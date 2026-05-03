import { MessageSquare } from "lucide-react";
import { Users, UserPlus, Shuffle } from "lucide-react";

import AddFriendModal from "./AddFriendModal";
import { useState } from "react";


const NoChatSelected = () => {

  const [showAddFriendModal, setShowAddFriendModal] = useState(false);

  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 bg-base-100/50">
      <div className="max-w-md text-center space-y-6">
        {/* Icon Display */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center
             justify-center animate-bounce"
            >
              <MessageSquare className="w-8 h-8 text-primary " />
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <h2 className="text-2xl font-bold">Welcome to ChatPie!</h2>

        <div className="quickAccess mt-6 grid grid-cols-3 gap-4 max-w-md">

          <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-base-200 hover:bg-base-300 transition hover:translate-y-[-0.2rem] ">
            <Users className="size-6" />
            <span className="text-xs text-center">New Group</span>
          </button>

          <button
            onClick={() => setShowAddFriendModal(true)}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-base-200 hover:bg-base-300 transition hover:translate-y-[-0.2rem] "
          >
            <UserPlus className="size-6" />
            <span className="text-xs text-center">Add Friend</span>
          </button>

          <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-base-200 hover:bg-base-300 transition hover:translate-y-[-0.2rem] ">
            <Shuffle className="size-6" />
            <span className="text-xs text-center">Connect n Play</span>
          </button>

        </div>
      </div>

      {/* Modals */}
      <AddFriendModal
        isOpen={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
      />

    </div>
  );
};

export default NoChatSelected;
