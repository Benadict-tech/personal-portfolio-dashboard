"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Send, Shuffle, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { runQuery } from "@/lib/db";
import { heartConfetti } from "@/lib/confetti";
import { otherSlot } from "@/lib/identity";

export default function TwoTruthsWish({ game, me, partner, nameOf, refresh, toast }) {
  const [lines, setLines] = useState(["", "", ""]);
  const [wishIdx, setWishIdx] = useState(null);
  const partnerName = partner?.name || "your partner";

  const b = (game && game.board) || {};
  const gameId = game ? game.id : null;
  const entries = b.entries || {};
  const guesses = b.guesses || {};
  const myEntry = me && entries[me.slot];
  const theirEntry = me && entries[otherSlot(me.slot)];
  const myGuess = me && guesses[me.slot] != null ? guesses[me.slot] : null;
  const theirGuess = me && guesses[otherSlot(me.slot)] != null ? guesses[otherSlot(me.slot)] : null;
  const reveal = Boolean(theirEntry && myGuess != null && theirGuess != null);
  const scores = b.scores || {};

  const persist = async (patch, msg) => {
    const ok = await runQuery(
      supabase
        .from("games")
        .update({ board: { ...b, ...patch }, updated_at: new Date().toISOString() })
        .eq("id", gameId),
      toast,
      msg
    );
    if (ok) refresh();
    return ok;
  };

  const start = async () => {
    if (!supabase || !me) return;
    await runQuery(
      supabase.from("games").insert({
        type: "wish",
        status: "playing",
        x_slot: me.slot,
        o_slot: otherSlot(me.slot),
        board: { entries: {}, guesses: {}, scores: {}, round: 1 },
      }),
      toast,
      "Write your truths — and one wish ✨"
    );
    refresh();
  };

  const submitEntry = async (e) => {
    e.preventDefault();
    const clean = lines.map((l) => l.trim());
    if (!supabase || !me || !game || myEntry) return;
    if (clean.some((l) => !l) || wishIdx == null) {
      toast("Fill all 3 lines and mark the wish");
      return;
    }
    const ok = await persist({ entries: { ...entries, [me.slot]: { lines: clean, wish: wishIdx } } });
    if (ok) {
      setLines(["", "", ""]);
      setWishIdx(null);
    }
  };

  const guess = async (i) => {
    if (!supabase || !me || !game || !theirEntry || myGuess != null) return;
    const newGuesses = { ...guesses, [me.slot]: i };
    const newScores = { ...scores };
    // second guesser resolves the round for both
    const opp = otherSlot(me.slot);
    if (newGuesses[opp] != null) {
      if (i === theirEntry.wish) newScores[me.slot] = (newScores[me.slot] || 0) + 1;
      if (newGuesses[opp] === myEntry.wish) newScores[opp] = (newScores[opp] || 0) + 1;
    }
    const ok = await persist({ guesses: newGuesses, scores: newScores });
    if (ok && theirGuess != null) {
      if (i === theirEntry.wish) {
        heartConfetti();
        toast("You found their wish! 💘");
      } else {
        toast("That was a truth — sneaky! 😄");
      }
    }
  };

  const nextRound = async () => {
    if (!supabase || !game) return;
    await persist(
      { entries: {}, guesses: {}, round: (b.round || 1) + 1 },
      "New round — write fresh ones ✨"
    );
  };

  const end = async () => {
    if (!supabase || !game) return;
    await runQuery(supabase.from("games").delete().eq("id", gameId), toast);
    refresh();
  };

  return (
    <div className="card p-6 text-center">
      <h2 className="font-bold text-wine text-lg flex items-center justify-center gap-2">
        <Star size={18} className="text-rose-deep" /> Two Truths &amp; a Wish
      </h2>
      <p className="mt-1 text-xs opacity-60">
        Write two truths and one secret wish — your partner guesses which is which.
      </p>

      {!game ? (
        <div className="mt-6">
          <div className="text-4xl">💫</div>
          <p className="mt-3 text-sm opacity-70 max-w-xs mx-auto">
            Every round is different — because you write the statements yourself
          </p>
          <button className="btn-love mt-4" onClick={start} disabled={!me}>
            <Star size={15} /> Start round 1
          </button>
        </div>
      ) : (
        <>
          <div className="mt-3 flex items-center justify-center gap-3 text-xs">
            <span className="font-bold text-rose-deep">Round {b.round || 1}</span>
            <span className="opacity-60">
              {nameOf(me?.slot)} {scores[me?.slot] || 0} — {scores[otherSlot(me?.slot || "a")] || 0} {partnerName}
            </span>
          </div>

          {/* writing phase */}
          {!myEntry && (
            <form onSubmit={submitEntry} className="mt-4 space-y-2 text-left max-w-sm mx-auto">
              <p className="text-xs font-bold text-wine text-center">
                2 truths + 1 wish — mark the wish with ⭐
              </p>
              {lines.map((l, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className="input-love text-sm flex-1"
                    placeholder={`Statement ${i + 1}…`}
                    value={l}
                    onChange={(e) => {
                      const next = [...lines];
                      next[i] = e.target.value;
                      setLines(next);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setWishIdx(i)}
                    className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      wishIdx === i ? "border-gold bg-gold/40 text-lg" : "border-line opacity-50 hover:opacity-90"
                    }`}
                    aria-label={`Mark statement ${i + 1} as the wish`}
                  >
                    ⭐
                  </button>
                </div>
              ))}
              <button className="btn-love text-sm w-full" type="submit" disabled={!me}>
                <Send size={14} /> Seal your three
              </button>
            </form>
          )}

          {/* waiting for partner's entry */}
          {myEntry && !theirEntry && !reveal && (
            <p className="mt-5 text-sm font-semibold text-wine animate-pulse">
              Sealed — waiting for {partnerName} to write theirs… 🤫
            </p>
          )}

          {/* guessing phase */}
          {theirEntry && myGuess == null && (
            <div className="mt-4 space-y-2 max-w-sm mx-auto">
              <p className="text-xs font-bold text-wine">
                {partnerName}&apos;s three — which is the wish? ⭐
              </p>
              {theirEntry.lines.map((l, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => guess(i)}
                  className="w-full py-3 px-4 rounded-2xl border-2 border-line hover:border-rose bg-card text-sm font-semibold text-wine transition-all"
                >
                  {l}
                </motion.button>
              ))}
            </div>
          )}

          {/* guessed, waiting for them */}
          {theirEntry && myGuess != null && theirGuess == null && (
            <p className="mt-5 text-sm font-semibold text-wine animate-pulse">
              Locked in — waiting for {partnerName} to guess yours… 🤫
            </p>
          )}

          {/* reveal */}
          {reveal && (
            <div className="mt-4 space-y-3 max-w-sm mx-auto">
              {[{ label: `${partnerName}'s`, entry: theirEntry, guess: myGuess, you: false },
                { label: "Your", entry: myEntry, guess: theirGuess, you: true }].map((blk) => (
                <div key={blk.label} className="rounded-2xl bg-blush/50 p-3 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-rose-deep mb-1.5">
                    {blk.label} statements
                  </p>
                  {blk.entry.lines.map((l, i) => (
                    <p
                      key={i}
                      className={`text-sm py-0.5 ${
                        i === blk.entry.wish ? "font-bold text-rose-deep" : "text-wine/80"
                      }`}
                    >
                      {i === blk.entry.wish ? "⭐ " : "💗 "}{l}
                      {i === blk.guess && <span className="text-xs opacity-60"> ← {blk.you ? "their" : "your"} guess</span>}
                    </p>
                  ))}
                  <p className="mt-1 text-xs font-semibold">
                    {blk.guess === blk.entry.wish ? (
                      <span className="text-rose-deep">{blk.you ? "They" : "You"} found the wish! 💘</span>
                    ) : (
                      <span className="opacity-60">{blk.you ? "They" : "You"} picked a truth 😄</span>
                    )}
                  </p>
                </div>
              ))}
              <button className="btn-love text-sm" onClick={nextRound}>
                <Shuffle size={14} /> Another round
              </button>
            </div>
          )}

          <AnimatePresence />
          <button className="mt-4 text-xs opacity-50 hover:opacity-80 block mx-auto" onClick={end}>
            end the game
          </button>
        </>
      )}
    </div>
  );
}
