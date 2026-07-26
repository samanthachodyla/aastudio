import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";

/**
 * Public Cookie Policy page (/cookies). Describes the specific cookies and
 * tracking used by the site and how to control them. Kept in sync with the
 * actual trackers wired in index.html (GA4 + Meta Pixel) and the consent banner.
 */
const Section = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
  <section className="mt-9">
    <h2 className="font-display text-2xl text-[#11281c] mb-3">
      <span className="text-[#9a7b3f] mr-2 tabular-nums">{n}</span>{title}
    </h2>
    <div className="space-y-3 text-[15px] leading-relaxed text-[#3a4a40]">{children}</div>
  </section>
);

const Row = ({ name, provider, purpose, life }: { name: string; provider: string; purpose: string; life: string }) => (
  <tr className="border-b border-[#e2ddd2] align-top">
    <td className="py-2 pr-3 font-mono text-[13px] text-[#11281c]">{name}</td>
    <td className="py-2 pr-3">{provider}</td>
    <td className="py-2 pr-3">{purpose}</td>
    <td className="py-2">{life}</td>
  </tr>
);

export default function Cookies() {
  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#11281c]" style={{ fontFamily: "'Work Sans', system-ui, sans-serif" }}>
      <Seo
        title="Cookie Policy — Allegory Studio"
        description="The cookies and similar technologies Allegory Studio uses, why we use them, and how to control your preferences."
        canonicalPath="/cookies"
      />
      <div className="max-w-3xl mx-auto px-6 py-14 md:py-20">
        <Link to="/" className="text-[11px] uppercase tracking-[0.28em] text-[#6b746d] hover:text-[#11281c]">← Allegory Art Studio</Link>

        <h1 className="font-display text-4xl md:text-5xl mt-6 mb-2">Cookie Policy</h1>
        <p className="text-sm text-[#6b746d]">Effective Date: August 1, 2026 · Last Updated: August 1, 2026</p>

        <p className="mt-8 text-[15px] leading-relaxed text-[#3a4a40]">
          This Cookie Policy explains how Allegory Studio, LLC uses cookies and similar technologies on our website. It
          should be read alongside our{" "}
          <Link to="/privacy" className="text-[#2c533f] underline">Privacy Policy</Link>.
        </p>

        <Section n="1." title="What Are Cookies?">
          <p>Cookies are small text files stored on your device when you visit a website. Similar technologies — such as
          local storage and pixels — work in comparable ways. They help sites function, remember your preferences, and
          understand how the site is used.</p>
        </Section>

        <Section n="2." title="Types of Cookies We Use">
          <p><b>Essential.</b> Required for the site and app to work — for example, keeping you securely signed in and
          remembering your cookie choice. These cannot be switched off.</p>
          <p><b>Analytics.</b> Help us understand how visitors find and use the site so we can improve it (Google
          Analytics).</p>
          <p><b>Advertising.</b> Help us measure the effectiveness of our marketing and reach the right people (Meta
          Pixel). You can opt out of these.</p>
        </Section>

        <Section n="3." title="Cookies &amp; Technologies in Use">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px] text-[#3a4a40] mt-1">
              <thead>
                <tr className="border-b border-[#d8d2c6] text-[11px] uppercase tracking-wider text-[#6b746d]">
                  <th className="py-2 pr-3 font-medium">Name</th>
                  <th className="py-2 pr-3 font-medium">Provider</th>
                  <th className="py-2 pr-3 font-medium">Purpose</th>
                  <th className="py-2 font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                <Row name="_ga, _ga_*" provider="Google Analytics" purpose="Distinguish visitors and measure site usage" life="Up to 2 years" />
                <Row name="_fbp, _fbc" provider="Meta (Facebook)" purpose="Measure ad performance and attribute signups" life="Up to 90 days" />
                <Row name="Auth session" provider="Allegory Studio (Supabase)" purpose="Keep you securely signed in" life="Session / until sign-out" />
                <Row name="allegory.consent" provider="Allegory Studio" purpose="Remember your cookie choice" life="Persistent (local)" />
              </tbody>
            </table>
          </div>
          <p className="text-[13px] text-[#6b746d] italic">Specific cookie names and durations may change as providers update their technologies.</p>
        </Section>

        <Section n="4." title="Managing Your Preferences">
          <p>You are in control:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><b>Cookie banner.</b> When you first visit, you can accept or opt out of analytics and advertising cookies.</li>
            <li><b>Change anytime.</b> Use the <b>"Do Not Sell or Share My Personal Information"</b> link in our footer to
            reopen your choices.</li>
            <li><b>Global Privacy Control.</b> We automatically honor the GPC browser signal as an opt-out of the
            sale/sharing of personal information for advertising.</li>
            <li><b>Browser controls.</b> Most browsers let you block or delete cookies in their settings. Blocking
            essential cookies may prevent parts of the Service from working.</li>
          </ul>
        </Section>

        <Section n="5." title="Third-Party Providers">
          <p>Some cookies are set by third parties whose own policies govern their use:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Google — <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="text-[#2c533f] underline">Privacy Policy</a></li>
            <li>Meta — <a href="https://www.facebook.com/policy.php" target="_blank" rel="noopener" className="text-[#2c533f] underline">Data Policy</a></li>
          </ul>
        </Section>

        <Section n="6." title="Changes &amp; Contact">
          <p>We may update this Cookie Policy as our practices or the technologies we use evolve. Questions? Email{" "}
          <a href="mailto:hello@allegoryartstudio.com" className="text-[#2c533f] underline">hello@allegoryartstudio.com</a>.</p>
        </Section>

        <div className="mt-12 pt-6 border-t border-[#d8d2c6] text-xs text-[#6b746d]">
          © 2026 Allegory Art Studio, LLC. All rights reserved. ·{" "}
          <Link to="/" className="underline hover:text-[#11281c]">Home</Link> ·{" "}
          <Link to="/terms" className="underline hover:text-[#11281c]">Terms</Link> ·{" "}
          <Link to="/privacy" className="underline hover:text-[#11281c]">Privacy</Link>
        </div>
      </div>
    </div>
  );
}
