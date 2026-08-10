import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/**
 * Post-checkout landing for the pay-first signup flow. Stripe has already taken
 * payment and created the customer; here the new member picks a password, which
 * finishes creating their account server-side, then we sign them in. No email
 * round-trip is needed to get into the app.
 */
export default function Welcome() {
  const navigate = useNavigate();
  const [sid, setSid] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("sid");
    setSid(s);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!sid) { toast.error("We couldn't find your checkout. Please contact hello@allegoryartstudio.com."); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    if (password !== confirm) { toast.error("Passwords don't match."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/stripe/finish-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sid, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Couldn't finish setting up your account. Please try again.");
        setBusy(false);
        return;
      }
      // Account is ready — sign them straight in.
      const { error } = await supabase.auth.signInWithPassword({ email: json.email, password });
      if (error) {
        toast.success("Your account is ready — please sign in.");
        navigate("/login", { replace: true });
        return;
      }
      toast.success("You're all set — welcome to Allegory Studio. ✦");
      navigate("/dashboard", { replace: true });
    } catch {
      toast.error("Something went wrong. Please try again, or email hello@allegoryartstudio.com.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Seo title="Welcome — Allegory Studio" canonicalPath="/welcome" noindex />
      <div
        className="bg-primary text-[11px] tracking-[0.28em] uppercase text-center py-2 font-medium"
        style={{ color: "#032419" }}
      >
        Payment received · Let's set up your studio
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
            <div className="eyebrow mb-2">You're in ✦</div>
            <h1 className="font-display text-3xl tracking-tight mb-2">Set your password</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Your subscription is active. Choose a password to finish creating your account and jump into your studio.
            </p>

            {!sid ? (
              <p className="text-sm text-destructive">
                We couldn't find your checkout details. If you were charged, email{" "}
                <a className="underline" href="mailto:hello@allegoryartstudio.com">hello@allegoryartstudio.com</a>{" "}
                and we'll set you up right away.
              </p>
            ) : (
              <form onSubmit={submit} className="grid gap-4">
                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    autoFocus
                  />
                </div>
                <div>
                  <Label>Confirm password</Label>
                  <Input
                    type="password"
                    required
                    minLength={6}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" className="rounded-sm mt-1" disabled={busy}>
                  {busy ? "Setting up…" : "Enter my studio"}
                </Button>
              </form>
            )}
          </div>

          <p className="mt-5 text-xs text-muted-foreground text-center">
            Already have an account?{" "}
            <button type="button" onClick={() => navigate("/login")} className="underline underline-offset-4 hover:text-foreground">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
