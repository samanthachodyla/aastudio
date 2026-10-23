import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { catById, guideBySlug, readMinutes } from "@/lib/resourcesContent";
import "@/styles/resources.css";

/** A single resource guide at its own URL (/resources/<slug>). Separately
 *  indexable, with per-page title/description/canonical for SEO. */
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

  return (
    <div className="aas-res" style={{ ["--cat" as string]: catColor, ["--cat-ink" as string]: catInk }}>
      <Seo
        title={`${guide.title} | Allegory Art Studio Resource Library`}
        description={guide.dek}
        canonicalPath={`/resources/${guide.id}`}
      />

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
          <p className="g-dek">{guide.dek}</p>
          <div className="g-meta">
            <span>{guide.kind}</span><span>·</span><span>{readMinutes(guide.body)} min read</span>
          </div>

          <div className="g-body" dangerouslySetInnerHTML={{ __html: guide.body }} />

          <div className="g-foot">
            <div className="g-cta">
              <p>
                Allegory Art Studio does this part for you,{" "}
                <Link to="/#pricing">start a 7-day free trial →</Link>
              </p>
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
