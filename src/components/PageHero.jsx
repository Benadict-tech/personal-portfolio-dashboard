"use client";

import HangingPhoto from "@/components/HangingPhoto";

// page header — clean title flanked by little pinned photos + one dangling below
export default function PageHero({ title, caption, pins = [] }) {
  return (
    <div className="relative mb-10 pt-3 text-center">
      <div className="flex items-center justify-center gap-3 sm:gap-8">
        {pins[0] && (
          <HangingPhoto img={pins[0]} size={58} rotate={-8} className="hidden sm:block shrink-0" />
        )}
        <div>
          <h1 className="font-romantic text-5xl sm:text-6xl text-wine drop-shadow-sm">{title}</h1>
          {caption && <p className="text-xs sm:text-sm opacity-70 mt-1">{caption}</p>}
        </div>
        {pins[1] && (
          <HangingPhoto img={pins[1]} size={58} rotate={7} className="hidden sm:block shrink-0" />
        )}
      </div>
      {pins[2] && (
        <HangingPhoto
          img={pins[2]}
          size={50}
          rotate={5}
          string={10}
          className="absolute -bottom-8 right-2 sm:right-14"
        />
      )}
    </div>
  );
}
