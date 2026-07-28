import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { DataGate } from "@/components/DataGate";
import { SurveyGate } from "@/components/SurveyGate";
import { BETA_ALL_PRO } from "@/lib/tier";
import { useSubscription, hasActiveAccess } from "@/lib/subscription";

/** Gates its children behind a valid Supabase session, redirecting to /login otherwise.
 *  After the beta ends (BETA_ALL_PRO = false) it also requires an active
 *  subscription, sending users without one to /pricing to subscribe. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  const { subscription, loaded, fetch } = useSubscription();

  // Load the user's subscription once they're signed in.
  useEffect(() => {
    if (session && !loaded) fetch();
  }, [session, loaded, fetch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="eyebrow text-muted-foreground animate-pulse">Loading your studio…</div>
      </div>
    );
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
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="eyebrow text-muted-foreground animate-pulse">Loading your studio…</div>
        </div>
      );
    }
    if (!hasActiveAccess(subscription)) {
      return <Navigate to="/pricing" replace state={{ needsPlan: true }} />;
    }
  }

  return (
    <DataGate>
      <SurveyGate>{children}</SurveyGate>
    </DataGate>
  );
}
