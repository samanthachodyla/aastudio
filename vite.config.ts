import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "node:fs";
import { componentTagger } from "lovable-tagger";
import { isLaunched, toLiveLanding, toLiveIndexHead } from "./src/lib/landingLive";

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
      const guard =
        '<script>(function(){var p=location.pathname;' +
        'if(p!=="/"&&p!=="/index.html"){var el=document.getElementById("prerender");' +
        'if(el&&el.parentNode)el.parentNode.removeChild(el);}})();</script>';
      const block = '<div id="prerender">' + landing + "</div>" + guard;
      return html.replace('<div id="root"></div>', '<div id="root">' + block + "</div>");
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
