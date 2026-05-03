// REPLACE entire SidebarSkeleton.jsx with:

const SidebarSkeleton = () => {
  const skeletonContacts = Array(8).fill(null);

  return (
    <aside className="relative h-full border-r border-base-300 flex flex-col" style={{ width: 280 }}>

      {/* Header — collapse button + search bar */}
      <div className="border-b border-base-300 w-full p-3">
        <div className="flex items-center gap-2">
          <div className="skeleton size-8 rounded-md shrink-0" />
          <div className="skeleton h-8 w-full rounded-lg" />
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mt-2">
          <div className="skeleton h-7 w-20 rounded-md" />
          <div className="skeleton h-7 w-20 rounded-md" />
        </div>
      </div>

      {/* User list */}
      <div className="overflow-y-auto w-full p-2">
        {skeletonContacts.map((_, idx) => (
          <div key={idx} className="w-full p-2 flex items-center gap-3">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="skeleton size-10 rounded-full" />
            </div>
            {/* Name + status */}
            <div className="flex-1 min-w-0">
              <div className="skeleton h-4 w-28 mb-2" />
              <div className="skeleton h-3 w-16" />
            </div>
          </div>
        ))}
      </div>

    </aside>
  );
};

export default SidebarSkeleton;