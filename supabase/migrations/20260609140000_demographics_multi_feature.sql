-- ============================================================================
-- Demographics survey: allow selecting MULTIPLE "most-wanted" features.
--
-- Adds a text[] column alongside the original single-value `desired_feature`
-- (kept for backward compatibility / existing rows). Backfills the array from
-- any answer already collected. Covered by existing profiles RLS.
-- ============================================================================

alter table public.profiles
  add column if not exists desired_features text[];

update public.profiles
  set desired_features = array[desired_feature]
  where desired_feature is not null
    and desired_features is null;
