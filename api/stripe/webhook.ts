// Vercel Serverless Function — Stripe webhook. Verifies the signature against
// the raw request body, then mirrors subscription state into our `subscriptions`
// table (service role). This is the source of truth for who has active access.
//
// Set the endpoint in Stripe to: https://allegoryartstudio.com/api/stripe/webhook
// and subscribe to: checkout.session.completed, customer.subscription.created,
// customer.subscription.updated, customer.subscription.deleted, invoice.paid.
// (invoice.paid drives the first-payment Purchase conversion after the trial.)
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const META_PIXEL_ID = process.env.META_PIXEL_ID || "1583309690064748";
const META_CAPI_TOKEN = process.env.META_CAPI_TOKEN || "";
const APP_URL = process.env.APP_URL || "https://allegoryartstudio.com";
const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID || "G-CSJ5CQZ382";
const GA4_API_SECRET = process.env.GA4_API_SECRET || "";

// Plan+cycle -> monthly-list price, used as the start_trial "potential" value.
const PLAN_PRICE: Record<string, number> = {
  "starter:monthly": 25, "starter:annual": 240, "pro:monthly": 55, "pro:annual": 528,
};

const sha256 = (v: string) => crypto.createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

// A Meta Conversions API event. Browser + server events that share an event_id
// are de-duplicated by Meta. No-op until META_CAPI_TOKEN is set. PII (email,
// external id) is SHA-256 hashed; fbc/fbp are sent raw for matching.
async function fireMetaEvent(opts: {
  eventName: string;
  eventId: string;
  email?: string;
  userId?: string;
  fbc?: string;
  fbp?: string;
  value?: number;
  currency?: string;
  custom?: Record<string, unknown>;
}): Promise<void> {
  if (!META_CAPI_TOKEN || !META_PIXEL_ID) return;
  const user_data: Record<string, unknown> = {};
  if (opts.email) user_data.em = [sha256(opts.email)];
  if (opts.userId) user_data.external_id = [sha256(opts.userId)];
  if (opts.fbc) user_data.fbc = opts.fbc;
  if (opts.fbp) user_data.fbp = opts.fbp;
  const custom_data: Record<string, unknown> = { ...(opts.custom || {}) };
  if (typeof opts.value === "number") custom_data.value = opts.value;
  if (opts.currency) custom_data.currency = opts.currency;
  try {
    await fetch(`https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(META_CAPI_TOKEN)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [{
          event_name: opts.eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: opts.eventId,
          action_source: "website",
          event_source_url: `${APP_URL}/dashboard`,
          user_data,
          custom_data,
        }],
      }),
    });
  } catch { /* CAPI is best-effort */ }
}

// A GA4 event via the Measurement Protocol (server-side). Used for the purchase
// that happens after the trial, when the customer isn't on the site. No PII — the
// GA client_id ties it back to the original browser session; params only.
async function fireGa4(clientId: string, name: string, params: Record<string, unknown>): Promise<void> {
  if (!GA4_API_SECRET || !GA4_MEASUREMENT_ID || !clientId) return;
  try {
    await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${encodeURIComponent(GA4_API_SECRET)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, events: [{ name, params }] }),
    });
  } catch { /* MP is best-effort */ }
}

// We need the raw body to verify the Stripe signature — disable body parsing.
export const config = { api: { bodyParser: false } };

const SUPABASE_URL = process.env.SUPABASE_URL || "https://czbzunpabgmwpldkrcex.supabase.co";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function readRawBody(readable: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowFromSubscription(userId: string, customerId: string, sub: Stripe.Subscription) {
  const meta = sub.metadata || {};
  return {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    plan: meta.plan || null,
    cycle: meta.cycle || null,
    status: sub.status, // active | trialing | past_due | canceled | unpaid | incomplete...
    current_period_end: sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: !!sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  };
}

// Record the trial funnel on the member's subscription row, for conversion
// reporting. Sticky: converted_at is only ever set, never cleared, so a churn
// after conversion keeps its timestamp. The columns live behind a later
// migration; any failure here is swallowed so it never breaks the webhook.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function stampTrialLifecycle(supabase: any, userId: string, sub: Stripe.Subscription) {
  const iso = (u?: number | null) => (u ? new Date(u * 1000).toISOString() : null);
  const patch: Record<string, string | null> = {};
  if (sub.trial_start) patch.trial_started_at = iso(sub.trial_start);
  const converted = !!sub.trial_start && (
    ["active", "past_due"].includes(sub.status) ||
    (sub.status === "canceled" && !!sub.canceled_at && !!sub.trial_end && sub.canceled_at > sub.trial_end)
  );
  if (converted) patch.converted_at = iso(sub.trial_end);
  if (sub.canceled_at) patch.canceled_at = iso(sub.canceled_at);
  if (!Object.keys(patch).length) return;
  try { await supabase.from("subscriptions").update(patch).eq("user_id", userId); } catch { /* columns may not exist yet */ }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).end("Method not allowed");

  const secret = process.env.STRIPE_SECRET_KEY || "";
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!secret || !whSecret) return res.status(500).json({ error: "Server missing Stripe keys" });

  const stripe = new Stripe(secret);
  const sig = req.headers["stripe-signature"];

  let event: Stripe.Event;
  try {
    const raw = await readRawBody(req);
    event = stripe.webhooks.constructEvent(raw, sig, whSecret);
  } catch (e: unknown) {
    return res.status(400).send(`Webhook Error: ${e instanceof Error ? e.message : "bad signature"}`);
  }

  const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || "");

  // Resolve our user id from subscription metadata, or fall back to the customer.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolveUserId = async (sub: Stripe.Subscription, customerId: string): Promise<string | null> => {
    if (sub.metadata?.user_id) return sub.metadata.user_id;
    const { data } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    return data?.user_id ?? null;
  };

  // Manually comped accounts (free Pro granted in the DB) must never be
  // downgraded by a Stripe event — e.g. an old incomplete/canceled subscription
  // cleaning itself up would otherwise wipe out their access.
  const isComped = async (userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("subscriptions").select("status").eq("user_id", userId).maybeSingle();
    return data?.status === "comp";
  };

  // Resolve (or create) the auth user for a pay-first "guest" checkout, keyed by
  // the email Stripe collected. Scans the admin user list (fine at this scale).
  const getUserIdByEmail = async (email: string): Promise<string | null> => {
    for (let page = 1; page <= 25; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      if (error || !data?.users?.length) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const u = data.users.find((x: any) => (x.email || "").toLowerCase() === email);
      if (u) return u.id;
      if (data.users.length < 200) return null;
    }
    return null;
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
        const customerId = typeof s.customer === "string" ? s.customer : s.customer?.id;
        const email = (s.customer_details?.email || "").toLowerCase().trim();

        // Resolve the account. Logged-in checkouts carry user_id in metadata;
        // pay-first (guest) checkouts don't, so create/link the account by email.
        let userId: string | null = s.metadata?.user_id || null;
        if (!userId && email) {
          userId = await getUserIdByEmail(email);
          if (!userId) {
            const { data } = await supabase.auth.admin.createUser({ email, email_confirm: true });
            userId = data?.user?.id ?? null;
          }
        }

        if (userId && subId && customerId) {
          // Never double-charge: if this account already has a live subscription
          // that ISN'T this one, cancel this new one and refund it.
          const { data: existing } = await supabase
            .from("subscriptions").select("stripe_subscription_id, status").eq("user_id", userId).maybeSingle();
          const dup = existing
            && ["active", "trialing", "comp", "past_due"].includes(existing.status)
            && existing.stripe_subscription_id
            && existing.stripe_subscription_id !== subId;
          if (dup) {
            try { await stripe.subscriptions.cancel(subId); } catch { /* best-effort */ }
            try {
              const invId = typeof s.invoice === "string" ? s.invoice : s.invoice?.id;
              if (invId) {
                const inv = await stripe.invoices.retrieve(invId);
                const pi = typeof inv.payment_intent === "string" ? inv.payment_intent : inv.payment_intent?.id;
                if (pi) await stripe.refunds.create({ payment_intent: pi });
              }
            } catch { /* best-effort refund; flag in Stripe if it fails */ }
            console.error("[webhook] duplicate subscription auto-canceled + refunded", { userId, subId });
            break; // leave the existing good subscription untouched
          }

          const sub = await stripe.subscriptions.retrieve(subId);
          await supabase.from("subscriptions").upsert(rowFromSubscription(userId, customerId, sub), { onConflict: "user_id" });
          await stampTrialLifecycle(supabase, userId, sub);
        }

        // Server-side sign_up + start_trial (deduped with the browser via matching
        // event ids). NO purchase here — the 7-day trial hasn't charged yet; the
        // purchase fires from invoice.paid below. sign_up/CompleteRegistration only
        // for a brand-new (guest) account, not an existing member upgrading.
        {
          const plan = s.metadata?.plan || "";
          const cycle = s.metadata?.cycle || "";
          const label = `${plan}-${cycle}`;
          const value = PLAN_PRICE[`${plan}:${cycle}`];
          const isNewSignup = !s.metadata?.user_id;
          if (isNewSignup) {
            await fireMetaEvent({ eventName: "CompleteRegistration", eventId: `signup_${s.id}`, email, userId: userId || undefined, custom: { content_name: label } });
          }
          await fireMetaEvent({
            eventName: "StartTrial", eventId: `trial_${s.id}`, email, userId: userId || undefined,
            value, currency: "USD", custom: { content_name: label, predicted_ltv: value, plan, cycle },
          });
        }
        break;
      }
      // First successful payment (after the trial, or immediately for a no-trial
      // sub). Fires the Purchase conversion server-side, since the customer isn't
      // on the site 7 days later. Renewals are excluded via subscriptions.first_paid_at.
      case "invoice.paid": {
        const inv = event.data.object as Stripe.Invoice;
        const amount = (inv.amount_paid ?? 0) / 100;
        if (amount <= 0) break; // the $0 trial-start invoice is not a payment
        const subId = typeof inv.subscription === "string" ? inv.subscription : inv.subscription?.id;
        const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
        if (!subId || !customerId) break;
        const sub = await stripe.subscriptions.retrieve(subId);
        const userId = await resolveUserId(sub, customerId);
        if (!userId) break;

        // Fire the Purchase once — only for the FIRST paid invoice. A renewal finds
        // first_paid_at already set and is skipped.
        const { data: subRow } = await supabase
          .from("subscriptions").select("first_paid_at").eq("user_id", userId).maybeSingle();
        if (subRow?.first_paid_at) break;
        try { await supabase.from("subscriptions").update({ first_paid_at: new Date().toISOString() }).eq("user_id", userId); } catch { /* column may not exist yet */ }

        // Original attribution + match keys, saved on the profile during the trial.
        const { data: prof } = await supabase
          .from("profiles")
          .select("email, ga_client_id, fbc, fbp, first_utm_source, first_utm_medium, first_utm_campaign, first_utm_content, first_utm_term")
          .eq("id", userId).maybeSingle();

        const email = (inv.customer_email || prof?.email || "").toLowerCase().trim();
        const plan = sub.metadata?.plan || "";
        const cycle = sub.metadata?.cycle || "";
        const label = `${plan}-${cycle}`;
        const currency = (inv.currency || "usd").toUpperCase();
        const trialUsed = !!sub.trial_start;
        const txnId = inv.id;
        const attr = {
          utm_source: prof?.first_utm_source || undefined,
          utm_medium: prof?.first_utm_medium || undefined,
          utm_campaign: prof?.first_utm_campaign || undefined,
          utm_content: prof?.first_utm_content || undefined,
          utm_term: prof?.first_utm_term || undefined,
        };

        // Meta CAPI Purchase (server-only — no browser event, so no dedup needed).
        await fireMetaEvent({
          eventName: "Purchase",
          eventId: `purchase_${txnId}`,
          email, userId, fbc: prof?.fbc || undefined, fbp: prof?.fbp || undefined,
          value: amount, currency,
          custom: { content_name: label, plan, cycle, trial_used: trialUsed, transaction_id: txnId, subscription_id: sub.id, customer_id: userId, ...attr },
        });

        // GA4 purchase via Measurement Protocol (client_id stitches to the browser
        // session; no PII sent).
        await fireGa4(prof?.ga_client_id || "", "purchase", {
          transaction_id: txnId,
          value: amount,
          currency,
          items: [{ item_id: label, item_name: `Allegory ${plan} ${cycle}`.trim(), price: amount, quantity: 1 }],
          plan, cycle, trial_used: trialUsed, customer_id: userId,
          ...attr,
        });
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        if (customerId) {
          const userId = await resolveUserId(sub, customerId);
          if (userId && !(await isComped(userId))) {
            const row = rowFromSubscription(userId, customerId, sub);
            if (event.type === "customer.subscription.deleted") row.status = "canceled";
            await supabase.from("subscriptions").upsert(row, { onConflict: "user_id" });
            await stampTrialLifecycle(supabase, userId, sub);
          }
        }
        break;
      }
      default:
        break;
    }
    return res.status(200).json({ received: true });
  } catch (e: unknown) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Unknown error" });
  }
}
