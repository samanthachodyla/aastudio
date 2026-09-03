// Turns the pre-launch waitlist landing markup into the live "sign up" homepage.
// Used at runtime (Landing.tsx) and at build time (vite prerender) so both agree.
//
// Launched: the live "sign up" homepage shows from here on. (Set to a past moment
// so the site is live immediately; before this timestamp the waitlist page showed.)
export const LAUNCH_AT_MS = Date.UTC(2026, 6, 30, 0, 0, 0); // Live as of Jul 30 2026

export function isLaunched(nowMs: number = Date.now()): boolean {
  return nowMs >= LAUNCH_AT_MS;
}

/** Apply the pre-launch → live transforms to the landing HTML string. */
export function toLiveLanding(html: string): string {
  let out = html;

  // Announcement marquee: waitlist message → live message.
  out = out.split('Launching August 1st <span class="bar">|</span> Join the list &amp; get first access')
    .join('Labor Day special is now live <span class="bar">|</span> First month free with code LABORDAY');

  // Every "first access" call-to-action anchor now scrolls to the pricing plans,
  // where choosing a plan opens Stripe Checkout. Payment comes first — no account
  // is created until checkout is paid (see Welcome.tsx / finish-signup), so these
  // never deep-link to an account-first form.
  out = out.split('href="#signup"').join('href="#pricing"');
  out = out.split('>Get first access</a>').join('>Get started</a>');

  // Pricing section: retire the remaining pre-launch "reserve a spot" framing.
  out = out.split('Join the launch list and get first access.')
    .join('Choose your plan and start managing your studio today.');
  out = out.split('>Reserve your spot</a>').join('>Get started</a>');

  // Hero eyebrow tag.
  out = out.replace('<span class="hero-tag">Launching August 1</span>',
    '<span class="hero-tag">Now live for artists</span>');

  // Replace both waitlist signup forms with sign-up call-to-action buttons.
  // Both the hero and the final CTA sit on light (cream) backgrounds, so the
  // secondary button is a ghost outline — btn-light would be cream-on-cream and
  // effectively invisible.
  // "Start your studio" scrolls down to the pricing options; "Sign in" goes to
  // the login form. (The pricing "Get started" buttons are what open sign-up.)
  out = out.replace(/<form class="signup"[\s\S]*?<\/form>/g,
    '<div class="signup">' +
    '<a class="btn btn-solid" href="#pricing" data-open-picker>Start your studio</a>' +
    '<a class="btn btn-ghost" href="/login" style="margin-left:8px">Sign in</a>' +
    '</div>');

  // Final CTA section copy.
  out = out.replace('<span class="eyebrow">Launching August 1, 2026</span>',
    '<span class="eyebrow">Allegory Art Studio</span>');
  out = out.replace('Get first access and be among the first artists in when we open on August 1.',
    'Start managing your studio today — set up in minutes.');

  // Footer micro line.
  out = out.split('<div class="micro">Launching August 1</div>')
    .join('<div class="micro">Now live</div>');

  // FAQ: swap the "when do you launch" question for a getting-started one.
  out = out.replace(
    /<details open><summary>When does Allegory Art Studio launch\?[\s\S]*?<\/details>/,
    '<details open><summary>How do I get started? <span class="pl">+</span></summary>' +
    '<div class="ans">Create your account, choose a plan, and you\'re in — most artists are set up in a few minutes. ' +
    'Have a discount code? Add it at checkout.</div></details>'
  );

  return out;
}

/** Post-launch, keep the FAQPage JSON-LD in index.html's <head> matching the
 *  visible FAQ (the "when do you launch" Q/A becomes a getting-started Q/A). */
export function toLiveIndexHead(html: string): string {
  return html
    .replace('"name": "When does Allegory Art Studio launch?"', '"name": "How do I get started?"')
    .replace(
      '"text": "We launch publicly on August 1, 2026. Get first access now and we\'ll let you know the moment we go live."',
      '"text": "Create your account, choose a plan, and you\'re in — most artists are set up in a few minutes. Have a discount code? Add it at checkout."'
    );
}
