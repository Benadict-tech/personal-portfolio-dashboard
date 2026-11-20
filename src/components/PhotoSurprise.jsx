"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WALL_PHOTOS, SURPRISE_LINES } from "@/lib/photos";
import { usePeople } from "@/lib/people";

const FIRST_DELAY = 15_000; // first peek ~15s in
const SHOW_MS = 10_000;
const NEXT_MIN = 80_000;
const NEXT_SPREAD = 50_000;

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default function PhotoSurprise() {
  const { partner } = usePeople();
  const [card, setCard] = useState(null);
  const timers = useRef([]);

  useEffect(() => {
    const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

    const pop = () => {
      setCard({ img: pick(WALL_PHOTOS), line: pick(SURPRISE_LINES) });
      later(() => {
        setCard(null);
        later(pop, NEXT_MIN + Math.random() * NEXT_SPREAD);
      }, SHOW_MS);
    };

    later(pop, FIRST_DELAY);
    const stash = timers.current;
    return () => stash.forEach(clearTimeout);
  }, []);

  const line = card ? card.line.replace("{name}", partner?.name || "love") : "";

  return (
    <AnimatePresence>
      {card && (
        <motion.div
          key={card.img}
          initial={{ y: 140, opacity: 0, rotate: 10 }}
          animate={{ y: 0, opacity: 1, rotate: -3 }}
          exit={{ y: 140, opacity: 0, rotate: 8 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="fixed bottom-5 right-5 z-40 w-52 sm:w-60 cursor-pointer"
          onClick={() => setCard(null)}
        >
          <div className="relative bg-white p-2 pb-3 rounded-md shadow-2xl ring-1 ring-black/10 rotate-[-2deg]">
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 rounded-[2px] rotate-2"
              style={{ background: "rgba(245, 222, 179, 0.9)", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
            />
            <div className="relative w-full aspect-[4/5] overflow-hidden rounded-sm bg-blush">
              <Image src={card.img} alt="us" fill sizes="240px" className="object-cover" style={{ objectPosition: "50% 25%" }} />
            </div>
            <p className="mt-2.5 px-1 text-center font-romantic text-lg leading-tight text-wine">{line}</p>
            <span className="absolute top-1.5 right-1.5 text-[10px] opacity-50">✕</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
