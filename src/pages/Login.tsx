import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Seo } from "@/components/Seo";
import { toast } from "sonner";

type Mode = "signin" | "signup" | "forgot";

/** Turn raw Supabase auth errors into something a non-technical user understands. */
const friendlyError = (message: string): string => {
  if (/email not confirmed/i.test(message))
    return "Your email isn't confirmed yet. Check your inbox for the confirmation link (or ask the studio to confirm you).";
  if (/invalid login credentials/i.test(message))
    return "That email or password isn't right. Try again, or use “Forgot password?”.";
  if (/user already registered/i.test(message))
    return "An account with this email already exists — try signing in instead.";
  return message;
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading } = useAuth();

  // Landing "Get started" CTAs deep-link here with ?mode=signup so new artists
  // land straight on the create-account form.
  const startedAsSignup = new URLSearchParams(location.search).get("mode") === "signup";
  const [mode, setMode] = useState<Mode>(startedAsSignup ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  // New sign-ups go straight to pricing to choose a plan; returning users go to
  // wherever they were headed (default their dashboard).
  const from =
    (location.state as { from?: string } | null)?.from ?? (startedAsSignup ? "/pricing" : "/dashboard");

  // If already authenticated, bounce away from the login screen.
  useEffect(() => {
    if (!loading && session) navigate(from, { replace: true });
  }, [loading, session, from, navigate]);

  const sendReset = async () => {
    if (!email.trim()) {
      toast.error("Enter your email first.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("If an account exists for that email, a reset link is on its way.");
      setMode("signin");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? friendlyError(err.message) : "Couldn't send the reset email.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (mode === "forgot") return sendReset();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        // Navigation handled by the effect once the session lands.
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (error) throw error;
        // Add every new account to Mailchimp too (system of record), tagged
        // "app-signup" so full signups are distinguishable from newsletter/popup
        // leads. Best-effort — never blocks account creation.
        try {
          const [fn, ...rest] = name.trim().split(/\s+/).filter(Boolean);
          void fetch("/api/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email.trim(),
              first_name: fn || "",
              last_name: rest.join(" "),
              source: "app-signup",
              event_name: "CompleteRegistration",
              event_source_url: window.location.href,
            }),
          }).catch(() => {});
        } catch { /* never block signup */ }
        if (!data.session) {
          // Email confirmation is enabled on the project — no session yet.
          toast.success("Check your email to confirm your account, then sign in.");
          setMode("signin");
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? friendlyError(err.message) : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const heading =
    mode === "signin" ? "Sign in" : mode === "signup" ? "Sign up" : "Reset password";
  const eyebrow =
    mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your studio" : "We'll email you a link";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Seo title="Sign in — Allegory Studio" canonicalPath="/login" noindex />
      <div
        className="bg-primary text-[11px] tracking-[0.28em] uppercase text-center py-2 font-medium"
        style={{ color: "#032419" }}
      >
        Allegory Studio · for working artists
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <img
            src="/Allegory_Studio_Logo.png"
            alt="Allegory Studio"
            style={{ width: 180, height: "auto" }}
            className="mb-8"
          />

          <div className="hairline-card p-7">
            <div className="eyebrow mb-2">{eyebrow}</div>
            <h1 className="font-display text-3xl tracking-tight mb-6">{heading}</h1>

            <form onSubmit={submit} className="grid gap-4">
              {mode === "signup" && (
                <div>
                  <Label>Full name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                    placeholder="e.g. Maya Ortiz"
                    autoComplete="name"
                  />
                </div>
              )}
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  placeholder="you@studio.com"
                  autoComplete="email"
                />
              </div>
              {mode !== "forgot" && (
                <div>
                  <div className="flex items-center justify-between">
                    <Label>Password</Label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                        onClick={() => setMode("forgot")}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <Input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  />
                </div>
              )}
              <Button type="submit" className="rounded-sm mt-1" disabled={busy}>
                {busy
                  ? "One moment…"
                  : mode === "signin"
                  ? "Sign in"
                  : mode === "signup"
                  ? "Create account"
                  : "Send reset link"}
              </Button>

              {mode === "signup" && (
                <p className="text-[11px] leading-relaxed text-muted-foreground text-center">
                  By creating an account, you agree to our{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    Terms &amp; Conditions
                  </a>
                  .
                </p>
              )}
            </form>
          </div>

          <div className="mt-5 text-sm text-muted-foreground text-center">
            {mode === "forgot" ? (
              <button
                type="button"
                className="text-foreground underline underline-offset-4 hover:opacity-70"
                onClick={() => setMode("signin")}
              >
                Back to sign in
              </button>
            ) : mode === "signin" ? (
              <>
                New here?{" "}
                <button
                  type="button"
                  className="text-foreground underline underline-offset-4 hover:opacity-70"
                  onClick={() => setMode("signup")}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-foreground underline underline-offset-4 hover:opacity-70"
                  onClick={() => setMode("signin")}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
