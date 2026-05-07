import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

let isSubscribed = false;

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isTyping: false,
  isRandomChatPending: false,
  randomChatListenerInitialized: false,
  randomChatCallInfo: null,
  randomChatStatus: "idle",

  getUsers: async (showLoader = true) => {
    if (showLoader) set({ isUsersLoading: true });

    try {
      const res = await axiosInstance.get("/friends/list");

      set((state) => {
        // 🔥 prevent unnecessary re-render if data same
        const isSame =
          JSON.stringify(state.users) === JSON.stringify(res.data);

        if (isSame) return state;

        return { users: res.data };
      });

      // set({ users: res.data });

    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching users");
    } finally {
      if (showLoader) set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  startRandomChat: async () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) {
      toast.error("Socket unavailable");
      return;
    }

    if (get().isRandomChatPending) return;

    socket.emit("joinRandomQueue");
    set({ isRandomChatPending: true, randomChatStatus: "waiting", randomChatCallInfo: null });
  },

  leaveRandomChatQueue: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) socket.emit("leaveRandomQueue");
    set({ isRandomChatPending: false, randomChatStatus: "idle", randomChatCallInfo: null });
  },

  handleRandomChatMatched: (matchInfo) => {
    set({
      isRandomChatPending: false,
      randomChatStatus: "matched",
      randomChatCallInfo: matchInfo,
    });
  },

  clearRandomChatCallInfo: () => {
    set({ randomChatCallInfo: null, randomChatStatus: "idle" });
  },

  initializeRandomChatSocket: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket || get().randomChatListenerInitialized) return;

    socket.on("randomChatMatched", (matchInfo) => {
      get().handleRandomChatMatched(matchInfo);
    });

    socket.on("randomChatQueued", () => {
      set({ isRandomChatPending: true, randomChatStatus: "waiting" });
    });

    socket.on("randomChatPartnerLeft", ({ message }) => {
      set({ isRandomChatPending: true, randomChatStatus: "waiting" });
    });

    set({ randomChatListenerInitialized: true });
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  // Mark all messages from a specific user as seen
  markMessagesSeen: async (userId) => {
    try {
      // 🔥 Immediately update local state (instant UI update)
      set((state) => ({
        users: state.users.map((user) =>
          user._id === userId ? { ...user, unreadCount: 0 } : user
        ),
      }));

      // Then sync with backend (don't refresh the list, just mark as seen)
      await axiosInstance.put(`/messages/seen/${userId}`);
    } catch (error) {
      console.log("Error marking messages as seen:", error);
    }
  },

  subscribeToMessages: () => {
    if (isSubscribed) return;
    const socket = useAuthStore.getState().socket;

    if (!socket) return;
    isSubscribed = true;

    socket.on("newMessage", (newMessage) => {
      const { selectedUser } = get();

      if (selectedUser && newMessage.senderId === selectedUser._id) {
        set((state) => ({ messages: [...state.messages, newMessage] }));
        get().markMessagesSeen(selectedUser._id);
      } else {
        set((state) => ({
          users: state.users.map((user) =>
            user._id === newMessage.senderId
              ? { ...user, unreadCount: (user.unreadCount || 0) + 1 }
              : user
          ),
        }));
      }
    });

    socket.on("messagesSeen", ({ by }) => {
      const { selectedUser } = get();

      if (selectedUser && by === selectedUser._id) {
        set({
          messages: get().messages.map((msg) =>
            msg.senderId !== by ? { ...msg, seen: true } : msg
          ),
        });
      }
    });

    socket.on("userTyping", ({ userId }) => {
      const { selectedUser } = get();
      if (selectedUser && userId === selectedUser._id) {
        set({ isTyping: true });
      }
    });

    socket.on("userStopTyping", ({ userId }) => {
      const { selectedUser } = get();
      if (selectedUser && userId === selectedUser._id) {
        set({ isTyping: false });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messagesSeen");
    socket.off("userTyping");
    socket.off("userStopTyping");
    set({ isTyping: false });
    isSubscribed = false;
  },

  setSelectedUser: (selectedUser) => {
    set({ selectedUser });
    if (selectedUser) {
      get().markMessagesSeen(selectedUser._id);
    }
  },
}));
