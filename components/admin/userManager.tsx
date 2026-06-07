"use client";

import Y2KCard from "../ui/Y2KCard";
import { UserPlus, Trash2, Edit2, AlertCircle } from "lucide-react";
import { useContext, useState, useCallback } from "react";
import { AuthContext } from "@/app/context/AuthContext";
import { db } from "@/app/lib/firebase";
import { UserService, UserData } from "@/app/lib/userService";
import UserManagerModal, {
  ModalFormData,
} from "../modal/admin/userManagerModal";

const UserManagerTab = () => {
  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error("AuthContext not found");

  const { users, usersLoading, usersError, refreshUsers } = authContext;
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleOpenModal = (user?: UserData) => {
    setEditingUser(user || null);
    setShowModal(true);
    setActionError(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setActionError(null);
  };

  const handleSubmitForm = useCallback(
    async (formData: ModalFormData) => {
      setActionLoading(true);
      setActionError(null);
      try {
        if (editingUser) {
          await UserService.updateUser(db, editingUser.id, {
            username: formData.username,
          });
          if (formData.password) {
            await UserService.updateUserPassword(
              db,
              editingUser.id,
              formData.password,
            );
          }
        } else {
          await UserService.createUser(
            db,
            formData.username,
            formData.password,
            formData.role,
          );
        }
        await refreshUsers();
        handleCloseModal();
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "An error occurred";
        setActionError(errorMsg);
        throw error;
      } finally {
        setActionLoading(false);
      }
    },
    [editingUser, refreshUsers],
  );

  const handleDeleteUser = useCallback(
    async (userId: string) => {
      setActionLoading(true);
      setActionError(null);
      try {
        await UserService.deleteUser(db, userId);
        await refreshUsers();
        setDeleteConfirm(null);
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Failed to delete user";
        setActionError(errorMsg);
      } finally {
        setActionLoading(false);
      }
    },
    [refreshUsers],
  );

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const roleClass = (role: string) =>
    role === "admin"
      ? "border-(--color-y2k-purple) text-(--color-y2k-purple)"
      : role === "operator"
      ? "border-(--color-y2k-lime) text-(--color-y2k-lime)"
      : "border-gray-500 text-gray-500";

  return (
    <>
      <Y2KCard title="Node_Operators_Directory" variant="purple">
        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap justify-between items-center gap-3">
          <p className="text-[10px] text-gray-500 font-bold uppercase italic tracking-widest">
            Active System Accounts
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-(--color-y2k-lime) text-(--color-y2k-button-text) px-4 py-2 text-[10px] font-black border-2 border-(--color-y2k-solid-border) shadow-[3px_3px_0px_0px_var(--color-y2k-purple)] uppercase active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all hover:shadow-none disabled:opacity-50"
            disabled={actionLoading || usersLoading}
          >
            <UserPlus size={14} /> Enroll_New_Node
          </button>
        </div>

        {/* Error Display */}
        {(usersError || actionError) && (
          <div className="mb-4 p-3 bg-red-500/20 border-2 border-red-500 text-red-500 font-bold text-[10px] uppercase flex items-center gap-2">
            <AlertCircle size={16} />
            {usersError || actionError}
          </div>
        )}

        {/* Loading State */}
        {usersLoading && (
          <div className="p-6 text-center text-(--color-y2k-text-muted) text-[11px] uppercase">
            Loading users...
          </div>
        )}

        {/* Empty State */}
        {!usersLoading && users.length === 0 && (
          <div className="p-6 text-center text-(--color-y2k-text-muted) text-[11px] uppercase">
            No users found. Create one to get started.
          </div>
        )}

        {!usersLoading && users.length > 0 && (
          <>
            {/* ── MOBILE: Card list (hidden on md+) ──────────────── */}
            <div className="block md:hidden space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="border-2 border-(--color-y2k-border) bg-(--color-y2k-border)/10 p-4 space-y-3"
                >
                  {/* Identity + role */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-(--color-y2k-lime) font-black text-sm truncate">
                      {user.username}
                    </span>
                    <span
                      className={`px-2 py-0.5 border-2 uppercase text-[9px] font-bold shrink-0 ${roleClass(user.role)}`}
                    >
                      {user.role}
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-(--color-y2k-text-muted)">
                    <div>
                      <p className="text-(--color-y2k-purple) uppercase text-[9px] mb-0.5">Created</p>
                      <p>{formatDate(user.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-(--color-y2k-purple) uppercase text-[9px] mb-0.5">Last Session</p>
                      <p>{formatDate(user.last_login)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-1 border-t border-(--color-y2k-border)">
                    <button
                      onClick={() => handleOpenModal(user)}
                      disabled={actionLoading}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[11px] font-bold disabled:opacity-50"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    {deleteConfirm === user.id ? (
                      <div className="flex gap-3 text-[11px] font-bold">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={actionLoading}
                          className="text-red-400 hover:text-red-300 disabled:opacity-50"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          disabled={actionLoading}
                          className="text-(--color-y2k-text-muted) hover:text-gray-300 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(user.id)}
                        disabled={actionLoading}
                        className="text-red-500 hover:text-red-400 flex items-center gap-1 text-[11px] font-bold disabled:opacity-50"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ── DESKTOP: Table (hidden below md) ───────────────── */}
            <div className="hidden md:block overflow-x-auto border-2 border-(--color-y2k-border)">
              <table className="w-full text-left text-[11px] font-bold">
                <thead className="bg-(--color-y2k-border)/20 border-b-2 border-(--color-y2k-border)">
                  <tr className="uppercase text-(--color-y2k-purple) italic">
                    <th className="p-4">User_Identity</th>
                    <th className="p-4">Access_Role</th>
                    <th className="p-4">Created_At</th>
                    <th className="p-4">Last_Session</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--color-y2k-border)">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-(--color-y2k-lime)/5 transition-colors"
                    >
                      <td className="p-4 text-(--color-y2k-lime)">{user.username}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 border-2 uppercase text-[9px] ${roleClass(user.role)}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4 text-(--color-y2k-text-muted) text-[10px]">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="p-4 text-(--color-y2k-text-muted) text-[10px]">
                        {formatDate(user.last_login)}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => handleOpenModal(user)}
                            disabled={actionLoading}
                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1 disabled:opacity-50"
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                          {deleteConfirm === user.id ? (
                            <div className="flex gap-2 text-[10px]">
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={actionLoading}
                                className="text-red-400 hover:text-red-300 font-bold disabled:opacity-50"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                disabled={actionLoading}
                                className="text-(--color-y2k-text-muted) hover:text-gray-300 font-bold disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(user.id)}
                              disabled={actionLoading}
                              className="text-red-500 hover:text-red-400 flex items-center gap-1 disabled:opacity-50"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Y2KCard>

      {/* User Manager Modal */}
      {showModal && (
        <UserManagerModal
          onClose={handleCloseModal}
          onSubmit={handleSubmitForm}
          editingUser={editingUser}
          loading={actionLoading}
        />
      )}
    </>
  );
};

export default UserManagerTab;
