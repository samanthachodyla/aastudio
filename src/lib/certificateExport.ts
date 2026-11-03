// Certificate of Authenticity, per artwork. Renders a print-optimized, landscape
// certificate into a new window and triggers the browser's Save-as-PDF / Print,
// the same dependency-free approach as portfolioExport.ts. The layout mirrors the
// studio's Canva template: centered title, "ORIGINAL ARTWORK BY {ARTIST}", a
// thumbnail box on the left, TITLE / MEDIUM / DIMS / DATED on the right, and an
// artist signature + date line at the foot. Artwork images are data URLs, so they
// embed with no network round-trip.
import type { Artwork } from "@/lib/types";

export interface CertificateOptions {
  artwork: Artwork;
  artistName: string;
  /** Optional edition note, e.g. "Original, 1 of 1" or "2 / 25". */
  edition?: string;
  /** Optional date the certificate is issued (defaults to today). */
  issuedDate?: string;
}

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const INK = "#3a2e1f"; // warm brown ink, matching the template

export function printCertificate({ artwork, artistName, edition }: CertificateOptions): void {
  const title = esc(artwork.title || "Untitled");
  const medium = esc(artwork.medium || "");
  const dims = esc(artwork.dimensions || "");
  const dated = esc(artwork.year ? String(artwork.year) : "");
  const artist = esc(artistName || "The Artist");
  const ed = esc(edition || artwork.edition || "");
  const img = artwork.imageUrl;

  const thumb = img
    ? `<img class="thumb-img" src="${esc(img)}" alt="${title}" />`
    : `<span class="thumb-ph">{ARTWORK THUMBNAIL}</span>`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>Certificate of Authenticity, ${title}</title>
<style>
  @page { size: letter landscape; margin: 0; }
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&display=swap');
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: ${INK};
    font-family: "Cormorant Garamond", "Times New Roman", Georgia, serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet { width: 11in; min-height: 8.5in; margin: 0 auto; padding: 0.7in 0.8in; display: flex; flex-direction: column; }
  .head { text-align: center; }
  .head h1 { font-weight: 500; letter-spacing: .06em; font-size: 46px; margin: 0; text-transform: uppercase; }
  .head .by { font-weight: 500; letter-spacing: .16em; font-size: 21px; margin: 10px 0 0; text-transform: uppercase; }
  .head .artist { font-weight: 600; font-size: 40px; margin: 8px 0 0; }
  .body { display: flex; gap: 0.7in; align-items: stretch; margin-top: 0.55in; flex: 1; }
  .thumb { width: 2.9in; border: 1.5px solid ${INK}; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .thumb-img { width: 100%; height: 100%; object-fit: contain; }
  .thumb-ph { font-size: 17px; letter-spacing: .08em; color: #8a8276; text-transform: uppercase; }
  .fields { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 34px; }
  .row { display: flex; align-items: baseline; gap: 18px; }
  .row .lbl { font-weight: 600; font-size: 26px; letter-spacing: .04em; text-transform: uppercase; white-space: nowrap; }
  .row .val { flex: 1; font-size: 24px; border-bottom: 1.5px solid ${INK}; padding: 0 4px 6px; min-height: 30px; }
  .foot { display: flex; align-items: baseline; gap: 26px; margin-top: 0.5in; }
  .foot .sig { flex: 1; }
  .foot .lbl { font-weight: 600; font-size: 22px; letter-spacing: .04em; text-transform: uppercase; }
  .foot .line { border-bottom: 1.5px solid ${INK}; height: 26px; margin-top: 4px; }
  .foot .date { width: 2.6in; }
  .ed { text-align: center; font-size: 16px; letter-spacing: .08em; color: #6f6652; margin-top: 10px; text-transform: uppercase; }
  @media screen { body { background: #e9e6df; padding: 24px; } .sheet { background: #fff; box-shadow: 0 10px 40px rgba(0,0,0,.15); }
    .bar { max-width: 11in; margin: 0 auto 14px; display: flex; gap: 10px; justify-content: flex-end; font-family: system-ui, sans-serif; }
    .bar button { font-size: 13px; padding: 9px 16px; border-radius: 4px; border: 1px solid ${INK}; background: ${INK}; color: #fff; cursor: pointer; }
    .bar .ghost { background: #fff; color: ${INK}; } }
  @media print { .bar { display: none; } }
</style></head>
<body>
  <div class="bar">
    <button onclick="window.print()">Print / Save as PDF</button>
    <button class="ghost" onclick="window.close()">Close</button>
  </div>
  <div class="sheet">
    <div class="head">
      <h1>Certificate of Authenticity</h1>
      <div class="by">Original Artwork By</div>
      <div class="artist">${artist}</div>
    </div>
    <div class="body">
      <div class="thumb">${thumb}</div>
      <div class="fields">
        <div class="row"><span class="lbl">Title:</span><span class="val">${title}</span></div>
        <div class="row"><span class="lbl">Medium:</span><span class="val">${medium}</span></div>
        <div class="row"><span class="lbl">Dims:</span><span class="val">${dims}</span></div>
        <div class="row"><span class="lbl">Dated:</span><span class="val">${dated}</span></div>
      </div>
    </div>
    ${ed ? `<div class="ed">Edition: ${ed}</div>` : ""}
    <div class="foot">
      <div class="sig"><span class="lbl">Artist Signature:</span><div class="line"></div></div>
      <div class="date"><span class="lbl">Date</span><div class="line"></div></div>
    </div>
  </div>
  <script>window.focus();</script>
</body></html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}
