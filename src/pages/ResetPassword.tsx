import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/**
 * Public page users land on from the "reset your password" email. The recovery
 * link establishes a short-lived session (Supabase fires PASSWORD_RECOVERY),
 * after which we let them set a new password via updateUser.
 */
const ResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false); // recovery session present
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let settled = false;
    let graceTimer: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      settled = true;
      setChecking(false);
    };
    const sub = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
        finish();
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
        finish();
      } else {
        // No session yet — give the recovery event a grace period to arrive
        // (cold start / slow network) before declaring the link invalid.
        graceTimer = setTimeout(() => {
          if (!settled) finish();
        }, 5000);
      }
    });
    return () => {
      sub.data.subscription.unsubscribe();
      if (graceTimer) clearTimeout(graceTimer);
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated — you're signed in.");
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Couldn't update your password. Request a new reset link.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="bg-primary text-[11px] tracking-[0.28em] uppercase text-center py-2 font-medium" style={{ color: "#032419" }}>
        Allegory Studio · for working artists
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <img src="/Allegory_Studio_Logo.png" alt="Allegory Studio" style={{ width: 180, height: "auto" }} className="mb-8" />
          <div className="hairline-card p-7">
            <div className="eyebrow mb-2">Reset password</div>
            <h1 className="font-display text-3xl tracking-tight mb-6">Choose a new password</h1>

            {checking ? (
              <p className="text-sm text-muted-foreground animate-pulse">Verifying your reset link…</p>
            ) : ready ? (
              <form onSubmit={submit} className="grid gap-4">
                <div>
                  <Label>New password</Label>
                  <Input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <Label>Confirm new password</Label>
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
                  {busy ? "Saving…" : "Update password"}
                </Button>
              </form>
            ) : (
              <div className="text-sm text-muted-foreground">
                <p className="mb-4">This reset link is invalid or has expired. Request a new one from the sign-in screen.</p>
                <Button variant="outline" className="rounded-sm" onClick={() => navigate("/login", { replace: true })}>
                  Back to sign in
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
