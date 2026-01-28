// Invite a user to a group and publish group.invited event
export const inviteUserToGroup = async (req, res) => {
  const log = req.log;
  const groupId = req.params.id;
  const inviterId = req.user.id;
  const { invitedUserId } = req.body;
  try {
    // Check if group exists
    const groupRes = await db.query('SELECT id, name, profile_picture_id FROM "Groups" WHERE id = $1', [groupId]);
    let groupName = null;
    let groupProfilePicture = null;
    if (groupRes.rows.length > 0) {
      groupName = groupRes.rows[0].name;
      groupProfilePicture = groupRes.rows[0].profile_picture_id;
    }

    // Optionally: Add invite record to DB (not implemented here)

    // Build event payload
    let eventPayload = {
      groupId,
      invitedUserId,
      inviterId
    };
    if (groupName) {
      eventPayload.groupName = groupName;
      eventPayload.groupProfilePicture = groupProfilePicture;
    }
    // Publish event
    publishEvent('group.invited', eventPayload);
    log.info({ groupId, invitedUserId, inviterId }, 'Wysłano zaproszenie do grupy');
    res.status(200).json({ message: 'Zaproszenie wysłane', event: eventPayload });
  } catch (err) {
    log.error({ err, groupId, inviterId, invitedUserId }, 'Błąd podczas zapraszania do grupy');
    res.status(500).json({ error: err.message + ' Błąd podczas zapraszania do grupy' });
  }
};
import * as db from "../db/index.js";
import { publishEvent } from "../utils/rabbitmq-client.js";

export const getAllGroups= async (req, res) => {
  const log = req.log;
  try
  {
    const result = await db.query(
      `
      SELECT
    g.id,
    g.bio,
    g.header_picture_id,
    g.profile_picture_id,
    g.name,  -- Fixed: was g,name (comma instead of dot)
    g.created_at,
    -- Aggregate membership data into a JSON object
    COALESCE(
      (
          SELECT json_build_object(
              'members', COUNT(*),
              'owner_id', (
                  SELECT user_id
                  FROM "Group_Memberships" gm2
                  WHERE gm2.group_id = g.id
                  AND gm2.member_type = 'owner'  
                  LIMIT 1
              )
          )
          FROM "Group_Memberships" gm
          WHERE gm.group_id = g.id AND gm.member_type != 'banned' AND gm.deleted=false AND gm.valid=true
      ),
      '{"members": 0, "owner_id": null}'::json
  ) as member_data
FROM
    "Groups" g
WHERE
    g.deleted = false
ORDER BY
    g.created_at DESC;
      `
    )

    res.status(200).json(result.rows);
  }
  catch (err) {
    log.error({ err }, "Błąd serwera podczas pobierania grup.");
    res.status(500).json({
      error: err.message + " Błąd serwera podczas pobierania grup",
    });
  }
};

export const getGroupById= async (req, res) => {
  
  const{ g_id } = req.params;
  const log = req.log;
  
  try
  {
    const result = await db.query(
      `SELECT g.*, 
      COALESCE(
        (
            SELECT json_build_object(
                'members', COUNT(*),
                'owner_id', (
                    SELECT user_id
                    FROM "Group_Memberships" gm2
                    WHERE gm2.group_id = g.id
                    AND gm2.member_type = 'owner'  
                    LIMIT 1
                )
            )
            FROM "Group_Memberships" gm
            WHERE gm.group_id = g.id AND gm.member_type != 'banned' AND gm.deleted=false AND gm.valid=true
        ),
        '{"members": 0, "owner_id": null}'::json
    ) as member_data
      FROM "Groups" g
      WHERE id = $1 AND deleted = false
      `,[g_id] 
      ,
    );
    
    if (result.rows.length === 0) {
      log.warn(
        { eventId: g_id },
        "Nieudana próba pobrania nieistniejącej lub nieprawidłowej grupy."
      );
      return res
        .status(404)
        .json({ message: "Nie znaleziono grupy o id: " + g_id });
    }

    log.info({groupId:g_id},
      `Pobrano grupę o id:`+g_id
    );
    res.status(200).json(result.rows[0]);
  }
  catch (err) {
    log.error({ err, groupId:g_id }, 
      "Błąd serwera podczas pobierania grupy.");
    res.status(500).json({
      error: err.message + " Błąd serwera podczas pobierania grupy"+ g_id,
    });
  }
}

export const createGroup = async (req, res) => {
  const log = req.log;
 

  const { name, bio, header_picture_id, profile_picture_id, free_join_b } =
    req.body;
  const creator_id = req.user.id; 
    const free_join = free_join_b || "false";
  ///return res.status(200).json({message:"uid="+creator_id});
  try
  {
    
    await db.query("BEGIN");
    
    const group_result = await db.query
    (
      `
      INSERT INTO "Groups"(name, bio,header_picture_id,profile_picture_id,free_join)
      VALUES ($1, $2, $3, $4,$5)
      RETURNING *
        `,[name,bio,header_picture_id,profile_picture_id,free_join]
    )
    
    const newGroup=group_result.rows[0];


    const membershipQuery= `INSERT INTO "Group_Memberships"(user_id,group_id,valid,member_type)
    VALUES($1,$2,true,owner) RETURNING *
    `
    const membershipValues=[req.user.id,newGroup.id];
    await db.query("COMMIT"); 
    const membershipResult = await db.query
    ( `INSERT INTO "Group_Memberships"(user_id,group_id,valid,member_type)
    VALUES($1,$2,$3,$4) RETURNING *
    `,
    [req.user.id,newGroup.id,true,'owner']
    ); 
    await db.query("COMMIT");
    log.info(
      {group_id: newGroup.id, creatorID: req.user.id},"utworzono nową grupę"

    )
    
    // Publish group.created event
    publishEvent("group.created", {
      groupId: newGroup.id,
      name: newGroup.name,
      creatorId: req.user.id,
      timestamp: new Date().toISOString(),
      type: "group.created",
    });
    
    res.status(200).json({message:"Grupa została dodane"})
  }
  catch (err) {
    await db.query("ROLLBACK");
    log.error(
      { err, creatorId: creator_id, body: req.body },
      "Błąd serwera podczas tworzenia grupy."
    );
    res.status(500).json({
      error: err.message + " Błąd serwera podczas tworzenia grupy",
    });
  }
  
};




export const updateGroup = async (req, res) => {
  const log = req.log;
  const { id } = req.params;
  const { name, bio, profile_picture_id,header_picture_id } = req.body;

  try {
    const currentGroupResult = await db.query(
      `SELECT * FROM "Groups" WHERE id = $1 AND deleted = false`,
      [id]
    );

    if (currentGroupResult.rows.length === 0) {
      log.warn({ eventId: id }, "Nieudana próba aktualizacji nieistniejącej grupy.");
      return res
        .status(404)
        .json({ message: "Nie znaleziono grupy do edycji o id: " + id });
    }

    const currentGroup = currentGroupResult.rows[0];

    const updatedData = {
      name: req.body.name || currentGroup.name,
      bio: req.body.bio || currentGroup.bio,
      profile_picture_id: req.body.profile_picture_id || currentGroup.profile_picture_id,
      header_picture_id: req.body.header_picture_id || currentGroup.header_picture_id,
      free_join: req.body.free_join || currentGroup.free_join
    };

    const result = await db.query(
      `UPDATE "Groups"
      SET name = $1, bio = $2, profile_picture_id = $3, header_picture_id = $4
      WHERE id = $5 AND deleted = false
      RETURNING *`,
      [updatedData.name, updatedData.bio, updatedData.profile_picture_id,updatedData.header_picture_id , id]
    );

    log.info({groupId: id }, "Zaktualizowano grupę."+id + "  " + req.body.bio);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    log.error({ err, groupId: id }, "Błąd serwera podczas aktualizacji grupy.");
    res.status(500).json({
      error:
        err.message + " Błąd serwera podczas aktualizacji grupy o id: " + id,
    });
  }
};

export const deleteGroup= async (req, res) => {

  const log = req.log;
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE "Groups"
      SET deleted = true
      WHERE id = $1 AND deleted = false
      RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Nie znaleziono grupy o id: " + id });
    }

    log.info({ eventId: id }, "Usunięto grupę.");
    return res.status(200).json({ message: "Grupa została usunięta" });
  } catch (err) {
    log.error({ err, eventId: id }, "Błąd serwera podczas usuwania grupy.");
    res.status(500).json({
      error: err.message + " Błąd serwera podczas usuwania grupy o id: " + id,
    });
  }
}

export const getUserGroups= async (req, res) => {
 
  const log = req.log;
  const u_id = req.query.id || req.user?.id;
  try {
    let result;
    if (u_id) {
      // Return groups for a specific user
      result = await db.query(
        `SELECT g.*, 
        (
          SELECT user_id
          FROM "Group_Memberships"
          WHERE group_id = gm.group_id
          AND member_type = 'owner'
          LIMIT 1
        ) as owner_id
        FROM "Group_Memberships" as gm
        JOIN "Groups" AS g ON gm.group_id = g.id
        WHERE gm.user_id = $1 AND g.deleted = false AND gm.deleted=false AND gm.valid=true
        `, [u_id]
      );
      log.info({ groupId: u_id }, `Pobrano grupy użytkownika:` + u_id);
    } else {
      // Return all user-group memberships
      result = await db.query(
        `SELECT g.*, 
        (
          SELECT user_id
          FROM "Group_Memberships"
          WHERE group_id = gm.group_id
          AND member_type = 'owner'
          LIMIT 1
        ) as owner_id,
        gm.user_id as member_user_id
        FROM "Group_Memberships" as gm
        JOIN "Groups" AS g ON gm.group_id = g.id
        WHERE g.deleted = false AND gm.deleted=false AND gm.valid=true`
      );
      log.info(`Pobrano wszystkie grupy użytkowników`);
    }
    res.status(200).json(result.rows);
  } catch (err) {
    log.error({ err, groupId: u_id }, "Błąd serwera podczas pobierania grup użytkownika.");
    res.status(500).json({
      error: err.message + " Błąd serwera podczas pobierania grup użytkownika" + u_id,
    });
  }
}

export const requestGroupJoin= async (req, res) => {
  //if !exists, insert new, if existss make deleted=true

  const log = req.log;
  const {group_id}= req.params;
  const user_id = req.user.id;
  try
  { 
    const targetGroup = await db.query(`SELECT   free_join FROM "Groups" WHERE id=$1`,[group_id])

    if(targetGroup.rowCount===0)
    {
      log.error("Grupa nie istnieje")
          return res.status(500).json({message: "Grupa nie istnieje" + group_id})
    }

    const currentStatus= await db.query(`
    SELECT * FROM "Group_Memberships" WHERE group_id = $1 AND user_id = $2
    `,[group_id,user_id])

    if(currentStatus.rowCount!=0)
    {

    
      if(currentStatus.rows[0].banned===true)
      {
        log.info("Próba dołączenia zbanowanego użytkownika: " + user_id)
        return res.status(200).json({message: "Użytkownik ma bana na tej grupie"})
      }
      if(currentStatus.rows[0].deleted===false)
      {
        if(currentStatus.rows[0].valid===true)
        {
          log.info("Ponowna próba dołączenia użytkownika: " + user_id+", który jest już członkiem grupy")
          return res.status(200).json({message: "Użytkownik jest już członkiem grupy"})
        }
        else
        {
          log.info("Ponowna próba dołączenia użytkownika: " + user_id)
          return res.status(200).json({message: "Użytkownik już próbował dołączyć do grupy"})
        }
      }
      //rejoin
      //const group_rules=db.query(`SELECT free_join FROM "Groups" WHERE id=$1`,[group_id]);
      if(targetGroup.rows[0].free_join===true)
      {
        await db.query(`UPDATE "Group_Memberships" SET deleted =false, valid=true WHERE user_id=$1 AND group_id=$2 `,[user_id,group_id])
        // Publish group.joined event to group owner
        const groupData = await db.query('SELECT name, profile_picture_id FROM "Groups" WHERE id = $1', [group_id]);
        const ownerRes = await db.query('SELECT user_id FROM "Group_Memberships" WHERE group_id = $1 AND member_type = $2 LIMIT 1', [group_id, 'owner']);
        if (ownerRes.rows.length > 0) {
          const eventPayload = {
            groupId: group_id,
            groupName: groupData.rows[0]?.name || null,
            groupProfilePicture: groupData.rows[0]?.profile_picture_id || null,
            joinedUserId: user_id,
            ownerId: ownerRes.rows[0].user_id
          };
          publishEvent('group.joined', eventPayload);
        }
        log.info("Użytkownik dołączył do grupy " + user_id)
        return res.status(200).json({message: "Użytkownik dołączył do grupy"})
      }
      else
      {
        await db.query(`UPDATE "Group_Memberships" SET deleted =false, valid=false WHERE user_id=$1 AND group_id=$2 `,[user_id,group_id])
        
        log.info("Użytkownik wysłał prośbę o dołączenie do grupy " + user_id)
        return res.status(200).json({message: "Użytkownik wysłał prośbę o dołączenie do grupy "})
  
      }
     
    }
    else
    { 
      if(targetGroup.rows[0].free_join===true)
      {
        await db.query(`INSERT INTO "Group_Memberships"(user_id,group_id,valid,member_type)
        VALUES($1,$2,true,'normal_member') RETURNING *`,[user_id,group_id])
        // Publish group.joined event to group owner
        const groupData = await db.query('SELECT name, profile_picture_id FROM "Groups" WHERE id = $1', [group_id]);
        const ownerRes = await db.query('SELECT user_id FROM "Group_Memberships" WHERE group_id = $1 AND member_type = $2 LIMIT 1', [group_id, 'owner']);
        if (ownerRes.rows.length > 0) {
          const eventPayload = {
            groupId: group_id,
            groupName: groupData.rows[0]?.name || null,
            groupProfilePicture: groupData.rows[0]?.profile_picture_id || null,
            joinedUserId: user_id,
            ownerId: ownerRes.rows[0].user_id
          };
          publishEvent('group.joined', eventPayload);
        }
        log.info("Użytkownik dołączył do grupy " + user_id)
        return res.status(200).json({message: "Użytkownik dołączył do grupy"})
      }
      else
      {
        await db.query(`INSERT INTO "Group_Memberships"(user_id,group_id,valid,member_type)
        VALUES($1,$2,false,'normal_member') RETURNING *`,[user_id,group_id])
      
          
        log.info("Użytkownik wysłał prośbę o dołączenie do grupy " + user_id)
        return res.status(200).json({message: "Użytkownik wysłał prośbę o dołączenie do grupy "})
  
      }
    } 

  } 
  catch(err)
  {
    log.error(
      { err, user_id  },
      "Błąd serwera podczas prośby dołączenia do grupy"
    );
    res.status(500).json({
      error: err.message + " Błąd serwera podczas prośby dołączenia do grupy",
    });
  }
 }
///body: action 'change role' or 'kick', 'accept'
 export const changeUserMemberStatus= async(req,res) =>
 {

  const log = req.log;
  const groupId = req.params.id;
  const user_id = req.user.id;
  const target_id = req.body.target_user;
  const action=req.body.action;
  try
  {

  
    switch(action)
    {
      case('accept'):
      //  log.info("Zaakceptowano użytkownika " + user_id + " do grupy" + groupId)
        //return res.status(200).json({message: "Zaakceptowano użytkownika " + user_id + " do grupy" + groupId})

        const acceptres= await db.query(`UPDATE "Group_Memberships"
        SET valid=true
        WHERE user_id=$1 AND group_id=$2 RETURNING *`,[target_id,groupId]);
        
        // Fetch group data to include in the event
        const groupData = await db.query(
          `SELECT id, name, profile_picture_id FROM "Groups" WHERE id = $1`,
          [groupId]
        );
        
        const eventPayload = {
          groupId: groupId,
          userId: target_id,
          acceptedBy: user_id,
          timestamp: new Date().toISOString(),
        };
        
        // Include group details if found
        if (groupData.rows.length > 0) {
          const group = groupData.rows[0];
          eventPayload.groupName = group.name;
          eventPayload.groupProfilePicture = group.profile_picture_id;
        }
        
        eventPayload.type = "group.memberAccepted";
        // Publish member accepted event - this person is now a member
        publishEvent("group.memberAccepted", eventPayload);
        
        log.info("Zaakceptowano użytkownika " + user_id + " do grupy" + groupId)
        return res.status(200).json({message: "Zaakceptowano użytkownika " + user_id + " do grupy" + groupId})
  
        break;
      case('kick'):
      //log.info("Wykopano użytkownika " + user_id + " z grupy" + groupId)
      //return res.status(200).json({message: "Wykopano użytkownika " + user_id + " z grupy" + groupId})

        const kickres= await db.query(`UPDATE "Group_Memberships"
        SET deleted=true, valid=false
        WHERE user_id=$1 AND group_id=$2 RETURNING *`,[target_id,groupId]);
        log.info("Wykopano użytkownika " + user_id + " z grupy" + groupId)
        return res.status(200).json({message: "Wykopano użytkownika " + target_id + " z grupy" + groupId})
  
        break;
      case('change_role'):
        const tarrole=req.body.target_role;
       // return res.status(200).json({message:"tarrole:" + tarrole});
        const userMembership=await db.query(`SELECT * FROM "Group_Memberships" WHERE group_id=$1 AND user_id=$2`,[groupId,user_id]);
        const userrole= userMembership.rows[0].member_type;
        //return res.status(200).json(userrole);
        if(!canAffectRole( userrole, tarrole))
        {
          log.info( "Akcja przewyższa permisje użytkownika" + user_id)
        return res.status(403).json({message: "Akcja przewyższa permisje użytkownika" + user_id})
  
        }
        const changeres= await db.query('UPDATE "Group_Memberships" SET member_type=$1 WHERE user_id=$2 AND group_id=$3 ',[tarrole,target_id,groupId])
        log.info("Zmieniono rolę użytkownika")
        return res.status(200).json({message: "Zmieniono rolę użytkownika "})
  
        break;


    } 
  }
  catch(err)
  {
    log.error(
      { err, user_id  },
      "Błąd serwera podczas próby zmiany statusu użytkownika w grupie"
    );
    res.status(500).json({
      error: err.message + "Błąd serwera podczas próby zmiany statusu użytkownika w grupie",
    });
  }

 }


 export const canAffectRole = (actorRole, targetRole) => {
  switch(targetRole) {
    case 'owner':
      return false;
    case 'admin':
      return actorRole === 'owner';
    case 'moderator':
      return actorRole === 'owner' || actorRole === 'admin';
    case 'normal_member':
      return actorRole === 'owner' || actorRole === 'admin' || actorRole === 'moderator';
    case 'banned':
      return actorRole === 'owner' || actorRole === 'admin';
    default:
      return false;
  }
};

export const getGroupJoinRequests = async(req,res)=>
{
  const log = req.log;
  const groupId = req.params.id;
  //return res.status(500).json({message:"id grupy" + groupId});
  try
  {
    const result= await db.query(`SELECT * FROM "Group_Memberships" WHERE deleted=false AND valid=false AND group_id=$1`,[groupId])
    log.info(
      { groupId, eventCount: result.rowCount },
      "Pobrano prośby o dołączenie do grup."
    );
    return res.status(200).json(result.rows);
  }
  catch(err)
  {
    log.error(
      { err },
      "Błąd serwera podczas próby opuszczenie grupy przez użytkownika "
    );
    return res.status(500).json({
      error: err.message + "Błąd serwera podczas próby opuszczenie grupy przez użytkownika"
    });
  }
}

export const leaveGroup = async(req,res)=>
{
  const log = req.log;
  const groupId = req.params.id;
  const user_id = req.user.id;

  try{
    const isGroupMember= await db.query(`SELECT * FROM "Group_Memberships" WHERE group_id=$1 AND user_id=$2`,[groupId,user_id] )
    if(isGroupMember.rowCount==0)
    {
      log.info( "Użytkownik próbuje opuścić grupę której nie jest członkiem" + user_id)
    return res.status(403).json({message: "Użytkownik próbuje opuścic grupę, której nie jest członkiem!" + user_id})

    }
    if(isGroupMember.rows[0].member_type==='owner')
    {
      log.info("Użytkownik "+ user_id +" próbuje opuścić grupę "+ groupId+ "której jest właścicielem. Nielegalna akcja, kapitan powinien utonąć ze statkiem!")
      return res.status(403).json({message: "Użytkownik "+ user_id +" próbuje opuścić grupę "+ groupId+ "której jest właścicielem. Nielegalna akcja, kapitan powinien utonąć ze statkiem!"});
    }
    const result = await db.query(`UPDATE "Group_Memberships" SET deleted=true, valid=false WHERE group_id=$1 AND user_id=$2 RETURNING *`,[groupId,user_id]);
    
   
    log.info("Użytkownik wyszedł z grupy" + user_id);
    return res.status(200).json(result.rows[0]);
   // if(isGroupMember.)


  }
  catch(err)
  {
    log.error(
      { err, groupId  },
      "Błąd serwera podczas próby opuszczenia grupy przez użytkownika "+user_id 
    );
    res.status(500).json({
      error: err.message + "Błąd serwera podczas próby opuszczenie grupy przez użytkownika",
    });
  }
}


 export const getGroupMembers= async(req,res) =>
 {

  const log = req.log;
  const groupId = req.params.id;
  //return res.status(200).json({message:"messss "+ groupId })
  try
  {
    const result = await db.query(`
    SELECT u.user_id, u.name, u.surname,u.profile_picture_id,u.profile_header, gm.member_type
    FROM "Group_Memberships" as gm
    JOIN "Users" AS u ON u.user_id= gm.user_id
    WHERE gm.group_id=$1 AND gm.deleted = FALSE
    `,[groupId]);
    
    log.info(
      {groupId },
      "Pobrano członków grupy."
    );
    res.status(200).json(result.rows);
  }
  catch(err)
  {
    log.error(
      { err, groupId  },
      "Błąd serwera podczas próby pobrania członków grup"
    );
    res.status(500).json({
      error: err.message + "Błąd serwera podczas próby zmiany statusu użytkownika w grupie"
    });
  }
 }

 export const GetGroupMemberStatus= async(req,res) =>
 {

  const log = req.log;
  const groupId = req.params.id;
  const user_id = req.body.target_user;
  try
  {
    const result = await db.query(`SELECT * FROM "Group_Memberships" WHERE group_id=$1 AND user_id=$2`,[groupId,user_id])
    log.info(
      {groupId },
      "Pobrano status członkowstwa użytkownika."
    );
    if (result.rows.length === 0) {
      log.warn(
        { eventId: g_id },
        "Nieudana próba pobrania statusu użytkownika niebędącego w grupie"
      );
      return res
        .status(404)
        .json({ message: "Nieudana próba pobrania statusu użytkownika niebędącego w grupie" + g_id });
    }

    return res.status(200).json(result.rows[0]);
  }

  catch(err)
  {
    log.error(
      { err, groupId  },
      "Błąd serwera podczas próby pobrania członkowstwa użytkownika"
    );
    res.status(500).json({
      error: err.message + "Błąd serwera podczas próby pobrania członkowstwa użytkownika"
    });
  }
}