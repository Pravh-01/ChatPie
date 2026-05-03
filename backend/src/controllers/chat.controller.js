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