-- Recruitment Dashboard SaaS — Supabase Schema
-- Run this entire file in the Supabase SQL editor (Dashboard → SQL editor → New query)

-- =====================================================================
-- TABLES
-- =====================================================================

-- Each SaaS tenant (paying company)
CREATE TABLE IF NOT EXISTS public.companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  website     TEXT DEFAULT '',
  address     TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles: extends auth.users with app-level metadata
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  is_admin    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Candidates: JSONB payload keeps schema flexible without migrations
CREATE TABLE IF NOT EXISTS public.candidates (
  id          TEXT PRIMARY KEY,
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Company settings (one row per tenant)
CREATE TABLE IF NOT EXISTS public.company_settings (
  company_id          UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  sources             JSONB DEFAULT '[]'::jsonb,
  stages              JSONB DEFAULT '[]'::jsonb,
  company_profile     JSONB DEFAULT '{}'::jsonb,
  test_library        JSONB DEFAULT '[]'::jsonb,
  sla_settings        JSONB DEFAULT '{}'::jsonb,
  scorecard_templates JSONB DEFAULT '{}'::jsonb,
  comm_templates      JSONB DEFAULT '[]'::jsonb,
  theme_settings      JSONB DEFAULT '{}'::jsonb,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- TRIGGERS
-- =====================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_candidates_updated_at ON public.candidates;
CREATE TRIGGER trg_candidates_updated_at
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_settings_updated_at ON public.company_settings;
CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

ALTER TABLE public.companies        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Helper: current user's company_id (cached per query by Postgres planner)
CREATE OR REPLACE FUNCTION public.my_company_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper: is current user an admin?
CREATE OR REPLACE FUNCTION public.i_am_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

-- profiles --
DROP POLICY IF EXISTS "own profile read"     ON public.profiles;
DROP POLICY IF EXISTS "own profile update"   ON public.profiles;
DROP POLICY IF EXISTS "team members read"    ON public.profiles;
DROP POLICY IF EXISTS "admin delete member"  ON public.profiles;

CREATE POLICY "own profile read"     ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "own profile update"   ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "team members read"    ON public.profiles FOR SELECT USING (company_id = public.my_company_id());
CREATE POLICY "admin delete member"  ON public.profiles FOR DELETE USING (
  company_id = public.my_company_id() AND public.i_am_admin() AND id <> auth.uid()
);
-- Allow insert during registration (the function runs with service role via edge function, or anon if no RLS block)
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

-- companies --
DROP POLICY IF EXISTS "company read"   ON public.companies;
DROP POLICY IF EXISTS "company update" ON public.companies;
DROP POLICY IF EXISTS "company insert" ON public.companies;

CREATE POLICY "company read"   ON public.companies FOR SELECT USING (id = public.my_company_id());
CREATE POLICY "company update" ON public.companies FOR UPDATE USING (id = public.my_company_id() AND public.i_am_admin());
-- Allow insert during initial company creation (profile doesn't exist yet, handled by anon/service)
CREATE POLICY "company insert" ON public.companies FOR INSERT WITH CHECK (TRUE);

-- candidates --
DROP POLICY IF EXISTS "candidates company isolation" ON public.candidates;
CREATE POLICY "candidates company isolation" ON public.candidates
  FOR ALL
  USING      (company_id = public.my_company_id())
  WITH CHECK (company_id = public.my_company_id());

-- company_settings --
DROP POLICY IF EXISTS "settings company isolation" ON public.company_settings;
CREATE POLICY "settings company isolation" ON public.company_settings
  FOR ALL
  USING      (company_id = public.my_company_id())
  WITH CHECK (company_id = public.my_company_id());

-- =====================================================================
-- STORAGE BUCKETS
-- (run separately in Supabase dashboard → Storage, or uncomment below)
-- =====================================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('resumes',    'resumes',    false) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('test-files', 'test-files', false) ON CONFLICT DO NOTHING;
--
-- Storage RLS (after creating buckets):
-- CREATE POLICY "resume company isolation" ON storage.objects FOR ALL
--   USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = public.my_company_id()::text);
-- CREATE POLICY "testfile company isolation" ON storage.objects FOR ALL
--   USING (bucket_id = 'test-files' AND (storage.foldername(name))[1] = public.my_company_id()::text);
