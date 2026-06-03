import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/lib/userProfile";

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
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      syncProfileEmail(next?.user ?? null);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      syncProfileEmail(data.session?.user ?? null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
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
