"use client";

import Y2KCard from "@/components/ui/Y2KCard";
import { X } from "lucide-react";
import { useState } from "react";
import { UserData } from "@/app/lib/userService";

interface UserManagerModalProps {
  onClose: () => void;
  onSubmit: (data: ModalFormData) => Promise<void>;
  editingUser?: UserData | null;
  loading?: boolean;
}

export interface ModalFormData {
  username: string;
  password: string;
  confirmPassword?: string;
  role: "admin" | "operator" | "guest";
}

export default function UserManagerModal({
  onClose,
  onSubmit,
  editingUser,
  loading = false,
}: UserManagerModalProps) {
  const [formData, setFormData] = useState<ModalFormData>({
    username: editingUser?.username || "",
    password: "",
    confirmPassword: "",
    role: editingUser?.role || "operator",
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEditMode = !!editingUser;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.username.trim()) {
      setFormError("Username is required");
      return false;
    }

    if (formData.username.length < 3) {
      setFormError("Username must be at least 3 characters");
      return false;
    }

    if (!isEditMode && !formData.password) {
      setFormError("Password is required for new users");
      return false;
    }

    if (formData.password && formData.password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return false;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setFormError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "An error occurred",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md animate-in zoom-in-95 duration-300">
        <Y2KCard
          title={isEditMode ? "EDIT_NODE_OPERATOR" : "ENROLL_NEW_NODE"}
          variant="purple"
          className="shadow-[10px_10px_0px_0px_#BA8CFF] mb-0"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {formError && (
              <div className="p-3 bg-red-500/20 border-2 border-red-500 text-red-500 font-bold text-[11px] uppercase">
                {formError}
              </div>
            )}

            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase italic text-gray-400">
                User_Identity
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                disabled={submitting || loading}
                placeholder="Enter username"
                className="w-full px-4 py-2 bg-[#1A1A1A] border-2 border-[#4D4D4D] text-[#C4FF4D] font-bold text-[11px] placeholder-gray-600 focus:border-[#BA8CFF] focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* Password Field - Always shown in edit mode, required in create mode */}
            {!isEditMode || true ? (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase italic text-gray-400">
                    {isEditMode ? "New_Password" : "Password"}
                    {isEditMode && (
                      <span className="text-gray-500 ml-2">
                        (leave blank to keep current)
                      </span>
                    )}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={submitting || loading}
                    placeholder={
                      isEditMode
                        ? "Leave blank to keep current password"
                        : "Enter password"
                    }
                    className="w-full px-4 py-2 bg-[#1A1A1A] border-2 border-[#4D4D4D] text-[#C4FF4D] font-bold text-[11px] placeholder-gray-600 focus:border-[#BA8CFF] focus:outline-none disabled:opacity-50"
                  />
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase italic text-gray-400">
                    Confirm_Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={submitting || loading}
                    placeholder="Confirm password"
                    className="w-full px-4 py-2 bg-[#1A1A1A] border-2 border-[#4D4D4D] text-[#C4FF4D] font-bold text-[11px] placeholder-gray-600 focus:border-[#BA8CFF] focus:outline-none disabled:opacity-50"
                  />
                </div>
              </>
            ) : null}

            {/* Role Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase italic text-gray-400">
                Access_Role
              </label>
              {isEditMode ? (
                <div className="w-full px-4 py-2 bg-[#1A1A1A] border-2 border-[#4D4D4D] text-[#BA8CFF] font-bold text-[11px] flex items-center">
                  {formData.role.charAt(0).toUpperCase() +
                    formData.role.slice(1)}
                </div>
              ) : (
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  disabled={submitting || loading}
                  aria-label="Access Role"
                  title="Select user access role"
                  className="w-full px-4 py-2 bg-[#1A1A1A] border-2 border-[#4D4D4D] text-[#C4FF4D] font-bold text-[11px] focus:border-[#BA8CFF] focus:outline-none disabled:opacity-50"
                >
                  <option value="guest">Guest</option>
                  <option value="operator">Operator</option>
                  <option value="admin">Admin</option>
                </select>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting || loading}
                className="flex-1 bg-[#C4FF4D] text-[#1A1A1A] font-black py-2 border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(186,140,255,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all uppercase text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting || loading
                  ? "Processing..."
                  : isEditMode
                    ? "Update"
                    : "Create"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting || loading}
                className="flex-1 bg-gray-700 text-white font-black py-2 border-2 border-gray-600 hover:bg-gray-600 transition-colors uppercase text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Close Button */}
          <button
            onClick={onClose}
            disabled={submitting || loading}
            aria-label="Close modal"
            title="Close modal"
            className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </Y2KCard>
      </div>
    </div>
  );
}
