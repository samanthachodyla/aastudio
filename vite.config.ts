import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "node:fs";
import { componentTagger } from "lovable-tagger";

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
      const guard =
        '<script>(function(){var p=location.pathname;' +
        'if(p!=="/"&&p!=="/index.html"){var el=document.getElementById("prerender");' +
        'if(el&&el.parentNode)el.parentNode.removeChild(el);}})();</script>';
      const block = '<div id="prerender">' + landing + "</div>" + guard;
      return html.replace('<div id="root"></div>', '<div id="root">' + block + "</div>");
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    prerenderLanding(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
