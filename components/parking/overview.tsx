"use client";

import StatCard from "@/components/parking/StatCard";
import { UserRole } from "@/types";
import { Activity, AlertCircle, Car, Cpu, Database } from "lucide-react";

interface OverviewTabProps {
  role: UserRole;
  onOpenModal: () => void;
  totalSlots: number;
  availableSlots: number;
}

export const OverviewTab = ({ role, onOpenModal, totalSlots, availableSlots }: OverviewTabProps) => {

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
  </div>
  );
};

export default OverviewTab;