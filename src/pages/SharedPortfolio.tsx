import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fmtMoney } from "@/lib/store";
import { loadSharedPortfolio, type SharedPortfolioData } from "@/lib/sharePortfolio";

/** Public, read-only "available works" portfolio shown at /p/:slug. No auth —
 *  reads a snapshot the artist published from their inventory. */
const SharedPortfolio = () => {
  const { slug = "" } = useParams();
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [data, setData] = useState<SharedPortfolioData | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const d = await loadSharedPortfolio(slug);
      if (!active) return;
      if (!d) { setState("missing"); return; }
      setData(d);
      setState("ready");
      document.title = `${d.artistName ? d.artistName + " — " : ""}${d.title}`;
    })();
    return () => { active = false; };
  }, [slug]);

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-6 w-6 rounded-full border-2 border-muted border-t-foreground animate-spin" aria-label="Loading" />
      </div>
    );
  }

  if (state === "missing" || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-6">
        <div className="font-display text-2xl mb-2">Portfolio not found</div>
        <p className="text-sm text-muted-foreground mb-6">This link may have expired or been replaced.</p>
        <a href="https://allegoryartstudio.com" className="eyebrow text-muted-foreground hover:text-foreground">
          allegory art studio
        </a>
      </div>
    );
  }

  const works = data.works;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="max-w-5xl mx-auto px-6 pt-16 pb-10 text-center">
        <div className="eyebrow text-muted-foreground mb-6">allegory</div>
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight leading-tight">
          {data.artistName || data.title}
        </h1>
        <div className="mx-auto my-5 h-px w-12 bg-accent/60" />
        <div className="font-display italic text-xl sm:text-2xl text-accent">{data.title}</div>
        <div className="eyebrow text-muted-foreground mt-4">
          {works.length} {works.length === 1 ? "work" : "works"}
        </div>
        {data.contact && (
          <a
            href={`mailto:${data.contact}?subject=${encodeURIComponent("Inquiry — " + data.title)}`}
            className="inline-block mt-6 text-sm rounded-sm border border-foreground/20 px-5 py-2 hover:bg-foreground hover:text-background transition-colors"
          >
            Inquire about a work
          </a>
        )}
      </header>

      {/* Gallery — each work as a row: image on the left, details beside it. */}
      <main className="max-w-4xl mx-auto px-6 pb-20">
        <div className="divide-y divide-border border-t border-border">
          {works.map((w, i) => (
            <figure key={i} className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 py-10">
              <div className="w-full sm:w-[46%] shrink-0 flex items-center justify-center">
                {w.imageUrl ? (
                  <img src={w.imageUrl} alt={w.title} className="max-w-full max-h-[60vh] object-contain" loading="lazy" />
                ) : (
                  <div className="aspect-[4/5] w-full flex items-center justify-center bg-foreground/[0.03] border border-border">
                    <span className="font-display italic text-sm text-muted-foreground">Image on request</span>
                  </div>
                )}
              </div>
              <figcaption className="w-full sm:flex-1 text-center sm:text-left">
                <div className="font-display italic text-2xl leading-snug">{w.title || "Untitled"}</div>
                <div className="text-sm text-muted-foreground mt-2">
                  {[w.year, w.medium, w.dimensions, w.edition ? `Edition ${w.edition}` : ""]
                    .filter(Boolean)
                    .join("  ·  ")}
                </div>
                {typeof w.price === "number" && (
                  <div className="font-display text-2xl text-accent mt-4">{fmtMoney(w.price)}</div>
                )}
                <div className="mt-3">
                  <span className="eyebrow text-[9px] text-accent border border-accent/50 rounded-sm px-2 py-1">
                    {w.statusLabel}
                  </span>
                </div>
                {w.location && (
                  <div className="text-[11px] italic text-muted-foreground mt-2">{w.location}</div>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </main>

      {/* Footer — the "Made with Allegory" hook */}
      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="eyebrow text-muted-foreground">
            Made with <span className="text-foreground">Allegory Art Studio</span>
          </div>
          <Link
            to="/"
            className="text-sm rounded-sm bg-foreground text-background px-5 py-2 hover:opacity-90 transition-opacity"
          >
            Create your own studio →
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default SharedPortfolio;
