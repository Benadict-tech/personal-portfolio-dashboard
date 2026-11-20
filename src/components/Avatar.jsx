"use client";

import Image from "next/image";
import { avatarOf } from "@/lib/photos";

// circular face avatar for a heart slot — falls back to the person's emoji
export default function Avatar({ slot, img, emoji, size = 28, className = "" }) {
  const src = img || avatarOf(slot);
  if (!src) return <span className={className}>{emoji}</span>;
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className={`rounded-full object-cover ring-2 ring-rose/40 shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
