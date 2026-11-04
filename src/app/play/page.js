"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Flame, Gamepad2, Heart, Moon, RotateCcw, Shuffle, Sparkles, Swords, Trophy,
} from "lucide-react";
import { Page } from "@/components/Motion";
import { supabase } from "@/lib/supabase";
import { runQuery, useTable } from "@/lib/db";
import { usePeople } from "@/lib/people";
import { otherSlot } from "@/lib/identity";
import { heartConfetti } from "@/lib/confetti";
import { timeAgo } from "@/lib/moods";
import { DARES, TRUTHS, WYR_QUESTIONS, pickRandom } from "@/lib/games";
import {
  applyMove, cardLabel, colorOf, drawPass, faceOf, isWild,
  newUnoBoard, playable, CARD_STYLES, UNO_COLORS,
} from "@/lib/uno";
import { useToast } from "@/lib/toast";
import { useHydrated } from "@/lib/useHydrated";

const EMPTY = [null, null, null, null, null, null, null, null, null];
const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];
const MARKS = { x: "💗", o: "💙" };

function winnerOf(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return board.every(Boolean) ? "draw" : null;
}

export default function PlayPage() {
  const { me, mePerson, partner } = usePeople();
  const { rows: games, refresh } = useTable("games", { order: "updated_at" });
  const toast = useToast();

  const find = (type, status) => games.find((g) => g.type === type && g.status === status);
  const ttt = find("ttt", "playing");
  const tttOpen = find("ttt", "open");
  const wyr = find("wyr", "playing");
  const dare = find("dare", "playing");
  const midnight = find("midnight", "playing");
  const uno = find("uno", "playing");
  const doneGames = games.filter((g) => g.status === "done").slice(-5).reverse();

  const nameOf = (slot) =>
    slot === me?.slot ? mePerson?.name || "You" : partner?.name || "Them";

  return (
    <Page className="pt-8">
      <h1 className="font-romantic text-6xl text-wine text-center">Play Together</h1>
      <p className="text-center text-sm opacity-70 mt-2">
        A little friendly competition — hearts at stake.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2 items-start">
        <TicTacHeart
          game={ttt}
          openGame={tttOpen}
          doneGames={doneGames}
          me={me}
          mePerson={mePerson}
          partner={partner}
          nameOf={nameOf}
          refresh={refresh}
          toast={toast}
        />
        <WouldYouRather
          game={wyr}
          me={me}
          partner={partner}
          nameOf={nameOf}
          refresh={refresh}
          toast={toast}
        />
        <MidnightThoughts
          game={midnight}
          me={me}
          partner={partner}
          nameOf={nameOf}
          refresh={refresh}
          toast={toast}
        />
        <UnoGame
          game={uno}
          me={me}
          partner={partner}
          nameOf={nameOf}
          refresh={refresh}
          toast={toast}
        />
        <TruthOrDare
          game={dare}
          me={me}
          partner={partner}
          nameOf={nameOf}
          refresh={refresh}
          toast={toast}
        />
      </div>

      {/* recent results */}
      {doneGames.length > 0 && (
        <div className="card mt-8 p-5 max-w-md mx-auto">
          <h3 className="font-bold text-wine flex items-center gap-2">
            <Trophy size={16} className="text-rose-deep" /> Recent battles
          </h3>
          <div className="mt-3 space-y-1.5">
            {doneGames.map((g) => (
              <div key={g.id} className="flex items-center gap-2 text-sm py-1.5 border-b border-line last:border-0">
                <span>💗 {nameOf(g.x_slot)} vs 💙 {nameOf(g.o_slot)}</span>
                <span className="ml-auto text-xs font-semibold text-rose-deep whitespace-nowrap">
                  {g.winner === "draw" ? "Draw 🤝" : `${nameOf(g.winner)} won`}
                </span>
                <span className="text-xs opacity-50">{timeAgo(g.updated_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Page>
  );
}

/* ---------------- Tic-Tac-Heart ---------------- */

function TicTacHeart({ game, openGame, doneGames, me, mePerson, partner, nameOf, refresh, toast }) {
  const myMark = game && (game.x_slot === me?.slot ? "x" : game.o_slot === me?.slot ? "o" : null);
  const myTurn = game && game.turn === myMark;
  const gameId = game ? game.id : null;
  const partnerName = partner?.name || "your partner";

  const startGame = async () => {
    if (!supabase || !me) return;
    await runQuery(
      supabase.from("games").insert({ type: "ttt", x_slot: me.slot }),
      toast,
      "Game created — waiting for your partner 💌"
    );
    refresh();
  };

  const joinGame = async () => {
    if (!supabase || !me || !openGame) return;
    await runQuery(
      supabase.from("games").update({ o_slot: me.slot, status: "playing" }).eq("id", openGame.id),
      toast,
      "Joined — it's ON! 💗 vs 💙"
    );
    refresh();
  };

  const cancelGame = async (id) => {
    if (!supabase) return;
    await runQuery(supabase.from("games").delete().eq("id", id), toast);
    refresh();
  };

  const tttBoard = game && Array.isArray(game.board) ? game.board : EMPTY;

  const move = async (i) => {
    if (!supabase || !game || !myTurn || tttBoard[i]) return;
    const board = [...tttBoard];
    board[i] = myMark;
    const win = winnerOf(board);
    const ok = await runQuery(
      supabase
        .from("games")
        .update({
          board,
          turn: myMark === "x" ? "o" : "x",
          status: win ? "done" : "playing",
          winner: win ? (win === "draw" ? "draw" : me.slot) : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", gameId),
      toast
    );
    if (ok) {
      refresh();
      if (win === myMark) {
        heartConfetti();
        toast("You win! 🏆");
      }
    }
  };

  const rematch = async () => {
    const last = doneGames[0];
    if (!supabase || !me || !last || last.type !== "ttt") return;
    await runQuery(
      supabase
        .from("games")
        .update({
          board: EMPTY,
          turn: "x",
          status: "playing",
          winner: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", last.id),
      toast,
      "Rematch! 💗 goes first"
    );
    refresh();
  };

  return (
    <div className="card p-6 text-center">
      <h2 className="font-bold text-wine text-lg flex items-center justify-center gap-2">
        <Swords size={18} className="text-rose-deep" /> Tic-Tac-Heart
      </h2>

      {game ? (
        <>
          <div className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold">
            <span className="px-3 py-1 rounded-full bg-blush">💗 {nameOf(game.x_slot)}</span>
            <span className="opacity-50">vs</span>
            <span className="px-3 py-1 rounded-full bg-blush">💙 {nameOf(game.o_slot)}</span>
          </div>

          <div className={`mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ${
            myTurn ? "bg-linear-to-r from-rose to-rose-deep text-on-accent" : "bg-blush text-wine/70"
          }`}>
            {myTurn ? <><Heart size={13} className="fill-current animate-pulse" /> Your turn</> : `${nameOf(game.turn === "x" ? game.x_slot : game.o_slot)}'s turn…`}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 max-w-60 mx-auto">
            {tttBoard.map((cell, i) => (
              <motion.button
                key={i}
                whileTap={!cell && myTurn ? { scale: 0.9 } : undefined}
                onClick={() => move(i)}
                disabled={!myTurn || Boolean(cell)}
                className={`aspect-square rounded-2xl border-2 text-3xl flex items-center justify-center transition-all ${
                  cell
                    ? "border-line bg-blush/40"
                    : myTurn
                    ? "border-rose bg-card hover:bg-blush cursor-pointer"
                    : "border-line bg-card opacity-60"
                }`}
              >
                {cell && (
                  <motion.span
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    {MARKS[cell]}
                  </motion.span>
                )}
              </motion.button>
            ))}
          </div>

          {myMark && <p className="mt-3 text-xs opacity-60">You are {MARKS[myMark]}</p>}
        </>
      ) : openGame ? (
        <div className="mt-6">
          <div className="text-5xl animate-pulse">💗</div>
          {openGame.x_slot === me?.slot ? (
            <>
              <p className="mt-3 text-sm font-semibold text-wine">
                Waiting for {partnerName} to join…
              </p>
              <button className="btn-ghost text-sm mt-3" onClick={() => cancelGame(openGame.id)}>
                Cancel game
              </button>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm font-semibold text-wine">
                {partnerName} challenged you to tic-tac-heart!
              </p>
              <button className="btn-love mt-3" onClick={joinGame}>
                <Swords size={15} /> Accept the challenge
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="mt-6">
          <Gamepad2 size={40} className="mx-auto text-rose-deep" />
          <p className="mt-3 text-sm opacity-70">Three hearts in a row wins — 💗 vs 💙</p>
          <button className="btn-love mt-4" onClick={startGame} disabled={!me}>
            <Swords size={15} /> Start a game
          </button>
          {doneGames.some((g) => g.type === "ttt") && (
            <button className="btn-ghost text-sm mt-3 ml-2" onClick={rematch}>
              <RotateCcw size={14} /> Rematch
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- This or That ---------------- */

function WouldYouRather({ game, me, partner, nameOf, refresh, toast }) {
  const partnerName = partner?.name || "your partner";
  const b = (game && game.board) || {};
  const gameId = game ? game.id : null;
  const myAnswer = me && b.answers?.[me.slot];
  const theirAnswer = me && b.answers?.[otherSlot(me.slot)];
  const bothAnswered = myAnswer && theirAnswer;
  const matched = bothAnswered && myAnswer === theirAnswer;

  const start = async () => {
    if (!supabase || !me) return;
    const qi = pickRandom(WYR_QUESTIONS);
    await runQuery(
      supabase.from("games").insert({
        type: "wyr",
        status: "playing",
        x_slot: me.slot,
        o_slot: otherSlot(me.slot),
        board: { q: qi, answers: {}, round: 1 },
      }),
      toast,
      "Question round started 💭"
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
    const qi = pickRandom(WYR_QUESTIONS, b.q);
    const ok = await runQuery(
      supabase
        .from("games")
        .update({
          board: { q: qi, answers: {}, round: (b.round || 1) + 1 },
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
          <div className="mt-3 text-xs font-bold text-rose-deep">Round {b.round || 1}</div>
          <div className="mt-4 grid gap-3">
            {WYR_QUESTIONS[b.q]?.map((option, i) => {
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

          <button className="mt-1 text-xs opacity-50 hover:opacity-80" onClick={end}>
            end round
          </button>
        </>
      ) : (
        <div className="mt-6">
          <div className="text-4xl">💭</div>
          <p className="mt-3 text-sm opacity-70">
            12 couple questions — see if your hearts think alike
          </p>
          <button className="btn-love mt-4" onClick={start} disabled={!me}>
            <Sparkles size={15} /> New round
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Truth & Sweet Dares ---------------- */

function TruthOrDare({ game, me, partner, nameOf, refresh, toast }) {
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

/* ---------------- Midnight Thoughts (9pm–6am only) ---------------- */

const NIGHT_STATES = [
  { key: "thinking", label: "Thinking of you", emoji: "🥺" },
  { key: "awake", label: "Can't sleep", emoji: "🌙" },
  { key: "dreaming", label: "Dreaming of us", emoji: "✈️" },
  { key: "missing", label: "Missing your voice", emoji: "🎧" },
];

function MidnightThoughts({ game, me, partner, nameOf, refresh, toast }) {
  const [actual, setActual] = useState(null);
  const [guess, setGuess] = useState(null);
  const partnerName = partner?.name || "your partner";

  const hydrated = useHydrated();
  const hour = hydrated ? new Date().getHours() : 21;
  const unlocked = hour >= 21 || hour < 6;
  const untilOpen = unlocked ? 0 : 21 - hour;

  const b = (game && game.board) || {};
  const gameId = game ? game.id : null;
  const myEntry = me && b.answers?.[me.slot];
  const theirEntry = me && b.answers?.[otherSlot(me.slot)];
  const bothIn = myEntry && theirEntry;
  const stateOf = (key) => NIGHT_STATES.find((s) => s.key === key);

  const start = async () => {
    if (!supabase || !me) return;
    await runQuery(
      supabase.from("games").insert({
        type: "midnight",
        status: "playing",
        x_slot: me.slot,
        o_slot: otherSlot(me.slot),
        board: { answers: {}, scores: {}, round: 1 },
      }),
      toast,
      "The night begins 🌙"
    );
    refresh();
  };

  const submit = async () => {
    if (!supabase || !me || !game || !actual || !guess || myEntry) return;
    const answers = { ...b.answers, [me.slot]: { actual, guess } };
    const scores = { ...b.scores };
    // when both entries exist, score both guesses — whichever partner
    // submits second resolves the round for both
    if (theirEntry) {
      if (theirEntry.actual === guess) scores[me.slot] = (scores[me.slot] || 0) + 1;
      if (theirEntry.guess === actual)
        scores[otherSlot(me.slot)] = (scores[otherSlot(me.slot)] || 0) + 1;
    }
    const ok = await runQuery(
      supabase
        .from("games")
        .update({
          board: { ...b, answers, scores },
          updated_at: new Date().toISOString(),
        })
        .eq("id", gameId),
      toast
    );
    if (ok) {
      if (theirEntry && theirEntry.actual === guess) {
        heartConfetti();
        toast("You read their heart! 💘");
      }
      setActual(null);
      setGuess(null);
      refresh();
    }
  };

  const nextRound = async () => {
    if (!supabase || !game) return;
    const ok = await runQuery(
      supabase
        .from("games")
        .update({
          board: { ...b, answers: {}, round: (b.round || 1) + 1 },
          updated_at: new Date().toISOString(),
        })
        .eq("id", gameId),
      toast
    );
    if (ok) {
      setActual(null);
      setGuess(null);
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
        <Moon size={18} className="text-rose-deep" /> Midnight Thoughts
      </h2>
      <p className="mt-1 text-xs opacity-60">
        Only playable when the moon is up — guess what your love is doing right now.
      </p>

      {!unlocked ? (
        <div className="mt-6">
          <div className="text-4xl opacity-50">🌙</div>
          <p className="mt-3 text-sm font-semibold text-wine">Sealed until nightfall</p>
          <p className="mt-1 text-xs opacity-60">
            {untilOpen > 0
              ? `Opens in ${untilOpen}h — come back when the stars are out`
              : "Opens at 9 PM — come back when the stars are out"}
          </p>
        </div>
      ) : !game ? (
        <div className="mt-6">
          <div className="text-4xl">🌃</div>
          <p className="mt-3 text-sm opacity-70">
            The moon is up and so are you — read each other&apos;s hearts
          </p>
          <button className="btn-love mt-4" onClick={start} disabled={!me}>
            <Moon size={15} /> Begin tonight
          </button>
        </div>
      ) : (
        <>
          <div className="mt-3 flex items-center justify-center gap-3 text-xs">
            <span className="font-bold text-rose-deep">Night {b.round || 1}</span>
            <span className="opacity-60">
              {nameOf(me?.slot)} {b.scores?.[me?.slot] || 0} — {b.scores?.[otherSlot(me?.slot || "a")] || 0} {partnerName}
            </span>
          </div>

          {bothIn ? (
            <div className="mt-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-blush p-3">
                  <div className="text-2xl">{stateOf(myEntry.actual)?.emoji}</div>
                  <div className="text-xs font-bold text-wine mt-1">
                    You: {stateOf(myEntry.actual)?.label}
                  </div>
                </div>
                <div className="rounded-2xl bg-blush p-3">
                  <div className="text-2xl">{stateOf(theirEntry.actual)?.emoji}</div>
                  <div className="text-xs font-bold text-wine mt-1">
                    {partnerName}: {stateOf(theirEntry.actual)?.label}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-sm font-semibold space-y-0.5">
                {myEntry.guess === theirEntry.actual && (
                  <p className="text-rose-deep">You read their heart 💘</p>
                )}
                {theirEntry.guess === myEntry.actual && (
                  <p className="text-rose-deep">{partnerName} read your heart 💘</p>
                )}
                {myEntry.guess !== theirEntry.actual && theirEntry.guess !== myEntry.actual && (
                  <p className="opacity-70">Two hearts, two different skies 🌌</p>
                )}
              </div>
              <button className="btn-love text-sm mt-3" onClick={nextRound}>
                <Shuffle size={14} /> Another round
              </button>
            </div>
          ) : myEntry ? (
            <p className="mt-5 text-sm font-semibold text-wine animate-pulse">
              Sealed — waiting for {partnerName} to peek into your heart… 🤫
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-bold text-wine mb-2">What are YOU doing right now?</p>
                <div className="grid grid-cols-2 gap-2">
                  {NIGHT_STATES.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setActual(s.key)}
                      className={`py-2.5 px-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                        actual === s.key ? "border-rose-deep bg-blush text-wine" : "border-line opacity-70"
                      }`}
                    >
                      {s.emoji} {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-wine mb-2">What is {partnerName} doing?</p>
                <div className="grid grid-cols-2 gap-2">
                  {NIGHT_STATES.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setGuess(s.key)}
                      className={`py-2.5 px-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                        guess === s.key ? "border-rose-deep bg-blush text-wine" : "border-line opacity-70"
                      }`}
                    >
                      {s.emoji} {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                className="btn-love text-sm"
                onClick={submit}
                disabled={!actual || !guess || !me}
              >
                <Heart size={14} className="fill-current" /> Seal your answers
              </button>
            </div>
          )}

          <button className="mt-4 text-xs opacity-50 hover:opacity-80" onClick={end}>
            end the night
          </button>
        </>
      )}
    </div>
  );
}

/* ---------------- UNO Hearts ---------------- */

function UnoCard({ card, onClick, disabled, small }) {
  const wild = isWild(card);
  const style = wild ? null : CARD_STYLES[colorOf(card)];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${small ? "w-12 h-16 text-lg" : "w-14 h-20 text-xl"} shrink-0 rounded-xl font-extrabold text-white flex items-center justify-center shadow-md transition-all ${
        disabled ? "opacity-40" : "hover:-translate-y-1.5 cursor-pointer"
      }`}
      style={{
        background: wild
          ? "linear-gradient(135deg,#e6455f,#f2b234,#4caf6d,#5b6ee1)"
          : style.bg,
      }}
    >
      {cardLabel(card)}
    </button>
  );
}

function UnoGame({ game, me, partner, nameOf, refresh, toast }) {
  const [wildPick, setWildPick] = useState(null);
  const partnerName = partner?.name || "your partner";
  const b = (game && game.board) || {};
  const gameId = game ? game.id : null;
  const mySlot = me?.slot;
  const oppSlot = mySlot ? otherSlot(mySlot) : null;
  const boardOk = Boolean(b.hands && b.deck && b.discard && b.turn);
  const myHand = (mySlot && b.hands?.[mySlot]) || [];
  const theirCount = (oppSlot && b.hands?.[oppSlot]?.length) || 0;
  const top = b.discard?.[b.discard.length - 1];
  const myTurn = game && b.turn === mySlot && !b.winner;

  const persist = async (board, msg) => {
    const done = Boolean(board.winner);
    const ok = await runQuery(
      supabase
        .from("games")
        .update({
          board,
          status: done ? "done" : "playing",
          winner: board.winner || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", gameId),
      toast
    );
    if (ok) refresh();
    return ok;
  };

  const start = async () => {
    if (!supabase || !me) return;
    await runQuery(
      supabase.from("games").insert({
        type: "uno",
        status: "playing",
        x_slot: me.slot,
        o_slot: otherSlot(me.slot),
        board: newUnoBoard(me.slot, otherSlot(me.slot)),
      }),
      toast,
      "UNO dealt — hearts on the table 🃏"
    );
    refresh();
  };

  const play = async (card) => {
    if (!supabase || !myTurn || !top || !b.hands || !playable(card, b.color, top)) return;
    if (isWild(card)) {
      setWildPick(card);
      return;
    }
    const next = applyMove(b, mySlot, card);
    if (await persist(next)) {
      if (next.winner === mySlot) {
        heartConfetti();
        toast("UNO! You emptied your hand 🏆");
      } else if (next.hands[mySlot].length === 1) {
        toast("UNO! One card left ❤️‍🔥");
      }
    }
  };

  const playWild = async (color) => {
    const card = wildPick;
    setWildPick(null);
    if (!card || !supabase) return;
    const next = applyMove(b, mySlot, card, color);
    if (await persist(next) && next.winner === mySlot) {
      heartConfetti();
      toast("UNO! You emptied your hand 🏆");
    }
  };

  const draw = async () => {
    if (!supabase || !myTurn || !b.hands) return;
    const next = drawPass(b, mySlot);
    await persist(next);
  };

  const end = async () => {
    if (!supabase || !game) return;
    await runQuery(supabase.from("games").delete().eq("id", gameId), toast);
    refresh();
  };

  const faceLabel = top && cardLabel(top);
  const colorName = CARD_STYLES[b.color]?.name;

  return (
    <div className="card p-6 text-center lg:col-span-2">
      <h2 className="font-bold text-wine text-lg flex items-center justify-center gap-2">
        🃏 UNO Hearts
      </h2>
      <p className="mt-1 text-xs opacity-60">
        Match color or number, ditch your hand first — loser owes a hug.
      </p>

      {!game ? (
        <div className="mt-6">
          <div className="text-4xl">🎴</div>
          <p className="mt-3 text-sm opacity-70">
            Full UNO for two — skips, reverses, +2s, wilds and all
          </p>
          <button className="btn-love mt-4" onClick={start} disabled={!me}>
            <Swords size={15} /> Deal the cards
          </button>
        </div>
      ) : !boardOk ? (
        <div className="mt-6">
          <div className="text-4xl">🃏</div>
          <p className="mt-3 text-sm opacity-70">
            This game&apos;s cards got lost in the mail — reshuffle?
          </p>
          <button className="btn-love mt-4" onClick={end}>
            <RotateCcw size={14} /> Deal a fresh game
          </button>
        </div>
      ) : (
        <>
          {/* opponent hand */}
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {Array.from({ length: Math.min(theirCount, 10) }).map((_, i) => (
              <div
                key={i}
                className="w-8 h-11 rounded-lg bg-linear-to-b from-rose to-rose-deep border border-rose-deep/40 shadow-sm"
                style={{ transform: `rotate(${(i - theirCount / 2) * 3}deg)` }}
              />
            ))}
            {theirCount > 10 && <span className="text-xs font-bold text-wine">+{theirCount - 10}</span>}
          </div>
          <p className="mt-1 text-xs opacity-60">
            {partnerName} has {theirCount} card{theirCount === 1 ? " — UNO! 🔥" : "s"}
          </p>

          {/* turn banner */}
          <div className={`mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ${
            b.winner
              ? "bg-linear-to-r from-rose to-rose-deep text-on-accent"
              : myTurn
              ? "bg-linear-to-r from-rose to-rose-deep text-on-accent"
              : "bg-blush text-wine/70"
          }`}>
            {b.winner
              ? `${nameOf(b.winner)} wins! 🏆`
              : myTurn
              ? "Your turn — play a card"
              : `${partnerName}'s turn…`}
          </div>

          {/* table: deck + discard */}
          <div className="mt-5 flex items-center justify-center gap-6">
            <button
              onClick={draw}
              disabled={!myTurn}
              className={`relative w-14 h-20 rounded-xl border-2 font-bold text-xs transition-all ${
                myTurn ? "border-rose bg-card hover:scale-105 cursor-pointer" : "border-line opacity-60"
              }`}
            >
              🂠
              <span className="absolute -bottom-2 -right-2 text-[10px] px-1.5 rounded-full bg-wine text-on-accent">
                {b.deck?.length || 0}
              </span>
            </button>
            <div className="w-14 h-20 rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-lg"
              style={{
                background: isWild(top)
                  ? `linear-gradient(135deg, ${UNO_COLORS.map((c) => CARD_STYLES[c].bg).join(",")})`
                  : CARD_STYLES[b.color]?.bg || "var(--card)",
              }}
            >
              {faceLabel}
            </div>
          </div>
          <p className="mt-1 text-xs opacity-60">
            {myTurn ? "Draw or" : "Color in play:"} {colorName && `${colorName} ${{ r: "🔴", y: "🟡", g: "🟢", b: "🔵" }[b.color]}`}
          </p>

          {/* wild color picker */}
          <AnimatePresence>
            {wildPick && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 flex items-center justify-center gap-2"
              >
                <span className="text-xs font-bold text-wine">Pick a color:</span>
                {UNO_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => playWild(c)}
                    className="w-8 h-8 rounded-full border-2 border-white shadow hover:scale-110 transition-transform"
                    style={{ background: CARD_STYLES[c].bg }}
                    title={CARD_STYLES[c].name}
                  />
                ))}
                <button className="text-xs opacity-50 ml-1" onClick={() => setWildPick(null)}>cancel</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* my hand */}
          <div className="mt-5">
            <p className="text-xs font-bold text-wine mb-2">
              Your hand — {myHand.length} card{myHand.length === 1 ? " — UNO! ❤️‍🔥" : "s"}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 px-1 justify-start sm:justify-center">
              {myHand.map((card, i) => (
                <UnoCard
                  key={`${card}-${i}`}
                  card={card}
                  onClick={() => play(card)}
                  disabled={!myTurn || !playable(card, b.color, top)}
                />
              ))}
            </div>
          </div>

          {b.winner && (
            <button className="btn-love text-sm mt-4" onClick={end}>
              <RotateCcw size={14} /> Clear table
            </button>
          )}
          {!b.winner && (
            <button className="mt-4 text-xs opacity-50 hover:opacity-80" onClick={end}>
              end game
            </button>
          )}
        </>
      )}
    </div>
  );
}
