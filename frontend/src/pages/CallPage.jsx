import { useEffect, useState, useRef } from "react";
import {
    useNavigate,
    useParams,
    useSearchParams,
} from "react-router-dom";

import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
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
import { Loader, SkipForward } from "lucide-react";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const CallPage = () => {
    const { id: callId } = useParams();

    const [searchParams] = useSearchParams();

    const isRandom = searchParams.get("isRandom") === "true";
    const partnerId = searchParams.get("partnerId");

    const [client, setClient] = useState(null);
    const [call, setCall] = useState(null);
    const [isConnecting, setIsConnecting] = useState(true);

    const clientRef = useRef(null);
    const isInitializedRef = useRef(false);

    const { authUser } = useAuthStore();
    const { randomChatCallInfo, clearRandomChatCallInfo } = useChatStore();
    const navigate = useNavigate();

    useEffect(() => {
        const initCall = async () => {
            if (!authUser || !callId) return;

            if (isInitializedRef.current) return;
            isInitializedRef.current = true;

            try {
                const { data } = await axiosInstance.get("/chat/token");

                const videoClient = new StreamVideoClient({
                    apiKey: STREAM_API_KEY,
                    user: {
                        id: authUser._id.toString(),
                        name: authUser.fullName,
                        image: authUser.profilePic,
                    },
                    token: data.token,
                });

                const callInstance = videoClient.call("default", callId);

                await callInstance.join({
                    create: true,
                });

                clientRef.current = videoClient;

                setClient(videoClient);
                setCall(callInstance);
            } catch (error) {
                console.error("❌ Error joining call:", error);
                toast.error("Could not join call");
            } finally {
                setIsConnecting(false);
            }
        };

        initCall();

        return () => {
            isInitializedRef.current = false;

            if (clientRef.current) {
                clientRef.current.disconnectUser();
                clientRef.current = null;
            }
        };
    }, [authUser?._id, callId]);

    useEffect(() => {
        if (!isRandom || !randomChatCallInfo) return;

        navigate(
            `/call/${randomChatCallInfo.callId}?isRandom=true&partnerId=${randomChatCallInfo.partnerId}`
        );
        clearRandomChatCallInfo();
    }, [isRandom, randomChatCallInfo, navigate, clearRandomChatCallInfo]);

    if (isConnecting) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader className="size-10 animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-screen">
            {client && call ? (
                <StreamVideo client={client}>
                    <StreamCall call={call}>
                        <CallContent
                            call={call}
                            isRandom={isRandom}
                            partnerId={partnerId}
                        />
                    </StreamCall>
                </StreamVideo>
            ) : (
                <div className="h-screen flex items-center justify-center">
                    <p>Could not initialize call.</p>
                </div>
            )}
        </div>
    );
};

const CallContent = ({ call, isRandom, partnerId }) => {
    const navigate = useNavigate();

    const { useCallCallingState } = useCallStateHooks();

    const callingState = useCallCallingState();

    const [isSkipping, setIsSkipping] = useState(false);
    const [isWaitingForNext, setIsWaitingForNext] = useState(false);

    useEffect(() => {
        if (callingState === CallingState.LEFT) {
            navigate("/");
        }
    }, [callingState, navigate]);

    useEffect(() => {
        if (!isRandom) return;

        const socket = useAuthStore.getState().socket;

        const handlePartnerLeft = async () => {
            setIsWaitingForNext(true);
            if (call) {
                try {
                    await call.leave();
                } catch (err) {
                    console.warn("Failed to leave call after partner left", err);
                }
            }
        };

        socket.on("randomChatPartnerLeft", handlePartnerLeft);

        return () => {
            socket.off("randomChatPartnerLeft", handlePartnerLeft);
        };
    }, [isRandom, navigate, call]);

    const handleSkip = async () => {
        if (isSkipping) return;

        setIsSkipping(true);

        try {
            const socket = useAuthStore.getState().socket;
            socket.emit("skipRandomCall");

            if (call) {
                await call.leave();
            }

            setIsWaitingForNext(true);
        } catch (error) {
            console.error(error);
            toast.error("Could not skip call");
        } finally {
            setIsSkipping(false);
        }
    };

    return (
        <StreamTheme>
            <SpeakerLayout />

            {isRandom ? (
                <div className="relative">
                    <CallControls onLeave={() => navigate("/")} />

                    <button
                        onClick={handleSkip}
                        disabled={isSkipping}
                        className="absolute bottom-[0.6rem] left-[55vw] btn btn-primary py-[0.2rem] rounded-3xl "
                    >
                        <SkipForward className="size-5" />
                        {isSkipping ? "Skipping..." : "Skip"}
                    </button>

                    {isWaitingForNext && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-base-100/90 p-6 text-center">
                            <Loader className="size-10 animate-spin mb-4" />
                            <p className="text-lg font-semibold">Waiting for new stranger…</p>
                        </div>
                    )}
                </div>
            ) : (
                <CallControls onLeave={() => navigate("/")} />
            )}
        </StreamTheme>
    );
};

export default CallPage;