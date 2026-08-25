import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { useTier, BETA_ALL_PRO } from "@/lib/tier";

// Mirrors the `subscriptions` table (see api/stripe/*). The Stripe webhook is the
// source of truth; the client only reads its own row (RLS-protected).
export interface Subscription {
  plan: "starter" | "pro" | null;
  cycle: "monthly" | "annual" | null;
  status: string; // active | trialing | past_due | canceled | comp | inactive
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

// Statuses that grant access to the paid product. `past_due` is included so a
// single card decline doesn't instantly lock a paying member out mid-work —
// Stripe retries the charge over its dunning window; access is only removed once
// the subscription actually lapses to `canceled`/`unpaid`.
const ACTIVE_STATUSES = new Set(["active", "trialing", "comp", "past_due"]);

export function hasActiveAccess(s: Subscription | null): boolean {
  if (BETA_ALL_PRO) return true; // during beta, everyone has access
  return !!s && ACTIVE_STATUSES.has(s.status);
}

interface SubState {
  subscription: Subscription | null;
  loaded: boolean;
  loading: boolean;
  fetch: () => Promise<void>;
  reset: () => void;
}

export const useSubscription = create<SubState>((set) => ({
  subscription: null,
  loaded: false,
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ subscription: null, loaded: true, loading: false });
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("subscriptions")
        .select("plan, cycle, status, current_period_end, cancel_at_period_end")
        .eq("user_id", user.id)
        .maybeSingle();

      const sub: Subscription | null = data
        ? {
            plan: data.plan ?? null,
            cycle: data.cycle ?? null,
            status: data.status ?? "inactive",
            currentPeriodEnd: data.current_period_end ?? null,
            cancelAtPeriodEnd: !!data.cancel_at_period_end,
          }
        : null;

      set({ subscription: sub, loaded: true, loading: false });

      // Once the beta ends, drive the pro/starter experience from the real plan.
      if (!BETA_ALL_PRO) {
        const isPro = !!sub && ACTIVE_STATUSES.has(sub.status) && sub.plan === "pro";
        useTier.getState().setTier(isPro ? "pro" : "starter");
      }
    } catch {
      set({ subscription: null, loaded: true, loading: false });
    }
  },

  reset: () => set({ subscription: null, loaded: false, loading: false }),
}));
