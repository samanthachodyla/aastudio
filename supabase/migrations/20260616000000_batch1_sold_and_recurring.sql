-- ============================================================================
-- Beta batch 1: new optional fields for the Sold flow + recurring/payment-type
-- expenses. All nullable and additive — existing rows and writes are unaffected.
--
-- Column names match the client's camelCase->snake_case mapping in src/lib/sync.ts:
--   Artwork.buyer        -> artworks.buyer
--   Expense.recurring    -> expenses.recurring
--   Expense.frequency    -> expenses.frequency
--   Expense.paymentType  -> expenses.payment_type
-- ============================================================================

alter table public.artworks
  add column if not exists buyer text;

alter table public.expenses
  add column if not exists recurring    boolean,
  add column if not exists frequency    text,
  add column if not exists payment_type text;
