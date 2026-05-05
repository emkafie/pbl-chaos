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

export interface ParkingSession {
  id?: string;
  rfid_uid: string;
  vehicle_type: string;
  slot_id: string;
  check_in: string; // ISO String
  check_out: string | null;
  duration_minutes: number;
  fee: number;
  status: 'ongoing' | 'completed';
  created_at?: any;
}

export interface ChartData {
  name: string;
  value: number;
}