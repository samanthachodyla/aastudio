import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "node:fs";
import { componentTagger } from "lovable-tagger";
import { isLaunched, toLiveLanding, toLiveIndexHead } from "./src/lib/landingLive";
import { resourceRoutes } from "./src/lib/resourcesPrerender";
import { marketingRoutes } from "./src/lib/marketingContent";

// Shared guard: strips the prerendered #prerender block before React boots on any
// route it doesn't belong to, so no page flashes another route's content.
const PRERENDER_GUARD =
  '<script>(function(){var p=location.pathname;' +
  'if(p!=="/"&&p!=="/index.html"){var el=document.getElementById("prerender");' +
  'if(el&&el.parentNode)el.parentNode.removeChild(el);}})();</script>';

// Build-time prerender for the marketing landing page.
//
// The landing markup is a self-contained static block (src/pages/landing.html).
// We inject it into #root of the built index.html so crawlers and the first
// paint get the real content (H1, FAQ, features) without waiting on JavaScript —
// the biggest SEO win for a client-rendered SPA. A tiny inline guard removes the
// prerendered block on any non-home route before React boots, so app routes
// never flash landing content. On "/", React re-renders the identical markup.
function prerenderLanding(): Plugin {
  return {
    name: "prerender-landing",
    apply: "build",
    transformIndexHtml(html) {
      const landingPath = path.resolve(__dirname, "src/pages/landing.html");
      let landing = "";
      try {
        landing = fs.readFileSync(landingPath, "utf8");
      } catch {
        return html; // if it can't be read, ship the normal SPA shell
      }
      // Post-launch builds prerender the live homepage; earlier builds, the waitlist.
      if (isLaunched()) {
        landing = toLiveLanding(landing);
        html = toLiveIndexHead(html); // keep the FAQ schema in sync
      }
      const block = '<div id="prerender">' + landing + "</div>" + PRERENDER_GUARD;
      return html.replace('<div id="root"></div>', '<div id="root">' + block + "</div>");
    },
  };
}

// Shared build-time page prerenderer. Takes the built index.html as a base and,
// for each route, emits a static HTML file with the route's real content in
// #root, a route-specific title/description/canonical, and the given stylesheet
// inlined, so each page is fully readable by crawlers and AI answer engines
// without JavaScript. React re-renders #root on boot, exactly like the landing
// page. Used for both the Resource Library and the standalone marketing pages.
interface StaticPage { path: string; file: string; title: string; description: string; html: string }
function emitStaticPages(
  emit: (fileName: string, source: string) => void,
  bundle: Record<string, { type: string; source?: string | Uint8Array }>,
  routes: StaticPage[],
  cssRelPath: string,
): void {
  const index = bundle["index.html"];
  if (!index || index.type !== "asset") return;
  const base = typeof index.source === "string" ? index.source : Buffer.from(index.source as Uint8Array).toString("utf8");

  let css = "";
  try {
    css = fs.readFileSync(path.resolve(__dirname, cssRelPath), "utf8");
  } catch { /* styling still comes from the bundled stylesheet */ }
  const cssTag = css ? "<style>" + css + "</style>" : "";

  const setMeta = (html: string, attr: string, value: string): string => {
    const re = new RegExp(`(<meta ${attr} content=")[^"]*(")`);
    return re.test(html) ? html.replace(re, `$1${value.replace(/"/g, "&quot;")}$2`) : html;
  };

  for (const r of routes) {
    let html = base;
    const canonical = "https://allegoryartstudio.com" + r.path;
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${r.title}</title>`);
    html = setMeta(html, 'name="description"', r.description);
    html = setMeta(html, 'property="og:title"', r.title);
    html = setMeta(html, 'property="og:description"', r.description);
    html = setMeta(html, 'property="og:url"', canonical);
    html = setMeta(html, 'name="twitter:title"', r.title);
    html = setMeta(html, 'name="twitter:description"', r.description);
    html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${canonical}" />`);
    if (cssTag) html = html.replace("</head>", cssTag + "</head>");

    // Swap the landing #root block for this route's prerendered content.
    const startMarker = '<div id="root">';
    const endMarker = PRERENDER_GUARD + "</div>";
    const s = html.indexOf(startMarker);
    const e = html.indexOf(endMarker);
    if (s >= 0 && e > s) {
      html = html.slice(0, s) + '<div id="root">' + r.html + "</div>" + html.slice(e + endMarker.length);
    } else {
      html = html.replace('<div id="root"></div>', '<div id="root">' + r.html + "</div>");
    }

    emit(r.file, html);
  }
}

// Prerender the Resource Library (/resources and every guide).
function prerenderResources(): Plugin {
  return {
    name: "prerender-resources",
    apply: "build",
    enforce: "post",
    generateBundle(_opts, bundle) {
      emitStaticPages(
        (fileName, source) => this.emitFile({ type: "asset", fileName, source }),
        bundle as Record<string, { type: string; source?: string | Uint8Array }>,
        resourceRoutes(),
        "src/styles/resources.css",
      );
    },
  };
}

// Prerender the standalone marketing pages (/features, /plans, /faq) so each is
// its own indexable, analytics-trackable URL. The homepage keeps its sections.
function prerenderMarketing(): Plugin {
  return {
    name: "prerender-marketing",
    apply: "build",
    enforce: "post",
    generateBundle(_opts, bundle) {
      emitStaticPages(
        (fileName, source) => this.emitFile({ type: "asset", fileName, source }),
        bundle as Record<string, { type: string; source?: string | Uint8Array }>,
        marketingRoutes(),
        "src/styles/marketing.css",
      );
    },
  };
}

// Emits a tiny version.json into the build output carrying this build's id. The
// running app polls it (src/lib/appVersion.ts) to detect a newer deploy and
// refresh onto it, so a shipped fix reaches even long-open tabs.
function emitVersion(buildId: string): Plugin {
  return {
    name: "emit-version",
    apply: "build",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: JSON.stringify({ buildId }),
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // A unique id per build: the Vercel/GitHub commit sha when available (stable
  // and meaningful), otherwise a timestamp. "dev" locally so the watcher no-ops.
  const buildId =
    mode === "development"
      ? "dev"
      : process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || String(Date.now());

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    define: {
      __BUILD_ID__: JSON.stringify(buildId),
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      prerenderLanding(),
      prerenderResources(),
      prerenderMarketing(),
      emitVersion(buildId),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
