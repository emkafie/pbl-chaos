"use client";

import { useAuth } from "@/app/context/AuthContext";
import Y2KCard from "../ui/Y2KCard";
import { TrendingUp } from "lucide-react";

export const RevenueStreamingCard = () => (
  <Y2KCard title="Revenue_Streaming" variant="purple">
    <div className="flex items-center justify-between mb-8">
      <div>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
          Est. Daily Income
        </p>
        <h4 className="text-3xl font-black text-[#C4FF4D] italic">
          Rp 420.000
        </h4>
      </div>
      <div className="bg-[#BA8CFF] p-2 border-2 border-[#1A1A1A]">
        <TrendingUp className="text-[#1A1A1A]" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-bold border-b border-[#4D4D4D] pb-1">
        <span>Card (NFC)</span>
        <span className="text-[#C4FF4D]">75%</span>
      </div>
      <div className="flex justify-between text-[10px] font-bold">
        <span>Manual/Cash</span>
        <span className="text-[#BA8CFF]">25%</span>
      </div>
    </div>
  </Y2KCard>
);

export const UsagePeakHoursCard = () => (
  <Y2KCard title="Usage_Peak_Hours" variant="lime">
    <div className="h-48 flex items-end gap-2 border-b-2 border-[#4D4D4D] pb-1 px-2">
      {[20, 35, 60, 95, 80, 40, 30, 50, 70, 90, 45, 25].map((h, i) => (
        <div
          key={i}
          className="flex-1 bg-[#C4FF4D] hover:bg-[#BA8CFF] transition-all relative group"
          style={{ height: `${h}%` }}
        >
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-black hidden group-hover:block">
            {h}%
          </span>
        </div>
      ))}
    </div>
    <div className="flex justify-between text-[8px] font-black text-gray-500 mt-2">
      <span>06:00</span>
      <span>12:00</span>
      <span>18:00</span>
      <span>00:00</span>
    </div>
  </Y2KCard>
);

const AnalyticsTab = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-[#C4FF4D] font-bold">LOADING...</div>;
  }

  if (user?.role !== "admin") {
    return (
      <div className="text-center text-red-500 font-bold uppercase">
        ACCESS DENIED
      </div>
    );
  } else {
    return (
      <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RevenueStreamingCard />
          <UsagePeakHoursCard />
        </div>
      </div>
    );
  }
};

export default AnalyticsTab;
