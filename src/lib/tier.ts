import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Tier = "starter" | "pro";

// ---------------------------------------------------------------------------
// BETA: every user gets full Studio Pro access for free while we're in beta.
// Flip this to false to end the beta and return to per-user tiers. While true,
// the effective tier is always "pro" regardless of what's persisted locally or
// chosen in the Settings tier switcher.
// ---------------------------------------------------------------------------
export const BETA_ALL_PRO = true;

interface TierState {
  tier: Tier;
  setTier: (t: Tier) => void;
}

export const useTier = create<TierState>()(
  persist(
    (set) => ({
      tier: BETA_ALL_PRO ? "pro" : "starter",
      setTier: (tier) => set({ tier: BETA_ALL_PRO ? "pro" : tier }),
    }),
    {
      name: "allegory.tier.v1",
      // During the beta, force "pro" even when an older "starter" value was
      // already persisted to localStorage from a previous visit.
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<TierState>) };
        return BETA_ALL_PRO ? { ...merged, tier: "pro" } : merged;
      },
    },
  ),
);

// Modules that require Studio Pro (Profile Vault is now available on Starter as "Lite";
// gating happens inside the module for Pro-only sub-features.)
export const PRO_MODULES = {
  "/communications": { name: "Communications Hub", description: "Connect your inbox and let the studio flag what needs a reply." },
  "/marketing": { name: "Marketing Assistant", description: "Plan content, draft captions, and schedule posts in one place." },
  "/studio-manager": { name: "Studio Manager", description: "Chat with your AI arts administrator for guidance, planning, and answers." },
} as const;

export type ProPath = keyof typeof PRO_MODULES;

export function isProPath(path: string): path is ProPath {
  return path in PRO_MODULES;
}
