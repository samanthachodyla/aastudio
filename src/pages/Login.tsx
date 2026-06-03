import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Mode = "signin" | "signup";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/";

  // If already authenticated, bounce away from the login screen.
  useEffect(() => {
    if (!loading && session) navigate(from, { replace: true });
  }, [loading, session, from, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
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
        if (!data.session) {
          // Email confirmation is enabled on the project — no session yet.
          toast.success("Check your email to confirm your account, then sign in.");
          setMode("signin");
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
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
            <div className="eyebrow mb-2">{mode === "signin" ? "Welcome back" : "Create your studio"}</div>
            <h1 className="font-display text-3xl tracking-tight mb-6">
              {mode === "signin" ? "Sign in" : "Sign up"}
            </h1>

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
              <div>
                <Label>Password</Label>
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
              <Button type="submit" className="rounded-sm mt-1" disabled={busy}>
                {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>
          </div>

          <div className="mt-5 text-sm text-muted-foreground text-center">
            {mode === "signin" ? (
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
