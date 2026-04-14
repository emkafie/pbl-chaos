"use client";
import React from "react";
import { useState } from "react";
import {
  Car,
  LayoutDashboard,
  MapPin,
  BarChart3,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { NavItemProps } from "@/types"; // Sesuaikan path jika tidak pakai alias
import { useAuth } from "@/app/context/AuthContext";

const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  active,
  onClick,
  collapsed,
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 p-3 transition-all font-bold uppercase text-[11px] border-2 ${
      active
        ? "bg-[#C4FF4D] text-[#1A1A1A] border-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(186,140,255,1)] translate-x-1"
        : "text-gray-500 border-transparent hover:text-white hover:translate-x-1"
    }`}
  >
    {icon}
    {!collapsed && <span>{label}</span>}
  </button>
);

export const Sidebar = ({
  isOpen,
  activeTab,
  setActiveTab,
  onLogout,
}: {
  isOpen: boolean;
  activeTab: string;
  setActiveTab: (t: string) => void;
  onLogout: () => void;
}) => {

  const { user } = useAuth();

  return (
    <aside
      className={`bg-[#1A1A1A] border-r-4 border-[#4D4D4D] transition-all duration-300 z-50 ${isOpen ? "w-64" : "w-20"}`}
    >
      <div className="p-6 flex items-center gap-3">
        <div className="bg-[#C4FF4D] p-2 border-2 border-[#1A1A1A]">
          <Car className="text-[#1A1A1A]" size={20} />
        </div>
        {isOpen && (
          <span className="font-black text-xl italic tracking-tighter text-[#C4FF4D]">
            P-IOT
          </span>
        )}
      </div>

      <nav className="mt-10 px-4 space-y-4">
        <NavItem
          icon={<LayoutDashboard size={20} />}
          label="Overview"
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
          collapsed={!isOpen}
        />
        <NavItem
          icon={<MapPin size={20} />}
          label="Live Map"
          active={activeTab === "map"}
          onClick={() => setActiveTab("map")}
          collapsed={!isOpen}
        />

        {/* Admin Menu */}
        {user?.role === "admin" && (
          <>
            <div
              className={`pt-4 border-t-2 border-[#4D4D4D] ${!isOpen && "hidden"}`}
            >
              <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">
                Management
              </p>
            </div>
            <NavItem
              icon={<BarChart3 size={20} />}
              label="Analytics"
              active={activeTab === "analytics"}
              onClick={() => setActiveTab("analytics")}
              collapsed={!isOpen}
            />
            <NavItem
              icon={<Users size={20} />}
              label="User Manager"
              active={activeTab === "users"}
              onClick={() => setActiveTab("users")}
              collapsed={!isOpen}
            />
            <NavItem
              icon={<Settings size={20} />}
              label="IoT Config"
              active={activeTab === "config"}
              onClick={() => setActiveTab("config")}
              collapsed={!isOpen}
            />
          </>
        )}

        <div className="pt-10">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 p-3 text-[#BA8CFF] hover:bg-[#BA8CFF] hover:text-[#1A1A1A] transition-colors font-bold uppercase text-xs"
          >
            <LogOut size={20} />
            {isOpen && <span>Disconnect</span>}
          </button>
        </div>
      </nav>
    </aside>
  );
};
