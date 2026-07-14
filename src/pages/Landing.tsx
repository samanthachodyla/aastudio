import { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import landingHtml from "./landing.html?raw";

// Waitlist endpoint — a Google Apps Script Web App that appends each signup to a
// Google Sheet AND emails cara@allegoryartconsulting.com. Paste the deployed
// "/exec" web-app URL here (see landing/README-waitlist.md for the 5-min setup).
const WAITLIST_ENDPOINT = "https://script.google.com/macros/s/AKfycbzGAf1SwVp5TM6j2rajwBFlyEFJf9NAKmECu9haZt_E7X5iuEqpabWG2tfu3QN2qz4/exec";

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
        if (!email) return;
        const btn = form.querySelector<HTMLButtonElement>("button");
        if (!WAITLIST_ENDPOINT) {
          if (msg) { msg.className = "signup-msg err"; msg.textContent = "Sign-up isn't connected yet — please email hello@allegoryartstudio.com."; }
          return;
        }
        if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
        if (msg) { msg.className = "signup-msg"; msg.textContent = ""; }
        // Capture UTM tags from the URL so each signup carries its campaign/post.
        const qs = new URLSearchParams(window.location.search);
        const formSource = form.getAttribute("data-source") || "landing";
        fetch(WAITLIST_ENDPOINT, {
          method: "POST",
          mode: "no-cors",
          body: new URLSearchParams({
            email,
            source: formSource,
            referrer: document.referrer || "",
            user_agent: navigator.userAgent,
            utm_source: qs.get("utm_source") || "",
            utm_medium: qs.get("utm_medium") || "",
            utm_campaign: qs.get("utm_campaign") || "",
            utm_content: qs.get("utm_content") || "",
            utm_term: qs.get("utm_term") || "",
          }),
        })
          .then(() => {
            form.classList.add("done");
            if (msg) { msg.className = "signup-msg"; msg.textContent = "You've got first access. We'll email you the moment we open on August 1. ✦"; }
            // Fire a GA4 conversion so signups can be tied to traffic/campaigns.
            try {
              (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.("event", "waitlist_signup", {
                form_source: formSource,
                utm_source: qs.get("utm_source") || undefined,
                utm_campaign: qs.get("utm_campaign") || undefined,
              });
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

    return () => {
      submitBindings.forEach(([form, h]) => form.removeEventListener("submit", h));
      window.removeEventListener("resize", aasFit);
      window.removeEventListener("load", aasFit);
      window.clearTimeout(fitTimer);
      io?.disconnect();
      navLinks.forEach((a) => a.removeEventListener("click", closeMenu));
    };
  }, []);

  // Returning, logged-in users skip the marketing page and go to their dashboard.
  if (!loading && session) return <Navigate to="/dashboard" replace />;

  return <div ref={ref} dangerouslySetInnerHTML={{ __html: landingHtml }} />;
}
