// Build-time prerender for the Resource Library. Produces static, fully-readable
// HTML for /resources and each guide so crawlers (and AI answer engines that do
// not run JavaScript) get the real content, titles, and canonical URLs — the
// same treatment the landing page gets. React re-renders #root on boot, so this
// markup only needs to be valid and styled, not byte-match the components.
import { CATS, GUIDES, catById, readMinutes, type ResGuide } from "./resourcesContent";

const esc = (s: string): string =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

const ARROW =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const BACK =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>';
const verbFor = (k: string): string =>
  ["Template", "Spreadsheet", "Document", "Worksheet"].includes(k) ? "Explore" : k === "Checklist" ? "Read the checklist" : "Read the guide";

const MAST =
  '<header class="mast"><div class="wrap">' +
  '<a class="brand" href="/" aria-label="Allegory Art Studio home">' +
  '<img class="logo" src="/Allegory_Studio_Logo.png" alt="Allegory Art Studio"/>' +
  '<span class="tag">Resource Library</span></a>' +
  '<span class="spacer"></span>' +
  '<a class="app" href="/#pricing">Start free trial →</a></div></header>';

export function libraryHTML(): string {
  const nav = CATS.map(
    (c) => `<a href="#cat-${c.id}" style="--cat:${c.color}"><span class="dot"></span>${esc(c.name)}</a>`,
  ).join("");
  const sections = CATS.map((c) => {
    const cards = GUIDES.filter((g) => g.cat === c.id)
      .map(
        (g) =>
          `<a class="card" href="/resources/${g.id}"><span class="kind">${esc(g.kind)}</span>` +
          `<h3>${esc(g.title)}</h3><p>${esc(g.dek)}</p>` +
          `<span class="read">${verbFor(g.kind)} ${ARROW}</span></a>`,
      )
      .join("");
    return (
      `<section class="block" id="cat-${c.id}" style="--cat:${c.color}; --cat-ink:${c.ink}">` +
      `<div class="sec-head"><h2>${esc(c.name)}</h2><p>${esc(c.blurb)}</p></div>` +
      `<div class="grid">${cards}</div></section>`
    );
  }).join("");
  return (
    '<div class="aas-res">' + MAST + "<main>" +
    '<section class="hero"><div class="wrap"><div class="eyebrow">The Allegory Library</div>' +
    "<h1>The business of your practice, <em>demystified.</em></h1>" +
    '<p class="lead">Practical, plain-language guides for the parts of an art career no one teaches in the studio: ' +
    "pricing, galleries, applications, taxes, and keeping it all organized. Written by an arts administrator, for working artists.</p>" +
    '<div class="swatches" aria-hidden="true"><span style="background:#032419"></span><span style="background:#7a98d3"></span>' +
    '<span style="background:#e27a55"></span><span style="background:#cfc581"></span><span style="background:#e2ad44"></span>' +
    '<span style="background:#efd2c4"></span><span style="background:#522513"></span></div></div></section>' +
    '<nav class="catnav" aria-label="Resource categories"><div class="wrap">' + nav + "</div></nav>" +
    '<div class="wrap">' + sections +
    '<section class="cta"><div class="bar"><i style="background:#7a98d3"></i><i style="background:#e27a55"></i>' +
    '<i style="background:#cfc581"></i><i style="background:#e2ad44"></i><i style="background:#efd2c4"></i><i style="background:#522513"></i></div>' +
    '<div class="eyebrow">Put it into practice</div><h2>Stop juggling spreadsheets and sticky notes.</h2>' +
    "<p>Allegory Art Studio keeps your inventory, sales, deadlines, materials, and contacts in one calm place, " +
    "so you can spend less time on admin and more time making work.</p>" +
    '<a class="btn" href="/#pricing">Start your 7-day free trial</a>' +
    '<div class="sub">Card required · not charged until the trial ends · cancel anytime</div></section>' +
    '<footer><span>© Allegory Studio, LLC</span><span class="spacer"></span>' +
    '<a href="/">Home</a><a href="/about">About</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a></footer>' +
    "</div></main></div>"
  );
}

export function guideHTML(g: ResGuide): string {
  const c = catById(g.cat);
  const style = `--cat:${c ? c.color : "#032419"}; --cat-ink:${c ? c.ink : "#f7f5ef"}`;
  return (
    `<div class="aas-res" style="${style}">` + MAST +
    '<article id="guide"><div class="read-wrap">' +
    `<a class="back" href="/resources">${BACK} All resources</a>` +
    `<span class="g-eyebrow">${esc(c ? c.name : "")}</span>` +
    `<h1 class="g-title">${esc(g.title)}</h1><div class="g-rule"></div>` +
    `<p class="g-dek">${esc(g.dek)}</p>` +
    `<div class="g-meta"><span>${esc(g.kind)}</span><span>·</span><span>${readMinutes(g.body)} min read</span></div>` +
    `<div class="g-body">${g.body}</div>` +
    '<div class="g-foot"><div class="g-cta"><p>Allegory Art Studio does this part for you, ' +
    '<a href="/#pricing">start a 7-day free trial →</a></p></div>' +
    `<div><a class="back" href="/resources">${BACK} All resources</a></div></div>` +
    "</div></article></div>"
  );
}

export interface PrerenderRoute {
  path: string;
  file: string;
  title: string;
  description: string;
  html: string;
}

export function resourceRoutes(): PrerenderRoute[] {
  const routes: PrerenderRoute[] = [
    {
      path: "/resources",
      file: "resources.html",
      title: "Allegory Art Studio Resource Library",
      description:
        "Practical, plain-language guides for the business of an art practice: pricing, galleries, consignment, applications, artist statements, CVs, taxes, and marketing. Written by an arts administrator, for working artists.",
      html: libraryHTML(),
    },
  ];
  for (const g of GUIDES) {
    routes.push({
      path: `/resources/${g.id}`,
      file: `resources/${g.id}.html`,
      title: `${g.title} | Allegory Art Studio Resource Library`,
      description: g.dek,
      html: guideHTML(g),
    });
  }
  return routes;
}
