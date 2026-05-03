import User from "../models/user.model.js";
import FriendRequest from "../models/friendRequest.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js"

// Search user by userId (handle)
export const searchUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const users = await User.find({
            userId: { $regex: `^${userId.toLowerCase()}`, $options: "i" }
        }).select("_id fullName userId profilePic");

        if (!users.length) {
            return res.status(404).json({ message: "No users found" });
        }

        const results = await Promise.all(
            users.map(async (user) => {
                // skip self
                if (user._id.equals(currentUserId)) return null;

                // check friendship
                const existingRequest = await FriendRequest.findOne({
                    $or: [
                        { sender: currentUserId, receiver: user._id, status: "accepted" },
                        { sender: user._id, receiver: currentUserId, status: "accepted" },
                    ],
                });

                if (existingRequest) return null;

                // check pending
                const pendingRequest = await FriendRequest.findOne({
                    $or: [
                        { sender: currentUserId, receiver: user._id, status: "pending" },
                        { sender: user._id, receiver: currentUserId, status: "pending" },
                    ],
                });

                return {
                    ...user.toObject(),
                    requestStatus: pendingRequest ? "pending" : "none",
                };
            })
        );

        // remove nulls
        const filteredResults = results.filter(Boolean);

        res.status(200).json(filteredResults);
    } catch (error) {
        console.error("Error in searchUser:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Send friend request
export const sendFriendRequest = async (req, res) => {
    try {
        const { userId } = req.params;
        const senderId = req.user._id;

        const receiver = await User.findOne({ userId: userId.toLowerCase() });

        if (!receiver) {
            return res.status(404).json({ message: "User not found" });
        }

        if (receiver._id.equals(senderId)) {
            return res.status(400).json({ message: "Cannot add yourself" });
        }

        // Check if already friends
        const existingFriendship = await FriendRequest.findOne({
            $or: [
                { sender: senderId, receiver: receiver._id, status: "accepted" },
                { sender: receiver._id, receiver: senderId, status: "accepted" },
            ],
        });

        if (existingFriendship) {
            return res.status(400).json({ message: "Already friends with this user" });
        }

        // Check if request already exists
        const existingRequest = await FriendRequest.findOne({
            sender: senderId,
            receiver: receiver._id,
            status: "pending",
        });

        if (existingRequest) {
            return res.status(400).json({ message: "Friend request already sent" });
        }

        const friendRequest = new FriendRequest({
            sender: senderId,
            receiver: receiver._id,
            status: "pending",
        });

        await friendRequest.save();

        // Populate sender info for the notification
        await friendRequest.populate("sender", "fullName userId profilePic");

        // Emit socket event to receiver if online
        const receiverSocketId = getReceiverSocketId(receiver._id.toString());
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("friendRequestReceived", {
                request: friendRequest,
            });
        }

        res.status(201).json({
            message: "Friend request sent",
            request: friendRequest,
        });
    } catch (error) {
        console.error("Error in sendFriendRequest:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Accept friend request
export const acceptFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user._id;

        const friendRequest = await FriendRequest.findById(requestId).populate(
            "sender",
            "fullName userId profilePic"
        );

        if (!friendRequest) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        if (!friendRequest.receiver.equals(userId)) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        if (friendRequest.status !== "pending") {
            return res.status(400).json({ message: "Request is no longer pending" });
        }

        friendRequest.status = "accepted";
        await friendRequest.save();

        // Emit socket event to sender
        const senderSocketId = getReceiverSocketId(friendRequest.sender._id.toString());
        if (senderSocketId) {
            io.to(senderSocketId).emit("friendRequestAccepted", {
                request: friendRequest,
            });
        }

        res.status(200).json({
            message: "Friend request accepted",
            request: friendRequest,
        });
    } catch (error) {
        console.error("Error in acceptFriendRequest:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Reject friend request
export const rejectFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user._id;

        const friendRequest = await FriendRequest.findById(requestId);

        if (!friendRequest) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        if (!friendRequest.receiver.equals(userId)) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        if (friendRequest.status !== "pending") {
            return res.status(400).json({ message: "Request is no longer pending" });
        }

        friendRequest.status = "rejected";
        await friendRequest.save();

        res.status(200).json({
            message: "Friend request rejected",
            request: friendRequest,
        });
    } catch (error) {
        console.error("Error in rejectFriendRequest:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get pending friend requests (incoming)
export const getPendingRequests = async (req, res) => {
    try {
        const userId = req.user._id;

        const pendingRequests = await FriendRequest.find({
            receiver: userId,
            status: "pending",
        })
            .populate("sender", "fullName userId profilePic")
            .sort({ createdAt: -1 });

        res.status(200).json(pendingRequests);
    } catch (error) {
        console.error("Error in getPendingRequests:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all accepted friends
export const getFriendsList = async (req, res) => {
    try {
        const userId = req.user._id;

        const friendships = await FriendRequest.find({
            $or: [
                { sender: userId, status: "accepted" },
                { receiver: userId, status: "accepted" },
            ],
        }).populate(["sender", "receiver"]);

        // Extract friend objects and filter out the current user
        const friends = await Promise.all(
            friendships
                .map((friendship) => {
                    return friendship.sender._id.equals(userId)
                        ? friendship.receiver
                        : friendship.sender;
                })
                .map(async (friend) => {
                    // Count unread messages from this friend
                    const unreadCount = await Message.countDocuments({
                        senderId: friend._id,
                        receiverId: userId,
                        seen: false,
                    });

                    return {
                        _id: friend._id,
                        fullName: friend.fullName,
                        userId: friend.userId,
                        profilePic: friend.profilePic,
                        unreadCount,
                    };
                })
        );

        res.status(200).json(friends);
    } catch (error) {
        console.error("Error in getFriendsList:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// delete a friend
export const deleteFriend = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const friendship = await FriendRequest.findOneAndDelete({
            $or: [
                { sender: currentUserId, receiver: userId, status: "accepted" },
                { sender: userId, receiver: currentUserId, status: "accepted" },
            ],
        });

        if (!friendship) {
            return res.status(404).json({ message: "Friendship not found" });
        }

        // Notify the other user in real-time
        const otherSocketId = getReceiverSocketId(userId);
        if (otherSocketId) {
            io.to(otherSocketId).emit("friendDeleted", { by: currentUserId });
        }

        res.status(200).json({ message: "Friend removed" });
    } catch (error) {
        console.error("Error in deleteFriend:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};