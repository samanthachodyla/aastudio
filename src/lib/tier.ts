import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Tier = "starter" | "pro";

interface TierState {
  tier: Tier;
  setTier: (t: Tier) => void;
}

export const useTier = create<TierState>()(
  persist(
    (set) => ({
      tier: "starter",
      setTier: (tier) => set({ tier }),
    }),
    { name: "allegory.tier.v1" },
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
