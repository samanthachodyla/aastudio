# Stripe subscriptions — setup runbook

The code is done and deployed. Payments go live once these dashboard steps are
complete. Everything here is done by **you** in the Stripe / Supabase / Vercel
dashboards — I can't access your accounts or set secrets.

Model: **pay-to-start** (no free trial). Discounts/free access are handled with
**promotion codes** you create in Stripe (Checkout already accepts them).

---

## 1. Stripe products & prices

In the Stripe Dashboard → **Products**, create two products, each with a monthly
and an annual price:

| Product | Monthly | Annual |
|---|---|---|
| **Studio Starter** | $25.00 / month | $240.00 / year |
| **Studio Pro** | $55.00 / month | $528.00 / year |

After saving, open each price and copy its **Price ID** (looks like `price_1AbC...`).
You'll have four.

## 2. Create the `subscriptions` table (Supabase)

Either approve the migration when I run it, or paste this into
Supabase → **SQL Editor** → Run:

```sql
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text,
  cycle text,
  status text not null default 'inactive',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
drop policy if exists "read own subscription" on public.subscriptions;
create policy "read own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);
create index if not exists subscriptions_customer_idx
  on public.subscriptions (stripe_customer_id);
```

## 3. Webhook endpoint (Stripe)

Stripe Dashboard → **Developers → Webhooks → Add endpoint**:

- **URL:** `https://allegoryartstudio.com/api/stripe/webhook`
- **Events:** `checkout.session.completed`, `customer.subscription.created`,
  `customer.subscription.updated`, `customer.subscription.deleted`

Save, then copy the endpoint's **Signing secret** (`whsec_...`).

## 4. Enable the Billing Portal

Stripe Dashboard → **Settings → Billing → Customer portal** → activate it, and
allow "cancel subscription" and "update payment method." (Powers the *Manage
billing* button in Settings.)

## 5. Environment variables (Vercel)

Vercel → project → **Settings → Environment Variables** (Production). Add:

| Name | Value |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` (Stripe → Developers → API keys) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (from step 3) |
| `STRIPE_PRICE_STARTER_MONTHLY` | price ID |
| `STRIPE_PRICE_STARTER_ANNUAL` | price ID |
| `STRIPE_PRICE_PRO_MONTHLY` | price ID |
| `STRIPE_PRICE_PRO_ANNUAL` | price ID |

`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, and `APP_URL` are already set (from
the Gmail integration). Redeploy after adding variables so they take effect.

## 6. Test before going live

Use Stripe **test mode** first (test keys + a test webhook). Card `4242 4242 4242 4242`,
any future expiry/CVC. Go to `/pricing`, choose a plan, complete checkout → you
should land on the dashboard and `subscriptions` should show `status = active`.
Then swap the test keys for live keys.

## 7. Discount / free-access codes

Stripe Dashboard → **Products → Coupons** → create a coupon (e.g. 100% off) →
add a **Promotion code** (e.g. `FRIENDS`). Customers enter it on the Checkout
page. 100%-off codes effectively give free access.

## 8. Flip the switch to enforce paid access

The app currently runs in **beta mode** — everyone has full Pro access for free
(`BETA_ALL_PRO = true` in `src/lib/tier.ts`). Payments are wired but dormant.

When you're ready to require payment:

1. Set `BETA_ALL_PRO = false` in `src/lib/tier.ts` (tell me and I'll do it).
2. Grandfather any existing users you want to keep free — for each, add a
   comp row (they'll have full access with no charge):

   ```sql
   insert into public.subscriptions (user_id, plan, status)
   values ('<their-auth-user-id>', 'pro', 'comp')
   on conflict (user_id) do update set plan = 'pro', status = 'comp';
   ```

After the flip, users without an active subscription are sent to `/pricing` to
choose a plan. `/pricing` and `/settings` always stay reachable.

## 9. Launch-day note

The homepage auto-switches from waitlist to the live "sign up" version at
**midnight ET on Aug 1, 2026**. For the *prerendered* (crawler-facing) HTML to
switch too, trigger one redeploy on/after Aug 1 (any push works, or ask me).
Real visitors see the correct version immediately regardless.
