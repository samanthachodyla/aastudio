import { Link } from "react-router-dom";
import { useState } from "react";
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
  const { fullName, email, setProfile } = useUserProfile();
  const [name, setName] = useState(fullName);
  const [mail, setMail] = useState(email);

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
