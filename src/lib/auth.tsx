import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/lib/userProfile";
import { useSubscription } from "@/lib/subscription";
import { saveFbMatch, clearFbMatch } from "@/lib/fbMatch";

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
      syncProfile(next?.user ?? null);
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
        syncProfile(data.session?.user ?? null);
      })
      // Never hang the whole app on a failed session check — fall through to login.
      .catch((e) => console.error("[auth] getSession failed", e))
      .finally(() => setLoading(false));

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    clearFbMatch(); // forget this member's identity for the Pixel on sign-out
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

/** Keep the local profile store in sync with the authenticated user: their email
 *  (also feeds the Pixel's Advanced Matching), and their display NAME, which the
 *  PDF/portfolio exports use. The name is sourced from the account itself — auth
 *  metadata first, then the profiles row — so a comped artist who never opened
 *  Settings still gets their name on exports instead of just their email. When a
 *  DIFFERENT account signs in on the same device we reseed from that account, so
 *  one artist's name never bleeds onto another's exports. A name the user typed
 *  in Settings (same account, email unchanged) is preserved. */
function syncProfile(user: User | null) {
  if (!user?.email) return;
  const { email, fullName, setProfile } = useUserProfile.getState();
  const metaName = String(
    (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || "",
  ).trim();

  if (email !== user.email) {
    // A new/different account on this device — reset the name to this account's.
    setProfile({ email: user.email, fullName: metaName });
  } else if (!fullName && metaName) {
    setProfile({ fullName: metaName });
  }
  saveFbMatch({ em: user.email, external_id: user.id });

  // If we still have no name, pull it from the profiles row (covers accounts
  // whose name lives only in the database, e.g. ones set up on the backend).
  if (!useUserProfile.getState().fullName) {
    const db = supabase as unknown as { from: (t: string) => any };
    db.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      .then(({ data }: { data: { full_name?: string } | null }) => {
        const n = String(data?.full_name || "").trim();
        // Guard against an account switch mid-flight before applying.
        if (n && useUserProfile.getState().email === user.email && !useUserProfile.getState().fullName) {
          setProfile({ fullName: n });
        }
      })
      .catch(() => { /* best-effort */ });
  }
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
