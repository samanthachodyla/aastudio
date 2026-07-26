import { useEffect } from "react";

/**
 * Per-route SEO for this single-page app. Sets <title>, meta description, the
 * canonical link, and (optionally) a noindex robots tag while a page is mounted,
 * then restores the site defaults on unmount so values never leak across routes.
 *
 * This is a lightweight, dependency-free stand-in for react-helmet — enough for
 * a marketing site whose one indexable page is the landing page.
 */
const SITE = "https://allegoryartstudio.com";
const DEFAULT_TITLE = "Allegory Studio — CRM for Artists & Studio Management Software";
const DEFAULT_DESCRIPTION =
  "Allegory Studio is the CRM for artists and studio management software for working artists — art inventory software, sales, consignments, exhibitions, and outreach, running quietly in the background.";

interface SeoProps {
  title?: string;
  description?: string;
  /** Path only, e.g. "/" or "/terms". Defaults to "/". */
  canonicalPath?: string;
  /** When true, adds <meta name="robots" content="noindex,nofollow">. */
  noindex?: boolean;
}

function setMetaByName(name: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function Seo({ title, description, canonicalPath = "/", noindex }: SeoProps) {
  useEffect(() => {
    document.title = title ?? DEFAULT_TITLE;
    setMetaByName("description", description ?? DEFAULT_DESCRIPTION);
    setCanonical(SITE + canonicalPath);
    setMetaByName("robots", noindex ? "noindex,nofollow" : "index,follow");

    return () => {
      // Restore site defaults so the next route starts clean.
      document.title = DEFAULT_TITLE;
      setMetaByName("description", DEFAULT_DESCRIPTION);
      setCanonical(SITE + "/");
      setMetaByName("robots", "index,follow");
    };
  }, [title, description, canonicalPath, noindex]);

  return null;
}
