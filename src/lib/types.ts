export type Role = 'barber' | 'client';
export type AppointmentStatus = 'pending' | 'completed' | 'no-show' | 'cancelled';

export interface Profile {
  id: string;
  role: Role;
  email: string | null;
  name: string | null;
  university_grade: string | null;
  dorm_resident: boolean;
  room_number: string | null;
  penalty_fee: number;
  created_at: string;
}

export interface HaircutName {
  ko: string;
  en: string;
  de: string;
  fr: string;
  ru: string;
  es: string;
  [key: string]: string;
}

export interface Haircut {
  id: number;
  name: HaircutName;
  image_url: string | null;
  description: HaircutName | null;
  active: boolean;
}

export interface BlockedSlot {
  id: number;
  date: string;
  time: string;
  reason: string | null;
}

export interface Appointment {
  id: number;
  client_id: string;
  haircut_id: number | null;
  date: string;
  time: string;
  haircut_style: string | null;
  room_number: string | null;
  status: AppointmentStatus;
  penalty_applied: number;
  created_at: string;
  profiles?: Profile;
  haircuts?: Haircut;
}

export const BASE_PRICE = 16000;
export const PENALTY_FEE = 5500;
