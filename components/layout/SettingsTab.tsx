"use client";
import React, { useState, useRef } from "react";
import {
  Camera,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  Upload,
  Trash2,
} from "lucide-react";
import Y2KCard from "@/components/ui/Y2KCard";
import { UserService } from "@/app/lib/userService";
import { db } from "@/app/lib/firebase";
import { UserProfile } from "@/types";

interface SettingsTabProps {
  userProfile: UserProfile;
  onProfileUpdate: (updated: Partial<UserProfile>) => void;
}

type ToastType = "success" | "error";

interface Toast {
  message: string;
  type: ToastType;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  userProfile,
  onProfileUpdate,
}) => {
  // Profile Picture state
  const [profilePicture, setProfilePicture] = useState(
    userProfile.profilePicture || ""
  );
  const [pictureLoading, setPictureLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Handle profile picture upload
  const handlePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file.", "error");
      return;
    }

    // Validate file size (max 500KB for Firestore)
    if (file.size > 500 * 1024) {
      showToast("Image must be under 500KB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setProfilePicture(base64);

      if (!userProfile.id) {
        showToast("User ID not found. Cannot update.", "error");
        return;
      }

      setPictureLoading(true);
      try {
        await UserService.updateProfilePicture(db, userProfile.id, base64);
        onProfileUpdate({ profilePicture: base64 });
        showToast("Profile picture updated successfully!", "success");
      } catch (err) {
        console.error("Failed to update profile picture:", err);
        showToast("Failed to update profile picture.", "error");
        setProfilePicture(userProfile.profilePicture || "");
      } finally {
        setPictureLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle remove profile picture
  const handleRemovePicture = async () => {
    if (!userProfile.id) {
      showToast("User ID not found.", "error");
      return;
    }

    setPictureLoading(true);
    try {
      await UserService.updateProfilePicture(db, userProfile.id, "");
      setProfilePicture("");
      onProfileUpdate({ profilePicture: "" });
      showToast("Profile picture removed.", "success");
    } catch (err) {
      console.error("Failed to remove profile picture:", err);
      showToast("Failed to remove profile picture.", "error");
    } finally {
      setPictureLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userProfile.id) {
      showToast("User ID not found.", "error");
      return;
    }

    // Validation
    if (!currentPassword) {
      showToast("Current password is required.", "error");
      return;
    }
    if (!newPassword) {
      showToast("New password is required.", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("New password must be at least 6 characters.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }
    if (currentPassword === newPassword) {
      showToast("New password must be different from current.", "error");
      return;
    }

    setPasswordLoading(true);
    try {
      // Verify current password
      const isValid = await UserService.verifyPassword(
        db,
        userProfile.id,
        currentPassword
      );

      if (!isValid) {
        showToast("Current password is incorrect.", "error");
        setPasswordLoading(false);
        return;
      }

      // Update password
      await UserService.updateUserPassword(db, userProfile.id, newPassword);

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password updated successfully!", "success");
    } catch (err) {
      console.error("Failed to update password:", err);
      showToast("Failed to update password. Please try again.", "error");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { strength: 20, label: "WEAK", color: "#ff4444" };
    if (score <= 2) return { strength: 40, label: "FAIR", color: "#ffaa44" };
    if (score <= 3) return { strength: 60, label: "GOOD", color: "#ffff44" };
    if (score <= 4) return { strength: 80, label: "STRONG", color: "#C4FF4D" };
    return { strength: 100, label: "EXCELLENT", color: "#00ff88" };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div className="max-w-2xl mx-auto space-y-6 relative">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 border-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-xs uppercase tracking-wider ${
            toast.type === "success"
              ? "bg-[#C4FF4D] text-[#1A1A1A] border-[#1A1A1A]"
              : "bg-red-500 text-white border-[#1A1A1A]"
          }`}
          style={{
            animation: "toastSlide 0.3s ease-out",
          }}
        >
          {toast.type === "success" ? (
            <Check size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Profile Picture Section */}
      <Y2KCard title="Profile_Picture" icon={Camera} variant="purple">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Current Picture */}
          <div className="relative group">
            {profilePicture ? (
              <img
                src={profilePicture}
                alt={userProfile.username}
                className="w-28 h-28 rounded-full border-4 border-[#BA8CFF] shadow-[4px_4px_0px_0px_#C4FF4D] object-cover"
              />
            ) : (
              <div className="w-28 h-28 rounded-full border-4 border-[#BA8CFF] shadow-[4px_4px_0px_0px_#C4FF4D] bg-[#BA8CFF]/20 flex items-center justify-center">
                <span className="text-5xl font-black text-[#BA8CFF] uppercase">
                  {userProfile.username?.charAt(0) || "?"}
                </span>
              </div>
            )}

            {pictureLoading && (
              <div className="absolute inset-0 bg-[#1A1A1A]/70 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-[#C4FF4D] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Upload Controls */}
          <div className="flex-1 space-y-3">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              // Upload a new profile picture (max 500KB)
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                id="upload-picture-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={pictureLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#C4FF4D] text-[#1A1A1A] font-black text-[11px] uppercase tracking-wider border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(186,140,255,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(186,140,255,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={14} />
                <span>Upload</span>
              </button>

              {profilePicture && (
                <button
                  id="remove-picture-btn"
                  onClick={handleRemovePicture}
                  disabled={pictureLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-transparent text-red-400 font-black text-[11px] uppercase tracking-wider border-2 border-red-400/40 hover:bg-red-400/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={14} />
                  <span>Remove</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePictureUpload}
              className="hidden"
            />

            <p className="text-[9px] text-gray-600 font-mono">
              Supported: JPG, PNG, GIF, WebP
            </p>
          </div>
        </div>
      </Y2KCard>

      {/* Password Change Section */}
      <Y2KCard title="Change_Password" icon={Lock} variant="grey">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password..."
                className="w-full bg-[#4D4D4D]/20 border-2 border-[#4D4D4D] text-white placeholder-gray-600 px-4 py-3 text-sm font-mono focus:border-[#C4FF4D] focus:outline-none transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#C4FF4D] transition-colors"
              >
                {showCurrentPassword ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password..."
                className="w-full bg-[#4D4D4D]/20 border-2 border-[#4D4D4D] text-white placeholder-gray-600 px-4 py-3 text-sm font-mono focus:border-[#C4FF4D] focus:outline-none transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#C4FF4D] transition-colors"
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="mt-2 space-y-1">
                <div className="w-full h-1.5 bg-[#4D4D4D]/30">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${passwordStrength.strength}%`,
                      backgroundColor: passwordStrength.color,
                    }}
                  />
                </div>
                <p
                  className="text-[9px] font-black uppercase tracking-widest"
                  style={{ color: passwordStrength.color }}
                >
                  {passwordStrength.label}
                </p>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password..."
                className={`w-full bg-[#4D4D4D]/20 border-2 text-white placeholder-gray-600 px-4 py-3 text-sm font-mono focus:outline-none transition-colors pr-12 ${
                  confirmPassword && confirmPassword !== newPassword
                    ? "border-red-400 focus:border-red-400"
                    : confirmPassword && confirmPassword === newPassword
                    ? "border-[#C4FF4D] focus:border-[#C4FF4D]"
                    : "border-[#4D4D4D] focus:border-[#C4FF4D]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#C4FF4D] transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>
            </div>
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-[9px] text-red-400 font-bold uppercase tracking-widest mt-1">
                Passwords do not match
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="change-password-btn"
              type="submit"
              disabled={
                passwordLoading ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword
              }
              className="flex items-center gap-2 px-6 py-3 bg-[#C4FF4D] text-[#1A1A1A] font-black text-xs uppercase tracking-wider border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(186,140,255,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(186,140,255,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0px_0px_rgba(186,140,255,1)]"
            >
              {passwordLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Lock size={14} />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Y2KCard>

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes toastSlide {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default SettingsTab;
