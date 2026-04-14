import Y2KCard from "@/components/ui/Y2KCard";

const RecentStatus = () => {
  return (
    <Y2KCard title="Quick_Status" className="lg:col-span-1" variant="lime">
      <div className="p-4 border-2 border-[#4D4D4D] bg-[#4D4D4D]/10">
        <p className="text-[11px] font-bold text-gray-400 uppercase mb-4 tracking-tighter">
          Current Slot Occupancy Rate
        </p>
        <div className="h-4 w-full bg-[#1A1A1A] border-2 border-[#4D4D4D] overflow-hidden relative">
          <div className="h-full bg-[#C4FF4D]" style={{ width: "66%" }}></div>
          <span className="absolute right-2 top-0 text-[10px] font-black text-white">
            66.7%
          </span>
        </div>
        <div className="mt-4 flex gap-4 text-[10px] font-black uppercase tracking-widest">
          <span className="flex items-center gap-1 text-[#C4FF4D]">
            <div className="w-2 h-2 bg-[#C4FF4D]"></div> 08 Available
          </span>
          <span className="flex items-center gap-1 text-[#BA8CFF]">
            <div className="w-2 h-2 bg-[#BA8CFF]"></div> 04 Occupied
          </span>
        </div>
      </div>
    </Y2KCard>
  );
};

export default RecentStatus;
