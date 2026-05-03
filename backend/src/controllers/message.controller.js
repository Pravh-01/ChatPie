import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { encryptMessage, decryptMessage } from "../lib/encryption.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const users = await User.find({
      _id: { $ne: loggedInUserId }
    }).select("-password");

    // 🔥 attach unread count
    const usersWithUnread = await Promise.all(
      users.map(async (user) => {
        const unreadCount = await Message.countDocuments({
          senderId: user._id,
          receiverId: loggedInUserId,
          seen: false,
        });

        return {
          ...user.toObject(),
          unreadCount,
        };
      })
    );

    res.status(200).json(usersWithUnread);
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    // Decrypt messages before sending to client
    const decryptedMessages = messages.map((msg) => {
      const msgObj = msg.toObject();
      if (msgObj.text) {
        try {
          msgObj.text = decryptMessage(msgObj.text);
        } catch (error) {
          console.error("Failed to decrypt message text:", error);
        }
      }
      if (msgObj.image) {
        try {
          msgObj.image = decryptMessage(msgObj.image);
        } catch (error) {
          console.error("Failed to decrypt message image:", error);
        }
      }
      return msgObj;
    });

    res.status(200).json(decryptedMessages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesSeen = async (req, res) => {
  try {
    const { id: senderId } = req.params;
    const myId = req.user._id;

    await Message.updateMany(
      { senderId, receiverId: myId, seen: false },
      { seen: true }
    );

    // Notify the sender that their messages have been seen
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesSeen", { by: myId });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.log("Error in markMessagesSeen controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let encryptedText = null;
    let encryptedImageUrl = null;

    // Encrypt text message
    if (text) {
      encryptedText = encryptMessage(text);
    }

    // Encrypt image URL if present
    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
      encryptedImageUrl = encryptMessage(imageUrl);
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text: encryptedText,
      image: encryptedImageUrl,
    });

    await newMessage.save();

    // Decrypt for real-time emission and response
    const messageObj = newMessage.toObject();
    if (messageObj.text) {
      messageObj.text = decryptMessage(messageObj.text);
    }
    if (messageObj.image) {
      messageObj.image = decryptMessage(messageObj.image);
    }

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", messageObj);
    }

    res.status(201).json(messageObj);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
