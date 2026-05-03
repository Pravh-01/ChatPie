import { useNavigate } from "react-router-dom";
import { useCallStore } from "../store/useCallStore";
import { Phone, PhoneOff } from "lucide-react";

const IncomingCall = () => {
    const { incomingCall, acceptCall, declineCall } = useCallStore();
    const navigate = useNavigate();

    if (!incomingCall) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 bg-base-100 border border-base-300 rounded-2xl shadow-xl p-4 w-72 flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <img
                    src={incomingCall.callerInfo.profilePic || "/avatar.png"}
                    className="size-12 rounded-full object-cover"
                />
                <div>
                    <p className="font-semibold">{incomingCall.callerInfo.fullName}</p>
                    <p className="text-sm text-base-content/60">Incoming video call...</p>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => acceptCall(navigate)}
                    className="btn btn-success flex-1 gap-2"
                >
                    <Phone className="size-4" />
                    Accept
                </button>
                <button
                    onClick={declineCall}
                    className="btn btn-error flex-1 gap-2"
                >
                    <PhoneOff className="size-4" />
                    Decline
                </button>
            </div>
        </div>
    );
};

export default IncomingCall;