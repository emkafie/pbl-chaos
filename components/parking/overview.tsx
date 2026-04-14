"use client";

import StatCard from "@/components/parking/StatCard";
import Y2KCard from "@/components/ui/Y2KCard";
import { Database, Car, Activity, Cpu, AlertCircle } from "lucide-react";
import { UserRole } from "@/types";

interface OverviewTabProps {
  role: UserRole;
  onOpenModal: () => void;
}

export const OverviewTab = ({ role, onOpenModal }: OverviewTabProps) => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <div className={`grid grid-cols-1 md:grid-cols-2 ${role === "admin" ? "lg:grid-cols-4" : role === "operator" ? "lg:grid-cols-3" : "lg:grid-cols-2"} gap-6`}>
      <StatCard label="Total Slots" value="12" icon={<Database size={20}/>} color="#C4FF4D" />
      <StatCard label="Available" value="08" icon={<Car size={20}/>} color="#BA8CFF" />
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
            {[
              { name: 'KHAFI_DEV', time: '2m ago', role: 'admin' },
              { name: 'OP_PARKIR_01', time: '1h ago', role: 'operator' },
              { name: 'OP_PARKIR_02', time: '4h ago', role: 'operator' },
            ].map((log, i) => (
              <div key={i} className="flex justify-between items-center border-b border-[#4D4D4D] pb-2">
                <div>
                  <p className="text-xs font-black">{log.name}</p>
                  <p className="text-[8px] text-[#BA8CFF] font-bold uppercase">{log.role}</p>
                </div>
                <span className="text-[10px] text-gray-500 font-bold italic">{log.time}</span>
              </div>
            ))}
            <button className="w-full text-[10px] font-black text-[#C4FF4D] underline uppercase mt-2">View all logs</button>
          </div>
        </Y2KCard>
      )}
    </div>
  </div>
);

export default OverviewTab;