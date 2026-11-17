import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { computePricing, money, num, type PricingInputs } from "@/lib/pricing";

/**
 * In-app Artwork Pricing Calculator (Sales & Finance → Calculator). Same formula
 * as the public /pricing-calculator page (shared from @/lib/pricing), rendered in
 * the studio's own look — no marketing chrome, no email capture.
 */
export function ArtworkPricingCalculator() {
  const [w, setW] = useState("24");
  const [h, setH] = useState("36");
  const [perInch, setPerInch] = useState("4");
  const [materials, setMaterials] = useState("60");
  const [framing, setFraming] = useState("0");
  const [commission, setCommission] = useState("40");
  const [hours, setHours] = useState("");
  const [rate, setRate] = useState("");

  const inputs: PricingInputs = { w, h, perInch, materials, framing, commission, hours, rate };
  const calc = useMemo(() => computePricing(inputs), [w, h, perInch, materials, framing, commission, hours, rate]);

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      {/* Inputs */}
      <div className="hairline-card p-6 grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pc-w">Width (inches)</Label>
            <Input id="pc-w" type="number" min="0" inputMode="decimal" value={w} onChange={(e) => setW(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="pc-h">Height (inches)</Label>
            <Input id="pc-h" type="number" min="0" inputMode="decimal" value={h} onChange={(e) => setH(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="pc-pi">Price per inch ($)</Label>
          <Input id="pc-pi" type="number" min="0" inputMode="decimal" value={perInch} onChange={(e) => setPerInch(e.target.value)} />
          <p className="text-[11px] text-muted-foreground mt-1">Starting out? Try $2–$6. Raise it as your sales history and demand grow.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pc-mat">Materials ($)</Label>
            <Input id="pc-mat" type="number" min="0" inputMode="decimal" value={materials} onChange={(e) => setMaterials(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="pc-fr">Framing ($)</Label>
            <Input id="pc-fr" type="number" min="0" inputMode="decimal" value={framing} onChange={(e) => setFraming(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="pc-com">Gallery commission (%)</Label>
          <Input id="pc-com" type="number" min="0" max="100" inputMode="decimal" value={commission} onChange={(e) => setCommission(e.target.value)} />
          <p className="text-[11px] text-muted-foreground mt-1">Most galleries take 40–50%. Set 0 for a direct/studio sale.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pc-hrs">Hours spent (optional)</Label>
            <Input id="pc-hrs" type="number" min="0" inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="pc-rate">Your hourly rate ($, optional)</Label>
            <Input id="pc-rate" type="number" min="0" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Result */}
      <div className="hairline-card p-6 bg-surface/30">
        <div className="eyebrow mb-2">Suggested retail price</div>
        <div className="font-display text-5xl tracking-tight mb-5">{money(calc.retail)}</div>
        <ul className="text-sm divide-y divide-border">
          <li className="flex justify-between gap-4 py-2">
            <span className="text-muted-foreground">Size ({num(w) + num(h)}″ total × ${num(perInch)}/in)</span>
            <span className="tabular-nums">{money(calc.base)}</span>
          </li>
          <li className="flex justify-between gap-4 py-2">
            <span className="text-muted-foreground">Materials</span>
            <span className="tabular-nums">{money(num(materials))}</span>
          </li>
          <li className="flex justify-between gap-4 py-2">
            <span className="text-muted-foreground">Framing</span>
            <span className="tabular-nums">{money(num(framing))}</span>
          </li>
          <li className="flex justify-between gap-4 py-2">
            <span className="text-muted-foreground">You keep after {num(commission)}% gallery cut</span>
            <span className="tabular-nums font-medium">{money(calc.net)}</span>
          </li>
          {calc.timeValue > 0 && (
            <li className="flex justify-between gap-4 py-2">
              <span className="text-muted-foreground">Time check ({num(hours)}h × ${num(rate)})</span>
              <span className="tabular-nums">{money(calc.timeValue)}</span>
            </li>
          )}
        </ul>
        <p className="text-xs text-muted-foreground mt-5">
          A starting point, not a rule. Keep the same formula across a body of work so your prices scale together, and
          raise prices deliberately as demand grows.{" "}
          <Link to="/resources/how-to-price" className="underline underline-offset-2 hover:text-foreground">Read the full pricing guide →</Link>
        </p>
      </div>
    </div>
  );
}
