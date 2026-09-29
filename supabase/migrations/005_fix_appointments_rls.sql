-- ============================================================
-- Dorm Barbershop — Fix Appointments RLS
-- Allows authenticated users to view all appointments so the
-- booking page can correctly identify and block taken slots.
-- (Client personal details are still protected by profiles RLS).
-- ============================================================

DROP POLICY IF EXISTS "Clients view own appointments" ON public.appointments;

CREATE POLICY "Authenticated users can view appointments" 
ON public.appointments 
FOR SELECT 
USING (auth.role() = 'authenticated');
