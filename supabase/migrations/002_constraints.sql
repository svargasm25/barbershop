-- ============================================================
-- GyAR Barbershop — Constraints Migration
-- ============================================================

-- 1. One active (pending) appointment per client at a time
--    Partial unique index: enforced at DB level, not just app level
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_one_pending_per_client
  ON public.appointments (client_id)
  WHERE status = 'pending';

-- 2. Unique email in profiles table
--    (Supabase auth already enforces uniqueness on auth.users.email,
--     but this adds an explicit constraint on the profiles copy too)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_email_unique;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_email_unique UNIQUE (email);
