-- ============================================================
-- Dorm Barbershop — Room Number Update
-- Adds room_number to appointments table
-- ============================================================

ALTER TABLE public.appointments
ADD COLUMN room_number text;
