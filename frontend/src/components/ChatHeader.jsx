import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useFriendStore } from "../store/useFriendStore";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import CallButton from "./CallButton";
import { createPortal } from "react-dom";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const { deleteFriend } = useFriendStore();
  const navigate = useNavigate();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const dropdownRef = useRef(null);

  const closeDropdown = () => {
    setShowDropdown(false);
    setShowConfirm(false);
  };

  const handleVideoCall = () => {
    const socket = useAuthStore.getState().socket;
    const callId = crypto.randomUUID();

    socket.emit("callUser", {
      callId,
      receiverId: selectedUser._id,
      callerInfo: {
        _id: authUser._id,
        fullName: authUser.fullName,
        profilePic: authUser.profilePic,
      },
    });

    navigate(`/call/${callId}`);
  };

  const handleDeleteFriend = async () => {
    await deleteFriend(selectedUser._id);
    setShowDropdown(false);
    setShowConfirm(false);
    setSelectedUser(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape key to close chat
  useEffect(() => {
    if (!selectedUser) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        closeDropdown();
        setSelectedUser(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [selectedUser, setSelectedUser]);

  return (
    <div className="border-b border-base-300">
      <div className="p-2.5 flex items-center justify-between bg-primary/10 backdrop-blur-lg">

        {/* Clickable user info — shows dropdown */}
        <div className="relative w-full flex justify-left" ref={dropdownRef}>
          <div
            className="flex items-center gap-3 cursor-pointer pl-2 pr-4 hover:bg-base-200 rounded-lg p-1 transition"
            onClick={() => { setShowDropdown((prev) => !prev); setShowConfirm(false); }}
          >
            {/* Avatar */}
            <div className="avatar">
              <div className="size-10 rounded-full relative">
                <img
                  src={selectedUser.profilePic || "/avatar.png"}
                  alt={selectedUser.fullName}
                />
              </div>
            </div>

            {/* User info */}
            <div>
              <h3 className="font-medium">{selectedUser.fullName}</h3>
              <p className="text-sm text-base-content/70">
                {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
              </p>
            </div>
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <div className="relative text-center z-100 bg-base-300 border border-red-600 hover:bg-red-500 transition rounded-lg shadow-lg min-w-[150px]">
              {!showConfirm ? (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="py-[0.95rem] h-full w-full text-sm text-error hover:text-black font-medium transition"
                >
                  Unfriend {selectedUser.fullName}
                </button>
              ) : (
                <div className="px-4 py-2 space-y-2 bg-base-300 rounded-lg h">
                  <p className="text-sm font-medium bg-base-300 rounded-lg">Sure?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteFriend}
                      className="btn btn-error btn-xs flex-1"
                    >
                      Remove
                    </button>
                    <button
                      onClick={() => closeDropdown(true)}
                      className="btn btn-ghost btn-xs flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-2">
          <CallButton handleVideoCall={handleVideoCall} />
          <button onClick={() => setSelectedUser(null)}>
            <X />
          </button>
        </div>

      </div>
    </div>
  );
};

export default ChatHeader;