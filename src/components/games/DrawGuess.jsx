"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Brush, Eraser, Send, Shuffle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { runQuery } from "@/lib/db";
import { heartConfetti, loveBlast } from "@/lib/confetti";
import { otherSlot } from "@/lib/identity";
import { DRAW_WORDS, pickRandom } from "@/lib/games";

const ReactSketchCanvas = dynamic(
  () => import("react-sketch-canvas").then((m) => m.ReactSketchCanvas),
  { ssr: false }
);

const canvasStyle = {
  width: "100%",
  height: 280,
  borderRadius: 16,
  border: "2px solid var(--line)",
};

export default function DrawGuess({ game, me, partner, nameOf, refresh, toast }) {
  const [guessText, setGuessText] = useState("");
  const canvasRef = useRef(null);
  const partnerName = partner?.name || "your partner";
  const b = (game && game.board) || {};
  const gameId = game ? game.id : null;
  const isDrawer = me && b.drawer === me.slot;
  const guesses = b.guesses || [];
  const word = b.word || "";
  const won = Boolean(b.winner);

  // the guesser's canvas mirrors whatever the drawer has drawn so far
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || isDrawer) return;
    const strokes = b.strokes || [];
    c.clearCanvas();
    if (strokes.length) c.loadPaths(strokes);
  }, [b.strokes, isDrawer]);

  const persist = async (patch) => {
    const ok = await runQuery(
      supabase
        .from("games")
        .update({ board: { ...b, ...patch }, updated_at: new Date().toISOString() })
        .eq("id", gameId),
      toast
    );
    if (ok) refresh();
    return ok;
  };

  // drawer only — every stroke/clear lands here with the full path list
  const onChange = (paths) => {
    if (!supabase || !game || !isDrawer || won) return;
    persist({ strokes: paths });
  };

  const start = async () => {
    if (!supabase || !me) return;
    // retire any stale draw games still marked playing — they'd fight this one
    await runQuery(
      supabase.from("games").update({ status: "done" }).eq("type", "draw").eq("status", "playing"),
      toast
    );
    await runQuery(
      supabase.from("games").insert({
        type: "draw",
        status: "playing",
        x_slot: me.slot,
        o_slot: otherSlot(me.slot),
        board: {
          word: DRAW_WORDS[pickRandom(DRAW_WORDS)],
          drawer: me.slot,
          strokes: [],
          guesses: [],
          winner: null,
          round: 1,
        },
      }),
      toast,
      "You're drawing first — make it good 🎨"
    );
    refresh();
  };

  const submitGuess = async (e) => {
    e.preventDefault();
    const text = guessText.trim();
    if (!supabase || !game || !text || isDrawer || won) return;
    const correct = text.toLowerCase() === word.toLowerCase();
    const patch = { guesses: [...guesses, { slot: me.slot, text }].slice(-12) };
    if (correct) patch.winner = me.slot;
    const ok = await persist(patch);
    if (ok) {
      setGuessText("");
      if (correct) {
        heartConfetti(); loveBlast();
        toast(`It was “${word}” — you got it! 🎉`);
      } else {
        toast("Nope — look closer 👀");
      }
    }
  };

  const nextRound = async () => {
    if (!supabase || !game || !me) return;
    const next = DRAW_WORDS[pickRandom(DRAW_WORDS)];
    const ok = await persist({
      word: next,
      drawer: otherSlot(b.drawer || me.slot),
      strokes: [],
      guesses: [],
      winner: null,
      round: (b.round || 1) + 1,
    });
    if (ok) canvasRef.current?.clearCanvas();
  };

  const end = async () => {
    if (!supabase || !game) return;
    await runQuery(supabase.from("games").delete().eq("id", gameId), toast);
    refresh();
  };

  const blanks = word
    .split("")
    .map((c) => (c === " " ? "   " : "_"))
    .join(" ");

  return (
    <div className="card p-6 text-center lg:col-span-2">
      <h2 className="font-bold text-wine text-lg flex items-center justify-center gap-2">
        <Brush size={18} className="text-rose-deep" /> Draw &amp; Guess
      </h2>
      <p className="mt-1 text-xs opacity-60">
        One of you draws, the other guesses — watch the sketch appear live.
      </p>

      {!game ? (
        <div className="mt-6">
          <div className="text-4xl">🎨</div>
          <p className="mt-3 text-sm opacity-70">
            Pictionary for two — a shared canvas, a secret word
          </p>
          <button className="btn-love mt-4" onClick={start} disabled={!me}>
            <Brush size={15} /> Start drawing
          </button>
        </div>
      ) : (
        <>
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold bg-blush text-wine">
            {won
              ? `${nameOf(b.winner)} guessed “${word}”! 🎉`
              : isDrawer
              ? `You draw — ${partnerName} guesses`
              : `${partnerName} is drawing — guess the word`}
            <span className="opacity-50 font-normal">· round {b.round || 1}</span>
          </div>

          <div className="mt-4 mx-auto max-w-md">
            <div className="mb-2 text-center font-mono text-lg tracking-widest text-wine">
              {isDrawer ? (
                <span className="font-sans text-sm font-bold">
                  Your word: <span className="text-rose-deep text-base">{word}</span>
                </span>
              ) : (
                blanks
              )}
            </div>

            {isDrawer ? (
              <ReactSketchCanvas
                ref={canvasRef}
                style={canvasStyle}
                strokeWidth={4}
                strokeColor="#b93a5c"
                canvasColor="#fffdfb"
                onChange={onChange}
                withTimestamp={false}
              />
            ) : (
              <div className="pointer-events-none">
                <ReactSketchCanvas
                  ref={canvasRef}
                  style={canvasStyle}
                  strokeWidth={4}
                  strokeColor="#b93a5c"
                  canvasColor="#fffdfb"
                  withTimestamp={false}
                />
              </div>
            )}
          </div>

          {isDrawer && !won && (
            <button
              className="btn-ghost text-sm mt-2"
              onClick={() => canvasRef.current?.clearCanvas()}
            >
              <Eraser size={13} /> Clear canvas
            </button>
          )}

          {!isDrawer && !won && (
            <form onSubmit={submitGuess} className="mt-3 flex gap-2 max-w-md mx-auto">
              <input
                className="input-love text-sm"
                placeholder="What is it?"
                value={guessText}
                onChange={(e) => setGuessText(e.target.value)}
              />
              <button className="btn-love px-4" type="submit" aria-label="Guess">
                <Send size={15} />
              </button>
            </form>
          )}

          {guesses.length > 0 && !won && (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {guesses.slice(-6).map((g, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full bg-blush text-xs font-semibold text-wine"
                >
                  {g.text}
                </span>
              ))}
            </div>
          )}

          {won && (
            <button className="btn-love text-sm mt-4" onClick={nextRound}>
              <Shuffle size={14} /> Next round — swap roles
            </button>
          )}
          <div>
            <button className="mt-4 text-xs opacity-50 hover:opacity-80" onClick={end}>
              end the game
            </button>
          </div>
        </>
      )}
    </div>
  );
}
