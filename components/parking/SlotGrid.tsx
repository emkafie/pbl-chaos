// FILE: components/parking/SlotGrid.tsx
import React from 'react';
import { Car } from 'lucide-react';
import { ParkingSlot } from '@/types';

interface SlotGridProps {
  slots: ParkingSlot[];
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  occupancyRate: number;
}

const SlotGrid: React.FC<SlotGridProps> = ({ slots, totalSlots, availableSlots, occupiedSlots, occupancyRate }) => {
  return (
    <div className="space-y-6">
      {/* Slot Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {slots.map((slot) => (
          <div
            key={slot.id}
            className={`h-24 border-2 flex flex-col items-center justify-center transition-all cursor-pointer transform hover:scale-105 font-mono ${
              slot.status === 'available'
                ? 'border-[#C4FF4D] bg-[#C4FF4D]/10 text-[#C4FF4D]'
                : 'border-[#BA8CFF] bg-[#BA8CFF]/10 text-[#BA8CFF] opacity-80'
            }`}
          >
            <span className="text-[10px] font-bold mb-1">{slot.id}</span>
            <Car size={32} fill={slot.status === 'available' ? 'transparent' : '#BA8CFF'} />
            <span className="text-[9px] mt-1 font-black uppercase tracking-tighter">{slot.status}</span>
          </div>
        ))}
      </div>

      {/* Status Panel */}
      <div className="p-4 border-2 border-[#4D4D4D] bg-[#4D4D4D]/10">
        <p className="text-[11px] font-bold text-gray-400 uppercase mb-4 tracking-tighter">
          Current Slot Occupancy Rate
        </p>
        <div className="h-4 w-full bg-[#1A1A1A] border-2 border-[#4D4D4D] overflow-hidden relative">
          <div
            className="h-full bg-[#C4FF4D] transition-all duration-1000"
            style={{ width: `${occupancyRate}%` }}
          ></div>
          <span className="absolute right-2 top-0 text-[10px] font-black text-white mix-blend-difference">
            {occupancyRate.toFixed(1)}%
          </span>
        </div>
        <div className="mt-4 flex gap-6 text-[10px] font-black uppercase tracking-widest">
          <span className="flex items-center gap-1 text-[#C4FF4D]">
            <div className="w-2 h-2 bg-[#C4FF4D]"></div>
            {availableSlots.toString().padStart(2, '0')} Available
          </span>
          <span className="flex items-center gap-1 text-[#BA8CFF]">
            <div className="w-2 h-2 bg-[#BA8CFF]"></div>
            {occupiedSlots.toString().padStart(2, '0')} Occupied
          </span>
          <span className="flex items-center gap-1 text-gray-500">
            <div className="w-2 h-2 bg-gray-500"></div>
            {totalSlots.toString().padStart(2, '0')} Total
          </span>
        </div>
      </div>
    </div>
  );
};

export default SlotGrid;