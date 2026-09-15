-- Invoice tax + shipping breakdown.
-- `amount` remains the grand total (drives all financial rollups); these columns
-- store the breakdown so invoices can render Subtotal / Sales tax / Shipping /
-- Total. All nullable — existing invoices are unaffected.
alter table public.invoices
  add column if not exists subtotal        numeric,
  add column if not exists tax_rate        numeric,
  add column if not exists tax_amount      numeric,
  add column if not exists shipping_amount numeric;
