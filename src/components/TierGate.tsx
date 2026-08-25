import { ReactNode } from "react";
import { isProPath, PRO_MODULES, BETA_ALL_PRO } from "@/lib/tier";
import { useLocation } from "react-router-dom";
import { LockedModule } from "./LockedModule";
import { useSubscription, hasActiveAccess } from "@/lib/subscription";

/** Gates the Pro-only modules. Entitlement is derived from the REAL subscription
 *  (active/comp access AND plan "pro") — never a client-writable store — so a
 *  Starter subscriber can't unlock Pro by flipping a local toggle. During the
 *  beta (BETA_ALL_PRO) everyone has Pro. TierGate renders inside RequireAuth,
 *  so the subscription is already loaded here (no locked-content flash). */
export function TierGate({ children }: { children: ReactNode }) {
  const { subscription } = useSubscription();
  const { pathname } = useLocation();

  const isPro = BETA_ALL_PRO || (hasActiveAccess(subscription) && subscription?.plan === "pro");
  if (isPro) return <>{children}</>;

  if (isProPath(pathname)) {
    const m = PRO_MODULES[pathname];
    return <LockedModule moduleName={m.name} description={m.description} />;
  }
  return <>{children}</>;
}
