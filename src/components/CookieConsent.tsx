import { useEffect, useState } from "react";

/**
 * Lightweight US-model cookie consent banner.
 *
 * Model: analytics + advertising are on by default (US opt-out), but the visitor
 * can opt out here, and we automatically honor the browser Global Privacy Control
 * (GPC / "Do Not Sell or Share") signal without showing the banner. The choice is
 * stored locally and re-applied on every load via Google Consent Mode v2 + the
 * Meta Pixel consent API.
 *
 * Any element with a `data-allegory-cookie-prefs` attribute (e.g. a footer link)
 * reopens this banner so visitors can change their choice at any time.
 */
const GA_ID = "G-CSJ5CQZ382";
const KEY = "allegory.consent";

type Choice = "granted" | "declined";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type W = any;

function applyConsent(choice: Choice) {
  const w = window as W;
  const deny = choice === "declined";
  try {
    w.gtag?.("consent", "update", {
      ad_storage: deny ? "denied" : "granted",
      ad_user_data: deny ? "denied" : "granted",
      ad_personalization: deny ? "denied" : "granted",
      analytics_storage: deny ? "denied" : "granted",
    });
  } catch { /* analytics is best-effort */ }
  try {
    w.fbq?.("consent", deny ? "revoke" : "grant");
  } catch { /* analytics is best-effort */ }
  // Hard-stop GA collection when declined (belt-and-suspenders alongside Consent Mode).
  w["ga-disable-" + GA_ID] = deny;
}

export function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem(KEY); } catch { /* storage blocked */ }
    const gpc = (navigator as W).globalPrivacyControl === true;

    if (stored === "granted" || stored === "declined") {
      applyConsent(stored); // re-apply the saved choice on every load
    } else if (gpc) {
      // Respect the browser Do-Not-Sell/Share signal automatically — no banner.
      try { localStorage.setItem(KEY, "declined"); } catch { /* ignore */ }
      applyConsent("declined");
    } else {
      setOpen(true); // first visit, no signal — ask
    }

    // Let a footer link (or anything) reopen preferences.
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest?.("[data-allegory-cookie-prefs]");
      if (target) { e.preventDefault(); setOpen(true); }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const choose = (choice: Choice) => {
    try { localStorage.setItem(KEY, choice); } catch { /* ignore */ }
    applyConsent(choice);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-[9999] px-4 pb-4"
      style={{ fontFamily: "'Work Sans', system-ui, sans-serif" }}
    >
      <div className="mx-auto max-w-3xl rounded-lg shadow-2xl border border-[#25412f] bg-[#11281c] text-[#e9e5db] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <p className="text-[13px] leading-relaxed flex-1">
            We use cookies to measure site traffic and improve our marketing. You can opt out anytime.
            See our{" "}
            <a href="/terms" className="underline hover:text-white">data practices</a>.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => choose("declined")}
              className="text-[13px] px-4 py-2 rounded-sm border border-[#3a5544] text-[#e9e5db] hover:bg-[#183524] transition-colors"
            >
              Opt out
            </button>
            <button
              onClick={() => choose("granted")}
              className="text-[13px] px-4 py-2 rounded-sm bg-[#c9a961] text-[#11281c] font-medium hover:bg-[#d8bd7f] transition-colors"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
