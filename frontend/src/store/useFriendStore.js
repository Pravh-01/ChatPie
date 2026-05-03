import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore";

export const useFriendStore = create((set, get) => ({
    friends: [],
    pendingRequests: [],
    searchResult: null,
    isSearching: false,
    isSendingRequest: false,
    isLoadingFriends: false,
    isLoadingRequests: false,

    // Search user by handle
    searchUser: async (userId) => {
        set({ isSearching: true, searchResult: null });
        try {
            const res = await axiosInstance.get(`/friends/search/${userId.toLowerCase()}`);
            set({ searchResult: res.data });
        } catch (error) {
            // User not found or error - set searchResult to null with error message
            const errorMsg = error.response?.data?.message || "User not found";
            toast.error(errorMsg);
            set({ searchResult: null });
        } finally {
            set({ isSearching: false });
        }
    },

    // Send friend request
    sendRequest: async (userId) => {
        set({ isSendingRequest: true });
        try {
            const res = await axiosInstance.post(`/friends/request/${userId.toLowerCase()}`);
            toast.success("Friend request sent");

            // Update search result to show pending status
            set({
                searchResult: {
                    ...get().searchResult,
                    requestStatus: "pending",
                },
            });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send request");
        } finally {
            set({ isSendingRequest: false });
        }
    },

    // Accept friend request
    acceptRequest: async (requestId) => {
        try {
            await axiosInstance.put(`/friends/accept/${requestId}`);
            toast.success("Friend request accepted");

            // Remove from pending and refresh friends list
            set({
                pendingRequests: get().pendingRequests.filter((req) => req._id !== requestId),
            });

            get().getFriends();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to accept request");
        }
    },

    // Reject friend request
    rejectRequest: async (requestId) => {
        try {
            await axiosInstance.put(`/friends/reject/${requestId}`);
            toast.success("Friend request rejected");

            // Remove from pending
            set({
                pendingRequests: get().pendingRequests.filter((req) => req._id !== requestId),
            });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to reject request");
        }
    },

    // Get all pending friend requests
    getPendingRequests: async () => {
        set({ isLoadingRequests: true });
        try {
            const res = await axiosInstance.get("/friends/requests");
            set({ pendingRequests: res.data });
        } catch (error) {
            console.error("Error fetching pending requests:", error);
            toast.error("Failed to load friend requests");
        } finally {
            set({ isLoadingRequests: false });
        }
    },

    // Get all accepted friends
    getFriends: async () => {
        set({ isLoadingFriends: true });
        try {
            const res = await axiosInstance.get("/friends/list");
            set({ friends: res.data });
        } catch (error) {
            console.error("Error fetching friends:", error);
            toast.error("Failed to load friends");
        } finally {
            set({ isLoadingFriends: false });
        }
    },

    // Delete friend
    deleteFriend: async (userId) => {
        try {
            await axiosInstance.delete(`/friends/delete/${userId}`);
            toast.success("Friend removed");

            // <1> Sync sidebar immediately after unfriending
            const { getUsers } = (await import("./useChatStore")).useChatStore.getState();
            getUsers(false);

            // <1>
            // useChatStore.getState().getUsers(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to remove friend");
        }
    },

    // Subscribe to friend events via socket
    subscribeFriendEvents: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.on("friendRequestReceived", (data) => {
            set({
                pendingRequests: [data.request, ...get().pendingRequests],
            });
            toast.success(`${data.request.sender.fullName} sent you a friend request`);
        });

        socket.on("friendRequestAccepted", (data) => {
            get().getFriends();
            toast.success(`${data.request.sender.fullName} accepted your friend request`);
        });

        // socket.on("friendDeleted", ({ by }) => {
        //     toast(`You were removed as a friend`, { icon: "👋" });

        //     // Remove them from sidebar instantly
        //     const { users, setSelectedUser, selectedUser } = (await import("./useChatStore")).useChatStore.getState();
        //     if (selectedUser?._id === by) setSelectedUser(null);
        //     useChatStore.getState().getUsers(false);
        // });

        socket.on("friendDeleted", () => {
            toast(`You were removed as a friend`, { icon: "👋" });
            const { getUsers } = useChatStore.getState();
            getUsers(false);
        });
    },

    // Unsubscribe from friend events
    unsubscribeFriendEvents: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.off("friendRequestReceived");
        socket.off("friendRequestAccepted");
        socket.off("friendDeleted");
    },
}));
