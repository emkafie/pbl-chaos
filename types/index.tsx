export type SlotStatus = 'available' | 'occupied';

export interface ParkingSlot {
  id: string;
  status: SlotStatus;
}

export interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  collapsed: boolean;
}