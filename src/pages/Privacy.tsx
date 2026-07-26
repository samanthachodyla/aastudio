import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";

/**
 * Public Privacy Policy page (/privacy). Written for a US audience (opt-out
 * model, CCPA/CPRA rights). Bracketed items ([Business address]) are
 * placeholders for the studio to finalize with counsel.
 */
const Section = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
  <section className="mt-9">
    <h2 className="font-display text-2xl text-[#11281c] mb-3">
      <span className="text-[#9a7b3f] mr-2 tabular-nums">{n}</span>{title}
    </h2>
    <div className="space-y-3 text-[15px] leading-relaxed text-[#3a4a40]">{children}</div>
  </section>
);

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#11281c]" style={{ fontFamily: "'Work Sans', system-ui, sans-serif" }}>
      <Seo
        title="Privacy Policy — Allegory Studio"
        description="How Allegory Studio collects, uses, and protects your information — and the choices and privacy rights you have."
        canonicalPath="/privacy"
      />
      <div className="max-w-3xl mx-auto px-6 py-14 md:py-20">
        <Link to="/" className="text-[11px] uppercase tracking-[0.28em] text-[#6b746d] hover:text-[#11281c]">← Allegory Art Studio</Link>

        <h1 className="font-display text-4xl md:text-5xl mt-6 mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#6b746d]">Effective Date: August 1, 2026 · Last Updated: August 1, 2026</p>

        <p className="mt-8 text-[15px] leading-relaxed text-[#3a4a40]">
          This Privacy Policy explains how Allegory Studio, LLC ("Allegory Studio," "we," "us," or "our") collects,
          uses, and shares information when you use the Allegory Studio platform, website, and related services
          (the "Service"). It also describes the choices and rights you have. This Policy is incorporated into our{" "}
          <Link to="/terms" className="text-[#2c533f] underline">Terms &amp; Conditions</Link>.
        </p>

        <Section n="1." title="Information We Collect">
          <p><b>Information you provide.</b> When you create an account we collect your name and email address, and any
          profile details you add. As you use the Service, you create and upload content — artwork images and records,
          inventory, sales and finance data, contacts, documents, and notes ("Your Content").</p>
          <p><b>Payment information.</b> If you subscribe to a paid plan, our payment processor collects and processes
          your payment details on our behalf. We do not store full card numbers on our systems.</p>
          <p><b>Connected accounts.</b> If you choose to connect an email inbox (for example, Gmail) or other third-party
          account, we access only the data needed to provide that feature, with your authorization, and you can
          disconnect at any time.</p>
          <p><b>Information collected automatically.</b> Like most websites, we and our analytics providers collect
          limited technical and usage information — such as device and browser type, pages viewed, referring links, and
          general location inferred from your IP address — using cookies and similar technologies. See our{" "}
          <Link to="/cookies" className="text-[#2c533f] underline">Cookie Policy</Link> for details.</p>
        </Section>

        <Section n="2." title="How We Use Your Information">
          <ul className="list-disc pl-5 space-y-2">
            <li>To provide, maintain, and improve the Service;</li>
            <li>To create and secure your account and authenticate you;</li>
            <li>To process subscriptions and payments;</li>
            <li>To power features you use, including AI-assisted tools that generate suggestions from the content you provide;</li>
            <li>To communicate with you about your account, updates, and support;</li>
            <li>To understand how the Service is used and to measure our marketing;</li>
            <li>To detect, prevent, and address fraud, abuse, or security issues, and to comply with law.</li>
          </ul>
        </Section>

        <Section n="3." title="We Do Not Sell Your Content">
          <p>Your Content — your artwork records, sales figures, contacts, and account details — is yours. We do not sell
          it, and we do not use it to train third-party AI models without your consent. We use trusted service providers
          to operate the Service; they may process data only on our behalf and under confidentiality obligations. For
          how we treat advertising and analytics identifiers under U.S. state "sale/share" laws, see Sections 5 and 7.</p>
        </Section>

        <Section n="4." title="How We Share Information">
          <p>We share information only as needed to run the Service:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><b>Service providers.</b> Hosting and database (Supabase, Vercel), a payment processor, email delivery,
            inbox connectivity (where you enable it), and AI providers that power generative features — each processing
            data on our behalf.</li>
            <li><b>Analytics &amp; advertising partners.</b> Google Analytics and the Meta Pixel help us understand
            traffic and measure marketing. These may involve cookies and identifiers as described in our Cookie Policy.</li>
            <li><b>Legal &amp; safety.</b> When required by law, or to protect the rights, property, or safety of Allegory
            Studio, our users, or the public.</li>
            <li><b>Business transfers.</b> If we are involved in a merger, acquisition, or sale of assets, information may
            be transferred as part of that transaction; we will notify you before your data becomes subject to a
            different privacy policy.</li>
          </ul>
        </Section>

        <Section n="5." title="Cookies, Analytics &amp; Your Choices">
          <p>We use cookies and similar technologies for essential functions (like keeping you signed in), analytics, and
          advertising measurement. You can accept or opt out of non-essential cookies through the cookie banner on our
          site, and you can reopen your choices anytime using the "Do Not Sell or Share My Personal Information" link in
          our footer.</p>
          <p>We honor the Global Privacy Control (GPC) browser signal as a valid request to opt out of the "sale" or
          "sharing" of personal information for cross-context behavioral advertising. Full details are in our{" "}
          <Link to="/cookies" className="text-[#2c533f] underline">Cookie Policy</Link>.</p>
        </Section>

        <Section n="6." title="Data Retention">
          <p>We keep your information for as long as your account is active or as needed to provide the Service. You may
          export Your Content at any time. If you close your account, we will delete Your Content within 90 days, except
          where retention is required by law or for legitimate business purposes such as fraud prevention or dispute
          resolution.</p>
        </Section>

        <Section n="7." title="Your California Privacy Rights">
          <p>If you are a California resident, the California Consumer Privacy Act (as amended by the CPRA) gives you the
          following rights, subject to certain exceptions:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><b>Right to know</b> the categories and specific pieces of personal information we have collected;</li>
            <li><b>Right to delete</b> personal information we have collected from you;</li>
            <li><b>Right to correct</b> inaccurate personal information;</li>
            <li><b>Right to opt out</b> of the "sale" or "sharing" of your personal information; and</li>
            <li><b>Right to non-discrimination</b> for exercising any of these rights.</li>
          </ul>
          <p>To exercise these rights, email{" "}
          <a href="mailto:hello@allegoryartstudio.com" className="text-[#2c533f] underline">hello@allegoryartstudio.com</a>{" "}
          or use the "Do Not Sell or Share My Personal Information" link in our footer. We do not knowingly sell personal
          information for money. Where our use of advertising cookies may be considered "sharing" under California law,
          you can opt out as described above, and we honor GPC signals.</p>
          <p>Residents of other U.S. states with comprehensive privacy laws may have similar rights; contact us to
          exercise them.</p>
        </Section>

        <Section n="8." title="Security">
          <p>We use industry-standard safeguards — including encryption in transit and at rest, secure authentication,
          and access controls — to protect your information. No method of transmission or storage is completely secure,
          but we work continuously to protect your data.</p>
        </Section>

        <Section n="9." title="Children's Privacy">
          <p>The Service is intended for users 18 and older. We do not knowingly collect personal information from
          children. If you believe a child has provided us information, please contact us and we will delete it.</p>
        </Section>

        <Section n="10." title="Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. If we make material changes, we will notify you by email
          or through the Service. The "Last Updated" date above reflects the most recent version.</p>
        </Section>

        <Section n="11." title="Contact Us">
          <p>Questions about this Policy or your information? Reach us at:</p>
          <p>Allegory Studio, LLC<br />[Business address]<br />
          <a href="mailto:hello@allegoryartstudio.com" className="text-[#2c533f] underline">hello@allegoryartstudio.com</a></p>
        </Section>

        <div className="mt-12 pt-6 border-t border-[#d8d2c6] text-xs text-[#6b746d]">
          © 2026 Allegory Art Studio, LLC. All rights reserved. ·{" "}
          <Link to="/" className="underline hover:text-[#11281c]">Home</Link> ·{" "}
          <Link to="/terms" className="underline hover:text-[#11281c]">Terms</Link> ·{" "}
          <Link to="/cookies" className="underline hover:text-[#11281c]">Cookie Policy</Link>
        </div>
      </div>
    </div>
  );
}
