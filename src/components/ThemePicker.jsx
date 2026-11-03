"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Palette } from "lucide-react";
import { THEMES, useTheme } from "@/lib/theme";

export default function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full text-wine hover:bg-blush transition-colors"
        title="Change theme"
        aria-label="Change theme"
      >
        <Palette size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="card absolute right-0 top-11 w-64 p-2 z-50"
          >
            {THEMES.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setTheme(t.key);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
                  theme === t.key ? "bg-blush" : "hover:bg-blush/60"
                }`}
              >
                <span className="flex -space-x-1.5 shrink-0">
                  {t.swatches.map((c) => (
                    <span
                      key={c}
                      className="w-5 h-5 rounded-full border-2 border-card"
                      style={{ background: c }}
                    />
                  ))}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold text-wine">{t.label}</span>
                  <span className="block text-xs opacity-60">{t.desc}</span>
                </span>
                {theme === t.key && <Check size={15} className="text-rose-deep shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
