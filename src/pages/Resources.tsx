import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { CATS, GUIDES } from "@/lib/resourcesContent";
import "@/styles/resources.css";

const ARROW = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const verbFor = (kind: string) => {
  if (["Template", "Spreadsheet", "Document", "Worksheet"].includes(kind)) return "Explore";
  if (kind === "Checklist") return "Read the checklist";
  return "Read the guide";
};

/** Public Resource Library index (/resources). Each card links to a guide at its
 *  own URL, so every topic is separately crawlable and indexable. */
const Resources = () => {
  return (
    <div className="aas-res">
      <Seo
        title="Allegory Art Studio Resource Library"
        description="Practical, plain-language guides for the business of an art practice: pricing, galleries, consignment, applications, artist statements, CVs, taxes, and marketing. Written by an arts administrator, for working artists."
        canonicalPath="/resources"
      />

      <header className="mast">
        <div className="wrap">
          <Link to="/" className="brand" aria-label="Allegory Art Studio home">
            <img className="logo" src="/Allegory_Studio_Logo.png" alt="Allegory Art Studio" />
            <span className="tag">Resource Library</span>
          </Link>
          <span className="spacer" />
          <Link to="/#pricing" className="app">Start free trial →</Link>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="wrap">
            <div className="eyebrow">The Allegory Library</div>
            <h1>The business of your practice, <em>demystified.</em></h1>
            <p className="lead">
              Practical, plain-language guides for the parts of an art career no one teaches in the
              studio: pricing, galleries, applications, taxes, and keeping it all organized. Written
              by an arts administrator, for working artists.
            </p>
            <div className="swatches" aria-hidden="true">
              <span style={{ background: "#032419" }} /><span style={{ background: "#7a98d3" }} />
              <span style={{ background: "#e27a55" }} /><span style={{ background: "#cfc581" }} />
              <span style={{ background: "#e2ad44" }} /><span style={{ background: "#efd2c4" }} />
              <span style={{ background: "#522513" }} />
            </div>
          </div>
        </section>

        <nav className="catnav" aria-label="Resource categories">
          <div className="wrap">
            {CATS.map((c) => (
              <a key={c.id} href={`#cat-${c.id}`} style={{ ["--cat" as string]: c.color }}>
                <span className="dot" />{c.name}
              </a>
            ))}
          </div>
        </nav>

        <div className="wrap">
          {CATS.map((c) => (
            <section
              key={c.id}
              className="block"
              id={`cat-${c.id}`}
              style={{ ["--cat" as string]: c.color, ["--cat-ink" as string]: c.ink }}
            >
              <div className="sec-head">
                <h2>{c.name}</h2>
                <p>{c.blurb}</p>
              </div>
              <div className="grid">
                {GUIDES.filter((g) => g.cat === c.id).map((g) => (
                  <Link key={g.id} className="card" to={`/resources/${g.id}`}>
                    <span className="kind">{g.kind}</span>
                    <h3>{g.title}</h3>
                    <p>{g.dek}</p>
                    <span className="read">{verbFor(g.kind)} {ARROW}</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          <section className="cta">
            <div className="bar">
              <i style={{ background: "#7a98d3" }} /><i style={{ background: "#e27a55" }} />
              <i style={{ background: "#cfc581" }} /><i style={{ background: "#e2ad44" }} />
              <i style={{ background: "#efd2c4" }} /><i style={{ background: "#522513" }} />
            </div>
            <div className="eyebrow">Put it into practice</div>
            <h2>Stop juggling spreadsheets and sticky notes.</h2>
            <p>
              Allegory Art Studio keeps your inventory, sales, deadlines, materials, and contacts in
              one calm place, so you can spend less time on admin and more time making work.
            </p>
            <Link className="btn" to="/#pricing">Start your 7-day free trial</Link>
            <div className="sub">Card required · not charged until the trial ends · cancel anytime</div>
          </section>

          <footer>
            <span>© Allegory Studio, LLC</span>
            <span className="spacer" />
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Resources;
