import { useState } from "react";
import { Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StudioManagerChat } from "@/components/StudioManagerChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { toast } from "sonner";
import { useUserProfile } from "@/lib/userProfile";

// NOTE: Both the contact form submission (StudioManagerChat) and call request
// below should route to a backend email relay (e.g. SendGrid or Postmark) —
// placeholder for backend wiring in a later release.

const callSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  topic: z.string().trim().min(1).max(2000),
  timeframe: z.string().min(1),
});

const TIMEFRAMES = [
  "Within the next week",
  "Within the next two weeks",
  "This month",
  "Flexible",
];

function CallRequestForm({ onSubmitted }: { onSubmitted: () => void }) {
  const profile = useUserProfile();
  const [name, setName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [topic, setTopic] = useState("");
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[0]);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = callSchema.safeParse({ name, email, topic, timeframe });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setSubmitting(true);
    try {
      // TODO: wire to backend email relay (SendGrid / Postmark).
      await new Promise((r) => setTimeout(r, 600));
      onSubmitted();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 mt-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} required />
        </div>
      </div>
      <div>
        <Label>What would you like to discuss?</Label>
        <Textarea
          rows={4}
          required
          maxLength={2000}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Describe your question or challenge in a few sentences — this helps us prepare and confirm the session is a good fit."
        />
      </div>
      <div>
        <Label>Preferred timeframe</Label>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {TIMEFRAMES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Button type="submit" disabled={submitting} className="gap-2">
          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {submitting ? "Submitting…" : "Submit request — $75"}
        </Button>
        <p className="text-xs text-muted-foreground italic mt-2">
          Once we receive your request, we'll review it and send you a payment link and calendar invite within 1–2 business days. We confirm all sessions manually to make sure we're the right fit for your question.
        </p>
      </div>
    </form>
  );
}

const StudioManager = () => {
  const [callOpen, setCallOpen] = useState(false);
  const [callSent, setCallSent] = useState(false);

  return (
    <AppShell
      eyebrow="Module · Studio Support"
      title="We're in your corner."
      description="Send a question to a real arts administrator — about a sale, a deadline, a grant application, or anything else on your plate. We'll reply by email, usually within 2 business days. Your privacy is protected — our email addresses are never shared or visible."
    >
      <img src="/AAC_Brandmark-03_Emerald.png" alt="Allegory Studio" style={{ width: 48, height: "auto" }} className="mx-auto mb-6" />
      <StudioManagerChat />

      {/* Book a call */}
      <section className="mt-14">
        <div className="mb-4">
          <div className="eyebrow mb-2">Add-on · Office hours</div>
          <h2 className="font-display text-2xl mb-2">Got a bigger question?</h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Sometimes a conversation is worth a thousand emails. Book a 30-minute call with an arts administrator to dig into a specific challenge — a grant application, a pricing decision, a career inflection point. $75 per session.
          </p>
        </div>
        <div className="rule mb-6" />

        <Dialog open={callOpen} onOpenChange={(o) => { setCallOpen(o); if (!o) setCallSent(false); }}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Calendar className="h-3.5 w-3.5" /> Request a call — $75
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl font-normal">Request a call</DialogTitle>
            </DialogHeader>
            {callSent ? (
              <div className="hairline-card p-8 text-center mt-2">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-4 text-foreground" />
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                  Request received. We'll be in touch within 1–2 business days with next steps.
                </p>
                <Button variant="outline" size="sm" onClick={() => setCallOpen(false)}>Close</Button>
              </div>
            ) : (
              <CallRequestForm onSubmitted={() => setCallSent(true)} />
            )}
          </DialogContent>
        </Dialog>
      </section>
    </AppShell>
  );
};

export default StudioManager;
