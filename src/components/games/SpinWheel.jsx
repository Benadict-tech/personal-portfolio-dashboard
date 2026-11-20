"use client";

import dynamic from "next/dynamic";
import { Sparkles, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { runQuery } from "@/lib/db";
import { heartConfetti } from "@/lib/confetti";
import { otherSlot } from "@/lib/identity";
import { SPIN_PRIZES, pickRandom } from "@/lib/games";

const RoulettePro = dynamic(() => import("react-roulette-pro"), { ssr: false });

const emojiImg = (emoji) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><text x="8" y="62" font-size="56">${emoji}</text></svg>`
  )}`;

const prizes = SPIN_PRIZES.map((p, i) => ({ id: i, image: emojiImg(p.emoji), text: p.text }));

export default function SpinWheel({ game, me, partner, nameOf, refresh, toast }) {
  const partnerName = partner?.name || "your partner";
  const b = (game && game.board) || {};
  const gameId = game ? game.id : null;
  const spinning = b.spin != null;
  const spinIdx = b.spin?.idx ?? 0;
  const spunByMe = spinning && b.spin.by === me?.slot;

  const start = async () => {
    if (!supabase || !me) return;
    await runQuery(
      supabase.from("games").insert({
        type: "wheel",
        status: "playing",
        x_slot: me.slot,
        o_slot: otherSlot(me.slot),
        board: { spin: null, last: null, count: 0 },
      }),
      toast,
      "Wheel's ready — first spin is yours 🎡"
    );
    refresh();
  };

  const spin = async () => {
    if (!supabase || !game || spinning) return;
    await runQuery(
      supabase
        .from("games")
        .update({
          board: { ...b, spin: { idx: pickRandom(SPIN_PRIZES), by: me.slot } },
          updated_at: new Date().toISOString(),
        })
        .eq("id", gameId),
      toast
    );
    refresh();
  };

  // fires on both screens when the strip stops — only the spinner
  // writes the result so we don't double-update
  const onPrizeDefined = async () => {
    if (!supabase || !game || !b.spin || !spunByMe) return;
    const ok = await runQuery(
      supabase
        .from("games")
        .update({
          board: {
            ...b,
            spin: null,
            last: { idx: b.spin.idx, by: b.spin.by },
            count: (b.count || 0) + 1,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", gameId),
      toast
    );
    if (ok) {
      heartConfetti();
      refresh();
    }
  };

  const end = async () => {
    if (!supabase || !game) return;
    await runQuery(supabase.from("games").delete().eq("id", gameId), toast);
    refresh();
  };

  return (
    <div className="card p-6 text-center">
      <h2 className="font-bold text-wine text-lg flex items-center justify-center gap-2">
        🎡 Wheel of Us
      </h2>
      <p className="mt-1 text-xs opacity-60">
        Spin for a sweet task — winner takes the prize, loser takes the joy.
      </p>

      {!game ? (
        <div className="mt-6">
          <div className="text-4xl">🎡</div>
          <p className="mt-3 text-sm opacity-70">8 couple treats on the wheel — spin to assign one</p>
          <button className="btn-love mt-4" onClick={start} disabled={!me}>
            <Sparkles size={15} /> Set up the wheel
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 -mx-2 overflow-hidden rounded-2xl border border-line bg-blush/30">
            <RoulettePro
              prizes={prizes}
              prizeIndex={spinIdx}
              start={spinning}
              spinningTime={5}
              onPrizeDefined={onPrizeDefined}
              defaultDesignOptions={{ prizesWithText: true }}
            />
          </div>

          <div className="mt-4 min-h-16">
            {spinning ? (
              <p className="text-sm font-semibold text-wine animate-pulse">
                {spunByMe ? "Spinning… 🎰" : `${partnerName} is spinning… 🎰`}
              </p>
            ) : b.last ? (
              <div>
                <p className="text-sm font-bold text-rose-deep flex items-center justify-center gap-1.5">
                  <Trophy size={14} /> {nameOf(b.last.by)} spun: {SPIN_PRIZES[b.last.idx]?.text}
                  {" "}{SPIN_PRIZES[b.last.idx]?.emoji}
                </p>
              </div>
            ) : (
              <p className="text-sm opacity-60">No spins yet — fate awaits</p>
            )}
          </div>

          <button className="btn-love" onClick={spin} disabled={spinning || !me}>
            <Sparkles size={15} /> {b.last ? "Spin again" : "Spin the wheel"}
          </button>
          <div>
            <button className="mt-3 text-xs opacity-50 hover:opacity-80" onClick={end}>
              put the wheel away
            </button>
          </div>
        </>
      )}
    </div>
  );
}
