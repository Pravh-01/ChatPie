import { useState } from "react";
import { useFriendStore } from "../store/useFriendStore";
import { Search, Send, Loader2, X } from "lucide-react";

const AddFriendModal = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const {
        searchResult,
        isSearching,
        isSendingRequest,
        searchUser,
        sendRequest,
    } = useFriendStore();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            searchUser(searchQuery);
        }
    };

    const handleSendRequest = (userId) => {
        sendRequest(userId);
    };

    const handleClose = () => {
        setSearchQuery("");
        onClose();
    };

    return (
        <dialog className={`modal ${isOpen ? "modal-open" : ""}`}>
            <div className="modal-box w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">Add Friend</h3>
                    <button
                        className="btn btn-sm btn-circle btn-ghost"
                        onClick={handleClose}
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSearch} className="space-y-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-base-content/40">@</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by user ID"
                            className="input input-bordered w-full pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={isSearching || !searchQuery.trim()}
                    >
                        {isSearching ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Searching...
                            </>
                        ) : (
                            <>
                                <Search className="size-4" />
                                Search
                            </>
                        )}
                    </button>
                </form>

                {/* Search Results */}
                {Array.isArray(searchResult) && searchResult.length > 0 && (
                    <div className="mt-6 space-y-3">
                        {searchResult.map((user) => (
                            <div key={user._id} className="p-3 bg-base-200 rounded-lg flex items-center justify-between">

                                {/* Left: user info */}
                                <div className="flex items-center gap-3">
                                    <img
                                        src={user.profilePic || "/avatar.png"}
                                        alt={user.fullName}
                                        className="size-10 rounded-full object-cover"
                                    />
                                    <div>
                                        <h4 className="font-medium text-sm">{user.fullName}</h4>
                                        <p className="text-xs text-base-content/60">@{user.userId}</p>
                                    </div>
                                </div>

                                {/* Right: minimal button */}
                                {user.requestStatus === "pending" ? (
                                    <button className="btn btn-xs btn-disabled">
                                        <Loader2 className="size-3 animate-spin" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleSendRequest(user.userId)}
                                        disabled={isSendingRequest}
                                        className="btn btn-circle btn-xs btn-primary"
                                    >
                                        {isSendingRequest ? (
                                            <Loader2 className="size-3 animate-spin" />
                                        ) : (
                                            <Send className="size-3" />
                                        )}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* No results */}
                {!isSearching &&
                    searchQuery &&
                    Array.isArray(searchResult) &&
                    searchResult.length === 0 && (
                        <div className="mt-6 p-4 bg-base-200 rounded-lg text-center text-sm text-base-content/60">
                            No users found.
                        </div>
                    )}

                <div className="modal-action mt-6">
                    <button className="btn btn-ghost w-full" onClick={handleClose}>
                        Close
                    </button>
                </div>
            </div>

            <form method="dialog" className="modal-backdrop">
                <button onClick={handleClose}></button>
            </form>
        </dialog>
    );
};

export default AddFriendModal;