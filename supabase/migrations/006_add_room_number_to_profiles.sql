-- ============================================================
-- Dorm Barbershop — Add room_number to profiles
-- Room number is now stored on the profile (set at registration)
-- instead of being entered per appointment.
-- ============================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS room_number TEXT;
