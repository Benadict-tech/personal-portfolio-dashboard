"use client";

import Image from "next/image";
import { motion } from "framer-motion";

// a polaroid hung on the wall — tape on top, gentle sway
export default function HangingPhoto({
  img,
  caption,
  size = 100,
  rotate = 0,
  pos = "50% 25%",
  string = 0,
  className = "",
}) {
  // stable per-photo sway so it doesn't change every render
  const duration = 4.5 + (img.length % 3);
  return (
    <motion.div
      initial={{ rotate }}
      animate={{ rotate: [rotate - 1.2, rotate + 1.2, rotate - 1.2] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformOrigin: "top center", width: size }}
      className={className}
    >
      {string > 0 && <div className="mx-auto w-px bg-amber-900/30" style={{ height: string }} />}
      <div className="relative bg-white p-1.5 pb-5 rounded-sm shadow-lg ring-1 ring-black/5">
        <div
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-12 h-4 rounded-[2px] rotate-3"
          style={{ background: "rgba(245, 222, 179, 0.85)", boxShadow: "0 1px 2px rgba(0,0,0,0.15)" }}
        />
        <div className="relative w-full aspect-[4/5] overflow-hidden bg-blush">
          <Image src={img} alt="" fill sizes={`${size}px`} className="object-cover" style={{ objectPosition: pos }} />
        </div>
        {caption && (
          <p className="absolute bottom-0.5 inset-x-0 text-center text-[9px] font-semibold text-wine/70 truncate px-1">
            {caption}
          </p>
        )}
      </div>
    </motion.div>
  );
}
