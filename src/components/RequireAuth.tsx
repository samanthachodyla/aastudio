import { ReactNode, useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { DataGate } from "@/components/DataGate";
import { BETA_ALL_PRO } from "@/lib/tier";
import { useSubscription, hasActiveAccess } from "@/lib/subscription";
import { supabase } from "@/integrations/supabase/client";

function LoaderScreen({ label = "Loading your studio…" }: { label?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="eyebrow text-muted-foreground animate-pulse">{label}</div>
    </div>
  );
}

/** Gates its children behind a valid Supabase session, redirecting to /login otherwise.
 *  After the beta ends (BETA_ALL_PRO = false) it also requires an active
 *  subscription, sending users without one to /pricing to subscribe. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  const { subscription, loaded, fetch } = useSubscription();

  const justCheckedOut = new URLSearchParams(location.search).get("checkout") === "success";
  const [finalizing, setFinalizing] = useState(justCheckedOut);
  const finalizeRan = useRef(false);

  // Load the user's subscription once they're signed in.
  useEffect(() => {
    if (session && !loaded) fetch();
  }, [session, loaded, fetch]);

  // After returning from Stripe Checkout, finalize the subscription synchronously
  // (server record) and poll as a fallback, so a just-paid customer is never
  // bounced to /pricing while the async webhook is still in flight.
  useEffect(() => {
    if (!session || !justCheckedOut || finalizeRan.current) return;
    finalizeRan.current = true;
    let cancelled = false;

    const sid = new URLSearchParams(window.location.search).get("sid") || "";
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    (async () => {
      // 1) Immediate server-side record (does not depend on the webhook).
      try {
        const access = (await supabase.auth.getSession()).data.session?.access_token;
        if (sid && access) {
          await window.fetch("/api/stripe/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${access}` },
            body: JSON.stringify({ action: "sync", sid }),
          });
        }
      } catch { /* fall through to polling */ }

      // 2) Refetch, briefly polling as a fallback for webhook-only timing.
      for (let i = 0; i < 8 && !cancelled; i++) {
        await fetch();
        if (hasActiveAccess(useSubscription.getState().subscription)) break;
        await sleep(1200);
      }
      if (!cancelled) setFinalizing(false);
    })();

    return () => { cancelled = true; };
  }, [session, justCheckedOut, fetch]);

  if (loading) {
    return <LoaderScreen />;
  }

  if (!session) {
    // Preserve where the user was headed so we can return them after login.
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  // Pay-to-start gate (inactive during beta). Wait for the subscription to load,
  // then require active access; otherwise route to pricing to subscribe.
  // /pricing and /settings stay reachable so users can subscribe or manage billing
  // (and to avoid a redirect loop back into /pricing).
  const ALWAYS_ALLOWED = ["/pricing", "/settings"];
  if (!BETA_ALL_PRO && !ALWAYS_ALLOWED.includes(location.pathname)) {
    if (!loaded) {
      return <LoaderScreen />;
    }
    if (!hasActiveAccess(subscription)) {
      // Just returned from checkout — finalize (above) rather than bounce.
      if (justCheckedOut && finalizing) {
        return <LoaderScreen label="Finalizing your subscription…" />;
      }
      return <Navigate to="/pricing" replace state={{ needsPlan: true }} />;
    }
  }

  return <DataGate>{children}</DataGate>;
}
