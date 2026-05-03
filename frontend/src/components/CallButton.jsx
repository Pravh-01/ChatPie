import { VideoIcon } from "lucide-react";

function CallButton({ handleVideoCall }) {
    return (
        <button
            onClick={handleVideoCall}
            className="btn btn-primary btn-sm text-base-content"
            aria-label="Start video call"
        >
            <VideoIcon className="size-5" />
        </button>
    );
}

export default CallButton;