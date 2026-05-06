"use client";
import React from "react";
import { Menu, X } from "lucide-react";
import AvatarDropdown from "../profile/AvatarDropdown";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  title: string;
  userProfile?: {
    username: string;
    role: string;
    profilePicture?: string;
  };
  onNavigate: (tab: string) => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({
  sidebarOpen,
  setSidebarOpen,
  title,
  userProfile,
  onNavigate,
  onLogout,
}) => {
  return (
    <header className="h-16 sm:h-20 border-b-4 border-[#4D4D4D] flex items-center justify-between px-4 sm:px-8 bg-[#1A1A1A] shrink-0">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 border-2 border-[#C4FF4D] text-[#C4FF4D] hover:bg-[#C4FF4D] hover:text-[#1A1A1A] transition-all shrink-0"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <h2 className="text-[#C4FF4D] font-black text-sm sm:text-xl uppercase italic tracking-tighter text-ellipsis">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {userProfile && (
          <AvatarDropdown
            userProfile={userProfile}
            onNavigate={onNavigate}
            onLogout={onLogout}
          />
        )}
      </div>
    </header>
  );
};

export default Header;
