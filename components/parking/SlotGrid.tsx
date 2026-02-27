// FILE: components/parking/SlotGrid.tsx
import React from 'react';
import { Car } from 'lucide-react';
import { ParkingSlot } from '@/types'; // Import dari file types yang kita buat sebelumnya

interface SlotGridProps {
  slots: ParkingSlot[];
}

const SlotGrid: React.FC<SlotGridProps> = ({ slots }) => {
  return (
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
  );
};

export default SlotGrid;