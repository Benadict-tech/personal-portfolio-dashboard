"use client";

import Image from "next/image";

// wallpaper banner for page tops — image + soft veil + romantic title
export default function PageHero({ img, title, caption, pos = "50% 50%" }) {
  return (
    <div className="relative -mx-4 overflow-hidden rounded-3xl h-44 sm:h-52 flex items-end justify-center mb-8">
      <Image src={img} alt="" fill sizes="100vw" priority className="object-cover" style={{ objectPosition: pos }} />
      <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-background/20" />
      <div className="relative pb-5 text-center">
        <h1 className="font-romantic text-5xl sm:text-6xl text-wine drop-shadow-sm">{title}</h1>
        {caption && <p className="text-xs sm:text-sm opacity-70 mt-1">{caption}</p>}
      </div>
    </div>
  );
}
