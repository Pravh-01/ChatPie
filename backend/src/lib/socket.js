import { Server } from "socket.io";
import http from "http";
import express from "express";
import crypto from "crypto";
import User from "../models/user.model.js";
import FriendRequest from "../models/friendRequest.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}
const randomChatQueue = []; // { userId, socketId, joinedAt }
const randomChatSessions = new Map(); // userId -> { partnerId, socketId, callId }

const removeFromRandomQueue = (userId) => {
  const index = randomChatQueue.findIndex((entry) => entry.userId === userId);
  if (index !== -1) randomChatQueue.splice(index, 1);
};

const getRandomSession = (userId) => randomChatSessions.get(userId);

const clearRandomSession = (userId) => {
  const session = randomChatSessions.get(userId);
  if (!session) return null;
  randomChatSessions.delete(userId);
  return session;
};

const addRandomSession = (userId, partnerId, socketId, callId) => {
  randomChatSessions.set(userId, { partnerId, socketId, callId });
  randomChatSessions.set(partnerId, { partnerId: userId, socketId, callId });
};

const queueRandomUser = async (userId, socketId) => {
  removeFromRandomQueue(userId);
  clearRandomSession(userId);

  const candidate = await findEligibleRandomMatch(userId);
  if (candidate) {
    removeFromRandomQueue(candidate.userId);

    const [currentUser, partnerUser] = await Promise.all([
      User.findById(userId).select("-password -__v"),
      User.findById(candidate.userId).select("-password -__v"),
    ]);

    if (!currentUser || !partnerUser) {
      removeFromRandomQueue(userId);
      return;
    }

    const callId = crypto.randomUUID();
    addRandomSession(userId, candidate.userId, candidate.socketId, callId);

    io.to(candidate.socketId).emit("randomChatMatched", {
      _id: currentUser._id,
      fullName: currentUser.fullName,
      profilePic: currentUser.profilePic,
      partnerId: currentUser._id,
      callId,
    });

    io.to(socketId).emit("randomChatMatched", {
      _id: partnerUser._id,
      fullName: partnerUser.fullName,
      profilePic: partnerUser.profilePic,
      partnerId: partnerUser._id,
      callId,
    });
    return;
  }

  randomChatQueue.push({ userId, socketId, joinedAt: new Date() });
  io.to(socketId).emit("randomChatQueued");
};

const findEligibleRandomMatch = async (userId) => {
  for (const candidate of randomChatQueue) {
    if (candidate.userId === userId) continue;

    const isFriend = await FriendRequest.exists({
      status: "accepted",
      $or: [
        { sender: userId, receiver: candidate.userId },
        { sender: candidate.userId, receiver: userId },
      ],
    });

    if (!isFriend) {
      return candidate;
    }
  }
  return null;
};

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", async () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];

    const session = getRandomSession(userId);
    clearRandomSession(userId);
    removeFromRandomQueue(userId);

    if (session && session.partnerId) {
      const partnerSocketId = getReceiverSocketId(session.partnerId);
      if (partnerSocketId) {
        io.to(partnerSocketId).emit("randomChatPartnerLeft", {
          message: "Your partner disconnected. Waiting for new stranger...",
        });
        await queueRandomUser(session.partnerId, partnerSocketId);
      }
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  socket.on("joinRandomQueue", async () => {
    if (!userId) return;
    await queueRandomUser(userId, socket.id);
  });

  socket.on("leaveRandomQueue", () => {
    if (!userId) return;
    removeFromRandomQueue(userId);
    clearRandomSession(userId);
  });

  socket.on("skipRandomCall", async () => {
    if (!userId) return;
    const session = getRandomSession(userId);

    if (session) {
      const partnerId = session.partnerId;
      const partnerSocketId = getReceiverSocketId(partnerId);

      clearRandomSession(userId);
      if (partnerId) clearRandomSession(partnerId);

      if (partnerSocketId) {
        io.to(partnerSocketId).emit("randomChatPartnerLeft", {
          message: "Your partner skipped. Waiting for new stranger...",
        });
        await queueRandomUser(partnerId, partnerSocketId);
      }
    }

    await queueRandomUser(userId, socket.id);
  });

  // Call events
  socket.on("callUser", ({ callId, receiverId, callerInfo }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incomingCall", { callId, callerInfo });
    }
  });

  socket.on("declineCall", ({ callerId }) => {
    const callerSocketId = getReceiverSocketId(callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("callDeclined");
    }
  });

  // Typing indicator events
  socket.on("typing", ({ receiverId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", { userId });
    }
  });

  socket.on("stopTyping", ({ receiverId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userStopTyping", { userId });
    }
  });
});

export { io, app, server };
