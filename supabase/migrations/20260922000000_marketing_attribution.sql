-- Marketing attribution on the customer record + first-payment marker.
-- All nullable; no PII beyond click/measurement IDs used for ad matching.

alter table public.profiles
  -- First-touch (original acquisition source — set once, never overwritten)
  add column if not exists first_utm_source   text,
  add column if not exists first_utm_medium   text,
  add column if not exists first_utm_campaign text,
  add column if not exists first_utm_content  text,
  add column if not exists first_utm_term     text,
  add column if not exists first_fbclid       text,
  add column if not exists first_referrer     text,
  add column if not exists first_landing_page text,
  add column if not exists first_visit_at     timestamptz,
  -- Last-touch (most recent acquisition source)
  add column if not exists last_utm_source    text,
  add column if not exists last_utm_medium    text,
  add column if not exists last_utm_campaign  text,
  add column if not exists last_utm_content   text,
  add column if not exists last_utm_term      text,
  add column if not exists last_fbclid        text,
  add column if not exists last_referrer      text,
  add column if not exists last_landing_page  text,
  add column if not exists last_visit_at      timestamptz,
  -- Cross-channel match keys (kept current for server-side GA4 + Meta CAPI)
  add column if not exists ga_client_id       text,
  add column if not exists fbc                text,
  add column if not exists fbp                text;

-- First successful subscription payment (distinguishes the first charge from
-- recurring renewals; set once by the invoice webhook so Purchase fires once).
alter table public.subscriptions
  add column if not exists first_paid_at timestamptz;
