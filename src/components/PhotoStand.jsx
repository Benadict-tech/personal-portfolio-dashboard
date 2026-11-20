"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const PHOTOS = [
  "/assets/us-1.jpeg", "/assets/us-4.jpeg", "/assets/us-6.jpeg", "/assets/us-8.jpeg",
  "/assets/us-10.jpeg", "/assets/us-13.jpeg", "/assets/us-14.jpeg", "/assets/us-16.jpeg",
  "/assets/us-17.jpeg", "/assets/us-19.jpeg", "/assets/us-20.jpeg", "/assets/us-22.jpeg",
];
const FLIP_MS = 4000;

// a desk flip-stand — ring-bound frame on an easel leg, pages turn on their own
export default function PhotoStand() {
  const [i, setI] = useState(0);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (held) return;
    const t = setInterval(() => setI((v) => (v + 1) % PHOTOS.length), FLIP_MS);
    return () => clearInterval(t);
  }, [i, held]);

  const flip = (d) => setI((v) => (v + d + PHOTOS.length) % PHOTOS.length);

  return (
    <div className="card mt-8 p-5 overflow-hidden">
      <div className="text-center">
        <h2 className="font-romantic text-3xl text-wine">Our photo stand</h2>
        <p className="text-xs opacity-60">flips through us, all day long</p>
      </div>

      <div className="relative mx-auto mt-2 h-[330px] w-[250px]">
        {/* easel leg behind the frame */}
        <div
          className="absolute left-1/2 top-24 h-60 w-2.5 rounded-full bg-amber-900/70"
          style={{ transform: "translateX(30px) rotate(14deg)", transformOrigin: "top center" }}
        />
        {/* desk shadow */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 h-3.5 w-56 rounded-full bg-black/15 blur-[3px]" />
        {/* desk */}
        <div className="absolute bottom-3 inset-x-0 h-2.5 rounded-full bg-gradient-to-r from-amber-800/70 via-amber-700/80 to-amber-800/70" />

        {/* the standing frame — tap to flip */}
        <button
          onClick={() => flip(1)}
          onMouseEnter={() => setHeld(true)}
          onMouseLeave={() => setHeld(false)}
          className="absolute inset-x-0 top-4 mx-auto block w-[212px] cursor-pointer"
          aria-label="Flip photo"
        >
          {/* binder rings */}
          <span className="absolute -top-2.5 left-10 z-10 h-5 w-3.5 rounded-full border-[3px] border-zinc-400 bg-transparent shadow-sm" />
          <span className="absolute -top-2.5 right-10 z-10 h-5 w-3.5 rounded-full border-[3px] border-zinc-400 bg-transparent shadow-sm" />

          <div className="relative -rotate-1 rounded-sm bg-white p-2 pb-9 shadow-xl ring-1 ring-black/10" style={{ perspective: 800 }}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2px] bg-blush">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={i}
                  initial={{ rotateX: -88, opacity: 0.4 }}
                  animate={{ rotateX: 0, opacity: 1 }}
                  exit={{ rotateX: 70, opacity: 0 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  style={{ transformOrigin: "top center", backfaceVisibility: "hidden" }}
                  className="absolute inset-0"
                >
                  <Image
                    src={PHOTOS[i]}
                    alt="us"
                    fill
                    sizes="200px"
                    className="object-cover"
                    style={{ objectPosition: "50% 25%" }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
            <p className="absolute bottom-2 inset-x-0 text-center font-romantic text-xl leading-none text-wine/80">
              us · {i + 1}/{PHOTOS.length}
            </p>
          </div>

          {/* prev / next nubs */}
          <span
            className="absolute left-[-14px] top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-wine shadow ring-1 ring-black/10 text-xs"
            onClick={(e) => { e.stopPropagation(); flip(-1); }}
          >
            ‹
          </span>
          <span
            className="absolute right-[-14px] top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-wine shadow ring-1 ring-black/10 text-xs"
            onClick={(e) => { e.stopPropagation(); flip(1); }}
          >
            ›
          </span>
        </button>
      </div>
    </div>
  );
}
