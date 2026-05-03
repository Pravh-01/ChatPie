import { StreamChat } from "stream-chat";
import "dotenv/config";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_SECRET_KEY;

console.log("🔑 Stream API Key:", apiKey);
console.log("🔑 Stream Secret:", apiSecret ? "loaded" : "MISSING");

if (!apiKey || !apiSecret) {
    throw new Error("Stream API key or Secret is missing");
}

const streamClient = StreamChat.getInstance(apiKey, apiSecret);

export const upsertStreamUser = async (userData) => {
    try {
        if (!userData?.id) {
            throw new Error("User ID is required for Stream");
        }

        await streamClient.upsertUsers([
            {
                id: userData.id.toString(),
                name: userData.name || "User",
                image: userData.image || "",
            },
        ]);

        return userData;
    } catch (error) {
        console.error("Error upserting Stream user:", error);
        throw error;
    }
};

export const generateStreamToken = (userId) => {
    try {
        if (!userId) throw new Error("User ID required for token");

        const token = streamClient.createToken(userId.toString());
        console.log("🎟️ Generated token for user:", userId);
        return token;
    } catch (error) {
        console.error("Error generating Stream token:", error);
        throw error;
    }
};