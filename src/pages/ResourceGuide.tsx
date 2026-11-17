import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Seo } from "@/components/Seo";
import {
  catById, guideBySlug, readMinutes, guideTitleTag, guideDescription,
  guideKeepReading, guideJsonLd, RESOURCE_AUTHOR,
} from "@/lib/resourcesContent";
import "@/styles/resources.css";

const fmtUpdated = (iso: string): string => {
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return iso;
  }
};

/** A single resource guide at its own URL (/resources/<slug>). Separately
 *  indexable, with per-page title/description/canonical, a byline, an FAQ and
 *  Article/FAQPage/BreadcrumbList structured data for SEO + AI answer engines. */
const ResourceGuide = () => {
  const { slug = "" } = useParams();
  const guide = guideBySlug(slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Unknown slug: send back to the library rather than show an empty page.
  if (!guide) return <Navigate to="/resources" replace />;

  const cat = catById(guide.cat);
  const catColor = cat ? cat.color : "#032419";
  const catInk = cat ? cat.ink : "#f7f5ef";
  const keepReading = guideKeepReading(guide);

  return (
    <div className="aas-res" style={{ ["--cat" as string]: catColor, ["--cat-ink" as string]: catInk }}>
      <Seo
        title={guideTitleTag(guide)}
        description={guideDescription(guide)}
        canonicalPath={`/resources/${guide.id}`}
      />
      {guideJsonLd(guide).map((block, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }} />
      ))}

      <header className="mast">
        <div className="wrap">
          <Link to="/" className="brand" aria-label="Allegory Art Studio home">
            <img className="logo" src="/Allegory_Studio_Logo.png" alt="Allegory Art Studio" />
            <span className="tag">Resource Library</span>
          </Link>
          <nav className="mast-nav" aria-label="Primary">
            <Link to="/">Home</Link>
            <Link to="/features">Features</Link>
            <Link to="/plans">Plans</Link>
            <Link to="/faq">FAQ</Link>
          </nav>
          <span className="spacer" />
          <Link to="/#pricing" className="app">Start free trial →</Link>
        </div>
      </header>

      <article id="guide">
        <div className="read-wrap">
          <Link to="/resources" className="back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            All resources
          </Link>

          <span className="g-eyebrow">{cat?.name}</span>
          <h1 className="g-title">{guide.title}</h1>
          <div className="g-rule" />

          <div className="g-byline">
            By <Link to={RESOURCE_AUTHOR.url}>{RESOURCE_AUTHOR.name}</Link>, {RESOURCE_AUTHOR.role}
            <span className="sep">·</span>
            <a href={RESOURCE_AUTHOR.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
            {guide.updated && <><span className="sep">·</span>Updated {fmtUpdated(guide.updated)}</>}
            <span className="sep">·</span>{readMinutes(guide.body)} min read
          </div>

          {guide.shortAnswer
            ? <p className="g-answer">{guide.shortAnswer}</p>
            : <p className="g-dek">{guide.dek}</p>}

          <div className="g-body" dangerouslySetInnerHTML={{ __html: guide.body }} />

          {guide.faqs && guide.faqs.length > 0 && (
            <section className="g-faq">
              <h2>Frequently asked questions</h2>
              {guide.faqs.map((f, i) => (
                <div className="g-faq-item" key={i}>
                  <h3>{f.q}</h3>
                  <p>{f.a}</p>
                </div>
              ))}
            </section>
          )}

          {guide.disclaimer && <p className="g-disclaimer">{guide.disclaimer}</p>}

          <div className="g-foot">
            <div className="g-cta">
              <p>
                {guide.cta || "Allegory Art Studio does this part for you."}{" "}
                <Link to="/#pricing">Start your 7-day free trial →</Link>
              </p>
            </div>
            <div className="g-related">
              <div className="g-related-label">Keep reading</div>
              <ul>
                {keepReading.map((r, i) => (
                  <li key={i}>
                    {r.href.startsWith("/")
                      ? <Link to={r.href}>{r.title}</Link>
                      : <a href={r.href} target="_blank" rel="noopener noreferrer">{r.title}</a>}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Link to="/resources" className="back">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path d="M19 12H5M11 18l-6-6 6-6" />
                </svg>
                All resources
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

export default ResourceGuide;
