"use client";

import StatCard from "@/components/parking/StatCard";
import { UserRole } from "@/types";
import { Activity, AlertCircle, Car, Cpu, Database } from "lucide-react";

interface OverviewTabProps {
  role: UserRole;
  onOpenModal: () => void;
  totalSlots: number;
  availableSlots: number;
  rfidActive?: number;
  gateOnline?: boolean;
}

export const OverviewTab = ({ 
  role, 
  onOpenModal, 
  totalSlots, 
  availableSlots,
  rfidActive = 0,
  gateOnline = false
}: OverviewTabProps) => {

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className={`grid grid-cols-1 md:grid-cols-2 ${role === "admin" ? "lg:grid-cols-4" : role === "operator" ? "lg:grid-cols-3" : "lg:grid-cols-2"} gap-6`}>
      <StatCard label="Total Slots" value={totalSlots.toString().padStart(2, '0')} icon={<Database size={20}/>} color="var(--color-y2k-lime)" />
      <StatCard label="Available" value={availableSlots.toString().padStart(2, '0')} icon={<Car size={20}/>} color="var(--color-y2k-purple)" />
      {role === "operator" && (
        <>
      <button onClick={onOpenModal} className="text-left">
        <StatCard label="Operator_Notes" value="1" icon={<AlertCircle size={20}/>} color="var(--color-y2k-lime)" />
      </button>
      </>
      )}
      {role === "admin" && (
        <>
          <StatCard label="RFID Active" value={rfidActive.toString().padStart(2, '0')} icon={<Activity size={20}/>} color="var(--color-y2k-lime)" />
          <StatCard label="Gate Status" value={gateOnline ? "ONLINE" : "OFFLINE"} icon={<Cpu size={20}/>} color={gateOnline ? "var(--color-y2k-lime)" : "var(--color-y2k-red)"} />
        </>
      )}
    </div>
  </div>
  );
};

export default OverviewTab;