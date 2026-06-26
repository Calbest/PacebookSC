-- ============================================================
-- SwimSCPlan — Row Level Security policies
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── ratings table ────────────────────────────────────────────
-- Create the table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS public.ratings (
  id         bigserial PRIMARY KEY,
  stars      smallint NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment    text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Anyone can submit a rating, but only select is public.
-- No user can update or delete any row.

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Public read (used for the 5-star reviews carousel)
CREATE POLICY "ratings_select_public"
  ON public.ratings FOR SELECT
  USING (true);

-- Anyone (including anonymous) can insert
CREATE POLICY "ratings_insert_anon"
  ON public.ratings FOR INSERT
  WITH CHECK (true);

-- No updates or deletes — intentionally no policy for UPDATE/DELETE
-- (RLS blocks anything without an explicit policy)


-- ── help_submissions table (if it exists) ────────────────────
-- Only the insert is allowed; nobody can read or modify submissions.

ALTER TABLE public.help_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "help_insert_anon"
  ON public.help_submissions FOR INSERT
  WITH CHECK (true);

-- Admins can read via service role key (bypasses RLS by default).


-- ── Supabase auth.users — no RLS needed ──────────────────────
-- All user data lives in auth.users.raw_user_meta_data which is
-- already protected: the Supabase JWT enforces that each user can
-- only update their own record via supabase.auth.updateUser().
-- There is no risk of IDOR here.


-- ── Auth hardening (Supabase Dashboard settings) ─────────────
-- These cannot be set via SQL — apply them in:
--   Authentication → Providers → Email
--
--   [ ] Enable email confirmations          ← turn ON
--   [ ] Secure email change                 ← turn ON
--   Session expiry (JWT expiry):            3600  (1 hour)
--   Refresh token rotation:                 ON
--   Reuse interval:                         10 seconds
--
--   Authentication → Rate Limits
--   Sign-in/up attempts per hour:           10
--   Token refresh per hour:                 360
-- ============================================================
