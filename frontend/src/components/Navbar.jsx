import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import { LogOut, MessageSquare, Settings, Bell } from "lucide-react";
import FriendRequests from "./FriendRequests";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const {
    pendingRequests,
    getPendingRequests,
    subscribeFriendEvents,
    unsubscribeFriendEvents
  } = useFriendStore();

  const [showFriendRequests, setShowFriendRequests] = useState(false);

  useEffect(() => {
    getPendingRequests();
    subscribeFriendEvents();

    return () => {
      unsubscribeFriendEvents();
    };
  }, [getPendingRequests, subscribeFriendEvents, unsubscribeFriendEvents]);

  return (
    <header className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 backdrop-blur-lg bg-base-100/80">
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-lg font-bold">ChatPie</h1>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2">

            {/* Friend requests */}
            <button
              onClick={() => setShowFriendRequests(true)}
              className="btn btn-sm relative"
            >
              <Bell className="size-5" />
              {pendingRequests.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            {/* Settings */}
            <Link to="/settings" className="btn btn-sm gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>

            {/* Profile + Logout */}
            {authUser && (
              <>
                <Link to="/profile" className="btn btn-sm gap-2">
                  <img
                    className="size-5 rounded-full"
                    src={authUser.profilePic || "/avatar.png"}
                    alt="Profile"
                  />
                  <span className="hidden sm:inline">Profile</span>
                </Link>

                <button className="btn btn-sm gap-2" onClick={logout}>
                  <LogOut className="size-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <FriendRequests
        isOpen={showFriendRequests}
        onClose={() => setShowFriendRequests(false)}
      />
    </header>
  );
};

export default Navbar;