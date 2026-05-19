"use client";
import React from "react";
import { User, Mail, Shield, Clock, Camera } from "lucide-react";
import Y2KCard from "@/components/ui/Y2KCard";

interface ProfileTabProps {
  userProfile: {
    username: string;
    email?: string;
    role: string;
    profilePicture?: string;
    lastLogin?: string;
  };
}

const ProfileTab: React.FC<ProfileTabProps> = ({ userProfile }) => {
  const roleColors: Record<string, string> = {
    admin: "bg-[var(--color-y2k-lime)] text-[var(--color-y2k-button-text)]",
    operator: "bg-[var(--color-y2k-purple)] text-[var(--color-y2k-button-text)]",
    guest: "bg-[var(--color-y2k-border)] text-[var(--color-y2k-text-main)]",
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <Y2KCard variant="purple">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Profile Picture */}
          <div className="relative group">
            {userProfile.profilePicture ? (
              <img
                src={userProfile.profilePicture}
                alt={userProfile.username}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[var(--color-y2k-purple)] shadow-[4px_4px_0px_0px_var(--color-y2k-lime)] object-cover"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[var(--color-y2k-purple)] shadow-[4px_4px_0px_0px_var(--color-y2k-lime)] bg-[var(--color-y2k-purple)]/20 flex items-center justify-center">
                <span className="text-4xl sm:text-5xl font-black text-[var(--color-y2k-purple)] uppercase">
                  {userProfile.username?.charAt(0) || "?"}
                </span>
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[var(--color-y2k-lime)] border-2 border-[var(--color-y2k-solid-border)] rounded-full flex items-center justify-center">
              <Camera size={14} className="text-[var(--color-y2k-button-text)]" />
            </div>
          </div>

          {/* User Info */}
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--color-y2k-text-main)] uppercase italic tracking-tighter">
              {userProfile.username}
            </h2>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
              <span
                className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-[var(--color-y2k-solid-border)] ${
                  roleColors[userProfile.role] || roleColors.guest
                }`}
              >
                {userProfile.role}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-3">
            </p>
          </div>
        </div>
      </Y2KCard>

      {/* Profile Details Card */}
      <Y2KCard title="User_Details" icon={User} variant="grey">
        <div className="space-y-4">
          {/* Username */}
          <div className="flex items-start gap-4 p-4 bg-[var(--color-y2k-border)]/10 border-l-4 border-[var(--color-y2k-lime)]">
            <div className="w-8 h-8 bg-[var(--color-y2k-lime)]/10 flex items-center justify-center shrink-0">
              <User size={16} className="text-[var(--color-y2k-lime)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                Username
              </p>
              <p className="text-[var(--color-y2k-text-main)] font-bold text-sm truncate">
                {userProfile.username}
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-4 p-4 bg-[var(--color-y2k-border)]/10 border-l-4 border-[var(--color-y2k-purple)]">
            <div className="w-8 h-8 bg-[var(--color-y2k-purple)]/10 flex items-center justify-center shrink-0">
              <Mail size={16} className="text-[var(--color-y2k-purple)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                Email
              </p>
              <p className="text-[var(--color-y2k-text-main)] font-bold text-sm truncate">
                {userProfile.email || "Not set"}
              </p>
            </div>
          </div>

          {/* Role */}
          <div className="flex items-start gap-4 p-4 bg-[var(--color-y2k-border)]/10 border-l-4 border-[var(--color-y2k-lime)]">
            <div className="w-8 h-8 bg-[var(--color-y2k-lime)]/10 flex items-center justify-center shrink-0">
              <Shield size={16} className="text-[var(--color-y2k-lime)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                Role
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border-2 border-[var(--color-y2k-solid-border)] ${
                    roleColors[userProfile.role] || roleColors.guest
                  }`}
                >
                  {userProfile.role}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  {userProfile.role === "admin"
                    ? "// Full system access"
                    : userProfile.role === "operator"
                    ? "// Operational access"
                    : "// Limited access"}
                </span>
              </div>
            </div>
          </div>

          {/* Last Login */}
          <div className="flex items-start gap-4 p-4 bg-[var(--color-y2k-border)]/10 border-l-4 border-[var(--color-y2k-purple)]">
            <div className="w-8 h-8 bg-[var(--color-y2k-purple)]/10 flex items-center justify-center shrink-0">
              <Clock size={16} className="text-[var(--color-y2k-purple)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                Last Login
              </p>
              <p className="text-[var(--color-y2k-text-main)] font-bold text-sm">
                {formatDate(userProfile.lastLogin)}
              </p>
            </div>
          </div>
        </div>
      </Y2KCard>
    </div>
  );
};

export default ProfileTab;
