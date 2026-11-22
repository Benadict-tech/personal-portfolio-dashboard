"use client";

import { useMemo } from "react";

// Original floating-lantern artwork — a warm paper lantern drawn in SVG.
export function Lantern({ size = 40, className = "", lit = true }) {
  const h = size * 1.3;
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 48 62"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="lantern-core" cx="50%" cy="58%" r="55%">
          <stop offset="0%" stopColor={lit ? "#FFE9B0" : "#C9B8E8"} />
          <stop offset="55%" stopColor={lit ? "#FBBF24" : "#8B7AB8"} />
          <stop offset="100%" stopColor={lit ? "#D97706" : "#5B4890"} />
        </radialGradient>
      </defs>
      {/* cap strings */}
      <line x1="24" y1="0" x2="24" y2="9" stroke="#B45309" strokeWidth="1.6" />
      {/* top + bottom caps */}
      <rect x="17" y="8" width="14" height="4" rx="2" fill="#92400E" />
      <rect x="17" y="51" width="14" height="4" rx="2" fill="#92400E" />
      {/* paper body */}
      <ellipse cx="24" cy="32" rx="17" ry="21" fill="url(#lantern-core)" />
      {/* ribs */}
      <path d="M10 22 Q24 26 38 22" stroke="#B45309" strokeOpacity="0.35" fill="none" />
      <path d="M8 32 Q24 36 40 32" stroke="#B45309" strokeOpacity="0.35" fill="none" />
      <path d="M10 42 Q24 46 38 42" stroke="#B45309" strokeOpacity="0.35" fill="none" />
      {/* inner light */}
      {lit && <circle cx="24" cy="35" r="6" fill="#FFF7D6" opacity="0.9" />}
    </svg>
  );
}

// A small Corona-inspired sun crest — circle + tapered rays, original artwork.
export function SunCrest({ size = 44, className = "" }) {
  const rays = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        const long = i % 2 === 0;
        const r1 = long ? 15 : 16.5;
        const r2 = long ? 21 : 18.5;
        return {
          x1: 24 + Math.cos(a) * r1,
          y1: 24 + Math.sin(a) * r1,
          x2: 24 + Math.cos(a) * r2,
          y2: 24 + Math.sin(a) * r2,
          w: long ? 2 : 1.2,
        };
      }),
    []
  );
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="sun-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE9B0" />
          <stop offset="70%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </radialGradient>
      </defs>
      {rays.map((r, i) => (
        <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke="#F59E0B" strokeWidth={r.w} strokeLinecap="round" />
      ))}
      <circle cx="24" cy="24" r="13" fill="url(#sun-core)" stroke="#D97706" strokeWidth="1" />
      <circle cx="24" cy="24" r="8" fill="none" stroke="#B45309" strokeOpacity="0.5" strokeWidth="0.8" />
    </svg>
  );
}

// A quiet festival sky — a few lanterns drifting, a few stars blinking.
// Pure SVG + CSS so it costs almost nothing and respects reduced-motion.
export default function FloatingLanterns({ count = 5, className = "" }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: 6 + ((i * 71) % 88),
        top: 12 + ((i * 37) % 55),
        size: 22 + ((i * 13) % 26),
        delay: (i * 1.3) % 6,
        dur: 5.5 + ((i * 7) % 4),
        opacity: 0.5 + ((i * 17) % 40) / 100,
      })),
    [count]
  );
  const stars = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        left: (i * 97) % 100,
        top: (i * 53) % 60,
        delay: (i * 0.7) % 3,
      })),
    []
  );
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {stars.map((s) => (
        <span
          key={`s${s.id}`}
          className="star-twinkle absolute w-1 h-1 rounded-full bg-gold"
          style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s` }}
        />
      ))}
      {items.map((l) => (
        <span
          key={l.id}
          className="lantern-float absolute"
          style={{
            left: `${l.left}%`,
            top: `${l.top}%`,
            opacity: l.opacity,
            animationDelay: `${l.delay}s`,
            animationDuration: `${l.dur}s`,
          }}
        >
          <span className="lantern-flicker block" style={{ animationDelay: `${l.delay * 0.6}s` }}>
            <Lantern size={l.size} />
          </span>
        </span>
      ))}
    </div>
  );
}
