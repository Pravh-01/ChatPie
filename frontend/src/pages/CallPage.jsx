import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";

import {
    StreamVideo,
    StreamVideoClient,
    StreamCall,
    CallControls,
    SpeakerLayout,
    StreamTheme,
    CallingState,
    useCallStateHooks,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";
import { Loader } from "lucide-react";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

console.log("🔑 Frontend Stream API Key:", STREAM_API_KEY);

const CallPage = () => {
    const { id: callId } = useParams();
    const [client, setClient] = useState(null);
    const [call, setCall] = useState(null);
    const [isConnecting, setIsConnecting] = useState(true);
    const clientRef = useRef(null);
    const isInitializedRef = useRef(false);

    const { authUser } = useAuthStore();

    useEffect(() => {
        const initCall = async () => {
            if (!authUser || !callId) return;
            if (isInitializedRef.current) return;
            isInitializedRef.current = true;

            console.log("📞 Initializing call with ID:", callId);
            console.log("👤 Auth user:", authUser._id);

            try {
                const { data } = await axiosInstance.get("/chat/token");
                const token = data.token;

                console.log("🎟️ Token received:", token ? "yes" : "MISSING");

                const user = {
                    id: authUser._id.toString(),
                    name: authUser.fullName,
                    image: authUser.profilePic,
                };

                console.log("🎥 Creating StreamVideoClient with key:", STREAM_API_KEY);

                const videoClient = new StreamVideoClient({
                    apiKey: STREAM_API_KEY,
                    user,
                    token,
                });

                console.log("✅ StreamVideoClient created, joining call...");

                const callInstance = videoClient.call("default", callId);
                await callInstance.join({ create: true });

                console.log("✅ Joined call successfully");

                clientRef.current = videoClient;
                setClient(videoClient);
                setCall(callInstance);
            } catch (error) {
                console.error("❌ Error joining call:", error);
                toast.error("Could not join the call. Please try again.");
            } finally {
                setIsConnecting(false);
            }
        };

        initCall();
        return () => {
            isInitializedRef.current = false;
            if (clientRef.current) {
                console.log("🔌 Disconnecting Stream client...");
                clientRef.current.disconnectUser();
                clientRef.current = null;
            }
        };
    }, [authUser?._id, callId]);

    if (isConnecting) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader className="size-10 animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col items-center justify-center">
            {client && call ? (
                <StreamVideo client={client}>
                    <StreamCall call={call}>
                        <CallContent />
                    </StreamCall>
                </StreamVideo>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p>Could not initialize call. Please refresh or try again later.</p>
                </div>
            )}
        </div>
    );
};

const CallContent = () => {
    const { useCallCallingState } = useCallStateHooks();
    const callingState = useCallCallingState();
    const navigate = useNavigate();

    useEffect(() => {
        if (callingState === CallingState.LEFT) {
            navigate("/");
        }
    }, [callingState, navigate]);

    return (
        <StreamTheme>
            <SpeakerLayout />
            <CallControls />
        </StreamTheme>
    );
};

export default CallPage;