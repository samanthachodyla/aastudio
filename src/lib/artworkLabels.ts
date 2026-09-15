// Printable artwork labels — gallery/exhibition wall labels or inventory tags for
// selected works. Renders a self-contained, print-optimized HTML sheet into a new
// window and triggers Save-as-PDF, exactly like the portfolio export. Images are
// data URLs so everything embeds with no network round-trip.
import { fmtMoney } from "@/lib/store";
import type { Artwork } from "@/lib/types";

export interface LabelOptions {
  artworks: Artwork[];
  artistName: string;
  showPrices: boolean;
  /** 2 (larger) or 3 (more per page) labels across. */
  perRow?: number;
}

const BRAND = {
  ink: "hsl(150 30% 10%)",
  sage: "hsl(145 30% 24%)",
  hair: "hsl(150 12% 82%)",
  muted: "hsl(150 12% 38%)",
};

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function labelCard(a: Artwork, opts: LabelOptions): string {
  const meta: string[] = [];
  if (a.medium) meta.push(esc(a.medium));
  if (a.dimensions) meta.push(esc(a.dimensions));
  if (a.edition) meta.push(`Edition ${esc(a.edition)}`);
  const price = opts.showPrices && typeof a.price === "number" && a.price > 0
    ? `<div class="price">${esc(fmtMoney(a.price))}</div>` : "";
  return `
    <div class="label">
      ${opts.artistName ? `<div class="artist">${esc(opts.artistName)}</div>` : ""}
      <div class="title"><em>${esc(a.title) || "Untitled"}</em>${a.year ? `, ${esc(a.year)}` : ""}</div>
      ${meta.length ? `<div class="meta">${meta.join("<br/>")}</div>` : ""}
      ${price}
    </div>`;
}

export function buildLabelsHtml(opts: LabelOptions): string {
  const perRow = opts.perRow === 3 ? 3 : 2;
  const cards = opts.artworks.map((a) => labelCard(a, opts)).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(opts.artistName || "Allegory")} — Labels</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Work+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
<style>
  :root { --ink:${BRAND.ink}; --sage:${BRAND.sage}; --hair:${BRAND.hair}; --muted:${BRAND.muted}; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; }
  body { font-family: "Work Sans", system-ui, sans-serif; color: var(--ink); font-weight: 300; }
  .sheet {
    display: grid; grid-template-columns: repeat(${perRow}, 1fr);
    gap: 0.25in; padding: 0.5in;
  }
  .label {
    border: 1px solid var(--hair); border-radius: 2px; padding: 0.28in 0.3in;
    break-inside: avoid; min-height: 1.7in; display: flex; flex-direction: column; justify-content: center;
  }
  .artist {
    font-size: 8.5px; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--muted); margin-bottom: 8px;
  }
  .title {
    font-family: "Cormorant Garamond", Georgia, serif; font-size: 18px;
    line-height: 1.2; color: var(--ink); margin-bottom: 6px;
  }
  .title em { font-style: italic; }
  .meta { font-size: 11.5px; color: var(--muted); line-height: 1.5; }
  .price {
    font-family: "Cormorant Garamond", Georgia, serif; font-size: 15px;
    color: var(--sage); font-weight: 500; margin-top: 8px;
  }
  @page { size: letter; margin: 0; }
</style>
</head>
<body>
  <div class="sheet">${cards}</div>
  <script>
    (function () {
      function ready() {
        var imgs = Array.prototype.slice.call(document.images);
        return Promise.all(imgs.map(function (i) { return i.complete ? Promise.resolve() : new Promise(function (r) { i.onload = i.onerror = r; }); }));
      }
      window.addEventListener("load", function () { ready().then(function () { setTimeout(function () { window.focus(); window.print(); }, 250); }); });
    })();
  </script>
</body>
</html>`;
}

/** Open the labels sheet in a new window and trigger the print dialog.
 *  Returns false if the pop-up was blocked. */
export function exportArtworkLabels(opts: LabelOptions): boolean {
  const html = buildLabelsHtml(opts);
  const w = window.open("", "_blank", "width=800,height=1000");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  return true;
}
