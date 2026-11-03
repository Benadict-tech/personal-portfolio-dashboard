"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, HeartHandshake, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { runQuery, useTable } from "@/lib/db";
import { usePeople } from "@/lib/people";
import { heartConfetti } from "@/lib/confetti";
import { timeAgo } from "@/lib/moods";
import { useToast } from "@/lib/toast";

const MILESTONES = [
  { at: 25, label: "Spark", emoji: "💫" },
  { at: 50, label: "Inseparable", emoji: "💞" },
  { at: 75, label: "Devoted", emoji: "💘" },
  { at: 100, label: "Forever", emoji: "💍" },
];

export default function LoveMeter() {
  const { me, mePerson, partner } = usePeople();
  const { rows: meterRows } = useTable("love_meter");
  const { rows: log } = useTable("love_log");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const meter = meterRows[0];
  const value = meter?.value ?? 0;
  const recent = [...log].sort((a, b) => b.id - a.id).slice(0, 5);

  const nameOf = (slot) =>
    slot === me?.slot ? me.name : partner?.name || (slot === "a" ? "Heart One" : "Heart Two");

  const addLove = async (amount) => {
    if (!supabase || !me || busy || value >= 100) return;
    setBusy(true);
    const next = Math.min(100, value + amount);
    const ok = await runQuery(
      supabase
        .from("love_meter")
        .update({ value: next, updated_by: me.slot, updated_at: new Date().toISOString() })
        .eq("id", 1),
      toast
    );
    if (ok) {
      await supabase
        .from("love_log")
        .insert({ added_by: me.slot, amount: next - value, value_after: next });
      const crossed = MILESTONES.find((m) => value < m.at && next >= m.at);
      if (crossed) {
        heartConfetti();
        toast(
          crossed.at === 100
            ? "100% — Forever 💍"
            : `${crossed.at}% — ${crossed.label} ${crossed.emoji}`
        );
      }
    }
    setBusy(false);
  };

  return (
    <div className="card mt-8 p-6 overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold text-wine text-lg flex items-center gap-2">
          <HeartHandshake size={20} className="text-rose-deep" /> Our Love
        </h2>
        <div className="font-romantic text-4xl text-rose-deep leading-none">{value}%</div>
      </div>
      <p className="mt-1 text-xs opacity-60">
        It grows a little every time one of us pours more love in — no hurry, we have forever.
      </p>

      {/* the bar */}
      <div className="relative mt-6 mb-8">
        <div className="h-5 rounded-full bg-soft border border-line overflow-visible relative">
          <motion.div
            className="relative h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, var(--accent), var(--accent-2))",
              boxShadow: "0 0 18px color-mix(in srgb, var(--accent) 55%, transparent)",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 15 }}
          >
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="love-shimmer absolute inset-y-0 w-1/3" />
            </div>
            {value > 0 && (
              <motion.div
                className="absolute -top-3 right-0 translate-x-1/2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.2 }}
              >
                <Heart
                  size={value >= 100 ? 26 : 20}
                  className={`fill-rose-deep text-rose-deep drop-shadow-md ${value < 100 ? "animate-pulse" : ""}`}
                />
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* milestone markers */}
        {MILESTONES.map((m) => {
          const reached = value >= m.at;
          return (
            <div key={m.at} className="absolute" style={{ left: `${m.at}%` }}>
              <div
                className={`w-2.5 h-2.5 rounded-full border-2 -translate-x-1/2 mt-2 transition-colors ${
                  reached ? "bg-rose-deep border-rose-deep" : "bg-card border-line"
                }`}
              />
              <div
                className={`mt-1 -translate-x-1/2 text-center whitespace-nowrap transition-all ${
                  reached ? "opacity-100" : "opacity-40"
                }`}
              >
                <div className="text-sm leading-none">{m.emoji}</div>
                <div className="text-[10px] font-bold text-wine">{m.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* controls */}
      <div className="flex items-center justify-center gap-2">
        {value >= 100 ? (
          <span className="px-5 py-2 rounded-full bg-blush text-wine font-bold text-sm">
            💍 Forever — and still counting
          </span>
        ) : (
          <>
            <button className="btn-love text-sm" onClick={() => addLove(1)} disabled={!me || busy}>
              <Heart size={14} className="fill-current" /> Pour +1%
            </button>
            <button className="btn-ghost text-sm" onClick={() => addLove(5)} disabled={!me || busy}>
              <Plus size={14} /> +5%
            </button>
          </>
        )}
      </div>
      <p className="mt-2 text-center text-[11px] opacity-60">
        {meter?.updated_by
          ? `Last drop of love by ${nameOf(meter.updated_by)} · ${timeAgo(meter.updated_at)}`
          : me
          ? "Be the first to pour some love in"
          : "Pick your heart to pour some love in"}
      </p>

      {/* little history */}
      {recent.length > 0 && (
        <div className="mt-5 pt-4 border-t border-line space-y-1">
          {recent.map((l) => (
            <div key={l.id} className="flex items-center gap-2 text-xs opacity-70">
              <Heart size={10} className="fill-rose text-rose shrink-0" />
              <span className="font-semibold text-wine">{nameOf(l.added_by)}</span>
              <span>poured +{l.amount}% → {l.value_after}%</span>
              <span className="ml-auto opacity-70">{timeAgo(l.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
