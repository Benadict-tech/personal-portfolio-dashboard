"use client";

import { useMemo } from "react";
import { Heart } from "lucide-react";

const COUNT = 12;

// Deterministic PRNG so server and client render the same hearts (no hydration mismatch)
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function FloatingHearts() {
  const hearts = useMemo(() => {
    const rand = mulberry32(42);
    return Array.from({ length: COUNT }, (_, i) => ({
      id: i,
      left: rand() * 100,
      size: 14 + rand() * 22,
      duration: 14 + rand() * 14,
      delay: -rand() * 20,
      opacity: 0.08 + rand() * 0.12,
    }));
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {hearts.map((h) => (
        <Heart
          key={h.id}
          className="absolute fill-rose text-rose animate-[floatUp_linear_infinite]"
          style={{
            left: `${h.left}%`,
            width: h.size,
            height: h.size,
            opacity: h.opacity,
            animationDuration: `${h.duration}s`,
            animationDelay: `${h.delay}s`,
            bottom: "-40px",
          }}
        />
      ))}
      <style jsx global>{`
        @keyframes floatUp {
          from {
            transform: translateY(0) rotate(0deg);
          }
          to {
            transform: translateY(-110vh) rotate(20deg);
          }
        }
      `}</style>
    </div>
  );
}
