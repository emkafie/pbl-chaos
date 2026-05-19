"use client";
import React, { useState, useRef, useEffect } from "react";
import { User, Settings, LogOut, ChevronDown, Bell } from "lucide-react";
import { useNotifications } from "@/app/lib/useNotifications";

interface AvatarDropdownProps {
  userProfile: {
    username: string;
    role: string;
    profilePicture?: string;
  };
  onNavigate: (tab: string) => void;
  onLogout: () => void;
  onOpenNotifications?: () => void;
}

const AvatarDropdown: React.FC<AvatarDropdownProps> = ({
  userProfile,
  onNavigate,
  onLogout,
  onOpenNotifications,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Only subscribe for operators to get the unread count
  const isOperator = userProfile.role === "operator";
  const { unreadCount } = useNotifications({
    role: (userProfile.role as "admin" | "operator") || "operator",
  });

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const menuItems = [
    {
      icon: <User size={14} />,
      label: "Profile",
      action: () => {
        onNavigate("profile");
        setIsOpen(false);
      },
    },
    {
      icon: <Bell size={14} />,
      label: "Notifications",
      action: () => {
        onOpenNotifications?.();
        setIsOpen(false);
      },
      badge: isOperator && unreadCount > 0 ? unreadCount : undefined,
    },
    {
      icon: <Settings size={14} />,
      label: "Settings",
      action: () => {
        onNavigate("settings");
        setIsOpen(false);
      },
    },
    {
      icon: <LogOut size={14} />,
      label: "Logout",
      action: () => {
        onLogout();
        setIsOpen(false);
      },
      danger: true,
    },
  ];

  return (
    <div ref={dropdownRef} className="relative">
      {/* Avatar Button */}
      <button
        id="avatar-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 group cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="hidden sm:block text-right font-mono">
          <p className="text-[10px] text-[var(--color-y2k-purple)] font-bold uppercase tracking-widest">
            {userProfile.role || "Unknown Role"}_access
          </p>
          <p className="text-sm font-black underline decoration-[var(--color-y2k-lime)]">
            {userProfile.username || "Unknown User"}
          </p>
        </div>
        <div className="relative">
          {userProfile.profilePicture ? (
            <img
              src={userProfile.profilePicture}
              alt={userProfile.username}
              className="w-9 h-9 sm:w-10 sm:h-10 border-2 border-[var(--color-y2k-solid-border)] shadow-[2px_2px_0px_0px_var(--color-y2k-lime)] rounded-full object-cover group-hover:shadow-[2px_2px_0px_0px_var(--color-y2k-purple)] transition-all"
            />
          ) : (
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 bg-[var(--color-y2k-purple)] border-2 border-[var(--color-y2k-solid-border)] shadow-[2px_2px_0px_0px_var(--color-y2k-lime)] flex items-center justify-center rounded-full text-[var(--color-y2k-button-text)] font-bold uppercase text-sm group-hover:shadow-[2px_2px_0px_0px_var(--color-y2k-purple)] group-hover:bg-[var(--color-y2k-lime)] transition-all"
            >
              {userProfile.username
                ? userProfile.username.charAt(0).toUpperCase()
                : "?"}
            </div>
          )}

          {/* Unread badge on avatar (operator only) */}
          {isOperator && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-[var(--color-y2k-text-main)] text-[9px] font-black border border-[var(--color-y2k-solid-border)] px-0.5 animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-[var(--color-y2k-purple)] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-3 w-56 bg-[var(--color-y2k-bg-main)] border-3 border-[var(--color-y2k-border)] shadow-[4px_4px_0px_0px_var(--color-y2k-purple)] z-100 overflow-hidden"
          style={{
            animation: "dropdownSlide 0.15s ease-out",
          }}
        >
          {/* User info header */}
          <div className="px-4 py-3 border-b-2 border-[var(--color-y2k-border)] bg-[var(--color-y2k-border)]/10">
            <p className="text-xs font-black text-[var(--color-y2k-text-main)] uppercase tracking-wider truncate">
              {userProfile.username}
            </p>
            <p className="text-[10px] text-[var(--color-y2k-purple)] font-bold uppercase tracking-widest mt-0.5">
              {userProfile.role}_access
            </p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {menuItems.map((item) => (
              <React.Fragment key={item.label}>
                {item.danger && (
                  <div className="mx-3 my-1 border-t border-[var(--color-y2k-border)]" />
                )}
                <button
                  id={`dropdown-${item.label.toLowerCase()}`}
                  onClick={item.action}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                    item.danger
                      ? "text-red-400 hover:bg-red-400/10 hover:text-red-300"
                      : "text-[var(--color-y2k-text-muted)] hover:bg-[var(--color-y2k-lime)]/10 hover:text-[var(--color-y2k-lime)]"
                  }`}
                >
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                  {/* Unread badge next to "Notifications" */}
                  {item.badge && (
                    <span className="min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-[var(--color-y2k-text-main)] text-[9px] font-black px-1 border border-[var(--color-y2k-solid-border)] shadow-[1px_1px_0px_0px_var(--color-y2k-purple)]">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default AvatarDropdown;
