/**
 * MY EVRYDAY — brand marks & illustrations.
 * Everything here is pure SVG/CSS so the site is fully self-contained
 * (no external photography to hotlink or break).
 */
import { CSSProperties } from "react";

/* -- Wordmark: "MY" heavy + "EVRYDAY" tracked, matching the brand board ---- */
export function Wordmark({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={`wordmark inline-flex items-baseline ${className}`} style={style} aria-label="My Evryday">
      <span style={{ letterSpacing: "0.02em" }}>MY</span>
      <span style={{ fontWeight: 500, letterSpacing: "0.22em", marginLeft: "0.16em" }}>EVRYDAY</span>
    </span>
  );
}

/* -- "ME" monogram mark ---------------------------------------------------- */
export function Monogram({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`font-display inline-block ${className}`}
      style={{ fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1, ...style }}
      aria-hidden="true"
    >
      ME
    </span>
  );
}

/* -- Sand-dollar motif (the little icon under the logo) -------------------- */
export function SandDollar({
  className = "",
  color = "currentColor",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Sand dollar">
      <circle cx="50" cy="50" r="46" fill={color} />
      <g fill="none" stroke="hsl(43 44% 96%)" strokeWidth="2.4" strokeLinecap="round">
        {/* five-petal keyhole flower */}
        <g>
          {[0, 72, 144, 216, 288].map((a) => (
            <path
              key={a}
              d="M50 50 C 46 34, 46 26, 50 20 C 54 26, 54 34, 50 50 Z"
              transform={`rotate(${a} 50 50)`}
              fill="hsl(43 44% 96%)"
              fillOpacity="0.9"
              stroke="none"
            />
          ))}
        </g>
        <circle cx="50" cy="50" r="3" fill="hsl(43 44% 96%)" stroke="none" />
        {/* radial dashes toward the rim */}
        {Array.from({ length: 20 }).map((_, i) => {
          const a = (i / 20) * Math.PI * 2;
          const r1 = 38, r2 = 43;
          return (
            <line
              key={i}
              x1={50 + Math.cos(a) * r1}
              y1={50 + Math.sin(a) * r1}
              x2={50 + Math.cos(a) * r2}
              y2={50 + Math.sin(a) * r2}
              strokeWidth="1.6"
            />
          );
        })}
      </g>
    </svg>
  );
}

/* -- Amber pump bottle (wash / cleanse) ------------------------------------ */
export function AmberBottle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 320" className={className} role="img" aria-label="Amber pump bottle">
      <defs>
        <linearGradient id="amber" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5a3320" />
          <stop offset="0.5" stopColor="#7a4526" />
          <stop offset="1" stopColor="#3f2415" />
        </linearGradient>
      </defs>
      {/* pump */}
      <rect x="86" y="8" width="28" height="34" rx="4" fill="#2b1b12" />
      <rect x="70" y="40" width="60" height="14" rx="5" fill="#241611" />
      <rect x="118" y="18" width="46" height="9" rx="4" fill="#2b1b12" />
      <rect x="90" y="52" width="20" height="20" fill="#241611" />
      {/* body */}
      <rect x="46" y="70" width="108" height="228" rx="16" fill="url(#amber)" />
      <rect x="46" y="70" width="108" height="228" rx="16" fill="none" stroke="#2b1b12" strokeWidth="2" />
      {/* highlight */}
      <rect x="58" y="86" width="14" height="196" rx="7" fill="#ffffff" opacity="0.10" />
      {/* label */}
      <rect x="62" y="150" width="76" height="96" rx="3" fill="hsl(43 44% 96%)" />
      <text x="100" y="205" textAnchor="middle" fontFamily="Archivo, sans-serif" fontWeight="800" fontSize="34" letterSpacing="-2" fill="#472e21">ME</text>
      <line x1="74" y1="222" x2="126" y2="222" stroke="#c9a97c" strokeWidth="1.4" />
    </svg>
  );
}

/* -- Dry-shampoo aerosol can (the flagship) -------------------------------- */
export function DryShampooCan({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 340" className={className} role="img" aria-label="My Evryday dry shampoo">
      <defs>
        <linearGradient id="can" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f3efe4" />
          <stop offset="0.5" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e4ded0" />
        </linearGradient>
      </defs>
      {/* cap */}
      <rect x="62" y="10" width="56" height="46" rx="8" fill="#d8d2c4" />
      <rect x="62" y="10" width="56" height="46" rx="8" fill="none" stroke="#c3bcaa" strokeWidth="1.5" />
      <rect x="70" y="54" width="40" height="10" fill="#cfc8b8" />
      {/* body */}
      <rect x="40" y="62" width="100" height="266" rx="14" fill="url(#can)" stroke="#d5cdbc" strokeWidth="1.5" />
      {/* shoulder + base rings */}
      <path d="M40 84 Q90 74 140 84" fill="none" stroke="#d5cdbc" strokeWidth="1.5" />
      <path d="M40 312 Q90 322 140 312" fill="none" stroke="#d5cdbc" strokeWidth="1.5" />
      {/* vertical wordmark */}
      <g transform="rotate(90 90 200)">
        <text x="90" y="200" textAnchor="middle" fontFamily="Archivo, sans-serif" fontSize="22" fill="#472e21">
          <tspan fontWeight="800" letterSpacing="1">MY</tspan>
          <tspan fontWeight="500" letterSpacing="5" dx="7">EVRYDAY</tspan>
        </text>
      </g>
      <text x="90" y="300" textAnchor="middle" fontFamily="Archivo, sans-serif" fontWeight="600" fontSize="9" letterSpacing="3" fill="#8a6f52">DRY SHAMPOO</text>
    </svg>
  );
}

/* -- Botanical sprig (line art accent) ------------------------------------- */
export function Sprig({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  const leaves = Array.from({ length: 7 });
  return (
    <svg viewBox="0 0 120 260" className={className} role="presentation" aria-hidden="true">
      <path d="M60 254 C60 200 60 120 60 8" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {leaves.map((_, i) => {
        const y = 40 + i * 28;
        const dir = i % 2 === 0 ? 1 : -1;
        return (
          <path
            key={i}
            d={`M60 ${y} C ${60 + dir * 30} ${y - 18}, ${60 + dir * 46} ${y - 6}, ${60 + dir * 40} ${y + 12} C ${60 + dir * 22} ${y + 10}, ${60 + dir * 8} ${y + 6}, 60 ${y}`}
            fill={color}
            fillOpacity="0.85"
          />
        );
      })}
    </svg>
  );
}

/* -- Eucalyptus round-leaf branch ------------------------------------------ */
export function Eucalyptus({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 300 120" className={className} role="presentation" aria-hidden="true">
      <path d="M4 60 C 90 40, 200 44, 296 30" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {Array.from({ length: 8 }).map((_, i) => {
        const x = 30 + i * 32;
        const y = 58 - i * 3.5;
        const up = i % 2 === 0;
        return (
          <ellipse
            key={i}
            cx={x}
            cy={up ? y - 16 : y + 16}
            rx="14"
            ry="11"
            fill={color}
            fillOpacity="0.85"
            transform={`rotate(${up ? -18 : 18} ${x} ${up ? y - 16 : y + 16})`}
          />
        );
      })}
    </svg>
  );
}
