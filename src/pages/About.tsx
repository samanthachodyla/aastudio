import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";

const LINKEDIN = "https://www.linkedin.com/in/cara-alford-34471217/";
const CONSULTING = "https://allegoryartconsulting.com";

/**
 * Public founder / About page. Gives Allegory Art Studio a real on-site entity
 * for its founder (helps SEO/AEO and brand trust), covering Cara Alford's
 * background in arts administration and why she built the studio. Linked from
 * the landing footer and the sitemap.
 */
const About = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Seo
        title="About the Founder — Allegory Art Studio"
        description="Allegory Art Studio was founded by Cara Alford, an arts administrator with 15+ years helping working artists run the business side of their practice."
        canonicalPath="/about"
      />

      <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-16">
        <div className="mb-10">
          <div className="eyebrow text-muted-foreground mb-4">Allegory Art Studio</div>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight">Meet the founder</h1>
        </div>

        <div className="hairline-card p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start mb-10">
          <img
            src="/founder.jpg"
            alt="Cara Alford, founder of Allegory Art Studio"
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-sm object-cover border border-border shrink-0"
          />
          <div>
            <h2 className="font-display text-2xl tracking-tight">Cara Alford</h2>
            <div className="eyebrow text-muted-foreground mt-1">Founder · Allegory Studio, LLC</div>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Fifteen-plus years in arts administration — spent on the business side of the studio,
              right alongside the artists doing the work.
            </p>
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              <a href={LINKEDIN} target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-foreground">
                LinkedIn ↗
              </a>
              <a href={CONSULTING} target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-foreground">
                Allegory Art Consulting ↗
              </a>
            </div>
          </div>
        </div>

        <div className="prose-like space-y-5 text-[15px] leading-relaxed text-foreground/90">
          <p>
            Cara has spent more than fifteen years working with artists — not making the art, but
            handling everything around it: inventory and sales, consignments and galleries, deadlines,
            applications, and the steady stream of admin that comes with a working practice.
          </p>
          <p>
            In that time she saw the same pattern over and over. Deeply talented artists, buried in
            spreadsheets and sticky notes, spending evenings on paperwork instead of in the studio —
            and almost none of them in a position to hire a full-time studio manager to take it off
            their plate.
          </p>
          <p>
            Through her consulting practice,{" "}
            <a href={CONSULTING} target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-foreground">
              Allegory Art Consulting
            </a>
            , she did that work by hand — organizing studios, tracking work out in the world, pricing,
            and keeping artists ready for the next opportunity. Allegory Art Studio is that same
            support, built into software: the organization, reminders, and guidance of an arts
            administrator, at a fraction of the cost of hiring one.
          </p>

          <blockquote className="font-display text-2xl sm:text-[28px] leading-snug text-foreground border-l-2 border-foreground/20 pl-5 my-8">
            “Developed by an arts admin, for artists — so you can spend less time on the business of
            your practice, and more time making the work.”
          </blockquote>

          <p>
            Every part of the platform reflects how Cara actually works with artists: calm, practical,
            and built around the real rhythms of a studio — not generic business software bent to fit.
          </p>
        </div>

        <div className="hairline-card p-7 mt-12 text-center">
          <h3 className="font-display text-2xl tracking-tight">Run your practice like a professional studio.</h3>
          <p className="text-sm text-muted-foreground mt-3 max-w-md mx-auto">
            Start a 7-day free trial — card required, not charged until the trial ends, cancel anytime.
          </p>
          <a
            href="https://allegoryartstudio.com/#pricing"
            className="inline-block mt-5 rounded-sm bg-foreground text-background px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Start your free trial
          </a>
        </div>

        <div className="mt-10 text-center">
          <Link to="/" className="eyebrow text-muted-foreground hover:text-foreground">← Back to home</Link>
        </div>
      </main>
    </div>
  );
};

export default About;
