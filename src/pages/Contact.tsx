import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const CONTACT_EMAIL = "hello@allegoryartstudio.com";

/** Public "Contact us" inquiry form. Composes the message to hello@ so it lands
 *  in the studio inbox with no backend dependency (works regardless of how email
 *  is wired up). A direct mailto link is always shown as a fallback. */
const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Please add your name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError("Please add a valid email so we can reply.");
    if (!message.trim()) return setError("Please add a short message.");

    const subj = subject.trim() || "Inquiry via allegoryartstudio.com";
    const body =
      `Name: ${name.trim()}\n` +
      `Email: ${email.trim()}\n\n` +
      `${message.trim()}\n`;
    const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
    // Open the visitor's email app addressed to the studio inbox.
    window.location.href = href;
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 w-full max-w-xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="eyebrow text-muted-foreground mb-4">Allegory Art Studio</div>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight">Contact us</h1>
          <p className="text-sm text-muted-foreground mt-4 max-w-md mx-auto">
            Questions about Allegory, a partnership, or press? Send us a note and we'll get back to you,
            usually within 1–2 business days.
          </p>
        </div>

        {sent ? (
          <div className="hairline-card p-8 text-center">
            <h2 className="font-display text-2xl mb-3">Thanks — almost there.</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Your email app should have opened, addressed to <span className="text-foreground">{CONTACT_EMAIL}</span>.
              Just hit send. If nothing opened, email us directly at the address below.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-block text-sm rounded-sm border border-foreground/20 px-5 py-2 hover:bg-foreground hover:text-background transition-colors"
            >
              {CONTACT_EMAIL}
            </a>
            <div className="mt-8">
              <Link to="/" className="eyebrow text-muted-foreground hover:text-foreground">← Back to home</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Your name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Jane Artist" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} placeholder="you@studio.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={140} placeholder="What's this about?" />
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} maxLength={4000} placeholder="How can we help?" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex items-center justify-between gap-4 pt-1">
              <Link to="/" className="eyebrow text-muted-foreground hover:text-foreground">← Back to home</Link>
              <Button type="submit">Send message</Button>
            </div>
            <p className="text-xs text-muted-foreground text-center pt-2">
              Prefer email? Reach us directly at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-foreground">{CONTACT_EMAIL}</a>.
            </p>
          </form>
        )}
      </main>
    </div>
  );
};

export default Contact;
