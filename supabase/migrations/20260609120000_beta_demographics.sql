-- ============================================================================
-- Beta demographics survey
--
-- New users fill out a short survey on first sign-in (age, ZIP code, and the
-- feature they most hope to use). These columns store the answers on their
-- profile. `demographics_completed_at` is null until the survey is submitted,
-- which is what the client's SurveyGate checks to decide whether to show it.
--
-- Existing RLS already covers these: a user can update their own profile row
-- (profiles_update_own) and admins can read every profile (select_own_or_admin),
-- so the admin Reports section can aggregate the responses. No new policies.
-- ============================================================================

alter table public.profiles
  add column if not exists age                       smallint,
  add column if not exists zip_code                  text,
  add column if not exists desired_feature           text,
  add column if not exists demographics_completed_at timestamptz;
