import { Navigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { marketingPageHTML, marketingPageMeta } from "@/lib/marketingContent";
import "@/styles/marketing.css";

/**
 * A standalone marketing page (/features, /plans, /faq). The same HTML builder
 * backs both this route and the build-time prerender, so the client render and
 * the static file stay identical. The pages are static (links + native
 * <details>), so rendering the builder's HTML directly is all that's needed.
 */
export default function MarketingPage({ slug }: { slug: string }) {
  const html = marketingPageHTML(slug);
  const meta = marketingPageMeta(slug);
  if (!html || !meta) return <Navigate to="/" replace />;
  return (
    <>
      <Seo title={meta.title} description={meta.description} canonicalPath={`/${slug}`} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
