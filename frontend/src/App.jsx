
import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import CallPage from "./pages/CallPage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useChatStore } from "./store/useChatStore";
import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { useCallStore } from "./store/useCallStore";
import IncomingCall from "./components/IncomingCall";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  const { theme } = useThemeStore();

  const { subscribeToMessages, unsubscribeFromMessages, initializeRandomChatSocket } = useChatStore();
  const { subscribeToCallEvents, unsubscribeFromCallEvents, isCallDeclined } = useCallStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 🔥 GLOBAL SOCKET SUBSCRIPTION
  useEffect(() => {
    if (!authUser) return;

    const id = setTimeout(() => {
      subscribeToMessages();
      subscribeToCallEvents();
      initializeRandomChatSocket();
    }, 0);

    return () => {
      clearTimeout(id);
      unsubscribeFromMessages();
      unsubscribeFromCallEvents();
    };
  }, [authUser, subscribeToMessages, unsubscribeFromMessages, initializeRandomChatSocket]);

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <div data-theme={theme}>
      <Navbar />

      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />

        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />

        <Route path="/call/:id" element={authUser ? <CallPage /> : <Navigate to="/login" />}
        />
      </Routes>

      <IncomingCall />
      {isCallDeclined && (
        <div className="fixed bottom-6 right-6 z-50 bg-base-100 border border-base-300 rounded-xl shadow-lg px-4 py-3 text-sm">
          Call was declined.
        </div>
      )}
      <Toaster />
    </div>
  );
};

export default App;