import { useState } from "react";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useUserProfile } from "@/lib/userProfile";

// Submissions are delivered by the /api/support serverless function, which
// routes to the Studio Manager inbox (the same reliable channel used for
// signups, plus a direct email when Resend is configured).

const schema = z.object({
  subject: z.string().trim().min(1, "Subject required").max(200),
  message: z.string().trim().min(1, "Message required").max(4000),
  name: z.string().trim().min(1, "Name required").max(100),
  email: z.string().trim().email("Valid email required").max(255),
});

export function StudioManagerChat() {
  const profile = useUserProfile();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const reset = () => {
    setSubject(""); setMessage(""); setName(profile.fullName); setEmail(profile.email); setSent(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ subject, message, name, email });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, name, email, event_source_url: window.location.href }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Couldn't send right now. Please try again.");
      }
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send right now. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="hairline-card p-8 text-center">
        <CheckCircle2 className="h-8 w-8 mx-auto mb-4 text-foreground" />
        <h3 className="font-display text-2xl mb-2">We've got your note.</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          A Studio Manager will reply to your email within 2 business days. We look forward to reading it.
        </p>
        <button
          onClick={reset}
          className="mt-6 text-xs text-muted-foreground underline hover:text-foreground"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="hairline-card p-6 grid gap-5">
      <div>
        <Label htmlFor="sm-subject">What's this about?</Label>
        <Input
          id="sm-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Pricing a new body of work, Grant application question"
          maxLength={200}
          required
        />
      </div>

      <div>
        <Label htmlFor="sm-message">Tell us what's going on</Label>
        <Textarea
          id="sm-message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Give us as much context as you'd like — the more detail, the better we can help."
          maxLength={4000}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="sm-name">Your name</Label>
          <Input id="sm-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
        </div>
        <div>
          <Label htmlFor="sm-email">Your email — we'll reply here</Label>
          <Input id="sm-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} required />
        </div>
      </div>

      <div>
        <Button type="submit" disabled={sending} className="gap-2">
          {sending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {sending ? "Sending…" : "Send to Studio Manager"}
        </Button>
        <p className="text-xs text-muted-foreground italic mt-2">
          Messages are routed securely. Your email address and ours remain private throughout the exchange.
        </p>
      </div>
    </form>
  );
}
