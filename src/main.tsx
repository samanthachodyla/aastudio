import { createRoot } from "react-dom/client";
import { analytics } from "@heycatch/sdk";
import App from "./App.tsx";
import "./index.css";
import { captureAttribution } from "./lib/attribution";

// HeyCatch analytics — initialized once, at module scope, in the client entry so
// autocapture (pageviews, clicks, SPA route changes) covers every page from the
// first paint. Idempotent and a no-op during SSR. The project key is publishable.
analytics.init({
  projectKey: "hck_pk_0rFSdNdqLyelScsDmwFX37v4J-V5-BFy",
  install: {
    framework: "vite-react",
    frameworkVersion: "18",
    agent: "claude-code",
  },
});

// Record where this visit came from (UTMs, click IDs, referrer, landing page)
// before anything else, so first-touch is captured on the very first pageview.
captureAttribution();

// If the user arrived from a Supabase password-recovery email, the token can
// land on any path (depending on the project's redirect config). Route them to
// the reset page *before* React renders — keeping the token in the URL so the
// Supabase client can still establish the recovery session once we're there.
(() => {
  const { pathname, search, hash } = window.location;
  const isRecovery = /type=recovery/.test(hash) || /type=recovery/.test(search);
  if (isRecovery && pathname !== "/reset-password") {
    window.history.replaceState(null, "", `/reset-password${search}${hash}`);
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
