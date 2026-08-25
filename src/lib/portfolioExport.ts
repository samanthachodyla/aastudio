// Portfolio export — turns selected inventory into a polished, on-brand PDF that
// an artist can hand to a collector, gallery, or store as an "available works"
// presentation. No dependencies: we render a self-contained, print-optimized HTML
// document into a new window and trigger the browser's Save-as-PDF. Because
// artwork images are stored as data URLs, they embed directly with no network
// round-trip, so the PDF is fully offline and pixel-faithful.
import { fmtMoney } from "@/lib/store";
import type { Artwork, ArtworkStatus } from "@/lib/types";

export interface PortfolioOptions {
  artworks: Artwork[];
  artistName: string;
  /** Optional logo/wordmark data URL (reuses the invoice logo). */
  logo?: string;
  /** Contact line shown on the cover — usually the artist's email. */
  contact?: string;
  /** Cover title, e.g. "Available Works". */
  title?: string;
  showPrices: boolean;
  showLocation: boolean;
  /** Maps a status value to a human label (covers custom statuses too). */
  statusLabels: Record<string, string>;
}

const BRAND = {
  cream: "hsl(42 24% 96%)",
  paper: "hsl(42 30% 99%)",
  ink: "hsl(150 30% 10%)",
  forest: "hsl(150 45% 12%)",
  sage: "hsl(145 30% 24%)",
  hair: "hsl(150 12% 82%)",
  muted: "hsl(150 12% 38%)",
};

/** Escape user-entered text so it can't break the generated markup. */
function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function titleize(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusLabel(status: ArtworkStatus, labels: Record<string, string>): string {
  return labels[status] ?? titleize(String(status));
}

/** One "plate" per work: image on top, elegant caption block beneath. */
function plate(a: Artwork, opts: PortfolioOptions): string {
  const details: string[] = [];
  if (a.year) details.push(esc(a.year));
  if (a.medium) details.push(esc(a.medium));
  if (a.dimensions) details.push(esc(a.dimensions));
  if (a.edition) details.push(`Edition ${esc(a.edition)}`);
  const metaLine = details.join("&nbsp;&nbsp;·&nbsp;&nbsp;");

  const img = a.imageUrl
    ? `<div class="plate-img"><img src="${esc(a.imageUrl)}" alt="${esc(a.title)}" /></div>`
    : `<div class="plate-img plate-img--empty"><span>Image available on request</span></div>`;

  const price = opts.showPrices && typeof a.price === "number" && a.price > 0
    ? `<div class="price">${esc(fmtMoney(a.price))}</div>`
    : "";

  const avail = `<span class="avail">${esc(statusLabel(a.status, opts.statusLabels))}</span>`;
  const loc = opts.showLocation && a.location
    ? `<span class="loc">${esc(a.location)}</span>`
    : "";

  // Running header on every page: the artist's own logo (their invoice logo) if
  // they have one, otherwise their name.
  const header = opts.logo
    ? `<img class="head-logo" src="${esc(opts.logo)}" alt="${esc(opts.artistName)}" />`
    : (opts.artistName ? `<span class="head-name">${esc(opts.artistName)}</span>` : "");

  return `
    <section class="plate">
      <div class="plate-head">${header}</div>
      ${img}
      <div class="caption">
        <h2 class="work-title">${esc(a.title) || "Untitled"}</h2>
        ${metaLine ? `<div class="work-meta">${metaLine}</div>` : ""}
        <div class="work-foot">
          ${price}
          <div class="tags">${avail}${loc}</div>
        </div>
      </div>
      <div class="plate-brand">Allegory Art Studio</div>
    </section>`;
}

function coverPage(opts: PortfolioOptions, count: number): string {
  // Top of the document: the artist's own logo (their invoice logo) if present.
  const logo = opts.logo ? `<img class="cover-logo" src="${esc(opts.logo)}" alt="${esc(opts.artistName)}" />` : "";
  const contact = opts.contact ? `<div class="cover-contact">${esc(opts.contact)}</div>` : "";
  const worksLabel = `${count} ${count === 1 ? "work" : "works"}`;
  return `
    <section class="cover">
      <div class="cover-main">
        ${logo}
        <div class="cover-artist">${esc(opts.artistName) || "Available Works"}</div>
        <div class="cover-rule"></div>
        <div class="cover-title">${esc(opts.title || "Available Works")}</div>
        <div class="cover-sub">${worksLabel}</div>
        ${contact}
      </div>
      <div class="cover-foot">Allegory Art Studio</div>
    </section>`;
}

export function buildPortfolioHtml(opts: PortfolioOptions): string {
  const plates = opts.artworks.map((a) => plate(a, opts)).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(opts.artistName || "Allegory")} — ${esc(opts.title || "Available Works")}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Work+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
<style>
  :root {
    --cream: ${BRAND.cream}; --paper: ${BRAND.paper}; --ink: ${BRAND.ink};
    --forest: ${BRAND.forest}; --sage: ${BRAND.sage}; --hair: ${BRAND.hair}; --muted: ${BRAND.muted};
  }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "Work Sans", system-ui, sans-serif;
    color: var(--ink); background: var(--cream);
    font-weight: 300; line-height: 1.5;
  }
  .display { font-family: "Cormorant Garamond", Georgia, serif; }

  /* ---- Cover ---- */
  .cover {
    height: 100vh; display: flex; flex-direction: column; text-align: center;
    padding: 0.9in 1in 0.55in; page-break-after: always;
  }
  .cover-main {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
  }
  .cover-logo { max-height: 96px; max-width: 300px; object-fit: contain; margin-bottom: 30px; }
  .cover-foot {
    text-transform: uppercase; letter-spacing: 0.24em; font-size: 9px;
    color: var(--muted); padding-top: 12px;
  }
  .cover-artist {
    font-family: "Cormorant Garamond", Georgia, serif; font-weight: 500;
    font-size: 52px; line-height: 1.05; letter-spacing: -0.01em; color: var(--ink);
  }
  .cover-rule { width: 46px; height: 1px; background: var(--sage); margin: 26px auto; opacity: 0.6; }
  .cover-title {
    font-family: "Cormorant Garamond", Georgia, serif; font-style: italic;
    font-size: 26px; color: var(--sage);
  }
  .cover-sub {
    text-transform: uppercase; letter-spacing: 0.28em; font-size: 10px;
    color: var(--muted); margin-top: 18px;
  }
  .cover-contact {
    margin-top: 42px; font-size: 12px; letter-spacing: 0.04em; color: var(--muted);
  }

  /* ---- Plate (one work per page) ---- */
  .plate {
    height: 100vh; display: flex; flex-direction: column;
    padding: 0.6in 0.85in 0.6in; page-break-after: always; position: relative;
  }
  .plate-head { text-align: center; margin-bottom: 14px; min-height: 18px; }
  .head-logo { max-height: 42px; max-width: 220px; object-fit: contain; }
  .head-name {
    font-family: "Cormorant Garamond", Georgia, serif; font-size: 15px;
    letter-spacing: 0.02em; color: var(--ink);
  }
  .plate-img {
    flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center;
    margin-bottom: 26px;
  }
  .plate-img img { max-width: 100%; max-height: 100%; object-fit: contain;
    box-shadow: 0 1px 0 var(--hair); }
  .plate-img--empty {
    border: 1px solid var(--hair); color: var(--muted); font-style: italic;
    font-family: "Cormorant Garamond", Georgia, serif; font-size: 18px;
  }
  .caption { border-top: 1px solid var(--hair); padding-top: 16px; break-inside: avoid; }
  .work-title {
    font-family: "Cormorant Garamond", Georgia, serif; font-style: italic; font-weight: 500;
    font-size: 26px; margin: 0 0 4px; color: var(--ink); line-height: 1.15;
  }
  .work-meta { font-size: 12.5px; color: var(--muted); letter-spacing: 0.01em; }
  .work-foot {
    display: flex; align-items: baseline; justify-content: space-between;
    margin-top: 12px; gap: 16px;
  }
  .price {
    font-family: "Cormorant Garamond", Georgia, serif; font-size: 22px;
    color: var(--forest); font-weight: 600;
  }
  .tags { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .avail {
    text-transform: uppercase; letter-spacing: 0.18em; font-size: 9px; font-weight: 500;
    color: var(--sage); border: 1px solid var(--sage); border-radius: 2px;
    padding: 4px 9px; white-space: nowrap;
  }
  .loc { font-size: 11px; color: var(--muted); font-style: italic; }
  .plate-brand {
    position: absolute; bottom: 0.42in; left: 0; right: 0; text-align: center;
    text-transform: uppercase; letter-spacing: 0.24em; font-size: 8px; color: var(--muted);
  }

  @page { size: letter; margin: 0; }
  @media print { body { background: var(--cream); } }
</style>
</head>
<body>
  ${coverPage(opts, opts.artworks.length)}
  ${plates}
  <script>
    (function () {
      function imagesReady() {
        var imgs = Array.prototype.slice.call(document.images);
        return Promise.all(imgs.map(function (img) {
          if (img.complete) return Promise.resolve();
          return new Promise(function (res) { img.onload = img.onerror = res; });
        }));
      }
      window.addEventListener("load", function () {
        imagesReady().then(function () {
          setTimeout(function () { window.focus(); window.print(); }, 300);
        });
      });
    })();
  </script>
</body>
</html>`;
}

/** Opens the branded portfolio in a new window and triggers Save-as-PDF.
 *  Returns false if the window was blocked (caller can surface a toast). */
export function exportPortfolioPdf(opts: PortfolioOptions): boolean {
  const html = buildPortfolioHtml(opts);
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
}
