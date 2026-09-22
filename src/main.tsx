import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { captureAttribution } from "./lib/attribution";

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
