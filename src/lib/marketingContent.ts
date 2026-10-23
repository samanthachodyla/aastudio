// Standalone marketing pages (/features, /plans, /faq). Each is its own real,
// indexable URL (own title + canonical) so Google indexes them and analytics
// tracks them separately, while the homepage keeps all its sections as a full
// overview. One HTML builder per page is the single source of truth: the React
// route renders it and the build-time prerender emits a static file from it, so
// the two never drift. Pages are static (links + native <details>), no JS needed.

export interface MarketingRoute {
  path: string;
  file: string;
  title: string;
  description: string;
  html: string;
}

const CHECK =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';

const MAST =
  '<header class="mast"><div class="wrap">' +
  '<a class="brand" href="/" aria-label="Allegory Art Studio home">' +
  '<img class="logo" src="/Allegory_Studio_Logo.png" alt="Allegory Art Studio"/></a>' +
  '<nav aria-label="Primary"><a href="/features">Features</a><a href="/plans">Plans</a><a href="/faq">FAQ</a><a href="/resources">Resources</a></nav>' +
  '<span class="spacer"></span>' +
  '<a class="app" href="/#pricing">Start free trial →</a></div></header>';

const FOOTER =
  '<footer><span>© Allegory Studio, LLC</span><span class="spacer"></span>' +
  '<a href="/">Home</a><a href="/features">Features</a><a href="/plans">Plans</a>' +
  '<a href="/faq">FAQ</a><a href="/about">About</a><a href="/resources">Resources</a></footer>';

const ctaBlock = (heading: string, body: string): string =>
  '<section class="cta"><h2>' + heading + "</h2><p>" + body + "</p>" +
  '<a class="btn" href="/#pricing">Start your 7-day free trial</a>' +
  '<div class="sub">Card required · not charged until the trial ends · cancel anytime</div></section>';

const page = (inner: string): string => '<div class="aas-mkt">' + MAST + "<main>" + inner + "</main>" + "</div>";

// ---- Features ----
interface Feat { ic: string; h: string; p: string; }
const CORE_FEATURES: Feat[] = [
  { ic: '<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>', h: "Inventory Manager", p: "Art inventory software that tracks every artwork from studio to sold." },
  { ic: '<path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>', h: "Sales &amp; Finance", p: "Make invoices, track expenses, and see a live profit-and-loss at a glance." },
  { ic: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>', h: "Deadlines &amp; Opportunities", p: "Commissions, open calls, grants and more, tracked with reminders." },
  { ic: '<path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/>', h: "Contacts", p: "A light CRM to keep track of collectors, galleries, and curators." },
  { ic: '<path d="M5 3h10l4 4v14H5z"/><path d="M15 3v4h4"/><path d="M9 13h6M9 17h6"/>', h: "Commissions", p: "Keep tabs on commissioned artwork, agreements, and payments." },
  { ic: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>', h: "Daily Check-In", p: "A morning brief that prioritizes the admin worth doing across your studio." },
];
const PRO_FEATURES: Feat[] = [
  { ic: '<path d="M4 4h16v12H4z"/><path d="M2 20h20M8 16v4M16 16v4"/>', h: "Profile Vault", p: "Save tailored bios, statements, and images, ready to send out." },
  { ic: '<path d="M4 4h16v16H4z"/><path d="M22 6l-10 7L2 6"/>', h: "Communications Hub", p: "Flag the emails and DMs that need a reply so you never miss a lead." },
  { ic: '<path d="M3 11l18-8-8 18-2-8-8-2z"/>', h: "Marketing Assistant", p: "Content ideas, scheduled posts, and social trend insight." },
  { ic: '<path d="M12 2a7 7 0 00-7 7c0 3 2 4 2 7h10c0-3 2-4 2-7a7 7 0 00-7-7z"/><path d="M9 21h6"/>', h: "Your Studio Manager", p: "A direct line to a real arts administrator to bounce ideas off. No question too small." },
];
const featCard = (f: Feat): string =>
  '<div class="feat"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor">' + f.ic +
  '</svg></div><h3>' + f.h + "</h3><p>" + f.p + "</p></div>";

function featuresHTML(): string {
  return page(
    '<section class="hero"><div class="wrap"><div class="eyebrow">Everything in one place</div>' +
    "<h1>Every part of your practice, <em>in one calm place.</em></h1>" +
    '<p class="lead">Allegory Art Studio is a studio management platform built by an arts administrator, for working artists. ' +
    "Streamline the business behind the scenes so you can do what you do best: create.</p>" +
    '<div class="accent"></div></div></section>' +
    '<section class="block"><div class="wrap">' +
    '<div class="group-label">Included for every artist</div>' +
    '<div class="feat-grid">' + CORE_FEATURES.map(featCard).join("") + "</div>" +
    '<div class="group-label">With Studio Pro</div>' +
    '<div class="feat-grid">' + PRO_FEATURES.map(featCard).join("") + "</div>" +
    "</div></section>" +
    '<div class="wrap">' + ctaBlock("Ready to bring it all together?", "Start your free trial and set up your studio in a few minutes.") + "</div>" +
    FOOTER,
  );
}

// ---- Plans ----
const STARTER_FEATURES = [
  "Inventory Manager", "Sales &amp; Finance", "Deadline &amp; Opportunity Tracker",
  "Contacts &amp; a light CRM", "Finance Dashboard", "Daily Check-In dashboard",
  "Profile Vault, lite version", "Cancel anytime, no commitment",
];
const PRO_PLAN_FEATURES = [
  "Everything in Studio Starter", "Profile Vault, full version", "Communications Hub",
  "Marketing Assistant", "Smart pricing tool", "Tailored statements for every opportunity",
  "Personalized opportunity discovery", "Direct access to a real arts administrator",
];
const CMP_ROWS: [string, string, string][] = [
  ["Inventory, sales, deadlines &amp; contacts", "yes", "yes"],
  ["Commission tracking &amp; reminders", "yes", "yes"],
  ["Daily Check-In dashboard", "yes", "yes"],
  ["Profile Vault", "1 of each", "Unlimited &amp; tailored"],
  ["Commission agreements &amp; statements", "no", "yes"],
  ["Communications Hub", "no", "yes"],
  ["Marketing Assistant", "no", "yes"],
  ["Smart pricing &amp; opportunity discovery", "no", "yes"],
  ["Direct access to a real arts administrator", "no", "yes"],
];
const cmpCell = (v: string): string =>
  v === "yes" ? '<td class="yes">✓</td>' : v === "no" ? '<td class="muted">—</td>' : "<td>" + v + "</td>";
const planList = (items: string[]): string =>
  "<ul>" + items.map((t) => "<li>" + CHECK + "<span>" + t + "</span></li>").join("") + "</ul>";

function plansHTML(): string {
  return page(
    '<section class="hero"><div class="wrap"><div class="eyebrow">Plans &amp; pricing</div>' +
    "<h1>Built for working artists.</h1>" +
    '<p class="lead">Two simple plans, month-to-month or annual (save 20%). Every plan starts with a 7-day free trial, ' +
    "and you can cancel anytime.</p><div class=\"accent\"></div></div></section>" +
    '<section class="block"><div class="wrap"><div class="price-grid">' +
    // Starter
    '<div class="plan"><div class="pname">Studio Starter</div>' +
    '<div class="amt"><b>$25</b> / month</div><div class="annual">or $240 billed annually, save $60</div>' +
    '<p class="desc">Get organized and take control of your practice.</p>' + planList(STARTER_FEATURES) +
    '<a class="btn btn-ghost" href="/#pricing">Start with Starter</a></div>' +
    // Pro
    '<div class="plan pro"><span class="badge">Most popular</span><div class="pname">Studio Pro</div>' +
    '<div class="amt"><b>$55</b> / month</div><div class="annual">or $528 billed annually, save $132</div>' +
    '<div class="save">A part-time studio manager runs <b>$500–$1,000+/mo</b>. Pro gives you one for $55.</div>' +
    '<p class="desc">Your practice, supported by someone who understands it.</p>' + planList(PRO_PLAN_FEATURES) +
    '<a class="btn btn-solid" href="/#pricing">Start with Pro</a></div>' +
    "</div>" +
    '<div class="cmp-wrap"><table class="cmp"><thead><tr><th>Feature</th><th>Starter</th><th>Pro</th></tr></thead><tbody>' +
    CMP_ROWS.map((r) => "<tr><td>" + r[0] + "</td>" + cmpCell(r[1]) + cmpCell(r[2]) + "</tr>").join("") +
    "</tbody></table></div>" +
    "</div></section>" +
    '<div class="wrap">' + ctaBlock("Try it free for 7 days.", "Pick a plan and set up your studio in minutes. You are not charged until the trial ends.") + "</div>" +
    FOOTER,
  );
}

// ---- FAQ (post-launch / live wording) ----
const FAQS: [string, string][] = [
  ["How do I get started?", "Create your account, choose a plan, and you're in, most artists are set up in a few minutes. Have a discount code? Add it at checkout."],
  ["What's the difference between Starter and Pro?", "Starter gives you the core studio: inventory, sales &amp; finance, deadlines, contacts, and the daily dashboard. Pro adds the full Profile Vault, Communications Hub, Marketing Assistant, smart pricing and opportunity discovery, plus direct access to a working arts administrator."],
  ["Who is Allegory Art Studio for?", "Working and emerging artists who are managing the business of their practice, inventory, sales, commissions, exhibitions, and outreach, and want one calm place to do it. If you're thinking about hiring a studio manager but don't have the budget for one, start with Allegory Art Studio to help offload the admin burden."],
  ["Can I cancel anytime?", "Absolutely. Plans are month-to-month (or annual if you prefer the savings). Cancel anytime, no questions asked."],
  ["Is my data private and secure?", "Your studio data is yours. It's stored securely and never sold. You can export or delete it whenever you like."],
  ["How much does Allegory Art Studio cost?", "Studio Starter is $25 per month or $240 per year. Studio Pro is $55 per month or $528 per year. Plans are month-to-month or annual, and you can cancel anytime."],
  ["Is there a free trial?", "Yes, every plan starts with a 7-day free trial. You pick a plan and enter your card to begin, but you're not charged until the trial ends. Cancel anytime before then and you won't be billed. After the trial your plan continues month-to-month or annually, and you can cancel whenever you like."],
];

function faqHTML(): string {
  const items = FAQS.map(
    ([q, a], i) =>
      "<details" + (i === 0 ? " open" : "") + '><summary>' + q + ' <span class="pl" aria-hidden="true">+</span></summary>' +
      '<div class="ans">' + a + "</div></details>",
  ).join("");
  return page(
    '<section class="hero"><div class="wrap narrow"><div class="eyebrow">Questions</div>' +
    "<h1>Frequently asked questions.</h1>" +
    '<p class="lead">Everything you might want to know before you start. Still curious? Reach us at ' +
    '<a href="mailto:hello@allegoryartstudio.com" style="text-decoration:underline">hello@allegoryartstudio.com</a>.</p>' +
    '<div class="accent"></div></div></section>' +
    '<section class="block"><div class="wrap narrow"><div class="faq">' + items + "</div></div></section>" +
    '<div class="wrap">' + ctaBlock("Still have questions?", "The best way to see if it fits is to try it. Every plan starts with a free 7-day trial.") + "</div>" +
    FOOTER,
  );
}

const PAGES: Record<string, { html: () => string; title: string; description: string }> = {
  features: {
    html: featuresHTML,
    title: "Features | Allegory Art Studio",
    description: "Everything Allegory Art Studio does for working artists: art inventory, sales and finance, deadlines and opportunities, contacts, commissions, the Profile Vault, marketing, and a real arts administrator on Pro.",
  },
  plans: {
    html: plansHTML,
    title: "Plans & Pricing | Allegory Art Studio",
    description: "Simple pricing for working artists. Studio Starter is $25/month and Studio Pro is $55/month, month-to-month or annual, each with a 7-day free trial. Compare plans.",
  },
  faq: {
    html: faqHTML,
    title: "FAQ | Allegory Art Studio",
    description: "Common questions about Allegory Art Studio: getting started, Starter vs Pro, pricing, the free trial, who it's for, and how your data is kept private.",
  },
};

export const MARKETING_SLUGS = Object.keys(PAGES);

export function marketingPageHTML(slug: string): string | null {
  return PAGES[slug] ? PAGES[slug].html() : null;
}

export function marketingPageMeta(slug: string): { title: string; description: string } | null {
  const p = PAGES[slug];
  return p ? { title: p.title, description: p.description } : null;
}

export function marketingRoutes(): MarketingRoute[] {
  return MARKETING_SLUGS.map((slug) => ({
    path: `/${slug}`,
    file: `${slug}/index.html`,
    title: PAGES[slug].title,
    description: PAGES[slug].description,
    html: PAGES[slug].html(),
  }));
}
