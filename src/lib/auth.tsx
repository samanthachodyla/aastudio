import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/lib/userProfile";
import { useSubscription } from "@/lib/subscription";

interface AuthState {
  session: Session | null;
  user: User | null;
  /** True until the initial session check resolves. Guards against redirect flicker. */
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe first so we never miss an auth event that fires during init.
    let lastUserId: string | null = null;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      syncProfileEmail(next?.user ?? null);
      // When the signed-in user changes (sign in / sign out / account switch),
      // clear the cached subscription so the paywall re-checks for THIS account
      // instead of inheriting the previous user's access. Without this, signing
      // up a new (unpaid) account in the same tab would keep a prior comped
      // user's access and let them into the app without paying.
      const nextUserId = next?.user?.id ?? null;
      if (nextUserId !== lastUserId) {
        lastUserId = nextUserId;
        useSubscription.getState().reset();
      }
    });

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
        syncProfileEmail(data.session?.user ?? null);
      })
      // Never hang the whole app on a failed session check — fall through to login.
      .catch((e) => console.error("[auth] getSession failed", e))
      .finally(() => setLoading(false));

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("[auth] signOut failed", e);
      // The auth listener clears session on success; nothing else to do on failure.
    }
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Keep the local profile store's email in sync with the authenticated user. */
function syncProfileEmail(user: User | null) {
  if (!user?.email) return;
  const { email, setProfile } = useUserProfile.getState();
  if (email !== user.email) setProfile({ email: user.email });
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
