// Turns the pre-launch waitlist landing markup into the live "sign up" homepage.
// Used at runtime (Landing.tsx) and at build time (vite prerender) so both agree.
//
// Launch is midnight Eastern on Aug 1, 2026 (04:00 UTC). Before that the waitlist
// page shows; from that moment the live homepage shows automatically.
export const LAUNCH_AT_MS = Date.UTC(2026, 7, 1, 4, 0, 0); // Aug 1 2026, 00:00 ET

export function isLaunched(nowMs: number = Date.now()): boolean {
  return nowMs >= LAUNCH_AT_MS;
}

/** Apply the pre-launch → live transforms to the landing HTML string. */
export function toLiveLanding(html: string): string {
  let out = html;

  // Announcement marquee: waitlist message → live message.
  out = out.split('Launching August 1st <span class="bar">|</span> Join the list &amp; get first access')
    .join('Now live <span class="bar">|</span> Start managing your studio today');

  // Every "first access" call-to-action anchor now points at sign-up.
  out = out.split('href="#signup"').join('href="/login"');
  out = out.split('>Get first access</a>').join('>Get started</a>');

  // Hero eyebrow tag.
  out = out.replace('<span class="hero-tag">Launching August 1</span>',
    '<span class="hero-tag">Now live for artists</span>');

  // Replace both waitlist signup forms with sign-up call-to-action buttons.
  out = out.replace(/<form class="signup"[\s\S]*?<\/form>/g,
    '<div class="signup">' +
    '<a class="btn btn-solid" href="/login">Start your studio</a>' +
    '<a class="btn btn-light" href="/login" style="margin-left:8px">Sign in</a>' +
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
