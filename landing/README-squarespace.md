# Allegory Studio — one-page site for Squarespace

A single, self-contained file: `landing/index.html`. All CSS, fonts, and JS are
inline and scoped under `.allegory-lp`, so it won't collide with Squarespace's
own styles. No build step.

---

## How to put it into Squarespace

**Recommended — one Code Block on a blank page**

1. **Create the page.** In Squarespace: *Pages → + → Blank Page*. Name it
   (e.g. "Home"). Set it as your homepage later via *Pages → ⋯ → Set as Homepage*.
2. **Hide the default header/footer (optional, for a true one-pager).**
   *Page Settings → Advanced* — or use a fluid/blank section.
3. **Add the code.** Edit the page → add a section → **Add Block → Code**
   (the `</>` block). Delete the sample text.
4. **Paste** the *entire* contents of `landing/index.html` into the Code Block.
5. Make sure **"Display Source"** is **OFF** (toggle in the code block) so it
   renders as HTML, not raw text.
6. **Save.** View the live site (not just the editor preview) — the scroll
   animations and pricing toggle run on the published page.

> Squarespace's *in-editor* preview sometimes doesn't run inline `<script>`.
> The page still works fully without JS (pricing toggle, FAQ, and mobile menu
> use pure CSS); only the fade-in-on-scroll is JS, and it shows everything if
> JS is blocked. Always confirm on the **published** URL.

**Alternative — per-page Code Injection** (*Page Settings → Advanced → Page
Header Code Injection*) also works if your plan supports it (Business plan or
higher is required for Code Blocks / Code Injection).

---

## Swap in your real content

Search the file for these markers:

- `▼▼ REPLACE` / `▼ REPLACE` — image placeholders. Replace the placeholder
  `<div>` with `<img src="YOUR-IMAGE-URL" alt="...">`. Upload screenshots via
  Squarespace (*add an Image block, copy its URL*) or host them on
  `allegoryartstudio.com`. Ideal sizes:
  - Hero device shot: ~1200×820
  - Showcase screenshots: ~1280×880 (16:11)
- **Testimonials** — search `real beta testimonials`. Names/quotes are
  placeholders; swap for real ones (and avatar initials in `<span class="av">`).
- **Links** — every CTA points to `https://allegoryartstudio.com`. Change to
  your trial / signup URL if different. Contact email: `hello@allegoryartstudio.com`.
- **Launch date** — appears in the top bar, FAQ, and final CTA ("August 1, 2026").
- **Pricing** — Starter `$25/$20`, Pro `$55/$44`, annual totals `$240 / $528`,
  in the `#pricing` section and the compare table. Edit in place if they change.

## Brand it's built on (pulled from the app)

- Cream `#f5f3ee`, forest ink `#11281c`, sage accent `#2c533f`
- Cormorant Garamond (display) + Work Sans (body)
- Sharp 2px radius, hairline rules, tiny tracked eyebrows — the app's
  "Gallery White" editorial system.

To tweak globally, edit the CSS variables in the `.allegory-lp{ ... }` block
near the top of `index.html`.
