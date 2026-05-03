import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    searchUser,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getPendingRequests,
    getFriendsList,
    deleteFriend,
} from "../controllers/friend.controller.js";

const router = express.Router();

// Search user by handle
router.get("/search/:userId", protectRoute, searchUser);

// Send friend request
router.post("/request/:userId", protectRoute, sendFriendRequest);

// Accept friend request
router.put("/accept/:requestId", protectRoute, acceptFriendRequest);

// Reject friend request
router.put("/reject/:requestId", protectRoute, rejectFriendRequest);

// Get pending incoming requests
router.get("/requests", protectRoute, getPendingRequests);

// Get accepted friends list
router.get("/list", protectRoute, getFriendsList);

// delete friend
router.delete("/delete/:userId", protectRoute, deleteFriend);
export default router;
