// FILE: components/parking/SlotGrid.tsx
import React from 'react';
import { Car, Wrench } from 'lucide-react';
import { ParkingSlot, SlotStatus } from '@/types';

interface SlotGridProps {
  slots: ParkingSlot[];
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  maintenanceSlots?: number;
  occupancyRate: number;
  // callback when a slot is clicked (used in edit mode)
  onSlotClick?: (slotId: string) => void;
  // current edit mode status for visual feedback
  editMode?: SlotStatus | null;
}

// Mapping color by slot status
const STATUS_STYLES: Record<SlotStatus, { border: string; bg: string; text: string; fill: string }> = {
  available: {
    border: 'border-(--color-y2k-lime)',
    bg: 'bg-(--color-y2k-lime)/10',
    text: 'text-(--color-y2k-lime)',
    fill: 'transparent',
  },
  occupied: {
    border: 'border-(--color-y2k-purple)',
    bg: 'bg-(--color-y2k-purple)/10',
    text: 'text-(--color-y2k-purple)',
    fill: 'var(--color-y2k-purple)',
  },
  maintenance: {
    border: 'border-(--color-y2k-red)',
    bg: 'bg-(--color-y2k-red)/10',
    text: 'text-(--color-y2k-red)',
    fill: 'var(--color-y2k-red)',
  },
};

const SlotGrid: React.FC<SlotGridProps> = ({
  slots,
  totalSlots,
  availableSlots,
  occupiedSlots,
  maintenanceSlots = 0,
  occupancyRate,
  onSlotClick,
  editMode,
}) => {
  const isEditing = editMode !== null && editMode !== undefined;

  return (
    <div className="space-y-6">
      {/* Edit Mode Indicator */}
      {isEditing && (
        <div className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-(--color-y2k-lime) bg-y2k-lime/5 text-(--color-y2k-lime) text-[10px] font-black uppercase tracking-widest animate-pulse">
          <Wrench size={14} />
          <span>
            Edit Mode Active — Click slot to set to{' '}
            <span className="underline">{editMode}</span>
          </span>
        </div>
      )}

      {/* Slot Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {slots.map((slot) => {
          const style = STATUS_STYLES[slot.status] || STATUS_STYLES.available;

          return (
            <div
              key={slot.id}
              onClick={() => onSlotClick?.(slot.id)}
              className={`h-24 border-2 flex flex-col items-center justify-center transition-all font-mono ${
                style.border
              } ${style.bg} ${style.text} ${
                slot.status === 'occupied' || slot.status === 'maintenance' ? 'opacity-80' : ''
              } ${
                isEditing
                  ? 'cursor-pointer transform hover:scale-110 hover:ring-2 hover:ring-(--color-y2k-lime) hover:ring-offset-2'
                  : 'cursor-default'
              }`}
            >
              <span className="text-[10px] font-bold mb-1">{slot.id}</span>
              {slot.status === 'maintenance' ? (
                <Wrench size={28} />
              ) : (
                <Car size={32} fill={style.fill} />
              )}
              <span className="text-[9px] mt-1 font-black uppercase tracking-tighter">
                {slot.status}
              </span>
            </div>
          );
        })}
      </div>

      {/* Status Panel */}
      <div className="p-4 border-2 border-(--color-y2k-border) bg-y2k-border/10">
        <p className="text-[11px] font-bold text-(--color-y2k-text-muted) uppercase mb-4 tracking-tighter">
          Current Slot Occupancy Rate
        </p>
        <div className="h-4 w-full bg-(--color-y2k-bg-main) border-2 border-(--color-y2k-border) overflow-hidden relative">
          <div
            className="h-full bg-(--color-y2k-lime) transition-all duration-1000"
            style={{ width: `${occupancyRate}%` }}
          ></div>
          <span className="absolute right-2 top-0 text-[10px] font-black text-(--color-y2k-text-main) mix-blend-difference">
            {occupancyRate.toFixed(1)}%
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 sm:gap-6 text-[10px] font-black uppercase tracking-widest">
          <span className="flex items-center gap-1 text-(--color-y2k-lime)">
            <div className="w-2 h-2 bg-(--color-y2k-lime)"></div>
            {availableSlots.toString().padStart(2, '0')} Available
          </span>
          <span className="flex items-center gap-1 text-(--color-y2k-purple)">
            <div className="w-2 h-2 bg-(--color-y2k-purple)"></div>
            {occupiedSlots.toString().padStart(2, '0')} Occupied
          </span>
          {maintenanceSlots > 0 && (
            <span className="flex items-center gap-1 text-(--color-y2k-red)">
              <div className="w-2 h-2 bg-(--color-y2k-red)"></div>
              {maintenanceSlots.toString().padStart(2, '0')} Maintenance
            </span>
          )}
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