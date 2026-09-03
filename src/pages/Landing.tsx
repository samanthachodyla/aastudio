import { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Seo } from "@/components/Seo";
import { isLaunched, toLiveLanding } from "@/lib/landingLive";
import landingHtml from "./landing.html?raw";

// Before Aug 1 2026 the waitlist page shows; from launch, the live homepage.
const pageHtml = isLaunched() ? toLiveLanding(landingHtml) : landingHtml;

// Signups POST to our own /api/subscribe function, which writes to Mailchimp
// (system of record), forwards to the Google Sheet as backup, and fires the
// Meta CAPI Lead. See api/subscribe.ts.

/**
 * Public marketing landing page at "/".
 *
 * The markup is a fully self-contained block (scoped `.allegory-lp` CSS +
 * its own launch-waitlist form). It's injected as-is; the two original inline
 * <script> blocks are ported into the effect below, since scripts inserted via
 * innerHTML don't execute.
 *
 * The waitlist form posts to a SEPARATE Supabase project (launch list only) via
 * a raw fetch — it never touches this app's auth Supabase client.
 */
export default function Landing() {
  const { session, loading } = useAuth();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const root = host.querySelector<HTMLElement>(".allegory-lp");
    if (!root) return;

    // ---- Launch-list signup → Google Apps Script (Sheet + email to Cara) ----
    // Posted as a "simple" urlencoded no-cors request so the browser sends it
    // without a CORS preflight (Apps Script web apps don't return CORS headers).
    // The response is opaque, so a resolved fetch = delivered.
    const forms = Array.from(root.querySelectorAll<HTMLFormElement>("[data-allegory-signup]"));
    const submitBindings: Array<[HTMLFormElement, (e: Event) => void]> = [];
    forms.forEach((form) => {
      const msg = form.querySelector<HTMLElement>(".signup-msg");
      const handler = (e: Event) => {
        e.preventDefault();
        const input = form.querySelector<HTMLInputElement>("input[type=email]");
        const email = (input?.value || "").trim();
        const firstEl = form.querySelector<HTMLInputElement>('input[name="first_name"]');
        const lastEl = form.querySelector<HTMLInputElement>('input[name="last_name"]');
        const firstName = (firstEl?.value || "").trim();
        const lastName = (lastEl?.value || "").trim();
        const phoneEl = form.querySelector<HTMLInputElement>('input[name="phone"]');
        const phone = (phoneEl?.value || "").trim();
        if (!email) return;
        if (!firstName) {
          if (msg) { msg.className = "signup-msg err"; msg.textContent = "Please add your first name."; }
          firstEl?.focus();
          return;
        }
        const btn = form.querySelector<HTMLButtonElement>("button");
        if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
        if (msg) { msg.className = "signup-msg"; msg.textContent = ""; }
        // Capture UTM tags from the URL so each signup carries its campaign/post.
        const qs = new URLSearchParams(window.location.search);
        const formSource = form.getAttribute("data-source") || "landing";
        // Shared event id: the browser Pixel and the server (CAPI) send the same
        // Lead with this id so Meta de-duplicates them into one conversion.
        const cookie = (name: string) => {
          const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]+)"));
          return m ? decodeURIComponent(m[1]) : "";
        };
        const eventId = (crypto as { randomUUID?: () => string }).randomUUID?.()
          ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        // GA client id (from the _ga cookie: "GA1.1.<id>.<ts>") so the server-side
        // GA4 event lands on the same user as the browser.
        const gaCookie = cookie("_ga");
        const gaClientId = gaCookie ? gaCookie.split(".").slice(-2).join(".") : "";
        fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            first_name: firstName,
            last_name: lastName,
            phone,
            source: formSource,
            referrer: document.referrer || "",
            user_agent: navigator.userAgent,
            utm_source: qs.get("utm_source") || "",
            utm_medium: qs.get("utm_medium") || "",
            utm_campaign: qs.get("utm_campaign") || "",
            utm_content: qs.get("utm_content") || "",
            utm_term: qs.get("utm_term") || "",
            // Shared with the server so the CAPI Lead de-dupes with the Pixel:
            event_id: eventId,
            event_source_url: window.location.href,
            fbp: cookie("_fbp"),
            fbc: cookie("_fbc"),
            ga_client_id: gaClientId,
          }),
        })
          .then(async (res) => {
            if (!res.ok) throw new Error("subscribe failed");
            form.classList.add("done");
            if (msg) {
              msg.className = "signup-msg";
              msg.textContent = (formSource === "newsletter" || formSource === "popup")
                ? "You're in! Your 20% code is on its way to your inbox. ✦"
                : "Thanks — you're on the list. ✦";
            }
            // Fire a GA4 conversion so signups can be tied to traffic/campaigns.
            try {
              (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.("event", "waitlist_signup", {
                form_source: formSource,
                utm_source: qs.get("utm_source") || undefined,
                utm_campaign: qs.get("utm_campaign") || undefined,
              });
            } catch { /* analytics is best-effort */ }
            // Fire the Meta Pixel Lead event so Meta ads can optimize for signups.
            // The eventID matches the server (CAPI) event so Meta de-dupes them.
            try {
              (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq?.("track", "Lead", {
                content_name: "waitlist",
                source: formSource,
              }, { eventID: eventId });
            } catch { /* analytics is best-effort */ }
          })
          .catch(() => {
            if (btn) { btn.disabled = false; btn.textContent = "Try again"; }
            if (msg) { msg.className = "signup-msg err"; msg.textContent = "Something went wrong. Please try again, or email hello@allegoryartstudio.com."; }
          });
      };
      form.addEventListener("submit", handler);
      submitBindings.push([form, handler]);
    });

    // ---- Progressive enhancement: reveal-on-scroll, hero sizing, mobile menu ----
    root.classList.add("js");

    const aasFit = () => {
      const op = root.querySelector<HTMLElement>(".opening");
      if (!op) return;
      const top = op.getBoundingClientRect().top + (window.pageYOffset || 0);
      const avail = window.innerHeight - top;
      op.style.minHeight = avail > 340 ? avail + "px" : "";
    };
    aasFit();
    window.addEventListener("resize", aasFit);
    window.addEventListener("load", aasFit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(aasFit);
    const fitTimer = window.setTimeout(aasFit, 400);

    const els = Array.from(root.querySelectorAll<HTMLElement>(".reveal"));
    let io: IntersectionObserver | null = null;
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
    } else {
      io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add("in"); io?.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      els.forEach((el) => io?.observe(el));
    }

    const chk = root.querySelector<HTMLInputElement>("#navchk");
    const navLinks = Array.from(root.querySelectorAll<HTMLAnchorElement>(".nav-links a"));
    const closeMenu = () => { if (chk) chk.checked = false; };
    navLinks.forEach((a) => a.addEventListener("click", closeMenu));

    // ---- Members discount popup: opens once per browser after a short delay or
    // on exit-intent; its form posts to the same waitlist Sheet as the others
    // (data-source="popup"). Dismissal/submission is remembered so it won't nag.
    const POP_KEY = "allegory.popup.seen.v1";
    const popup = root.querySelector<HTMLElement>("#aasPopup");
    const popSeen = () => { try { return !!localStorage.getItem(POP_KEY); } catch { return false; } };
    const markSeen = () => { try { localStorage.setItem(POP_KEY, "1"); } catch { /* ignore */ } };
    const openPopup = () => {
      if (popup && !popSeen()) { popup.classList.add("open"); popup.setAttribute("aria-hidden", "false"); }
    };
    const closePopup = () => {
      if (popup) { popup.classList.remove("open"); popup.setAttribute("aria-hidden", "true"); markSeen(); }
    };
    const onExitIntent = (e: MouseEvent) => { if (e.clientY <= 0) openPopup(); };
    const onPopKey = (e: KeyboardEvent) => { if (e.key === "Escape") closePopup(); };
    const onPopSubmit = () => { markSeen(); window.setTimeout(closePopup, 3200); };
    const popCloseEls = popup ? Array.from(popup.querySelectorAll<HTMLElement>("[data-pop-close]")) : [];
    const popForm = popup?.querySelector<HTMLFormElement>("form") ?? null;
    let popupTimer = 0;
    if (popup && !popSeen()) {
      popupTimer = window.setTimeout(openPopup, 7000);
      document.addEventListener("mouseout", onExitIntent);
      document.addEventListener("keydown", onPopKey);
      popCloseEls.forEach((el) => el.addEventListener("click", closePopup));
      popForm?.addEventListener("submit", onPopSubmit);
    }

    // ---- Pay-first: homepage plan buttons open Stripe Checkout directly, with
    // the cycle from the monthly/annual toggle. If checkout can't start we keep
    // the visitor on the pricing section (the anchor's #pricing href) — we never
    // create an account before payment.
    const planButtons = Array.from(root.querySelectorAll<HTMLAnchorElement>("a[data-plan]"));
    const onPlanClick = async (e: Event) => {
      const el = e.currentTarget as HTMLAnchorElement;
      const plan = el.getAttribute("data-plan");
      if (!plan) return;
      e.preventDefault();
      const cycle = root.querySelector<HTMLInputElement>("#ba")?.checked ? "annual" : "monthly";
      const original = el.textContent;
      el.textContent = "Loading…";
      el.style.pointerEvents = "none";
      try {
        const res = await fetch("/api/stripe/checkout-guest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, cycle }),
        });
        const json = await res.json();
        if (json.url) { window.location.href = json.url; return; }
        throw new Error(json.error || "no url");
      } catch {
        window.location.href = el.getAttribute("href") || "#pricing";
      } finally {
        el.textContent = original;
        el.style.pointerEvents = "";
      }
    };
    planButtons.forEach((b) => b.addEventListener("click", onPlanClick));

    return () => {
      submitBindings.forEach(([form, h]) => form.removeEventListener("submit", h));
      window.removeEventListener("resize", aasFit);
      window.removeEventListener("load", aasFit);
      window.clearTimeout(fitTimer);
      io?.disconnect();
      navLinks.forEach((a) => a.removeEventListener("click", closeMenu));
      window.clearTimeout(popupTimer);
      document.removeEventListener("mouseout", onExitIntent);
      document.removeEventListener("keydown", onPopKey);
      popCloseEls.forEach((el) => el.removeEventListener("click", closePopup));
      popForm?.removeEventListener("submit", onPopSubmit);
      planButtons.forEach((b) => b.removeEventListener("click", onPlanClick));
    };
  }, []);

  // Returning, logged-in users skip the marketing page and go to their dashboard.
  if (!loading && session) return <Navigate to="/dashboard" replace />;

  return (
    <>
      <Seo canonicalPath="/" />
      <div ref={ref} dangerouslySetInnerHTML={{ __html: pageHtml }} />
    </>
  );
}
