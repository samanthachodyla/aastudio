import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { DataGate } from "@/components/DataGate";
import { SurveyGate } from "@/components/SurveyGate";

/** Gates its children behind a valid Supabase session, redirecting to /login otherwise. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

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

  return (
    <DataGate>
      <SurveyGate>{children}</SurveyGate>
    </DataGate>
  );
}
