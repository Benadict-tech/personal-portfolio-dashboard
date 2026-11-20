"use client";

import HangingPhoto from "@/components/HangingPhoto";

const ROTS = [-6, 4, -3, 6, -5, 3];

// tiny polaroids clipped along a string — a photo garland divider
export default function PhotoGarland({ photos, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-x-2 top-0 h-px bg-amber-900/25" />
      <div className="flex items-start justify-center gap-4 sm:gap-8">
        {photos.map((p, i) => (
          <HangingPhoto
            key={p}
            img={p}
            size={62}
            rotate={ROTS[i % ROTS.length]}
            string={10 + (i % 3) * 9}
          />
        ))}
      </div>
    </div>
  );
}
