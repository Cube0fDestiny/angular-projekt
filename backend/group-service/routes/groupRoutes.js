
import express from "express";
import {
  createGroup,
  getAllGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  getUserGroups,
  requestGroupJoin,
  changeUserMemberStatus,
  getGroupMembers,
  leaveGroup,
  getGroupJoinRequests,
  GetGroupMemberStatus,
  inviteUserToGroup
} from "../controllers/groupController.js";
import { attachUserFromHeaders, isQualified, isSuperior, requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(attachUserFromHeaders);

router.get("/", getAllGroups); 
router.get("/user-groups", getUserGroups);
router.get("/:g_id",getGroupById)
router.get("/:id/get_members",getGroupMembers) 

router.get("/:id/get_membership",GetGroupMemberStatus);
router.get("/:id/applications",requireAuth,isQualified('admin','owner'),getGroupJoinRequests)

router.put("/:id", requireAuth, isQualified('admin','owner'),updateGroup); 

router.delete("/:id",requireAuth,isQualified('owner'),deleteGroup);

router.post("/",requireAuth, createGroup); 

// Invite user to group (after router is initialized)
router.post('/:id/invite', requireAuth, isQualified('admin','owner'),
  (req, res, next) => {
    if (!req.body.invitedUserId) {
      return res.status(400).json({ message: 'Brak wymaganych danych: invitedUserId' });
    }
    next();
  },
  inviteUserToGroup
);


router.post("/:id/leave",requireAuth,leaveGroup) 

router.post("/:id/alter_member",requireAuth,isSuperior,changeUserMemberStatus); 




router.post("/:group_id/join",requireAuth,requestGroupJoin)

export default router;
//router.