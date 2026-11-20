"use client";

import dynamic from "next/dynamic";
import { Gift, Shuffle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { runQuery } from "@/lib/db";
import { heartConfetti, loveBlast } from "@/lib/confetti";
import { otherSlot } from "@/lib/identity";
import { SCRATCH_PRIZES, pickRandom } from "@/lib/games";

const ScratchCard = dynamic(() => import("react-scratchcard-v2"), { ssr: false });

export default function ScratchCoupon({ game, me, partner, nameOf, refresh, toast }) {
  const partnerName = partner?.name || "your partner";
  const b = (game && game.board) || {};
  const gameId = game ? game.id : null;
  const revealed = Boolean(b.scratched_by);
  const coupon = SCRATCH_PRIZES[b.coupon];

  const start = async () => {
    if (!supabase || !me) return;
    await runQuery(
      supabase.from("games").insert({
        type: "scratch",
        status: "playing",
        x_slot: me.slot,
        o_slot: otherSlot(me.slot),
        board: { coupon: pickRandom(SCRATCH_PRIZES), scratched_by: null, round: 1 },
      }),
      toast,
      "A fresh coupon is on the table 🎁"
    );
    refresh();
  };

  const onComplete = async () => {
    if (!supabase || !game || revealed || !me) return;
    const ok = await runQuery(
      supabase
        .from("games")
        .update({ board: { ...b, scratched_by: me.slot }, updated_at: new Date().toISOString() })
        .eq("id", gameId),
      toast
    );
    if (ok) {
      heartConfetti(); loveBlast();
      refresh();
    }
  };

  const newCard = async () => {
    if (!supabase || !game) return;
    await runQuery(
      supabase
        .from("games")
        .update({
          board: {
            coupon: pickRandom(SCRATCH_PRIZES, b.coupon),
            scratched_by: null,
            round: (b.round || 1) + 1,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", gameId),
      toast,
      "New coupon dealt 🎁"
    );
    refresh();
  };

  const end = async () => {
    if (!supabase || !game) return;
    await runQuery(supabase.from("games").delete().eq("id", gameId), toast);
    refresh();
  };

  const couponFace = (
    <div className="w-full h-full rounded-2xl bg-linear-to-b from-blush to-card flex flex-col items-center justify-center p-4">
      <div className="text-4xl">{coupon?.emoji}</div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-rose-deep">
        Love coupon
      </div>
      <p className="mt-1.5 text-sm font-semibold text-wine leading-snug">{coupon?.text}</p>
    </div>
  );

  return (
    <div className="card p-6 text-center">
      <h2 className="font-bold text-wine text-lg flex items-center justify-center gap-2">
        <Gift size={18} className="text-rose-deep" /> Lucky Coupon
      </h2>
      <p className="mt-1 text-xs opacity-60">
        Scratch the card — a little gift hides underneath.
      </p>

      {!game ? (
        <div className="mt-6">
          <div className="text-4xl">🎟️</div>
          <p className="mt-3 text-sm opacity-70">
            8 love coupons in the deck — scratch to claim one
          </p>
          <button className="btn-love mt-4" onClick={start} disabled={!me}>
            <Gift size={15} /> Deal a coupon
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 mx-auto w-fit rounded-2xl overflow-hidden shadow-md">
            {revealed ? (
              <div className="w-72 h-44">{couponFace}</div>
            ) : (
              <ScratchCard
                key={`${gameId}-${b.round}`}
                width={288}
                height={176}
                cover={{ type: "color", color: "#e8a0b4" }}
                brush={{ type: "circle", radius: 24 }}
                finishPercent={55}
                onComplete={onComplete}
              >
                {couponFace}
              </ScratchCard>
            )}
          </div>

          <div className="mt-3 min-h-8">
            {revealed ? (
              <p className="text-sm font-semibold text-rose-deep">
                Scratched open by {nameOf(b.scratched_by)} 💖
              </p>
            ) : (
              <p className="text-xs opacity-60">
                Rub the card with your finger or mouse — whoever scratches first reveals it
              </p>
            )}
          </div>

          {revealed && (
            <button className="btn-love text-sm" onClick={newCard}>
              <Shuffle size={14} /> Deal another
            </button>
          )}
          <div>
            <button className="mt-3 text-xs opacity-50 hover:opacity-80" onClick={end}>
              put the coupons away
            </button>
          </div>
        </>
      )}
    </div>
  );
}
