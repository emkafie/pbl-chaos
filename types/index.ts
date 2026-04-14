export type SlotStatus = 'available' | 'occupied';
export type UserRole = 'admin' | 'operator' | 'guest';

export interface UserProfile {
  username: string;
  role: UserRole;
  lastLogin?: string;
}

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