import { createPortal } from "react-dom";
import { useFriendStore } from "../store/useFriendStore";
import { Check, X } from "lucide-react";

const FriendRequests = ({ isOpen, onClose }) => {
    const { pendingRequests, acceptRequest, rejectRequest } = useFriendStore();

    if (!isOpen) return null;

    return createPortal(
        <dialog className="modal modal-open">
            <div className="modal-box bg-neutral-400 text-black w-full max-w-md">
                <h3 className="font-bold text-lg mb-4">
                    Friend Requests ({pendingRequests.length})
                </h3>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {pendingRequests.length === 0 ? (
                        <div className="text-center py-8 text-black/50">
                            No pending friend requests
                        </div>
                    ) : (
                        pendingRequests.map((request) => (
                            <div
                                key={request._id}
                                className="flex items-center justify-between p-3 rounded-lg"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <img
                                        src={request.sender.profilePic || "/avatar.png"}
                                        className="size-10 rounded-full object-cover"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-semibold truncate">
                                            {request.sender.fullName}
                                        </h4>
                                        <p className="text-xs text-base-content/60">
                                            @{request.sender.userId}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2 ml-2">
                                    <button
                                        onClick={() => acceptRequest(request._id)}
                                        className="btn btn-sm btn-success btn-circle"
                                    >
                                        <Check className="size-4" />
                                    </button>
                                    <button
                                        onClick={() => rejectRequest(request._id)}
                                        className="btn btn-sm btn-error btn-circle"
                                    >
                                        <X className="size-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="modal-action mt-4">
                    <button className="btn btn-ghost w-full" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>

            <div className="modal-backdrop" onClick={onClose} />
        </dialog>,
        document.body
    );
};

export default FriendRequests;