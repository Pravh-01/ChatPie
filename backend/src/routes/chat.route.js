import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getStreamToken, getRandomChatUser } from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/token", protectRoute, getStreamToken);
router.get("/random", protectRoute, getRandomChatUser);

export default router;