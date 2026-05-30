"use client";
import React from "react";
import {
  Car,
  LayoutDashboard,
  MapPin,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Clock,
} from "lucide-react";
import { NavItemProps } from "@/types";
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
        ? "bg-(--color-y2k-lime) text-(--color-y2k-button-text) border-(--color-y2k-solid-border) shadow-[3px_3px_0px_0px_var(--color-y2k-purple)] translate-x-1"
        : "text-gray-500 border-transparent hover:text-(--color-y2k-text-main) hover:translate-x-1"
    }`}
  >
    {icon}
    {!collapsed && <span>{label}</span>}
  </button>
);

interface SidebarProps {
  isOpen: boolean;
  activeTab: string;
  setActiveTab: (t: string) => void;
  onLogout: () => void;
  /** Called when the mobile backdrop is clicked so the parent can close the sidebar */
  onClose?: () => void;
}

export const Sidebar = ({
  isOpen,
  activeTab,
  setActiveTab,
  onLogout,
  onClose,
}: SidebarProps) => {
  const { user } = useAuth();

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    // Close the drawer on mobile after selecting a tab
    if (window.innerWidth < 1024) {
      onClose?.();
    }
  };

  return (
    <>
      {/* ── Mobile backdrop overlay ─────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar panel ───────────────────────────────────── */}
      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-50
          bg-(--color-y2k-bg-main) border-r-4 border-(--color-y2k-border)
          transition-all duration-300 shrink-0
          ${
            isOpen
              ? "w-64 translate-x-0"
              : "w-64 -translate-x-full md:w-20 md:translate-x-0"
          }
        `}
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="bg-(--color-y2k-lime) p-2 border-2 border-(--color-y2k-solid-border)">
            <Car className="text-(--color-y2k-button-text)" size={20} />
          </div>
          {/* Always show text on mobile drawer; on desktop respect collapsed state */}
          <span
            className={`font-black text-xl italic tracking-tighter text-(--color-y2k-lime) ${
              !isOpen ? "md:hidden" : ""
            }`}
          >
            P-IOT
          </span>
        </div>

        {/* Nav items */}
        <nav className="mt-10 px-4 space-y-4">
          <NavItem
            icon={<LayoutDashboard size={20} />}
            label="Overview"
            active={activeTab === "overview"}
            onClick={() => handleNavClick("overview")}
            collapsed={!isOpen}
          />
          <NavItem
            icon={<MapPin size={20} />}
            label="Live Map"
            active={activeTab === "map"}
            onClick={() => handleNavClick("map")}
            collapsed={!isOpen}
          />

          {/* Admin Menu */}
          {user?.role === "admin" && (
            <>
              <div
                className={`pt-4 border-t-2 border-(--color-y2k-border) ${
                  !isOpen ? "md:hidden" : ""
                }`}
              >
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">
                  Management
                </p>
              </div>
              <NavItem
                icon={<BarChart3 size={20} />}
                label="Analytics"
                active={activeTab === "analytics"}
                onClick={() => handleNavClick("analytics")}
                collapsed={!isOpen}
              />
              <NavItem
                icon={<Users size={20} />}
                label="User Manager"
                active={activeTab === "users"}
                onClick={() => handleNavClick("users")}
                collapsed={!isOpen}
              />
              <NavItem
                icon={<Settings size={20} />}
                label="IoT Config"
                active={activeTab === "config"}
                onClick={() => handleNavClick("config")}
                collapsed={!isOpen}
              />
              <NavItem
                icon={<Clock size={20} />}
                label="History Log"
                active={activeTab === "history"}
                onClick={() => handleNavClick("history")}
                collapsed={!isOpen}
              />
            </>
          )}

          <div className="pt-10">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-4 p-3 text-(--color-y2k-purple) hover:bg-(--color-y2k-purple) hover:text-(--color-y2k-button-text) transition-colors font-bold uppercase text-xs"
            >
              <LogOut size={20} />
              {isOpen && <span>Disconnect</span>}
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};
