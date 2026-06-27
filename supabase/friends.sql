-- ============================================================
-- SwimSCPlan — Friends system
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── Public profiles table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     text        NOT NULL,
  full_name    text,
  avatar_url   text,
  gender       text,
  club_team    text,
  high_school  text,
  times        jsonb       NOT NULL DEFAULT '{}',
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (lower(username));

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read any profile (needed for friend lookup)
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can only write their own profile row
CREATE POLICY "profiles_insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);


-- ── Friendships table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.friendships (
  id           bigint      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  requester_id uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status       text        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'accepted')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id)
);

-- Prevent duplicate reverse pairs (A→B and B→A at the same time)
CREATE UNIQUE INDEX IF NOT EXISTS friendships_pair_idx
  ON public.friendships (LEAST(requester_id::text, addressee_id::text),
                         GREATEST(requester_id::text, addressee_id::text));

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Users can see any friendship row they are part of
CREATE POLICY "friendships_select"
  ON public.friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Only the requester can create a request
CREATE POLICY "friendships_insert"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Only the addressee can accept (update status)
CREATE POLICY "friendships_update"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = addressee_id);

-- Either party can remove the friendship / cancel request
CREATE POLICY "friendships_delete"
  ON public.friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
