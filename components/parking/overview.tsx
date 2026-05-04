"use client";

import { useAuth } from "@/app/context/AuthContext";
import StatCard from "@/components/parking/StatCard";
import Y2KCard from "@/components/ui/Y2KCard";
import { UserRole } from "@/types";
import { Activity, AlertCircle, Car, Cpu, Database } from "lucide-react";
import { useMemo, useState } from "react";

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

interface OverviewTabProps {
  role: UserRole;
  onOpenModal: () => void;
  totalSlots: number;
  availableSlots: number;
}

export const OverviewTab = ({ role, onOpenModal, totalSlots, availableSlots }: OverviewTabProps) => {
  const { users } = useAuth();
  const [showAllLogs, setShowAllLogs] = useState(false);

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className={`grid grid-cols-1 md:grid-cols-2 ${role === "admin" ? "lg:grid-cols-4" : role === "operator" ? "lg:grid-cols-3" : "lg:grid-cols-2"} gap-6`}>
      <StatCard label="Total Slots" value={totalSlots.toString().padStart(2, '0')} icon={<Database size={20}/>} color="#C4FF4D" />
      <StatCard label="Available" value={availableSlots.toString().padStart(2, '0')} icon={<Car size={20}/>} color="#BA8CFF" />
      {role === "operator" && (
        <>
      <button onClick={onOpenModal} className="text-left">
        <StatCard label="Operator_Notes" value="1" icon={<AlertCircle size={20}/>} color="#C4FF4D" />
      </button>
      </>
      )}
      {role === "admin" && (
        <>
          <StatCard label="Cloud Status" value="Online" icon={<Activity size={20}/>} color="#C4FF4D" />
          <StatCard label="System Load" value="14%" icon={<Cpu size={20}/>} color="#BA8CFF" />
        </>
      )}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
      {/* TAMPILAN KHUSUS ADMIN: Menampilkan Log User */}
      {role === 'admin' && (
        <Y2KCard title="Recent_Logins" variant="purple">
          <div className="space-y-4">
            {visibleLogs.length > 0 ? (
              visibleLogs.map((log, i) => (
                <div key={i} className="flex justify-between items-center border-b border-[#4D4D4D] pb-2">
                  <div>
                    <p className="text-xs font-black">{log.name}</p>
                    <p className="text-[8px] text-[#BA8CFF] font-bold uppercase">{log.role}</p>
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold italic">{log.time}</span>
                </div>
              ))
            ) : (
              <div className="text-[10px] text-gray-400 uppercase tracking-widest">
                No recent login records
              </div>
            )}
            {recentLogins.length > 3 && (
              <button
                onClick={() => setShowAllLogs(!showAllLogs)}
                className="w-full text-[10px] font-black text-[#C4FF4D] underline uppercase mt-2"
              >
                {showAllLogs ? "View fewer logs" : "View all logs"}
              </button>
            )}
          </div>
        </Y2KCard>
      )}
    </div>
  </div>
  );
};

export default OverviewTab;