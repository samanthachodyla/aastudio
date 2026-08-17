# Dorsey Brennan — Website & Launch Kit

Everything needed to build the site in Squarespace and be live for **September 9, 2026**.

| File | What it is |
|---|---|
| [`01-copy-deck.md`](01-copy-deck.md) | Every word for every page. Paste-ready. |
| [`02-squarespace-build-guide.md`](02-squarespace-build-guide.md) | Step-by-step build, in order. Plan, fonts, pages, shop, scheduling. |
| [`03-custom-css.css`](03-custom-css.css) | Paste into Custom CSS. Fixed header + footer, brown→yellow nav hover, brand type. |
| [`04-business-setup.md`](04-business-setup.md) | Phone, email, and the setup items that block everything else. |
| [`prototype/index.html`](prototype/index.html) | Working homepage preview. Open in a browser. |

---

## Structure

Navigation stays at four, exactly as specified:

```
Dorsey Brennan  (wordmark, fixed header)
SERVICES · PORTFOLIO · SHOP · INQUIRE

Home      → Welcome. / The Philosophy. / Projects. / About. / social
Services  → 5 offers, consultation is the bookable one
Portfolio → grid → individual project pages, each with its own gallery
Shop      → The Collection (antiques) + Templates (instant download)
Inquire   → booking calendar AND project form, one page, two doors
```

---

## The three things that decide the schedule

**1. Get the Core plan, not Basic.** Basic blocks custom CSS, and custom CSS is what
delivers the fixed footer, the yellow nav hover, and the type. Without it the site
can't look like your mockup.

**2. Start the fonts today.** Ovo is free and already in Squarespace. Weiss and
Parfumerie Script are licensed fonts that need buying, and your Canva license doesn't
carry over to a website. The shortcut: export the wordmark from Canva as a
transparent PNG and use it as the logo image — that removes the script font from the
critical path entirely. Details in the build guide.

**3. Scheduling is a separate subscription.** Squarespace Scheduling is Acuity,
roughly $16–20/month, not included in any website plan. It does embed directly into
the Inquire page beneath the form, so you get the one-page booking-and-inquiry
experience you wanted.

---

## Timeline to September 5

19 days. Sequenced so nothing waits on anything it doesn't have to.

**This week — Aug 17–23 · unblock everything**
- Buy the domain, set up Google Workspace + `hello@dorseybrennan.com`, add SPF/DKIM/DMARC
- Google Voice number on a 570 area code
- Buy the Squarespace Core plan; start the Stripe application (it takes days)
- Order the Weiss and Parfumerie webfont licenses, or commit to the PNG-wordmark route
- Fix the RSVP date on the dinner invitation — it currently says June 30
- **Order business cards by Aug 24** — printing takes a week and the dinner is Sept 8

**Aug 24–30 · build**
- Pages, colors, type, fixed header and footer, paste the CSS
- Homepage sections in hierarchy order
- Services and Inquire pages written from the copy deck
- Acuity: appointment type, availability, calendar sync, rewritten confirmation emails

**Aug 31–Sept 5 · fill and finish**
- Branding photos in (⏱ waiting on the photographer — chase them this week if the
  gallery hasn't landed)
- Portfolio galleries, shop listings, SEO, favicon, social share image
- Run the pre-launch checklist in the build guide. Test a real purchase and a real
  digital download
- **Site is done, password still on**

**Sept 8 · the dinner**
- Site stays private. QR codes on the table point to the Inquire page
- Leave the "books open tomorrow" card at each seat

**Sept 9 · books open**
- Remove the password. Announce.

---

## Still needed from you

Marked `[BRACKETS]` throughout the copy deck. The ones that block a page:

- **Pricing** for the five services — at minimum "projects begin at," and a real number
  for the consultation, since that's the bookable one
- **The About paragraph** — one or two sentences only you can write
- **Project names, locations, and the two-to-three sentence story** for each portfolio piece
- **Timeline and response-time promises** — "within two business days" is a placeholder
- **Service region** — how far you travel

---

## A design note worth reading before you build

Your mockup puts body copy directly over a photograph, and in the mockup itself the
paragraph under "The Philosophy" is genuinely hard to read — it disappears into the
bed and the wall behind it. The instinct is right and the look is right; it just needs
a scrim. Section 5 of the CSS gives you a gradient that darkens the top and bottom of a
photo while leaving its middle clean, so text sits on a readable field and the
photograph still fills the screen. The prototype shows it working — the Philosophy
section keeps the full-bleed photo and stays legible.
