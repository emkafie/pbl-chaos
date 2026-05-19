"use client";

import { useAuth } from "@/app/context/AuthContext";
import { UserRole } from "@/types";
import { useEffect, useMemo, useState } from "react";
import Y2KCard from "../ui/Y2KCard";

interface RecentLoginProps {
  role: UserRole;
}

const formatRelativeTime = (isoString: string) => {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "Invalid date";

  const deltaMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (deltaMinutes < 1) return "Just now";
  if (deltaMinutes < 60) return `${deltaMinutes}m ago`;

  const deltaHours = Math.floor(deltaMinutes / 60);
  if (deltaHours < 24) return `${deltaHours}h ago`;

  const deltaDays = Math.floor(deltaHours / 24);
  if (deltaDays < 7) return `${deltaDays}d ago`;

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const RecentLogin = ({ role }: RecentLoginProps) => {
  const { users, refreshUsers } = useAuth();
  const [showAllLogs, setShowAllLogs] = useState(false);

  // Fetch users once when admin views this component — avoids boot-time reads
  useEffect(() => {
    if (role === "admin") {
      refreshUsers();
    }
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps


  const recentLogins = useMemo(
    () =>
      users
        .filter((user) => user.last_login)
        .sort(
          (a, b) =>
            new Date(b.last_login).getTime() - new Date(a.last_login).getTime(),
        )
        .map((user) => ({
          name: user.username,
          role: user.role,
          time: formatRelativeTime(user.last_login),
        })),
    [users],
  );
  const visibleLogs = showAllLogs ? recentLogins : recentLogins.slice(0, 3);

  return (
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
      {/* TAMPILAN KHUSUS ADMIN: Menampilkan Log User */}
      {role === 'admin' && (
        <Y2KCard title="Recent_Logins" variant="purple">
          <div className="space-y-4">
            {visibleLogs.length > 0 ? (
              visibleLogs.map((log, i) => (
                <div key={i} className="flex justify-between items-center border-b border-[var(--color-y2k-border)] pb-2">
                  <div>
                    <p className="text-xs font-black">{log.name}</p>
                    <p className="text-[8px] text-[var(--color-y2k-purple)] font-bold uppercase">{log.role}</p>
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold italic">{log.time}</span>
                </div>
              ))
            ) : (
              <div className="text-[10px] text-[var(--color-y2k-text-muted)] uppercase tracking-widest">
                No recent login records
              </div>
            )}
            {recentLogins.length > 3 && (
              <button
                onClick={() => setShowAllLogs(!showAllLogs)}
                className="w-full text-[10px] font-black text-[var(--color-y2k-lime)] underline uppercase mt-2"
              >
                {showAllLogs ? "View fewer logs" : "View all logs"}
              </button>
            )}
          </div>
        </Y2KCard>
      )}
    </div>
  );
};
