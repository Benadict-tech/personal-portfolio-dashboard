"use client";

import { motion } from "framer-motion";
import { Gamepad2, Heart, RotateCcw, Swords } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { runQuery } from "@/lib/db";
import { heartConfetti } from "@/lib/confetti";
import Avatar from "@/components/Avatar";

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

export default function TicTacHeart({ game, openGame, doneGames, me, mePerson, partner, nameOf, refresh, toast }) {
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
            <span className="px-3 py-1 rounded-full bg-blush flex items-center gap-1.5">
              <Avatar slot={game.x_slot} size={20} /> {nameOf(game.x_slot)}
            </span>
            <span className="opacity-50">vs</span>
            <span className="px-3 py-1 rounded-full bg-blush flex items-center gap-1.5">
              <Avatar slot={game.o_slot} size={20} /> {nameOf(game.o_slot)}
            </span>
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
