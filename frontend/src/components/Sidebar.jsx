import { useEffect, useState, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import AddFriendModal from "./AddFriendModal";
import FriendRequests from "./FriendRequests";
import { UserPlus, PanelLeft, PanelLeftOpen, PanelLeftClose, Search } from "lucide-react";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const {
    getPendingRequests,
    subscribeFriendEvents,
    unsubscribeFriendEvents
  } = useFriendStore();

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showFriendRequests, setShowFriendRequests] = useState(false);

  const [sidebarWidth, setSidebarWidth] = useState(230);

  const sidebarRef = useRef(null);
  const isDraggingRef = useRef(false);
  const rafRef = useRef(null);

  const isCollapsed = sidebarWidth < 140;

  useEffect(() => {
    getUsers();
    getPendingRequests();
    subscribeFriendEvents();

    return () => unsubscribeFriendEvents();
  }, [getUsers, getPendingRequests, subscribeFriendEvents, unsubscribeFriendEvents]);

  // ✅ FIXED DRAG LOGIC
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current || !sidebarRef.current) return;

      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        const rect = sidebarRef.current.getBoundingClientRect();
        const newWidth = e.clientX - rect.left; // 🔥 FIX HERE

        const clampedWidth = Math.min(Math.max(newWidth, 80), 320);
        setSidebarWidth(clampedWidth);

        rafRef.current = null;
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.userSelect = ""; // restore
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // collapse toggle handler
  const toggleCollapse = () => {
    setSidebarWidth((prev) => (prev < 140 ? 230 : 80));
  };

  // search and filter logic
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.userId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesOnline = showOnlineOnly
      ? onlineUsers.includes(user._id)
      : true;

    const matchesUnread = showUnreadOnly
      ? (user.unreadCount || 0) > 0
      : true;

    return matchesSearch && matchesOnline && matchesUnread;
  });

  useEffect(() => {
    if (isCollapsed) setSearchQuery("");
  }, [isCollapsed]);

  const onlineFriendsCount = users.filter((user) =>
    onlineUsers.includes(user._id)
  ).length;


  const unreadCount = users.filter(user => user.unreadCount > 0).length;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside
      ref={sidebarRef}
      style={{ width: sidebarWidth }}
      className="relative h-full border-r border-base-300 flex flex-col transition will-change-[width]"
    >
      {/* collapse + search + online + unread*/}
      <div className="border-b border-base-300 w-full p-3">

        <div className="flex items-center gap-2">

          {/* Collapse button */}
          <button
            onClick={toggleCollapse}
            className="p-1 rounded-md hover:bg-base-200 transition"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="size-6 m-3" />
            ) : (
              <PanelLeftClose className="size-6" />
            )}
          </button>

          {/* Search */}
          <div
            className={`relative transition-all duration-200
              ${isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-full opacity-100"} `}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />

            <input
              type="text"
              placeholder="Search"
              className="input input-sm input-bordered w-full pl-9 pr-3"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

        </div>

        {!isCollapsed && (
          <div className="flex gap-2 mt-2 flex-wrap">

            {/* Online */}
            <label className={`flex items-center gap-2 text-sm text-base-content/70 cursor-pointer rounded-md px-2 py-1 transition 
              ${showOnlineOnly ? "bg-primary/30" : "bg-primary/10 hover:bg-primary/30"}`}>
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-xs"
              />
              <span>Online</span>
              <span className="text-xs text-base-content/40">
                {onlineFriendsCount}
              </span>
            </label>

            {/* Unread */}
            <label className={`flex items-center gap-2 text-sm text-base-content/70 cursor-pointer rounded-md px-2 py-1 transition 
              ${showUnreadOnly ? "bg-primary/30" : "bg-primary/10 hover:bg-primary/30"}`}>
              <input
                type="checkbox"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
                className="checkbox checkbox-xs"
              />
              <span>Unread</span>
              <span className="text-xs text-base-content/40">
                {unreadCount}
              </span>
            </label>

          </div>
        )}

      </div>

      {/*  Users list */}
      <div className="overflow-y-auto w-full p-2">
        {filteredUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`w-full p-2 flex items-center gap-3 hover:bg-base-300 ${selectedUser?._id === user._id ? "bg-base-200" : ""
              }`}
          >
            <div className={`relative ${isCollapsed ? "mx-auto" : ""}`}>
              <img
                src={user.profilePic || "/avatar.png"}
                className="size-10 rounded-full object-cover"
              />
              {onlineUsers.includes(user._id) && (
                <span className="absolute bottom-0 right-0 size-2.5 bg-green-500 rounded-full ring-2 ring-base-100" />
              )}
            </div>

            {!isCollapsed && (
              <div className="flex items-center w-full">

                <div className="text-left flex-1 min-w-0">
                  <div className="font-medium truncate">{user.fullName}</div>
                  <div className="text-xs text-zinc-400">
                    {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                  </div>
                </div>

                {/* 🔥 Unread badge */}
                {user.unreadCount > 0 && (
                  <span className="ml-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                    {user.unreadCount}
                  </span>
                )}

              </div>
            )}
          </button>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4 text-sm">
            {showUnreadOnly
              ? "No unread messages"
              : showOnlineOnly
                ? "No online friends"
                : "No friends yet"}
          </div>
        )}
      </div>

      {/* Drag handle */}
      <div
        onMouseDown={(e) => {
          e.preventDefault(); // 🔥 stops text selection instantly
          isDraggingRef.current = true;
          document.body.style.userSelect = "none"; // disable globally
        }}
        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary/30"
      />

      {/* Modals */}
      <AddFriendModal
        isOpen={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
      />
      <FriendRequests
        isOpen={showFriendRequests}
        onClose={() => setShowFriendRequests(false)}
      />
    </aside>
  );
};

export default Sidebar;