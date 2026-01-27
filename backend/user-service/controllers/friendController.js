import * as db from "../db/index.js";
import { publishEvent } from "../utils/rabbitmq-client.js";

export const toggleFollow = async (req, res) => {
  const followerId = req.user.id;
  const followeeId = req.params.id;
  const log = req.log;

  // 1. Prevent a user from following themselves.
  if (followerId === followeeId) {
    log.warn(`User ${followerId} attempted to follow themselves.`);
    return res.status(400).json({ message: "You cannot follow yourself." });
  }

  try {
    // 2. Check if the follow relationship already exists.
    const checkFollow = await db.query(
      `SELECT * FROM "Follows" WHERE follower = $1 AND followee = $2`,
      [followerId, followeeId]
    );

    // 3. If it exists, unfollow the user.
    if (checkFollow.rowCount > 0) {
      await db.query(
        `DELETE FROM "Follows" WHERE follower = $1 AND followee = $2`,
        [followerId, followeeId]
      );

      log.info(`User ${followerId} unfollowed user ${followeeId}.`);
      publishEvent("user.unfollowed", {
        followerId: followerId,
        followeeId: followeeId,
        timestamp: new Date().toISOString(),
        type: "user.unfollowed",
      });
      return res.status(200).json({ message: "Successfully unfollowed." });
    }
    // 4. If it does not exist, follow the user.
    else {
      const result = await db.query(
        `INSERT INTO "Follows" (follower, followee) VALUES ($1, $2) RETURNING *`,
        [followerId, followeeId]
      );

      log.info(
        { follow: result.rows[0] },
        `User ${followerId} started following ${followeeId}.`
      );
      publishEvent("user.followed", {
        followerId: followerId,
        followeeId: followeeId,
        timestamp: new Date().toISOString(),
        type: "user.followed",
      });
      return res.status(201).json({ message: "Successfully followed." });
    }
  } catch (err) {
    log.error({ err }, "Server error during toggle follow operation.");
    return res
      .status(500)
      .json({ error: "A server error occurred while updating follow status." });
  }
};

export const getUserFollowers = async (req, res) => {
  const userId = req.params.id; // Get user ID from URL to allow lookup of any user
  const log = req.log;

  try {
    // The query can be expanded with a JOIN to get follower profiles directly
    const result = await db.query(
      `SELECT T1.follower, T2.name, T2.surname
       FROM "Follows" T1
       LEFT JOIN "Users" T2 ON T1.follower = T2.user_id
       WHERE T1.followee = $1`,
      [userId]
    );

    const followers = result.rows;
    log.info(`Fetched ${followers.length} followers for user ${userId}.`);
    return res.status(200).json(followers);
  } catch (err) {
    log.error({ err }, "Server error while fetching followers.");
    return res
      .status(500)
      .json({ error: "A server error occurred while fetching followers." });
  }
};

export const getUserFollowing = async (req, res) => {
  const userId = req.params.id; // Get user ID from URL
  const log = req.log;

  try {
    // JOIN with Users table to get more profile data
    const result = await db.query(
      `SELECT T1.followee, T2.name, T2.surname
       FROM "Follows" T1
       LEFT JOIN "Users" T2 ON T1.followee = T2.user_id
       WHERE T1.follower = $1`,
      [userId]
    );

    const following = result.rows;
    log.info(`User ${userId} is following ${following.length} users.`);
    return res.status(200).json(following);
  } catch (err) {
    log.error({ err }, "Server error while fetching following list.");
    return res
      .status(500)
      .json({
        error: "A server error occurred while fetching the following list.",
      });
  }
};

export const requestFriend = async (req, res) => {
  const userId = req.user.id;
  const friendId = req.params.id;
  const log = req.log;

  // 1. Prevent a user from sending a request to themselves.
  if (userId === friendId) {
    log.warn(
      `User ${userId} attempted to send a friend request to themselves.`
    );
    return res
      .status(400)
      .json({ message: "You cannot send a friend request to yourself." });
  }

  try {
    // 2. Check for any existing relationship (pending or active) in either direction.
    const existingRelationship = await db.query(
      `SELECT * FROM "Friendships"
       WHERE (requester = $1 AND requestee = $2) OR (requester = $2 AND requestee = $1)`,
      [userId, friendId]
    );

    // 3. If a relationship already exists, handle it accordingly.
    if (existingRelationship.rowCount > 0) {
      const friendship = existingRelationship.rows[0];

      // Case A: They are already friends.
      if (friendship.active) {
        log.info(
          `User ${userId} tried to add ${friendId}, but they are already friends.`
        );
        return res.status(409).json({ message: "You are already friends." });
      }

      // Case B: The current user has already sent a request.
      if (friendship.requester === userId) {
        log.info(
          `User ${userId} tried to send a duplicate friend request to ${friendId}.`
        );
        return res.status(409).json({
          message: "You have already sent a friend request to this user.",
        });
      }

      // Case C: The other user has already sent a request to the current user.
      log.info(
        `User ${userId} tried to add ${friendId}, but a pending request already exists from ${friendId}.`
      );
      return res.status(409).json({
        message:
          "This user has already sent you a friend request. Please accept or decline their request.",
      });
    }

    // 4. If no relationship exists, create a new friend request.
    const result = await db.query(
      `INSERT INTO "Friendships" ("requester", "requestee", active) VALUES ($1, $2, $3) RETURNING *`,
      [userId, friendId, false] // active is false for a new request
    );

    log.info(
      { friendship: result.rows[0] },
      `User ${userId} sent a friend request to ${friendId}`
    );

    // Fetch requester's data to include in the event
    const requesterData = await db.query(
      `SELECT user_id, name, surname, email, profile_picture_id FROM "Users" WHERE user_id = $1`,
      [userId]
    );

    const eventPayload = {
      requesterId: userId,
      requesteeId: friendId,
      timestamp: new Date().toISOString(),
    };

    // Include requester details if found
    if (requesterData.rows.length > 0) {
      const requester = requesterData.rows[0];
      eventPayload.requesterName = requester.name;
      eventPayload.requesterSurname = requester.surname;
      eventPayload.requesterProfilePicture =
        requester.profile_picture_id ||
        `https://i.pravatar.cc/150?u=${encodeURIComponent(requester.email)}`;
    }

      eventPayload.type = "friend.request";
      publishEvent("user.friendRequested", eventPayload);

    return res
      .status(201)
      .json({ message: "Friend request sent successfully." });
  } catch (err) {
    log.error({ err }, "Server error while sending friend request.");
    return res.status(500).json({
      error: "A server error occurred while sending the friend request.",
    });
  }
};

export const checkRequests = async (req, res) => {
  const userId = req.user.id;
  const log = req.log;

  try {
    const result = await db.query(
      `SELECT * FROM "Friendships" WHERE requestee = $1 AND active = $2`,
      [userId, "false"]
    );

    log.info({ result }, "Pobrano zaproszenia.");
    res.status(200).json(result.rows);
  } catch (err) {
    log.error({ err }, "Błąd serwera podczas pobierania zaproszeń.");
    res.status(500).json({
      error: err.message + " Błąd serwera podczas pobierania zaproszeń.",
    });
  }
};

export const acceptFriendRequest = async (req, res) => {
  const userId = req.user.id; // The user accepting the request
  const requesterId = req.params.id; // The user who sent the request
  const log = req.log;

  try {
    // Find the pending friend request sent by the requesterId
    const findRequest = await db.query(
      `SELECT * FROM "Friendships" WHERE requester = $1 AND requestee = $2 AND active = false`,
      [requesterId, userId]
    );

    if (findRequest.rowCount === 0) {
      log.warn(
        `User ${userId} tried to accept a non-existent friend request from ${requesterId}.`
      );
      return res.status(404).json({ message: "Friend request not found." });
    }

    // Update the friendship to be active
    const result = await db.query(
      `UPDATE "Friendships" SET active = true WHERE requester = $1 AND requestee = $2 RETURNING *`,
      [requesterId, userId]
    );

    log.info(
      { friendship: result.rows[0] },
      `User ${userId} accepted friend request from ${requesterId}.`
    );

    // Fetch accepter's data to include in the event
    const accepterData = await db.query(
      `SELECT user_id, name, surname, email, profile_picture_id FROM "Users" WHERE user_id = $1`,
      [userId]
    );

    const eventPayload = {
      userId: userId,
      friendId: requesterId,
      timestamp: new Date().toISOString(),
    };

    // Include accepter details if found
    if (accepterData.rows.length > 0) {
      const accepter = accepterData.rows[0];
      eventPayload.accepterName = accepter.name;
      eventPayload.accepterSurname = accepter.surname;
      eventPayload.accepterProfilePicture =
        accepter.profile_picture_id ||
        `https://i.pravatar.cc/150?u=${encodeURIComponent(accepter.email)}`;
    }

    eventPayload.type = "friend.accepted";
    publishEvent("user.friendAccepted", eventPayload);

    return res.status(200).json({ message: "Friend request accepted." });
  } catch (err) {
    log.error({ err }, "Server error while accepting friend request.");
    return res
      .status(500)
      .json({ error: "A server error occurred while accepting the request." });
  }
};

export const deleteFriendRequest = async (req, res) => {
  const userId = req.user.id;
  const otherUserId = req.params.id;
  const log = req.log;

  try {
    // Find a non-active friendship between the two users, regardless of who is requester/requestee
    const result = await db.query(
      `DELETE FROM "Friendships"
       WHERE active = false AND
             ((requester = $1 AND requestee = $2) OR (requester = $2 AND requestee = $1))
       RETURNING *`,
      [userId, otherUserId]
    );

    if (result.rowCount === 0) {
      log.warn(
        `User ${userId} tried to delete a non-existent friend request with ${otherUserId}.`
      );
      return res
        .status(404)
        .json({ message: "Pending friend request not found." });
    }

    const deletedRequest = result.rows[0];
    const action =
      deletedRequest.requester === userId ? "cancelled" : "rejected";

    log.info(
      { friendship: deletedRequest },
      `User ${userId} ${action} friend request with ${otherUserId}.`
    );

      const cancelEventPayload = {
        userId: userId,
        otherUserId: otherUserId,
        timestamp: new Date().toISOString(),
        type: action === "cancelled" ? "friend.request.cancelled" : "friend.request.rejected",
      };
      publishEvent(
        action === "cancelled" ? "user.friendRequestCancelled" : "user.friendRequestRejected",
        cancelEventPayload
      );

    return res
      .status(200)
      .json({ message: `Friend request ${action} successfully.` });
  } catch (err) {
    log.error({ err }, "Server error while deleting friend request.");
    return res
      .status(500)
      .json({ error: "A server error occurred while deleting the request." });
  }
};

export const removeFriend = async (req, res) => {
  const userId = req.user.id;
  const friendId = req.params.id;
  const log = req.log;

  try {
    // Find and delete an active friendship between the two users
    const result = await db.query(
      `DELETE FROM "Friendships"
       WHERE active = true AND
             ((requester = $1 AND requestee = $2) OR (requester = $2 AND requestee = $1))
       RETURNING *`,
      [userId, friendId]
    );

    if (result.rowCount === 0) {
      log.warn(
        `User ${userId} tried to unfriend non-existent friend ${friendId}.`
      );
      return res.status(404).json({ message: "Friendship not found." });
    }

    log.info(
      { friendship: result.rows[0] },
      `User ${userId} removed friend ${friendId}.`
    );

    publishEvent("user.friendRemoved", {
      userId: userId,
      friendId: friendId,
      timestamp: new Date().toISOString(),
      type: "friend.removed",
    });

    return res.status(200).json({ message: "Friend removed successfully." });
  } catch (err) {
    log.error({ err }, "Server error while removing friend.");
    return res
      .status(500)
      .json({ error: "A server error occurred while removing the friend." });
  }
};

export const listFriends = async (req, res) => {
  const currentUserId = req.user.id;
  const targetUserId = req.query.id || currentUserId;
  const log = req.log;

  try {
    const results = await db.query(
      `SELECT
         CASE
           WHEN requester = $1 THEN requestee
           ELSE requester
         END as friend_id
       FROM "Friendships"
       WHERE ($1 IN (requester, requestee)) AND active = true`,
      [targetUserId]
    );

    const friends = results.rows;
    log.info(
      `User ${currentUserId} fetched ${friends.length} friends for target user ${targetUserId}.`
    );
    return res.status(200).json(friends);
  } catch (err) {
    log.error({ err }, `Server error while fetching friends for user ${targetUserId}.`);
    return res
      .status(500)
      .json({ error: "A server error occurred while fetching friends." });
  }
};

export const listIncomingRequests = async (req, res) => {
  const userId = req.user.id;
  const log = req.log;

  try {
    const results = await db.query(
      `SELECT requester as from_user_id, created_at FROM "Friendships"
       WHERE requestee = $1 AND active = false`,
      [userId]
    );

    const incomingRequests = results.rows;
    log.info(
      `User ${userId} fetched ${incomingRequests.length} incoming requests.`
    );
    return res.status(200).json(incomingRequests);
  } catch (err) {
    log.error({ err }, "Server error while fetching incoming requests.");
    return res.status(500).json({ error: "Server error occurred." });
  }
};

export const listOutgoingRequests = async (req, res) => {
  const userId = req.user.id;
  const log = req.log;

  try {
    const results = await db.query(
      `SELECT requestee as to_user_id, created_at FROM "Friendships"
       WHERE requester = $1 AND active = false`,
      [userId]
    );

    const outgoingRequests = results.rows;
    log.info(
      `User ${userId} fetched ${outgoingRequests.length} outgoing requests.`
    );
    return res.status(200).json(outgoingRequests);
  } catch (err) {
    log.error({ err }, "Server error while fetching outgoing requests.");
    return res.status(500).json({ error: "Server error occurred." });
  }
};
