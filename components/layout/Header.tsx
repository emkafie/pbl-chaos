"use client";
import React, { useState } from "react";
import { Menu, X } from "lucide-react";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  title: string;
  userProfile?: {
    username: string;
    role: string;
  };
}

const Header: React.FC<HeaderProps> = ({
  sidebarOpen,
  setSidebarOpen,
  title,
  userProfile,
}) => {
  return (
    <header className="h-20 border-b-4 border-[#4D4D4D] flex items-center justify-between px-8 bg-[#1A1A1A]">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 border-2 border-[#C4FF4D] text-[#C4FF4D] hover:bg-[#C4FF4D] hover:text-[#1A1A1A] transition-all"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <h2 className="text-[#C4FF4D] font-black text-xl uppercase italic tracking-tighter">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:block text-right font-mono">
          <p className="text-[10px] text-[#BA8CFF] font-bold uppercase tracking-widest">
            {userProfile?.role || "Unknown Role"}_access
          </p>
          <p className="text-sm font-black underline decoration-[#C4FF4D]">
            {userProfile?.username || "Unknown User"}
          </p>
        </div>
        <div className="w-10 h-10 bg-[#BA8CFF] border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#C4FF4D] flex items-center justify-center rounded-full text-[#1A1A1A] font-bold uppercase">
            {userProfile?.username ? userProfile.username.charAt(0).toUpperCase() : "?"}
        </div>
      </div>
    </header>
  );
};

export default Header;
