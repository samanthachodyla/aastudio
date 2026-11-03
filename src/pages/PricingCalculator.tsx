import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import "@/styles/marketing.css";

const money = (n: number) => "$" + Math.round(Math.max(0, n)).toLocaleString("en-US");
const round5 = (n: number) => Math.max(0, Math.round(n / 5) * 5);
const num = (v: string) => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

/**
 * Free art pricing calculator (the "pricing worksheet as a tool" from the SEO
 * plan). Interactive, and it captures leads: the "email me the worksheet" form
 * posts to /api/subscribe, so every use can grow the list. Targets "art pricing
 * calculator" search intent.
 */
export default function PricingCalculator() {
  const [w, setW] = useState("24");
  const [h, setH] = useState("36");
  const [perInch, setPerInch] = useState("4");
  const [materials, setMaterials] = useState("60");
  const [framing, setFraming] = useState("0");
  const [commission, setCommission] = useState("40");
  const [hours, setHours] = useState("");
  const [rate, setRate] = useState("");

  const calc = useMemo(() => {
    const base = (num(w) + num(h)) * num(perInch);
    const subtotal = base + num(materials) + num(framing);
    const retail = round5(subtotal);
    const net = retail * (1 - num(commission) / 100);
    const timeValue = num(hours) * num(rate);
    return { base, subtotal, retail, net, timeValue };
  }, [w, h, perInch, materials, framing, commission, hours, rate]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setErr("Please add a valid email.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          first_name: name.trim(),
          source: "pricing-calculator",
          event_name: "Lead",
          event_source_url: window.location.href,
          referrer: document.referrer || "",
          user_agent: navigator.userAgent,
        }),
      });
      if (!res.ok) throw new Error("subscribe failed");
      setSent(true);
    } catch {
      setErr("Something went wrong. Try again, or email hello@allegoryartstudio.com.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="aas-mkt">
      <Seo
        title="Art Pricing Calculator | Allegory Art Studio"
        description="A free art pricing calculator for artists: get a consistent, defensible price for any piece from its size, materials, and your rate, and see what you keep after a gallery commission."
        canonicalPath="/pricing-calculator"
      />
      <header className="mast">
        <div className="wrap">
          <Link className="brand" to="/" aria-label="Allegory Art Studio home">
            <img className="logo" src="/Allegory_Studio_Logo.png" alt="Allegory Art Studio" />
          </Link>
          <nav aria-label="Primary">
            <Link to="/">Home</Link>
            <Link to="/features">Features</Link>
            <Link to="/plans">Plans</Link>
            <Link to="/resources">Resources</Link>
          </nav>
          <span className="spacer" />
          <Link className="app" to="/#pricing">Start free trial →</Link>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="wrap">
            <div className="eyebrow">Free tool</div>
            <h1>Art pricing calculator</h1>
            <p className="lead">
              Get a consistent, defensible price for any piece, from its size, materials, and your rate.
              Then see what you keep after a gallery takes its cut.
            </p>
            <div className="accent" />
          </div>
        </section>

        <section className="block">
          <div className="wrap">
            <div className="calc">
              <div className="calc-panel">
                <div className="calc-row">
                  <div className="calc-field">
                    <label htmlFor="pc-w">Width (inches)</label>
                    <input id="pc-w" type="number" min="0" value={w} onChange={(e) => setW(e.target.value)} />
                  </div>
                  <div className="calc-field">
                    <label htmlFor="pc-h">Height (inches)</label>
                    <input id="pc-h" type="number" min="0" value={h} onChange={(e) => setH(e.target.value)} />
                  </div>
                </div>
                <div className="calc-field">
                  <label htmlFor="pc-pi">Price per inch ($)</label>
                  <input id="pc-pi" type="number" min="0" value={perInch} onChange={(e) => setPerInch(e.target.value)} />
                  <div className="hint">Starting out? Try $2–$6. Raise it as your sales history and demand grow.</div>
                </div>
                <div className="calc-row">
                  <div className="calc-field">
                    <label htmlFor="pc-mat">Materials ($)</label>
                    <input id="pc-mat" type="number" min="0" value={materials} onChange={(e) => setMaterials(e.target.value)} />
                  </div>
                  <div className="calc-field">
                    <label htmlFor="pc-fr">Framing ($)</label>
                    <input id="pc-fr" type="number" min="0" value={framing} onChange={(e) => setFraming(e.target.value)} />
                  </div>
                </div>
                <div className="calc-field">
                  <label htmlFor="pc-com">Gallery commission (%)</label>
                  <input id="pc-com" type="number" min="0" max="100" value={commission} onChange={(e) => setCommission(e.target.value)} />
                  <div className="hint">Most galleries take 40–50%. Set 0 for a direct/studio sale.</div>
                </div>
                <div className="calc-row">
                  <div className="calc-field">
                    <label htmlFor="pc-hrs">Hours spent (optional)</label>
                    <input id="pc-hrs" type="number" min="0" value={hours} onChange={(e) => setHours(e.target.value)} />
                  </div>
                  <div className="calc-field">
                    <label htmlFor="pc-rate">Your hourly rate ($, optional)</label>
                    <input id="pc-rate" type="number" min="0" value={rate} onChange={(e) => setRate(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="result">
                <div className="label">Suggested retail price</div>
                <div className="big">{money(calc.retail)}</div>
                <ul>
                  <li><span>Size ({num(w) + num(h)}″ total × ${num(perInch)}/in)</span><span>{money(calc.base)}</span></li>
                  <li><span>Materials</span><span>{money(num(materials))}</span></li>
                  <li><span>Framing</span><span>{money(num(framing))}</span></li>
                  <li><span>You keep after {num(commission)}% gallery cut</span><span>{money(calc.net)}</span></li>
                  {calc.timeValue > 0 && (
                    <li><span>Time check ({num(hours)}h × ${num(rate)})</span><span>{money(calc.timeValue)}</span></li>
                  )}
                </ul>

                <div className="capture">
                  {sent ? (
                    <p className="cap-done">You're in! The full pricing worksheet and studio tips are on their way to your inbox. ✦</p>
                  ) : (
                    <form onSubmit={submit}>
                      <div className="cap-title">Email me the full pricing worksheet</div>
                      <input type="text" placeholder="First name" value={name} onChange={(e) => setName(e.target.value)} aria-label="First name" autoComplete="given-name" />
                      <input type="email" placeholder="you@studio.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email address" autoComplete="email" required />
                      <button className="btn" type="submit" disabled={busy}>{busy ? "Sending…" : "Send it to me"}</button>
                      {err && <p className="cap-err">{err}</p>}
                      <p className="cap-fine">Plus studio tips and new opportunities. Unsubscribe anytime.</p>
                    </form>
                  )}
                </div>
              </div>
            </div>

            <p className="calc-note">
              A starting point, not a rule. Keep the same formula across a body of work so your prices scale
              together, and raise prices deliberately as demand grows. <Link to="/resources/how-to-price">Read the full pricing guide →</Link>
            </p>
          </div>
        </section>

        <div className="wrap">
          <section className="cta">
            <h2>Price every piece in seconds.</h2>
            <p>Allegory Art Studio remembers your formula and prices new work from your own sales history. Start your free trial.</p>
            <Link className="btn" to="/#pricing">Start your 7-day free trial</Link>
            <div className="sub">Card required · not charged until the trial ends · cancel anytime</div>
          </section>
        </div>

        <footer>
          <span>© Allegory Studio, LLC</span>
          <span className="spacer" />
          <Link to="/">Home</Link>
          <Link to="/features">Features</Link>
          <Link to="/plans">Plans</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/resources">Resources</Link>
        </footer>
      </main>
    </div>
  );
}
