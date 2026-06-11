import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FEATURE_OPTIONS } from "@/lib/labels";
import { toast } from "sonner";

const db = supabase as unknown as { from: (t: string) => any };

type Status = "checking" | "needed" | "done";

/**
 * One-time demographics survey shown after a user's first sign-in. Renders the
 * app once the survey is complete (or if we can't determine status — analytics
 * must never lock anyone out, so every error path fails open to the app).
 */
export function SurveyGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);
  const [age, setAge] = useState("");
  const [zip, setZip] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);

  const toggleFeature = (opt: string) =>
    setFeatures((prev) => (prev.includes(opt) ? prev.filter((f) => f !== opt) : [...prev, opt]));

  useEffect(() => {
    if (!user) return;
    let active = true;
    db.from("profiles")
      .select("demographics_completed_at")
      .eq("id", user.id)
      .maybeSingle()
      .then(
        ({ data, error }: { data: { demographics_completed_at?: string | null } | null; error: unknown }) => {
          if (!active) return;
          // Fail open: if the column isn't there yet or the read errors, don't block.
          if (error) return setStatus("done");
          setStatus(data?.demographics_completed_at ? "done" : "needed");
        },
        () => active && setStatus("done"),
      );
    return () => {
      active = false;
    };
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !user) return;
    setBusy(true);
    try {
      const ageNum = parseInt(age, 10);
      const { error } = await db
        .from("profiles")
        .update({
          age: Number.isFinite(ageNum) ? ageNum : null,
          zip_code: zip.trim() || null,
          desired_features: features.length ? features : null,
          desired_feature: features[0] ?? null,
          demographics_completed_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (error) throw error;
      setStatus("done");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Couldn't save — please try again.");
      setFailed(true); // reveal an escape hatch so a save error never traps the user
    } finally {
      setBusy(false);
    }
  };

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="eyebrow text-muted-foreground animate-pulse">One moment…</div>
      </div>
    );
  }

  if (status === "done") return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <img src="/Allegory_Studio_Logo.png" alt="Allegory Studio" style={{ width: 170, height: "auto" }} className="mb-8" />
        <div className="hairline-card p-7">
          <div className="eyebrow mb-2">Welcome to the beta</div>
          <h1 className="font-display text-3xl tracking-tight mb-2">A few quick questions</h1>
          <p className="text-sm text-muted-foreground mb-6">
            This helps us understand who's in the studio and what to build next. Takes about 30 seconds.
          </p>

          <form onSubmit={submit} className="grid gap-5">
            <div>
              <Label htmlFor="survey-age">Age</Label>
              <Input
                id="survey-age"
                type="number"
                required
                min={13}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 34"
                inputMode="numeric"
              />
            </div>

            <div>
              <Label htmlFor="survey-zip">ZIP code</Label>
              <Input
                id="survey-zip"
                required
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                maxLength={12}
                placeholder="e.g. 90210"
                autoComplete="postal-code"
              />
            </div>

            <div>
              <Label className="mb-1 block">Which features do you hope to use the most?</Label>
              <p className="text-xs text-muted-foreground mb-2">Select all that apply.</p>
              <div className="grid gap-2.5">
                {FEATURE_OPTIONS.map((opt) => {
                  const checked = features.includes(opt);
                  return (
                    <label
                      key={opt}
                      htmlFor={`feat-${opt}`}
                      className={`flex items-center gap-3 text-sm cursor-pointer rounded-sm border px-3 py-2 transition-colors hover:bg-muted/40 ${
                        checked ? "border-primary bg-muted/40" : "border-border"
                      }`}
                    >
                      <Checkbox id={`feat-${opt}`} checked={checked} onCheckedChange={() => toggleFeature(opt)} />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <Button type="submit" className="rounded-sm mt-1" disabled={busy || features.length === 0}>
              {busy ? "Saving…" : "Enter the studio"}
            </Button>

            {failed && (
              <button
                type="button"
                onClick={() => setStatus("done")}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 justify-self-center"
              >
                Skip for now and continue to the studio
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
