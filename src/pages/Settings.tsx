import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTier, type Tier } from "@/lib/tier";
import { useUserProfile } from "@/lib/userProfile";
import { useAuth } from "@/lib/auth";
import { QUICKBOOKS_ENABLED } from "@/lib/quickbooks";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Settings = () => {
  const { tier, setTier } = useTier();
  const { fullName, email, invoiceLogo, zapierHookUrl, setProfile } = useUserProfile();
  const { user } = useAuth();
  const [name, setName] = useState(fullName);
  const [mail, setMail] = useState(email);
  const [zapHook, setZapHook] = useState(zapierHookUrl);
  const logoRef = useRef<HTMLInputElement>(null);

  // ---- Native QuickBooks Online connection ----
  const [qbConnected, setQbConnected] = useState(false);
  const [qbCompany, setQbCompany] = useState("");
  const [qbBusy, setQbBusy] = useState(false);

  useEffect(() => {
    if (!QUICKBOOKS_ENABLED) return;
    // Toast + clean up the ?quickbooks= flag the OAuth callback redirects back with.
    const params = new URLSearchParams(window.location.search);
    const qb = params.get("quickbooks");
    if (qb === "connected") toast.success("QuickBooks connected. New invoices will sync to your books.");
    else if (qb === "error") toast.error("Couldn't connect QuickBooks. Please try again.");
    if (qb) window.history.replaceState({}, "", "/settings");
    // Load the current connection status to drive the UI.
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from("quickbooks_connections")
        .select("company_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) { setQbConnected(true); setQbCompany(data.company_name || ""); }
    })();
  }, [user?.id]);

  const connectQuickBooks = async () => {
    setQbBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please sign in again."); setQbBusy(false); return; }
      const res = await fetch("/api/quickbooks/auth", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (json.authUrl) { window.location.href = json.authUrl; return; }
      toast.error(json.error || "Couldn't start the QuickBooks connection.");
    } catch {
      toast.error("Couldn't reach QuickBooks. Please try again.");
    } finally {
      setQbBusy(false);
    }
  };

  const disconnectQuickBooks = async () => {
    setQbBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please sign in again."); setQbBusy(false); return; }
      const res = await fetch("/api/quickbooks/disconnect", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) { setQbConnected(false); setQbCompany(""); toast.success("QuickBooks disconnected."); }
      else toast.error("Couldn't disconnect. Please try again.");
    } catch {
      toast.error("Couldn't reach QuickBooks. Please try again.");
    } finally {
      setQbBusy(false);
    }
  };

  const saveZapier = (e: React.FormEvent) => {
    e.preventDefault();
    const url = zapHook.trim();
    if (url && !/^https?:\/\/\S+$/i.test(url)) {
      toast.error("Please paste a full URL starting with https://");
      return;
    }
    setProfile({ zapierHookUrl: url });
    toast.success(url ? "Zapier connected, new invoices will be sent to it." : "Zapier disconnected.");
  };

  const handleLogoFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (PNG, JPG, or SVG).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfile({ invoiceLogo: String(reader.result) });
      toast.success("Logo saved, it'll appear on your invoices.");
    };
    reader.readAsDataURL(file);
  };

  const switchTo = (t: Tier) => {
    setTier(t);
    toast.success(`Switched to Studio ${t === "pro" ? "Pro" : "Starter"}`);
  };

  const [billingBusy, setBillingBusy] = useState(false);
  const openBillingPortal = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error("Please sign in again."); return; }
    setBillingBusy(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (json.url) { window.location.href = json.url; return; }
      toast.error(json.error === "No billing account yet"
        ? "You don't have a billing account yet, choose a plan first."
        : (json.error || "Couldn't open billing."));
    } catch {
      toast.error("Couldn't reach billing. Please try again.");
    } finally {
      setBillingBusy(false);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const fn = name.trim();
    setProfile({ fullName: fn, email: mail.trim() });
    // Persist the name to the member's DB profile too (not just this device), so
    // it shows in admin reports and exports, not only in local settings.
    if (user?.id) {
      try { await supabase.from("profiles").update({ full_name: fn }).eq("id", user.id); } catch { /* local save still applied */ }
    }
    toast.success("Profile updated");
  };

  return (
    <AppShell title="Settings" eyebrow="Account" description="Account, plan, and developer tools.">
      <div className="space-y-8 max-w-2xl">
        {/* Profile */}
        <section className="hairline-card p-6">
          <div className="eyebrow mb-2">Your profile</div>
          <h2 className="font-display text-2xl tracking-tight mb-4">Name & email</h2>
          <form onSubmit={saveProfile} className="grid gap-4">
            <div>
              <Label>Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="e.g. Maya Ortiz" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={mail} onChange={(e) => setMail(e.target.value)} maxLength={255} placeholder="you@studio.com" />
            </div>
            <div>
              <Button type="submit" className="rounded-sm">Save profile</Button>
            </div>
          </form>
        </section>

        {/* Invoice branding */}
        <section className="hairline-card p-6">
          <div className="eyebrow mb-2">Branding</div>
          <h2 className="font-display text-2xl tracking-tight mb-2">Invoice logo</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Upload your own logo to appear at the top of the invoices you export. Leave it blank to use the
            default Allegory Studio heading. PNG, JPG, or SVG up to 2MB.
          </p>
          <input
            ref={logoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleLogoFile(e.target.files?.[0])}
          />
          {invoiceLogo ? (
            <div className="flex items-center gap-4">
              <div className="border border-border rounded-sm bg-white p-3 flex items-center justify-center h-24 w-48">
                <img src={invoiceLogo} alt="Your invoice logo" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" className="rounded-sm gap-2" onClick={() => logoRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" /> Replace
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-sm gap-2 text-muted-foreground hover:text-destructive"
                  onClick={() => { setProfile({ invoiceLogo: "" }); toast.message("Logo removed"); }}
                >
                  <X className="h-3.5 w-3.5" /> Remove
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => logoRef.current?.click()}
              className="w-full max-w-sm h-28 border border-dashed border-border rounded-sm flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            >
              <Upload className="h-5 w-5" />
              <span className="text-xs uppercase tracking-wider">Upload your logo</span>
              <span className="text-[10px] text-muted-foreground">PNG, JPG, or SVG up to 2MB</span>
            </button>
          )}
        </section>

        {/* Native QuickBooks Online (gated until Intuit keys + migration are live) */}
        {QUICKBOOKS_ENABLED && (
          <section className="hairline-card p-6">
            <div className="eyebrow mb-2">Integrations</div>
            <h2 className="font-display text-2xl tracking-tight mb-2">QuickBooks Online</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your QuickBooks and every invoice you create here flows straight into your books —
              a paid sale as a <span className="font-medium text-foreground">Sales Receipt</span>, an unpaid
              one as an <span className="font-medium text-foreground">Invoice</span>. No spreadsheets, no copy-paste.
            </p>
            {qbConnected ? (
              <div className="flex items-center gap-3">
                <span className="text-sm">
                  Connected{qbCompany ? <> to <span className="font-medium text-foreground">{qbCompany}</span></> : ""}.
                </span>
                <Button variant="outline" size="sm" className="rounded-sm" onClick={disconnectQuickBooks} disabled={qbBusy}>
                  {qbBusy ? "…" : "Disconnect"}
                </Button>
              </div>
            ) : (
              <Button className="rounded-sm" onClick={connectQuickBooks} disabled={qbBusy}>
                {qbBusy ? "Connecting…" : "Connect QuickBooks"}
              </Button>
            )}
          </section>
        )}

        {/* Integrations */}
        <section className="hairline-card p-6">
          <div className="eyebrow mb-2">Integrations</div>
          <h2 className="font-display text-2xl tracking-tight mb-2">QuickBooks, Shopify & more (via Zapier)</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Connect your own tools with Zapier. In Zapier, create a Zap with a{" "}
            <span className="font-medium text-foreground">Webhooks by Zapier → Catch Hook</span> trigger, copy the
            webhook URL it gives you, and paste it below. Then add an action like{" "}
            <span className="font-medium text-foreground">QuickBooks Online → Create Sales Receipt</span> (or a Shopify
            action). From then on, every new invoice you create here is sent to that Zap.
          </p>
          <form onSubmit={saveZapier} className="grid gap-3 max-w-xl">
            <div>
              <Label htmlFor="zap-hook">Zapier webhook URL</Label>
              <Input
                id="zap-hook"
                type="url"
                inputMode="url"
                placeholder="https://hooks.zapier.com/hooks/catch/…"
                value={zapHook}
                onChange={(e) => setZapHook(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Leave blank to turn the integration off. Each new invoice sends the buyer, item, amounts, tax and date.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" className="rounded-sm">Save</Button>
              {zapierHookUrl && (
                <span className="text-[11px] text-muted-foreground">Connected · invoices are being sent to Zapier.</span>
              )}
            </div>
          </form>
        </section>

        {/* Plan */}
        <section className="hairline-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="eyebrow mb-1">Current plan</div>
              <h2 className="font-display text-2xl tracking-tight">
                Studio {tier === "pro" ? "Pro" : "Starter"}
              </h2>
            </div>
            <Badge className="rounded-sm bg-accent text-accent-foreground">{tier === "pro" ? "$55/mo" : "$25/mo"}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {tier === "pro"
              ? "You have access to every module plus a real arts administrator."
              : "Upgrade to Pro to unlock Profile Vault, Communications, Marketing, and a real arts administrator."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-sm">
              <Link to="/pricing">View plans</Link>
            </Button>
            <Button variant="outline" className="rounded-sm" onClick={openBillingPortal} disabled={billingBusy}>
              {billingBusy ? "Opening…" : "Manage billing"}
            </Button>
          </div>
        </section>

        {/* Developer tier switcher, DEV builds only. In production, tier access is
            derived from the real subscription, never a client-side toggle. */}
        {import.meta.env.DEV && (
        <section className="hairline-card p-6 border-dashed">
          <div className="eyebrow mb-2">Developer · Tier switcher</div>
          <h3 className="font-display text-xl mb-2 tracking-tight">Preview tier experience</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Toggle the active subscription tier without going through checkout. For development and
            testing only.
          </p>
          <div className="flex gap-2">
            <Button
              variant={tier === "starter" ? "default" : "outline"}
              className="rounded-sm"
              onClick={() => switchTo("starter")}
            >
              Studio Starter
            </Button>
            <Button
              variant={tier === "pro" ? "default" : "outline"}
              className="rounded-sm"
              onClick={() => switchTo("pro")}
            >
              Studio Pro
            </Button>
          </div>
        </section>
        )}

        {/* Legal */}
        <section className="hairline-card p-6">
          <div className="eyebrow mb-2">Legal</div>
          <h3 className="font-display text-xl mb-2 tracking-tight">Terms &amp; policies</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Review the terms and policies that govern your use of Allegory Studio.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-sm">
              <a href="/terms" target="_blank" rel="noopener">Terms &amp; Conditions</a>
            </Button>
            <Button asChild variant="outline" className="rounded-sm">
              <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>
            </Button>
            <Button asChild variant="outline" className="rounded-sm">
              <a href="/cookies" target="_blank" rel="noopener">Cookie Policy</a>
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default Settings;
