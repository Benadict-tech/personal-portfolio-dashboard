"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Flame, Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { runQuery } from "@/lib/db";
import { otherSlot } from "@/lib/identity";
import { DARES, TRUTHS, pickRandom } from "@/lib/games";

export default function TruthOrDare({ game, me, partner, nameOf, refresh, toast }) {
  const b = (game && game.board) || {};
  const gameId = game ? game.id : null;
  const partnerName = partner?.name || "your partner";
  const myTurn = me && b.active === me.slot;

  const start = async () => {
    if (!supabase || !me) return;
    await runQuery(
      supabase.from("games").insert({
        type: "dare",
        status: "playing",
        x_slot: me.slot,
        o_slot: otherSlot(me.slot),
        board: { active: me.slot, card: null, count: 0 },
      }),
      toast,
      "Game on — your turn first 😏"
    );
    refresh();
  };

  const draw = async (kind) => {
    if (!supabase || !game || !myTurn || b.card) return;
    const deck = kind === "truth" ? TRUTHS : DARES;
    const card = { kind, text: deck[pickRandom(deck)] };
    await runQuery(
      supabase
        .from("games")
        .update({ board: { ...b, card }, updated_at: new Date().toISOString() })
        .eq("id", gameId),
      toast
    );
    refresh();
  };

  const doneCard = async () => {
    if (!supabase || !game) return;
    await runQuery(
      supabase
        .from("games")
        .update({
          board: {
            active: otherSlot(b.active),
            card: null,
            count: (b.count || 0) + 1,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", gameId),
      toast
    );
    refresh();
  };

  const end = async () => {
    if (!supabase || !game) return;
    await runQuery(supabase.from("games").delete().eq("id", gameId), toast);
    refresh();
  };

  return (
    <div className="card p-6 text-center lg:col-span-2">
      <h2 className="font-bold text-wine text-lg flex items-center justify-center gap-2">
        <Flame size={18} className="text-rose-deep" /> Truth or Sweet Dare
      </h2>
      <p className="mt-1 text-xs opacity-60">
        Take turns — honest answers and adorable dares only.
      </p>

      {game ? (
        <>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold bg-blush text-wine">
            {myTurn ? "Your turn to pick" : `${partnerName}'s turn — watching 👀`}
            {b.count > 0 && <span className="opacity-50 font-normal">· card #{b.count + 1}</span>}
          </div>

          <AnimatePresence mode="wait">
            {b.card ? (
              <motion.div
                key={`card-${b.card.text}`}
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -90, opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="mt-5 mx-auto max-w-md rounded-3xl border-2 border-rose-deep bg-linear-to-b from-blush to-card p-8 shadow-lg"
              >
                <div className="text-4xl">{b.card.kind === "truth" ? "💬" : "🔥"}</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-widest text-rose-deep">
                  {b.card.kind === "truth" ? "Truth" : "Sweet dare"}
                </div>
                <p className="mt-3 font-semibold text-wine leading-relaxed">{b.card.text}</p>
                <p className="mt-3 text-xs opacity-60">for {nameOf(b.active)}</p>
                {myTurn && (
                  <button className="btn-love text-sm mt-5" onClick={doneCard}>
                    <Heart size={14} className="fill-current" /> Done — pass it on
                  </button>
                )}
              </motion.div>
            ) : myTurn ? (
              <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="mt-5 flex justify-center gap-3">
                  <button
                    onClick={() => draw("truth")}
                    className="px-6 py-4 rounded-2xl border-2 border-line hover:border-rose font-bold text-wine transition-all hover:scale-105"
                  >
                    💬 Truth
                  </button>
                  <button
                    onClick={() => draw("dare")}
                    className="px-6 py-4 rounded-2xl border-2 border-line hover:border-rose font-bold text-wine transition-all hover:scale-105"
                  >
                    🔥 Dare
                  </button>
                </div>
                <p className="mt-3 text-xs opacity-50">choose your fate…</p>
              </motion.div>
            ) : (
              <motion.p key="wait" initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} className="mt-5 text-sm">
                {partnerName} is picking truth or dare…
              </motion.p>
            )}
          </AnimatePresence>

          <button className="mt-5 text-xs opacity-50 hover:opacity-80" onClick={end}>
            end game
          </button>
        </>
      ) : (
        <div className="mt-6">
          <div className="text-4xl">🎴</div>
          <p className="mt-3 text-sm opacity-70 max-w-sm mx-auto">
            Sweet truths and cute dares, made for couples on calls — nothing you can&apos;t do from a distance
          </p>
          <button className="btn-love mt-4" onClick={start} disabled={!me}>
            <Flame size={15} /> Start playing
          </button>
        </div>
      )}
    </div>
  );
}
