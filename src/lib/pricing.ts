// Shared Artwork Pricing Calculator logic — used by BOTH the public marketing
// page (/pricing-calculator) and the in-app tool (Sales & Finance → Calculator),
// so the two always compute a price the same way. Change the formula here once.

export const money = (n: number) => "$" + Math.round(Math.max(0, n)).toLocaleString("en-US");
export const round5 = (n: number) => Math.max(0, Math.round(n / 5) * 5);
export const num = (v: string) => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

export interface PricingInputs {
  w: string;
  h: string;
  perInch: string;
  materials: string;
  framing: string;
  commission: string;
  hours: string;
  rate: string;
}

export interface PricingResult {
  base: number;
  subtotal: number;
  retail: number;
  net: number;
  timeValue: number;
}

export function computePricing(i: PricingInputs): PricingResult {
  const base = (num(i.w) + num(i.h)) * num(i.perInch);
  const subtotal = base + num(i.materials) + num(i.framing);
  const retail = round5(subtotal);
  const net = retail * (1 - num(i.commission) / 100);
  const timeValue = num(i.hours) * num(i.rate);
  return { base, subtotal, retail, net, timeValue };
}
