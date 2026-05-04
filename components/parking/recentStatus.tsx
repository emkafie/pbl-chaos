import Y2KCard from "@/components/ui/Y2KCard";

interface RecentStatusProps {
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
}

const RecentStatus = ({ totalSlots, availableSlots, occupiedSlots }: RecentStatusProps) => {
  const occupancyRate = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0;

  return (
    <Y2KCard title="Quick_Status" className="lg:col-span-1" variant="lime">
      <div className="p-4 border-2 border-[#4D4D4D] bg-[#4D4D4D]/10">
        <p className="text-[11px] font-bold text-gray-400 uppercase mb-4 tracking-tighter">
          Current Slot Occupancy Rate
        </p>
        <div className="h-4 w-full bg-[#1A1A1A] border-2 border-[#4D4D4D] overflow-hidden relative">
          <div className="h-full bg-[#C4FF4D] transition-all duration-1000" style={{ width: `${occupancyRate}%` }}></div>
          <span className="absolute right-2 top-0 text-[10px] font-black text-white mix-blend-difference">
            {occupancyRate.toFixed(1)}%
          </span>
        </div>
        <div className="mt-4 flex gap-4 text-[10px] font-black uppercase tracking-widest">
          <span className="flex items-center gap-1 text-[#C4FF4D]">
            <div className="w-2 h-2 bg-[#C4FF4D]"></div> {availableSlots.toString().padStart(2, '0')} Available
          </span>
          <span className="flex items-center gap-1 text-[#BA8CFF]">
            <div className="w-2 h-2 bg-[#BA8CFF]"></div> {occupiedSlots.toString().padStart(2, '0')} Occupied
          </span>
        </div>
      </div>
    </Y2KCard>
  );
};

export default RecentStatus;
