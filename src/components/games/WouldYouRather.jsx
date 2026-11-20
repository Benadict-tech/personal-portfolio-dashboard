"use client";

import { Shuffle, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { runQuery } from "@/lib/db";
import { heartConfetti } from "@/lib/confetti";
import { otherSlot } from "@/lib/identity";
import { WYR_DECKS, pickRandom } from "@/lib/games";

const CATS = Object.keys(WYR_DECKS);

export default function WouldYouRather({ game, me, partner, nameOf, refresh, toast }) {
  const partnerName = partner?.name || "your partner";
  const b = (game && game.board) || {};
  const gameId = game ? game.id : null;
  const myAnswer = me && b.answers?.[me.slot];
  const theirAnswer = me && b.answers?.[otherSlot(me.slot)];
  const bothAnswered = myAnswer && theirAnswer;
  const matched = bothAnswered && myAnswer === theirAnswer;

  const start = async (cat) => {
    if (!supabase || !me) return;
    const qi = pickRandom(WYR_DECKS[cat]);
    await runQuery(
      supabase.from("games").insert({
        type: "wyr",
        status: "playing",
        x_slot: me.slot,
        o_slot: otherSlot(me.slot),
        board: { cat, q: qi, answers: {}, round: 1 },
      }),
      toast,
      `${cat} round started 💭`
    );
    refresh();
  };

  const answer = async (choice) => {
    if (!supabase || !me || !game || myAnswer) return;
    const ok = await runQuery(
      supabase
        .from("games")
        .update({
          board: { ...b, answers: { ...b.answers, [me.slot]: choice } },
          updated_at: new Date().toISOString(),
        })
        .eq("id", gameId),
      toast
    );
    if (ok) refresh();
  };

  const nextQuestion = async () => {
    if (!supabase || !game) return;
    const deck = WYR_DECKS[b.cat] || WYR_DECKS[CATS[0]];
    const qi = pickRandom(deck, b.q);
    const ok = await runQuery(
      supabase
        .from("games")
        .update({
          board: { ...b, q: qi, answers: {}, round: (b.round || 1) + 1 },
          updated_at: new Date().toISOString(),
        })
        .eq("id", gameId),
      toast
    );
    if (ok) {
      if (matched) heartConfetti();
      refresh();
    }
  };

  const switchVibe = async () => {
    if (!supabase || !game) return;
    const others = CATS.filter((c) => c !== b.cat);
    const cat = others[Math.floor(Math.random() * others.length)];
    const ok = await runQuery(
      supabase
        .from("games")
        .update({
          board: { cat, q: pickRandom(WYR_DECKS[cat]), answers: {}, round: (b.round || 1) + 1 },
          updated_at: new Date().toISOString(),
        })
        .eq("id", gameId),
      toast
    );
    if (ok) refresh();
  };

  const end = async () => {
    if (!supabase || !game) return;
    await runQuery(supabase.from("games").delete().eq("id", gameId), toast);
    refresh();
  };

  return (
    <div className="card p-6 text-center">
      <h2 className="font-bold text-wine text-lg flex items-center justify-center gap-2">
        <Sparkles size={18} className="text-rose-deep" /> This or That
      </h2>
      <p className="mt-1 text-xs opacity-60">
        Pick the same thing your partner does — how in sync are you?
      </p>

      {game ? (
        <>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs font-bold">
            <span className="px-2.5 py-0.5 rounded-full bg-blush text-rose-deep">{b.cat || "Sweet"}</span>
            <span className="text-rose-deep">Round {b.round || 1}</span>
          </div>
          <div className="mt-4 grid gap-3">
            {(WYR_DECKS[b.cat] || WYR_DECKS.Sweet)[b.q]?.map((option, i) => {
              const isMine = myAnswer === option;
              const isTheirs = bothAnswered && theirAnswer === option;
              return (
                <button
                  key={i}
                  onClick={() => answer(option)}
                  disabled={!me || Boolean(myAnswer)}
                  className={`relative py-4 px-4 rounded-2xl border-2 font-bold transition-all ${
                    bothAnswered && matched && isMine
                      ? "border-rose-deep bg-linear-to-r from-rose to-rose-deep text-on-accent"
                      : isMine
                      ? "border-rose-deep bg-blush text-wine"
                      : myAnswer
                      ? "border-line opacity-50"
                      : "border-line hover:border-rose"
                  }`}
                >
                  {option}
                  {bothAnswered && isTheirs && (
                    <span className="absolute -right-2 -top-2 text-lg" title={`${partnerName} picked this`}>
                      {isMine ? "💞" : "💙"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 min-h-10">
            {!myAnswer ? (
              <p className="text-sm opacity-60">Pick one…</p>
            ) : !theirAnswer ? (
              <p className="text-sm font-semibold text-wine animate-pulse">
                Waiting for {partnerName} to pick… 🤫
              </p>
            ) : matched ? (
              <div>
                <p className="font-bold text-rose-deep">Perfect match! 💞</p>
                <button className="btn-love text-sm mt-2" onClick={nextQuestion}>
                  <Shuffle size={14} /> Next question
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-wine">Opposites attract 😜</p>
                <button className="btn-ghost text-sm mt-2" onClick={nextQuestion}>
                  <Shuffle size={14} /> Next question
                </button>
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center justify-center gap-3">
            <button className="text-xs opacity-50 hover:opacity-80" onClick={switchVibe}>
              switch vibe 🎲
            </button>
            <button className="text-xs opacity-50 hover:opacity-80" onClick={end}>
              end round
            </button>
          </div>
        </>
      ) : (
        <div className="mt-6">
          <div className="text-4xl">💭</div>
          <p className="mt-3 text-sm opacity-70">
            60 questions, 4 vibes — see if your hearts think alike
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 max-w-55 mx-auto">
            {CATS.map((cat) => (
              <button key={cat} className="btn-ghost text-sm" onClick={() => start(cat)} disabled={!me}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
