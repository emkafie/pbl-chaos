"use client";
import React, { useState, useRef, useEffect } from "react";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";

interface AvatarDropdownProps {
  userProfile: {
    username: string;
    role: string;
    profilePicture?: string;
  };
  onNavigate: (tab: string) => void;
  onLogout: () => void;
}

const AvatarDropdown: React.FC<AvatarDropdownProps> = ({
  userProfile,
  onNavigate,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
          <p className="text-[10px] text-[#BA8CFF] font-bold uppercase tracking-widest">
            {userProfile.role || "Unknown Role"}_access
          </p>
          <p className="text-sm font-black underline decoration-[#C4FF4D]">
            {userProfile.username || "Unknown User"}
          </p>
        </div>
        <div className="relative">
          {userProfile.profilePicture ? (
            <img
              src={userProfile.profilePicture}
              alt={userProfile.username}
              className="w-9 h-9 sm:w-10 sm:h-10 border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#C4FF4D] rounded-full object-cover group-hover:shadow-[2px_2px_0px_0px_#BA8CFF] transition-all"
            />
          ) : (
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 bg-[#BA8CFF] border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#C4FF4D] flex items-center justify-center rounded-full text-[#1A1A1A] font-bold uppercase text-sm group-hover:shadow-[2px_2px_0px_0px_#BA8CFF] group-hover:bg-[#C4FF4D] transition-all"
            >
              {userProfile.username
                ? userProfile.username.charAt(0).toUpperCase()
                : "?"}
            </div>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-[#BA8CFF] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-3 w-56 bg-[#1A1A1A] border-3 border-[#4D4D4D] shadow-[4px_4px_0px_0px_rgba(186,140,255,1)] z-[100] overflow-hidden"
          style={{
            animation: "dropdownSlide 0.15s ease-out",
          }}
        >
          {/* User info header */}
          <div className="px-4 py-3 border-b-2 border-[#4D4D4D] bg-[#4D4D4D]/10">
            <p className="text-xs font-black text-white uppercase tracking-wider truncate">
              {userProfile.username}
            </p>
            <p className="text-[10px] text-[#BA8CFF] font-bold uppercase tracking-widest mt-0.5">
              {userProfile.role}_access
            </p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {menuItems.map((item, index) => (
              <React.Fragment key={item.label}>
                {item.danger && (
                  <div className="mx-3 my-1 border-t border-[#4D4D4D]" />
                )}
                <button
                  id={`dropdown-${item.label.toLowerCase()}`}
                  onClick={item.action}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                    item.danger
                      ? "text-red-400 hover:bg-red-400/10 hover:text-red-300"
                      : "text-gray-400 hover:bg-[#C4FF4D]/10 hover:text-[#C4FF4D]"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
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
