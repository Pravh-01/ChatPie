import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";

export const useCallStore = create((set, get) => ({
    incomingCall: null, // { callId, callerInfo }
    isCallDeclined: false,

    subscribeToCallEvents: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.on("incomingCall", ({ callId, callerInfo }) => {
            set({ incomingCall: { callId, callerInfo } });
        });

        socket.on("callDeclined", () => {
            set({ isCallDeclined: true });
            setTimeout(() => set({ isCallDeclined: false }), 3000);
        });
    },

    unsubscribeFromCallEvents: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;
        socket.off("incomingCall");
        socket.off("callDeclined");
    },

    acceptCall: (navigate) => {
        const { incomingCall } = get();
        if (!incomingCall) return;
        set({ incomingCall: null });
        navigate(`/call/${incomingCall.callId}`);
    },

    declineCall: () => {
        const { incomingCall } = get();
        if (!incomingCall) return;
        const socket = useAuthStore.getState().socket;
        socket.emit("declineCall", { callerId: incomingCall.callerInfo._id });
        set({ incomingCall: null });
    },
}));