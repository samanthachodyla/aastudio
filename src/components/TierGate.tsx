import { ReactNode } from "react";
import { useTier, isProPath, PRO_MODULES } from "@/lib/tier";
import { useLocation } from "react-router-dom";
import { LockedModule } from "./LockedModule";

export function TierGate({ children }: { children: ReactNode }) {
  const { tier } = useTier();
  const { pathname } = useLocation();
  if (tier === "pro") return <>{children}</>;
  if (isProPath(pathname)) {
    const m = PRO_MODULES[pathname];
    return <LockedModule moduleName={m.name} description={m.description} />;
  }
  return <>{children}</>;
}
