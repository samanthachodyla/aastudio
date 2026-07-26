import { Link } from "react-router-dom";
import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTier, type Tier } from "@/lib/tier";
import { useUserProfile } from "@/lib/userProfile";
import { toast } from "sonner";

const Settings = () => {
  const { tier, setTier } = useTier();
  const { fullName, email, invoiceLogo, setProfile } = useUserProfile();
  const [name, setName] = useState(fullName);
  const [mail, setMail] = useState(email);
  const logoRef = useRef<HTMLInputElement>(null);

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
      toast.success("Logo saved — it'll appear on your invoices.");
    };
    reader.readAsDataURL(file);
  };

  const switchTo = (t: Tier) => {
    setTier(t);
    toast.success(`Switched to Studio ${t === "pro" ? "Pro" : "Starter"}`);
  };

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile({ fullName: name.trim(), email: mail.trim() });
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
          <Button asChild variant="outline" className="rounded-sm">
            <Link to="/pricing">View plans</Link>
          </Button>
        </section>

        {/* Developer tier switcher */}
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

        {/* Legal */}
        <section className="hairline-card p-6">
          <div className="eyebrow mb-2">Legal</div>
          <h3 className="font-display text-xl mb-2 tracking-tight">Terms &amp; policies</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Review the terms that govern your use of Allegory Studio.
          </p>
          <Button asChild variant="outline" className="rounded-sm">
            <a href="/terms" target="_blank" rel="noopener">Terms &amp; Conditions</a>
          </Button>
        </section>
      </div>
    </AppShell>
  );
};

export default Settings;
