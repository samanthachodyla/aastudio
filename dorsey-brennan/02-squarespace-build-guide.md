# Building It In Squarespace

Do these in order. Anything marked **⏱** is a step where you're waiting on someone
else, so start it early even if you're not ready for the rest.

---

## Step 0 — The three decisions that gate everything else

### Which plan

**Get Core.** Not Basic.

Basic can't do custom CSS, which means no fixed footer, no brown→yellow nav hover,
none of the type styling — the entire look in `03-custom-css.css` is off the table.
Core also drops the online store transaction fee to 0% (Basic charges 2%).

The one thing to know going in: Core still charges **5% on digital downloads** —
that's your templates, not your antiques. If templates turn into real money after
launch, Plus drops that to 1%. Don't pay for Plus now to save a fee on revenue you
don't have yet. Revisit in November.

*Prices and fee tiers move; confirm the current numbers on the pricing page when you
check out.*

### Which template

Start from a **blank or near-blank 7.1 template**. Every template is the same engine
underneath — you are not choosing features, only a starting arrangement of blocks
you're going to delete anyway. A photo-forward starting point in the "Portfolio"
family saves you an hour.

Do **not** pick a template because you like its fonts or colors. You're replacing all
of them in Step 2.

### ⏱ Which fonts — start this today

| Role | Font | Where it comes from | Cost |
|---|---|---|---|
| Nav, headings, buttons, labels | **Ovo** | Already in Squarespace (Google Fonts) | Free |
| Subheads + body | **Weiss** | Not in Squarespace. Buy a **webfont** license (Linotype/URW/Elsner+Flake, via MyFonts) and upload it | Paid |
| `Dorsey Brennan` wordmark | **Parfumerie Script Text** | Typesenses. On Adobe Fonts, or buy a webfont license | See below |

**Two things worth knowing before you spend anything:**

1. **The Canva license doesn't travel.** The font licensing you get inside Canva
   covers designs made in Canva. It does not license the font file for use on a
   website, and Canva's terms specifically don't cover using their licensed fonts as
   a logo or trademark. Since Parfumerie Script *is* your logo, buying the desktop
   license from Typesenses is worth doing regardless — it's the difference between a
   brand you own and one you're borrowing.

2. **You don't need a webfont license for the wordmark.** Export "Dorsey Brennan"
   from Canva as a **PNG with transparent background** (or SVG) and upload it as your
   site logo image. That's how nearly every design studio does it, it renders
   identically on every device, and it sidesteps the web license entirely. Do this.

**If Weiss doesn't arrive in time:** launch on **EB Garamond**, free and already in
Squarespace. It shares Weiss's Renaissance bones and chancery italic, and it is a
genuinely good typeface — not a compromise anyone but you will notice. Swap in Weiss
after launch; it's a two-minute change in Site Styles.

---

## Step 1 — Skeleton

Create these pages in Main Navigation, in this order:

```
Home            (set as homepage)
Services
Portfolio       (Portfolio page type — not a regular page)
Shop            (Store page type)
Inquire
```

Then, **not linked in navigation** (drag to the "Not Linked" section):

```
Project: [Name]     ← one per project, auto-created by the Portfolio page
Thank You           ← where the inquiry form redirects
404
```

Turn on a **site-wide password** now (Website → Site Availability → Private) so
nobody finds a half-built site before September 9. You'll take it off launch morning.

---

## Step 2 — Colors and type

**Website → Site Styles → Colors.**

You have **six** brand colors, and all six should do work. A site built on only the
dark one flattens a palette you already took the trouble to build.

**The site is light.** Photographs are the background of the whole page — they sit
fixed while the writing scrolls over them, which is the "entire background is photos"
idea from your brief. The flat brand colors appear as a few resting places between the
photography, not as the ground everything sits on.

| Your swatch | Hex | Its job on the site |
|---|---|---|
| Red | `#bd0b0b` | The wordmark, and headings **on cream** |
| Brown | `#925c50` | Nav and links, resting state |
| Yellow | `#f8c135` | The hover — **as a block behind the word**, see below |
| Cream | `#fff0c8` | The header and footer veil, subheads on photos, closing ground |
| Body | `#f5efdd` | Body text on photos, and the page's own light ground |
| Sage | `#b2b192` | Ground for the About section |
| Pale blue | `#b6ccd7` | Ground for the templates band |
| Oxblood | `#4d0c0c` | **Text** on all the light grounds — not a background |

**Build three color themes** and assign them section by section:

| Theme | Background | Headings | Body | Links |
|---|---|---|---|---|
| **Photo** | image + scrim | `#fff0c8` | `#f5efdd` | `#fff0c8` |
| **Sage / Blue** | `#b2b192` / `#b6ccd7` | `#4d0c0c` | `#4d0c0c` | `#4d0c0c` |
| **Cream** | `#fff0c8` | `#bd0b0b` | `#4d0c0c` | `#925c50` |

Most of the page is Photo. Sage grounds About, blue grounds the templates band, and
cream closes it — red script on cream, the way your brand book opens.

> **Corrections to earlier drafts of this guide.** I first built the site on a dark
> `#310909` ground. That hex is the background of your Canva *slides*, not one of your
> swatches — and more importantly the whole dark direction was wrong. Your mockup is
> light. Oxblood `#4d0c0c` is now a text color, sage and pale blue are real grounds,
> and photography carries the page.

### The contrast table, and the one thing it forces

Measured against each ground. This is what decides where every color can go:

| | on photo + scrim | on cream | on sage | on blue |
|---|---|---|---|---|
| Cream `#fff0c8` | **8.0–9.6 ✓** | — | 1.9 ✗ | 1.5 ✗ |
| Body `#f5efdd` | **7.9–9.0 ✓** | — | 1.9 ✗ | 1.5 ✗ |
| Oxblood `#4d0c0c` | — | **13.5 ✓** | **7.0 ✓** | **9.2 ✓** |
| Red `#bd0b0b` | — | **5.8 ✓** | 3.0 ✗ | 3.9 ✗ |
| Brown `#925c50` | — | **4.75 ✓** | 2.5 ✗ | 3.3 ✗ |
| Yellow `#f8c135` | — | 1.5 ✗ | 1.3 ✗ | 1.0 ✗ |

**Which means your nav hover needs one change, and I want to be straight about it.**
You asked for links that turn bright yellow on hover. On a light page yellow text
measures 1.5:1 — not dim, invisible. And brown can't move to a dark header instead:
brown is dark enough that even on pure black it caps at 3.87:1, so it never passes
there either. The two colors only coexist on a mid-dark bar, which is exactly what you
just asked me to get rid of.

So the yellow moved from the letters to behind them. Hover a link and a yellow block
arrives, with the word going deep red over it at 9.2:1. Bright yellow is still what
appears the instant you hover — it just also works. If you'd rather have the letters
themselves turn yellow, §3 of the CSS has the one-line swap, commented and ready.

**Site Styles → Fonts:**
- Headings → **Ovo**
- Paragraphs → **Weiss** (or EB Garamond)
- Buttons → **Ovo**, uppercase, wide letter spacing

To upload Weiss: Site Styles → Fonts → upload. Files must be `.otf`, `.ttf`, or
`.woff`.

> **A note on your brand file:** page 3 of the Canva deck currently labels the nav
> colors as `#042698` (blue) and `#ad7e14` (gold), which contradicts the summary page
> and your brief. I've built everything to `#925c50` / `#f8c135` as you specified.
> Worth fixing that page so the next person reading it doesn't guess wrong.

---

## Step 3 — Header and footer

**Header:** Edit → click header → gear → **Fixed Position: on**. Layout with the
wordmark centered and nav beneath it, matching your mockup. Upload the transparent
PNG wordmark as the logo.

**Footer:** Squarespace has no fixed-footer switch — that's what §4 of the CSS does.
Build the footer content normally (three columns: wordmark + EST. 2026 / social links
/ address and email), then paste the CSS.

**Then measure and correct one number.** Once the footer is built, right-click it →
Inspect → read its height in pixels. Put that number into `--db-footer-h` at the top
of the CSS. If you skip this, your last section will sit slightly behind the footer.

**Paste the CSS:** Website → Website Tools → Custom CSS → paste all of
`03-custom-css.css`. Save.

---

## Step 4 — Homepage

Build the sections in your hierarchy order. For each one: add section → set background
image → set the **media overlay** to around 35–45%.

| Section | Ground | Layout |
|---|---|---|
| Opening | photo | Full viewport, no text — the photographs speak first |
| Welcome. | photo + scrim left | Text column left |
| The Philosophy. | photo + scrim right | Text column right, verse line breaks intact |
| Projects. | photo + scrim center | Four-image strip, each linking to a gallery |
| About. | **sage** | Portrait photo left, text right |
| Templates band | **pale blue** | One short paragraph and a button |
| Closing | **cream** | Crest, one line, "books open," Inquire button |

Photography carries the top two-thirds; then sage arrives and the page changes
temperature. That shift is what keeps a photo-heavy scroll from reading as one long
image, and every color in it is already yours.

**Set the photo background in Squarespace:** each section gets its own background
image, and the `.db-scrim` class handles legibility. If you want the single fixed
photo backdrop the prototype uses — one image staying put while everything scrolls
over it — set the section background image and turn on **Fixed** in the background
options rather than giving each section its own.

**About the text-on-photo look.** Your mockup puts body copy directly over a busy
photograph, and in the mockup it's genuinely hard to read — the paragraph under "The
Philosophy" disappears into the bed and the wall. The look is right; it just needs a
scrim. Squarespace's built-in media overlay handles most of it, and the `.db-scrim`
class in the CSS gives you a gradient version that darkens the top and bottom while
leaving the middle of the photo clean. Use overlay for simple cases, `.db-scrim` when
the photo is busy behind text.

To add the class: click the section → gear → scroll to the bottom → there's no class
field in 7.1, so instead add a **Code Block** at the top of the section containing
`<div class="db-scrim"></div>`, or apply the gradient site-wide by deleting `.db-scrim`
from the CSS selector so it targets all sections.

---

## Step 5 — Portfolio

Use the **Portfolio page type**, not a regular page with a gallery — it gives you
individual project pages for free, which is exactly the "individual photo galleries"
you asked for.

1. Portfolio → set layout to **Grid: Overlay** or **Grid: Simple**
2. Each project becomes its own page automatically
3. On each project page: description text at top (from the copy deck), then a
   **Gallery Section** set to Grid or Slideshow
4. Bottom of each project page: `Next project` and `Start yours` buttons

**Image prep, so the site doesn't crawl:** export everything at **2500px on the long
edge, JPG, quality 70–80**. Squarespace generates smaller versions automatically, but
it will happily serve a 12MB file if you upload one. Name files descriptively before
uploading — `clarks-summit-dining-room.jpg`, not `IMG_4471.jpg`. Squarespace uses the
filename for image SEO.

---

## Step 6 — Shop

**Store page → two categories:**

| Category | Product type | Notes |
|---|---|---|
| The Collection | Physical | Stock = 1 for each antique. Set "Limited availability." |
| Templates | Digital (Service/Download) | Squarespace delivers the file automatically at checkout |

**Connect Stripe** (Selling → Payments). This is a ⏱ step — Stripe verification can
take a day or two and needs your business details, so start it early.

Shipping: for one-of-one antiques, set **flat-rate by item** or "local pickup /
delivery quoted separately" rather than trying to compute freight on a sideboard.
Add a line to each listing: *Delivery within [X] miles quoted at checkout.*

---

## Step 7 — Inquire (the two-door page)

This is the page you had the question about. Here's how the scheduling actually works.

**Squarespace Scheduling is Acuity, and it's a separate subscription** — it is not
included in any website plan. In 2026 it runs roughly **$16–20/month on the Starter
tier** (annual vs monthly), with a 7-day free trial. Starter is plenty for one
appointment type.

Once you have it, both things live on one page:

1. Add a section: `Book a 1:1 Session` heading + the two lines from the copy deck
2. Add a **Scheduling Block** directly beneath — it embeds the real calendar inline,
   no code needed. Visitors pick a time without ever leaving your site.
3. Add a divider
4. Add a section: `Start a Project` heading + a **Form Block** with the fields from
   the copy deck
5. Form settings → **Storage**: send to your email *and* a Google Sheet. Two copies
   means you never lose an inquiry to a spam folder.
6. Form settings → **Post-submit**: redirect to your Thank You page

**Set up in Acuity before you embed:** one appointment type called
`Project Consultation — 90 minutes`, your real availability, a buffer between
bookings, and **connect your Google Calendar** so it can't double-book you. Turn on
the confirmation and 24-hour reminder emails, and rewrite them in your voice —
they're the first thing a new client reads from you.

If you decide the subscription isn't worth it before launch: ship the page with the
form only, and add the scheduling block later. The page is designed so the second door
can arrive a week late without looking unfinished.

---

## Step 8 — Before you take the password off

- [ ] Every page opens on a phone and nothing is hidden behind the fixed footer
- [ ] Nav hover goes yellow — check on desktop, since hover doesn't exist on touch
- [ ] Submit a test inquiry. Confirm it reaches your inbox *and* the sheet
- [ ] Book a test appointment. Confirm the calendar hold and the confirmation email
- [ ] Buy something from the shop with a real card, then refund yourself. Test a
      digital download separately — that's the one that silently fails
- [ ] Every page has an SEO title and description (copy deck §6)
- [ ] Favicon uploaded — use the DB floral crest
- [ ] Social share image set (Marketing → Social Sharing) — otherwise Instagram
      shows a grey box when anyone shares your link
- [ ] Connect the domain, and confirm `dorseybrennan.com` *and* `www.` both resolve
- [ ] Run the site past one person who has never seen it. Watch where they hesitate

---

## Sources

- [Squarespace pricing overview (Style Factory)](https://www.stylefactoryproductions.com/squarespace-pricing)
- [Squarespace pricing breakdown (Website Builder Expert)](https://www.websitebuilderexpert.com/website-builders/squarespace-pricing/)
- [Uploading custom fonts — Squarespace Help Center](https://support.squarespace.com/hc/en-us/articles/40181698210701-Uploading-custom-fonts)
- [Acuity Scheduling pricing](https://acuityscheduling.com/pricing)
- [Acuity + Squarespace setup guide](https://www.jpkdesignco.com/blog/how-to-set-up-acuity-scheduling-on-your-squarespace-site)
- [Parfumerie Script — Adobe Fonts](https://fonts.adobe.com/fonts/parfumerie-script)
- [Weiss — MyFonts (Linotype)](https://www.myfonts.com/collections/weiss-font-linotype)
