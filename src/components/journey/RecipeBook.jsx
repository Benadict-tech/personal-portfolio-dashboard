"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Clock } from "lucide-react";
import { RECIPE_CATEGORIES, RECIPES } from "@/lib/recipes";

// The parchment-style recipe library — warm cards, lavender labels,
// gold highlights, clear steps and hair-focused nutrition notes.
export default function RecipeBook() {
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState(null);
  const list = cat === "All" ? RECIPES : RECIPES.filter((r) => r.category === cat);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5">
        {RECIPE_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              cat === c ? "btn-love" : "bg-blush text-wine hover:bg-line"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {list.map((r) => (
          <article key={r.id} className="parchment overflow-hidden">
            <div className="h-28 flex items-center justify-center text-6xl bg-gold/10">
              <span role="img" aria-label="">{r.emoji}</span>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-romantic text-2xl text-wine leading-tight">{r.name}</h3>
                  <p className="text-xs opacity-70 mt-0.5">{r.tagline}</p>
                </div>
                <span className="shrink-0 px-2.5 py-1 rounded-full bg-lav/50 text-wine text-[10px] font-bold uppercase tracking-wide">
                  {r.category}
                </span>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] opacity-60">
                <Clock size={11} /> {r.minutes} min · {r.nutrition}
              </p>

              <button
                onClick={() => setOpen(open === r.id ? null : r.id)}
                className="mt-3 flex items-center gap-1 text-xs font-bold text-rose-deep hover:underline"
              >
                {open === r.id ? "Hide recipe" : "View recipe"}
                <ChevronDown size={13} className={`transition-transform ${open === r.id ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence initial={false}>
                {open === r.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 grid gap-4 sm:grid-cols-2 text-sm">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-gold mb-1.5">Ingredients</h4>
                        <ul className="space-y-1 text-xs opacity-85">
                          {r.ingredients.map((i) => (
                            <li key={i}>· {i}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-gold mb-1.5">Steps</h4>
                        <ol className="space-y-1 text-xs opacity-85 list-decimal list-inside">
                          {r.steps.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ol>
                      </div>
                    </div>
                    <p className="mt-3 text-xs rounded-xl bg-lav/30 p-2.5 text-wine">
                      💜 {r.forHair}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
