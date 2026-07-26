import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";

/**
 * Public Terms & Conditions page (/terms). Content mirrors the studio's
 * Terms doc. Bracketed items ([Business address], etc.) are placeholders for
 * the studio to finalize with counsel.
 */
const Section = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
  <section className="mt-9">
    <h2 className="font-display text-2xl text-[#11281c] mb-3">
      <span className="text-[#9a7b3f] mr-2 tabular-nums">{n}</span>{title}
    </h2>
    <div className="space-y-3 text-[15px] leading-relaxed text-[#3a4a40]">{children}</div>
  </section>
);

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#11281c]" style={{ fontFamily: "'Work Sans', system-ui, sans-serif" }}>
      <Seo
        title="Terms & Conditions — Allegory Studio"
        description="The Terms & Conditions governing use of Allegory Studio, the CRM and studio management software for working artists."
        canonicalPath="/terms"
      />
      <div className="max-w-3xl mx-auto px-6 py-14 md:py-20">
        <Link to="/" className="text-[11px] uppercase tracking-[0.28em] text-[#6b746d] hover:text-[#11281c]">← Allegory Art Studio</Link>

        <h1 className="font-display text-4xl md:text-5xl mt-6 mb-2">Terms &amp; Conditions</h1>
        <p className="text-sm text-[#6b746d]">Effective Date: August 1, 2026 · Last Updated: August 1, 2026</p>

        <p className="mt-8 text-[15px] leading-relaxed text-[#3a4a40]">
          Welcome to Allegory Studio. These Terms &amp; Conditions ("Terms") govern your use of the Allegory Studio
          platform, website, and related services (collectively, the "Service"), operated by Allegory Studio, LLC
          ("Allegory Studio," "we," "us," or "our"). By creating an account or using the Service, you agree to these
          Terms. If you do not agree, please do not use the Service.
        </p>

        <Section n="1." title="About the Service">
          <p>Allegory Studio is a studio management platform built for working artists. Depending on your subscription
          tier, the Service includes tools such as inventory management, sales and finance tracking, deadline and
          opportunity tracking, contact management, a profile vault, communications tools, marketing assistance, and
          pricing insights.</p>
        </Section>

        <Section n="2." title="Eligibility &amp; Accounts">
          <p>You must be at least 18 years old to use the Service. When you create an account, you agree to provide
          accurate information and keep it up to date. You are responsible for maintaining the confidentiality of your
          login credentials and for all activity that occurs under your account. Notify us immediately at{" "}
          <a href="mailto:hello@allegoryartstudio.com" className="text-[#2c533f] underline">hello@allegoryartstudio.com</a>{" "}
          if you suspect unauthorized access.</p>
        </Section>

        <Section n="3." title="Subscriptions, Billing &amp; Cancellation">
          <p><b>Plans.</b> Allegory Studio offers subscription plans as described on our pricing page, currently Studio
          Starter and Studio Pro. Features and pricing for each plan are listed on our pricing page and may be updated
          from time to time.</p>
          <p><b>Billing.</b> Subscriptions are billed monthly in advance to the payment method on file. By subscribing,
          you authorize us (and our payment processor) to charge recurring fees until you cancel.</p>
          <p><b>Cancellation.</b> You may cancel at any time through your account settings. Cancellation takes effect at
          the end of your current billing period. We do not provide prorated refunds for partial months, except where
          required by law.</p>
          <p><b>Price Changes.</b> We may adjust subscription pricing with at least 30 days' notice. Continued use of the
          Service after a price change takes effect constitutes acceptance of the new price.</p>
          <p><b>Beta &amp; Promotional Access.</b> Certain users may hold complimentary or lifetime access granted during
          our beta program or through promotions. This access is personal, non-transferable, and applies to the features
          of the designated plan as it evolves. It does not exempt users from these Terms.</p>
        </Section>

        <Section n="4." title="Your Content &amp; Ownership">
          <p><b>You own your work.</b> All artwork images, inventory records, sales data, contacts, documents, and other
          content you upload or create in the Service ("Your Content") belongs to you. Nothing in these Terms transfers
          ownership of Your Content to us.</p>
          <p><b>Limited License to Operate the Service.</b> You grant us a limited, non-exclusive license to host, store,
          process, and display Your Content solely as necessary to provide the Service to you. We will not use Your
          Content for any other purpose without your permission.</p>
          <p><b>Your Responsibilities.</b> You represent that you have the rights to any content you upload and that Your
          Content does not infringe the rights of others.</p>
          <p><b>Export &amp; Deletion.</b> You may export Your Content at any time while your account is active. If you
          close your account, we will delete Your Content within 90 days, except where retention is required by law.</p>
        </Section>

        <Section n="5." title="Data Privacy &amp; Security">
          <p>Your trust matters to us, and protecting your data is foundational to how Allegory Studio is built.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><b>We will never sell your personal data.</b> Your information — your artwork records, sales figures,
            contacts, and account details — is not a product. We do not sell it to advertisers, data brokers, or any
            third party.</li>
            <li><b>Security.</b> We use industry-standard safeguards, including encryption in transit and at rest, secure
            authentication, and access controls, to protect your data.</li>
            <li><b>Service Providers.</b> We work with trusted third-party providers (such as hosting and payment
            processors) who process data only on our behalf and under confidentiality obligations.</li>
            <li><b>Business Transfers.</b> If Allegory Studio is ever involved in a merger, acquisition, or sale of all
            or substantially all of its assets, user data may be transferred as part of that transaction. In that event,
            we will notify you before your data becomes subject to a different privacy policy, and any successor will be
            required to honor the commitments made in our Privacy Policy at the time of transfer.</li>
          </ul>
          <p>Our full data practices are described in our{" "}
          <Link to="/privacy" className="text-[#2c533f] underline">Privacy Policy</Link>, which is incorporated into these
          Terms by reference.</p>
        </Section>

        <Section n="6." title="AI-Powered Features">
          <p>Certain features of the Service — including marketing assistance, pricing suggestions, tailored statements,
          and opportunity discovery — use artificial intelligence to generate suggestions and content.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>AI-generated outputs are suggestions, not professional advice. Pricing recommendations, market insights,
            and generated text should be reviewed and verified by you before use.</li>
            <li>You are responsible for any content you publish or decisions you make based on AI-generated outputs.</li>
            <li>We do not use Your Content to train third-party AI models without your consent.</li>
          </ul>
        </Section>

        <Section n="7." title="Acceptable Use">
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Use the Service for any unlawful purpose or in violation of any applicable law;</li>
            <li>Upload content that infringes intellectual property rights, is fraudulent, or is harmful;</li>
            <li>Attempt to gain unauthorized access to the Service, other users' accounts, or our systems;</li>
            <li>Reverse engineer, scrape, or copy the Service or its underlying software;</li>
            <li>Resell, sublicense, or share your account access with third parties;</li>
            <li>Interfere with or disrupt the integrity or performance of the Service.</li>
          </ul>
          <p>We may suspend or terminate accounts that violate these Terms.</p>
        </Section>

        <Section n="8." title="Our Intellectual Property">
          <p>The Service — including its software, design, features, branding, and content we create — is owned by
          Allegory Studio and protected by intellectual property laws. These Terms do not grant you any rights to our
          trademarks, logos, or platform technology beyond the limited right to use the Service as intended.</p>
        </Section>

        <Section n="9." title="Service Availability &amp; Changes">
          <p>We work to keep the Service available and reliable, but we do not guarantee uninterrupted access. We may
          modify, add, or remove features from time to time. If we materially reduce the Service, we will make
          reasonable efforts to notify you.</p>
        </Section>

        <Section n="10." title="Disclaimers">
          <p className="uppercase text-[13px] tracking-wide">The Service is provided "as is" and "as available." To the
          fullest extent permitted by law, we disclaim all warranties, express or implied. We do not warrant that the
          Service will be error-free, secure, or uninterrupted, or that AI-generated content will be accurate or
          suitable for your purposes.</p>
        </Section>

        <Section n="11." title="Limitation of Liability">
          <p className="uppercase text-[13px] tracking-wide">To the fullest extent permitted by law, Allegory Studio will
          not be liable for any indirect, incidental, special, consequential, or punitive damages, or for lost profits,
          lost data, or business interruption, arising from your use of the Service. Our total liability for any claim
          arising from these Terms or the Service will not exceed the amount you paid us in the twelve (12) months
          preceding the claim.</p>
          <p>Some jurisdictions do not allow certain limitations of liability, so some of the above may not apply to you.</p>
        </Section>

        <Section n="12." title="Indemnification">
          <p>You agree to indemnify and hold Allegory Studio harmless from claims, damages, and expenses (including
          reasonable attorneys' fees) arising from Your Content, your use of the Service, or your violation of these Terms.</p>
        </Section>

        <Section n="13." title="Termination">
          <p>You may close your account at any time. We may suspend or terminate your access if you violate these Terms,
          fail to pay applicable fees, or if we discontinue the Service (with reasonable notice in the latter case). Upon
          termination, your right to use the Service ends, and Sections 4 (Export &amp; Deletion), 8, 10, 11, 12, and 15 survive.</p>
        </Section>

        <Section n="14." title="Changes to These Terms">
          <p>We may update these Terms from time to time. If we make material changes, we will notify you by email or
          through the Service at least 30 days before the changes take effect. Continued use of the Service after changes
          take effect constitutes acceptance.</p>
        </Section>

        <Section n="15." title="Governing Law &amp; Disputes">
          <p>These Terms are governed by the laws of the State of South Carolina, without regard to conflict-of-law
          principles. Any disputes will be resolved in the state or federal courts located in Charleston County, South
          Carolina, and you consent to their jurisdiction.</p>
        </Section>

        <Section n="16." title="Miscellaneous">
          <p>These Terms, together with our{" "}
          <Link to="/privacy" className="text-[#2c533f] underline">Privacy Policy</Link>, constitute the entire agreement
          between you and Allegory Studio regarding the Service. If any provision is found unenforceable, the remainder
          remains in effect. Our
          failure to enforce any provision is not a waiver. You may not assign these Terms without our consent; we may
          assign them in connection with a merger, acquisition, or sale of assets.</p>
        </Section>

        <Section n="17." title="Contact">
          <p>Questions about these Terms? Reach us at:</p>
          <p>Allegory Studio, LLC<br />[Business address]<br />
          <a href="mailto:hello@allegoryartstudio.com" className="text-[#2c533f] underline">hello@allegoryartstudio.com</a></p>
        </Section>

        <div className="mt-12 pt-6 border-t border-[#d8d2c6] text-xs text-[#6b746d]">
          © 2026 Allegory Art Studio, LLC. All rights reserved. · <Link to="/" className="underline hover:text-[#11281c]">Home</Link>
        </div>
      </div>
    </div>
  );
}
