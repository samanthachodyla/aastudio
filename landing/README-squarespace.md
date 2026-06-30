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

## The launch-list email funnel (where the emails go)

Both signup forms (hero + final CTA) write every email to **one place**: the
`launch_waitlist` table in the Supabase project
`lafkbawmkxgvmmlrblff` (sam@moresilverlinings.com's project).

- **View / export the emails:** Supabase dashboard →
  https://supabase.com/dashboard/project/lafkbawmkxgvmmlrblff/editor →
  open `launch_waitlist`. Use *Export → CSV* to download them, then email
  everyone their free-month code on August 1.
- Each row stores: `email`, `source` (which form), `referrer`, `user_agent`,
  `created_at`. Duplicate emails are treated as "already on the list" (success).
- The key embedded in the page is the **publishable** key — safe to expose.
  Row-level security only allows *inserts*, so no one can read the list back
  through the public API. Reading/exporting happens in the dashboard only.
- To point the funnel at a different Supabase table, edit `SUPABASE_URL`,
  `SUPABASE_KEY`, and the table name in the `<script>` near the bottom of
  `index.html`.

> Squarespace also has a built-in form/newsletter block if you'd rather collect
> emails there — but the Supabase table keeps them in one exportable place
> regardless of where the site lives.

## Swap in your real content

The three platform screenshots (Dashboard, Inventory, Profile Vault) are **real
captures of the app, embedded directly in the file** (base64) so they show up
anywhere with no hosting. To replace one later, swap the `src="data:image/..."`
on the matching `<img class="show-img">` in the `#showcase` section.

Other things you may want to edit:

- **Testimonials** — search `real beta testimonials`. Names/quotes are
  placeholders; swap for real ones (and avatar initials in `<span class="av">`).
- **Links** — the nav/pricing CTAs scroll to the `#signup` form. The footer
  "Sign in" still points to `https://allegoryartstudio.com`. Contact email:
  `hello@allegoryartstudio.com`.
- **Launch date** — appears in the top bar, hero, FAQ, and final CTA ("August 1, 2026").
- **Launch offer** — currently "first month free." Edit in the top bar, hero,
  pricing, and FAQ if it changes.
- **Pricing** — Starter `$25/$20`, Pro `$55/$44`, annual totals `$240 / $528`,
  in the `#pricing` section and the compare table. Edit in place if they change.

## Brand it's built on (pulled from the app)

- Cream `#f5f3ee`, forest ink `#11281c`, sage accent `#2c533f`
- Cormorant Garamond (display) + Work Sans (body)
- Sharp 2px radius, hairline rules, tiny tracked eyebrows — the app's
  "Gallery White" editorial system.

To tweak globally, edit the CSS variables in the `.allegory-lp{ ... }` block
near the top of `index.html`.
