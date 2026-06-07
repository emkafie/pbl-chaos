// FILE: components/parking/LiveParkingCard.tsx
'use client';
import React, { useState } from 'react';
import { MapPin, Shield, Car, Wrench, X } from 'lucide-react';
import { SlotStatus, ParkingSlot } from '@/types';
import { updateSlotStatus } from '@/app/lib/useParkingSlots';
import Y2KCard from '@/components/ui/Y2KCard';
import SlotGrid from '@/components/parking/SlotGrid';

interface LiveParkingCardProps {
  slots: ParkingSlot[];
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  maintenanceSlots?: number;
  occupancyRate: number;
  // Show edit mode buttons (for admin/debug)
  showEditControls?: boolean;
  className?: string;
  onRefresh?: () => void;
}

const LiveParkingCard: React.FC<LiveParkingCardProps> = ({
  slots,
  totalSlots,
  availableSlots,
  occupiedSlots,
  maintenanceSlots = 0,
  occupancyRate,
  showEditControls = false,
  className = '',
  onRefresh,
}) => {
  // Edit Mode State
  const [editMode, setEditMode] = useState<SlotStatus | null>(null);

  const toggleEditMode = (status: SlotStatus) => {
    setEditMode((prev) => (prev === status ? null : status));
  };

  const handleSlotClick = async (slotId: string) => {
    if (!editMode) return;
    try {
      await updateSlotStatus(slotId, editMode);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to update slot status:', err);
    }
  };

  // Edit buttons rendered in Y2KCard headerAction (aligned with title)
  const editButtons = (
    <div className="flex items-center gap-2 flex-wrap">
      {onRefresh && (
        <button
          onClick={() => onRefresh()}
          className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-(--color-y2k-lime) text-(--color-y2k-lime) text-[10px] font-black uppercase tracking-wider hover:bg-y2k-lime)/10 transition-all"
        >
          Refresh
        </button>
      )}
      {showEditControls && (
        <>
          <button
            onClick={() => toggleEditMode('available')}
        className={`flex items-center gap-1.5 px-3 py-1.5 border-2 text-[10px] font-black uppercase tracking-wider transition-all ${
          editMode === 'available'
            ? 'bg-y2k-lime text-(--color-y2k-button-text) border-(--color-y2k-solid-border) shadow-[2px_2px_0px_0px_(--color-y2k-purple)]'
            : 'border-(--color-y2k-lime) text-(--color-y2k-lime) hover:bg-y2k-lime)/10'
        }`}
      >
        <Shield size={12} /> Available
      </button>
      <button
        onClick={() => toggleEditMode('occupied')}
        className={`flex items-center gap-1.5 px-3 py-1.5 border-2 text-[10px] font-black uppercase tracking-wider transition-all ${
          editMode === 'occupied'
            ? 'bg-(--color-y2k-purple) text-(--color-y2k-button-text) border-(--color-y2k-solid-border) shadow-[2px_2px_0px_0px_(--color-y2k-lime)]'
            : 'border-(--color-y2k-purple) text-(--color-y2k-purple) hover:bg-y2k-purple)/10'
        }`}
      >
        <Car size={12} /> Occupied
      </button>
      <button
        onClick={() => toggleEditMode('maintenance')}
        className={`flex items-center gap-1.5 px-3 py-1.5 border-2 text-[10px] font-black uppercase tracking-wider transition-all ${
          editMode === 'maintenance'
            ? 'bg-(--color-y2k-red) text-(--color-y2k-button-text) border-(--color-y2k-solid-border) shadow-[2px_2px_0px_0px_(--color-y2k-purple)]'
            : 'border-(--color-y2k-red) text-(--color-y2k-red) hover:bg--y2k-red)/10'
        }`}
      >
        <Wrench size={12} /> Maintenance
      </button>
      {editMode && (
        <button
          onClick={() => setEditMode(null)}
          className="flex items-center gap-1 px-2 py-1.5 border-2 border-(--color-y2k-red) text-(--color-y2k-red) text-[10px] font-black uppercase tracking-wider hover:bg-(--color-y2k-red)/10 transition-all"
        >
          <X size={12} /> Cancel
        </button>
      )}
        </>
      )}
    </div>
  );

  return (
    <Y2KCard
      title="Live_Parking_Grid"
      icon={MapPin}
      headerAction={editButtons}
      className={className}
    >
      <SlotGrid
        slots={slots}
        totalSlots={totalSlots}
        availableSlots={availableSlots}
        occupiedSlots={occupiedSlots}
        maintenanceSlots={maintenanceSlots}
        occupancyRate={occupancyRate}
        onSlotClick={handleSlotClick}
        editMode={editMode}
      />

      <div className="mt-6 sm:mt-8 bg-y2k-border)/20 p-3 sm:p-4 border-l-4 border-(--color-y2k-lime) flex flex-col gap-2">
        <div className="flex items-center gap-3 text-[10px] font-bold">
          <div className="w-2 h-2 bg-(--color-y2k-lime) animate-pulse"></div>
          <span className="text-(--color-y2k-lime) uppercase italic">
            IoT_Stream: Node_A {' > '} Cloud_Gateway
          </span>
        </div>
        <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">
          Big_Data_Ingestion: Active
        </div>
      </div>
    </Y2KCard>
  );
};

export default LiveParkingCard;
