import mongoose from "mongoose";
import User from "../models/user.model.js";
import FriendRequest from "../models/friendRequest.model.js";
import { generateStreamToken, upsertStreamUser } from "../lib/stream.js";

export async function getStreamToken(req, res) {
    try {
        const userId = req.user._id.toString();

        await upsertStreamUser({
            id: userId,
            name: req.user.fullName,
        });

        const token = generateStreamToken(userId);

        res.status(200).json({ token });
    } catch (error) {
        console.log("Error in getStreamToken controller:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export async function getRandomChatUser(req, res) {
    try {
        const currentUserId = req.user._id.toString();

        const acceptedFriendRequests = await FriendRequest.find({
            status: "accepted",
            $or: [
                { sender: currentUserId },
                { receiver: currentUserId },
            ],
        }).select("sender receiver -_id");

        const acceptedFriendIds = acceptedFriendRequests.flatMap((request) => [
            request.sender.toString(),
            request.receiver.toString(),
        ]);

        const excludedIds = [
            currentUserId,
            ...new Set(acceptedFriendIds.filter((id) => id !== currentUserId)),
        ].map((id) => new mongoose.Types.ObjectId(id));

        const [randomUser] = await User.aggregate([
            { $match: { _id: { $nin: excludedIds } } },
            { $sample: { size: 1 } },
            {
                $project: {
                    password: 0,
                    __v: 0,
                },
            },
        ]);

        if (!randomUser) {
            return res
                .status(404)
                .json({ message: "No eligible users found for random chat" });
        }

        res.status(200).json(randomUser);
    } catch (error) {
        console.log("Error in getRandomChatUser controller:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
