"use client";
import React from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import AvatarDropdown from "../profile/AvatarDropdown";
import { useTheme } from "@/app/context/ThemeContext";

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
  onOpenNotifications?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  sidebarOpen,
  setSidebarOpen,
  title,
  userProfile,
  onNavigate,
  onLogout,
  onOpenNotifications,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 sm:h-20 border-b-4 border-(--color-y2k-border) flex items-center justify-between px-4 sm:px-8 bg-(--color-y2k-bg-main) shrink-0">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 border-2 border-(--color-y2k-lime) text-(--color-y2k-lime) hover:bg-(--color-y2k-lime) hover:text-(--color-y2k-button-text) transition-all shrink-0"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <h2 className="text-(--color-y2k-lime) font-black text-sm sm:text-xl uppercase italic tracking-tighter text-ellipsis">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <button
          onClick={toggleTheme}
          className="p-2 border-2 border-(--color-y2k-border) text-(--color-y2k-text-main) hover:bg-y2k-lime)/20 hover:text-(--color-y2k-text-main) transition-all rounded-full"
          title="Toggle Theme"
        >
          {theme === "bright" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        {userProfile && (
          <AvatarDropdown
            userProfile={userProfile}
            onNavigate={onNavigate}
            onLogout={onLogout}
            onOpenNotifications={onOpenNotifications}
          />
        )}
      </div>
    </header>
  );
};

export default Header;
