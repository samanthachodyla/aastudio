# Business Setup — Phone, Email, and the Rest

Your second priority: a phone number and email address you can print on business cards
before launch. Here's the short answer, then the reasoning.

---

## Email — you're closer than you think

Your dinner invitation already says **hello@dorseybrennan.com**. That means either the
domain is yours, or it needs to be by the time those invitations go out. Everything
else depends on it, so do this first.

**Set it up:**

1. **Own `dorseybrennan.com`.** Buy it wherever — Squarespace sells domains and will
   connect it in one click, which is one less thing to configure. If you already own
   it elsewhere, keep it there and just point it at Squarespace.
2. **Google Workspace, Business Starter** (~$7–8/user/month). You get
   `hello@dorseybrennan.com` in Gmail, plus Drive, Calendar, and Meet — and the
   Calendar piece matters, because that's what Acuity syncs with so it can't
   double-book you.
3. Set up these three aliases now, all forwarding to the one inbox — free, and it
   lets you route things later without changing anything you've printed:
   - `hello@` — the public one. Business cards, site, invitation.
   - `studio@` — vendors, trades, invoices
   - `dorsey@` — your name, for clients you're actually working with

**What not to do:** don't launch on a free forwarding address, and don't print a Gmail
address on a card. `dorseybrennaninteriors@gmail.com` on a card for a designer whose
whole proposition is considered restraint undoes a surprising amount of work.

**One deliverability step people skip:** after Workspace is connected, turn on **SPF,
DKIM, and DMARC** in the Workspace admin console. It's three DNS records and it's the
difference between your inquiry replies landing in the inbox or in spam. Do it the
same day you set up the account — it takes about fifteen minutes and it's much more
annoying to diagnose later.

---

## Phone — get a second number, not a second phone

**Recommendation: Google Voice.** Free for personal use, or ~$10/month on the
Workspace tier if you want it tied to `dorseybrennan.com`.

Why this rather than a real business line:

- It rings your existing phone. No second device, no forwarding you'll forget.
- Texts come through, which matters — clients and trades will text you photos of a
  delivery, a paint chip, a problem at the site.
- Voicemail transcribes to email, so you can read a message from a job site.
- You can turn it off at 7pm without turning off your actual phone.
- Your personal number never appears on a card, a contract, or a Google result.

**Alternatives if you want more:** OpenPhone (~$15/user/month) adds a shared inbox and
better call handling, and is what most small studios graduate to. Skip it for now —
you can port a Google Voice number to it later if you need to.

**Pick an area number.** 570 is Scranton. A local number does real work for a designer
whose brand is rooted in a place.

**On the card, format it the way you format everything else:**

```
(570) 555-0142
hello@dorseybrennan.com
dorseybrennan.com
```

---

## Do this in this order

The dependencies matter — each one blocks the next.

1. **Buy the domain** → nothing else can start
2. **Google Workspace + `hello@`** → needed for the site, the invitation, Stripe
3. **SPF / DKIM / DMARC** → same day, while you're already in DNS
4. **Google Voice number** → 20 minutes, needs nothing
5. **Order business cards** → needs 1, 2, and 4 done. ⏱ Printing takes a week —
   order by **August 24** to be safe for the September 8 dinner
6. **Stripe account** → needs your business details; verification can take days
7. **Squarespace Core plan** → annual billing is meaningfully cheaper, and you're
   not going to cancel in month three

---

## Things you'll want before money moves

I'm not your lawyer or accountant, and the specifics vary by state — but these are the
items that reliably bite people in month two, so raise them with whoever advises you:

- **Business entity.** An LLC is the usual choice for a design practice. Pennsylvania
  registration is straightforward and worth doing before you take deposits.
- **EIN** from the IRS — free, takes ten minutes online, and Stripe and your bank will
  both ask for it.
- **A business bank account**, separate from personal, opened before the first client
  payment. Mixing them is the single most common bookkeeping regret.
- **Pennsylvania sales tax.** Selling antiques and digital downloads likely means
  collecting it. Squarespace can calculate and collect automatically once you tell it
  where you have nexus — but you need to be registered with the state first.
- **A client agreement.** Even a one-page letter of agreement covering scope,
  payment schedule, and what happens if a project pauses. Especially for full-service
  work where you're fronting purchases.
- **Insurance.** General liability at minimum. Some commercial and hospitality clients
  won't sign without a certificate, so this can block a project rather than just
  being prudent.

Items 1–3 are quick and cheap and unblock everything else. The rest can follow through
September and October.

---

## Two things I noticed in your Canva file

**1. The dinner invitation has the wrong RSVP date.** It reads
*"rsvp BY june 30 | hello@dorseybrennan.com"* on an invitation to a **September 8**
dinner. If those go out as-is, people will assume the date is stale and not reply.
Suggested fix: **RSVP BY AUGUST 28**.

**2. The nav colors on page 3 contradict everything else.** Page 3 labels them
`#042698` (blue) and `#ad7e14` (gold); your summary page and your brief both say
`#925c50` and `#f8c135`. I built to the latter. Worth correcting the page so the file
stays trustworthy.
