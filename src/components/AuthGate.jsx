"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Gem, Heart, Lock, LogIn, Mail, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePeople } from "@/lib/people";
import { useToast } from "@/lib/toast";

const QUOTES = [
  "Whatever our souls are made of, yours and mine are the same.",
  "I love you as certain dark things are to be loved — in secret, between the shadow and the soul.",
  "In all the world, there is no heart for me like yours.",
  "And when you smile, the whole world stops and stares for a while.",
  "You are my today, and all of my tomorrows.",
  "Distance means so little when someone means so much.",
];

const FLOATERS = ["💗", "💌", "🌙", "✨", "🥀", "💍"];

export default function AuthGate() {
  const { me, mePerson, people, pickSlot, loading, user } = usePeople();
  const toast = useToast();

  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [slot, setSlot] = useState(null);
  const [name, setName] = useState("");
  const [quote, setQuote] = useState(0);
  const autoName = useRef(null);
  const hearts = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        x: 4 + ((i * 67) % 92),
        y: 6 + ((i * 37) % 88),
        e: FLOATERS[i % FLOATERS.length],
        s: 16 + ((i * 13) % 22),
        d: 3 + (i % 5),
        delay: i * 0.7,
      })),
    []
  );

  useEffect(() => {
    const t = setInterval(() => setQuote((q) => (q + 1) % QUOTES.length), 5000);
    return () => clearInterval(t);
  }, []);

  if (me || loading || !supabase) return null;

  const submitAuth = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      toast(error.message, "error");
    } else if (mode === "signup") {
      setMode("signin");
      setPassword("");
      toast("Account created — now sign in to claim your heart 💗");
    } else {
      toast("Welcome back 💕");
    }
  };

  const claimedBy = (s) => people.find((p) => p.slot === s && p.user_id)?.user_id;
  const takenBy = (s) => people.find((p) => p.slot === s)?.name;

  const Backdrop = (
    <div className="fixed inset-0 z-50 overflow-hidden bg-linear-to-br from-background via-soft to-background">
      {/* floating hearts */}
      {hearts.map((h) => (
        <motion.span
          key={h.id}
          className="absolute select-none"
          style={{ left: `${h.x}%`, top: `${h.y}%`, fontSize: h.s }}
          animate={{
            y: [0, -22, 0],
            rotate: [0, h.id % 2 ? 12 : -12, 0],
            opacity: [0.25, 0.7, 0.25],
          }}
          transition={{ duration: h.d, repeat: Infinity, delay: h.delay, ease: "easeInOut" }}
        >
          {h.e}
        </motion.span>
      ))}

      {/* rotating quote, bottom */}
      <div className="absolute inset-x-0 bottom-8 flex justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={quote}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 0.55, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.7 }}
            className="font-romantic text-2xl sm:text-3xl text-wine text-center max-w-2xl"
          >
            “{QUOTES[quote]}”
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );

  // signed in but hasn't claimed a heart yet
  if (user && !mePerson) {
    const free = (s) => !claimedBy(s);
    return (
      <>
        {Backdrop}
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="card max-w-md w-full p-8 text-center shadow-2xl"
          >
            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.8, repeat: Infinity }}>
              <Heart className="mx-auto fill-rose-deep text-rose-deep" size={44} />
            </motion.div>
            <h1 className="font-romantic text-5xl text-wine mt-3">Pick your heart</h1>
            <p className="mt-3 text-sm opacity-80">
              This heart stays yours — linked to your email forever.
            </p>

            <input
              className="input-love mt-6 text-center"
              placeholder="Your name (e.g. Alex)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="mt-5 grid grid-cols-2 gap-3">
              {["a", "b"].map((s) => {
                const disabled = !free(s);
                return (
                  <motion.button
                    key={s}
                    whileHover={!disabled ? { scale: 1.04 } : undefined}
                    whileTap={!disabled ? { scale: 0.97 } : undefined}
                    onClick={() => {
                      if (disabled) return;
                      setSlot(s);
                      if (!name.trim() || name === autoName.current) {
                        const taken = takenBy(s);
                        setName(taken || "");
                        autoName.current = taken || null;
                      }
                    }}
                    disabled={disabled}
                    className={`p-4 rounded-2xl border-2 transition-all font-semibold ${
                      disabled
                        ? "border-line bg-blush/40 opacity-40 cursor-not-allowed"
                        : slot === s
                        ? "border-rose-deep bg-blush text-wine shadow-lg"
                        : "border-rose/50 bg-blush/60 text-wine hover:border-rose-deep hover:bg-blush"
                    }`}
                  >
                    <Heart size={30} className={`mx-auto mb-1 ${slot === s ? "fill-rose-deep text-rose-deep" : "fill-rose/30 text-rose-deep"}`} />
                    {s === "a" ? "Heart One" : "Heart Two"}
                    {takenBy(s) && (
                      <div className="text-xs font-normal opacity-60 mt-1">
                        {disabled ? `claimed by ${takenBy(s)}` : takenBy(s)}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <button
              className="btn-love w-full justify-center mt-6"
              disabled={!slot || !name.trim() || busy}
              onClick={async () => {
                setBusy(true);
                const ok = await pickSlot(slot, name.trim());
                setBusy(false);
                toast(ok ? `You're Heart ${slot === "a" ? "One" : "Two"}, ${name.trim()} 💗` : "That heart was just claimed — pick the other one", ok ? "success" : "error");
              }}
            >
              <Heart size={16} /> This is me
            </button>
          </motion.div>
        </div>
      </>
    );
  }

  const isSignup = mode === "signup";

  return (
    <>
      {Backdrop}
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
        <motion.div
          key={mode}
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 20 }}
          className="card max-w-md w-full p-8 text-center shadow-2xl"
        >
          {/* mode emblem */}
          <motion.div
            animate={isSignup ? { rotate: [0, -10, 10, 0] } : { scale: [1, 1.12, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block"
          >
            {isSignup ? (
              <Gem className="mx-auto text-rose-deep" size={44} />
            ) : (
              <Heart className="mx-auto fill-rose-deep text-rose-deep" size={44} />
            )}
          </motion.div>

          <h1 className="font-romantic text-5xl text-wine mt-3">
            {isSignup ? "Begin Forever" : "Welcome Back"}
          </h1>
          <AnimatePresence mode="wait">
            <motion.p
              key={mode}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 0.8, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-3 text-sm"
            >
              {isSignup
                ? "Two hearts, one account — write the first page of your story."
                : "Your hearts, letters and plans are right where you left them."}
            </motion.p>
          </AnimatePresence>

          <form onSubmit={submitAuth} className="mt-6 space-y-3">
            <div className="flex items-center gap-2 input-love py-0!">
              <Mail size={16} className="text-rose-deep/60 shrink-0 ml-2" />
              <input
                type="email"
                required
                className="flex-1 bg-transparent py-2.5 outline-none text-center"
                placeholder="you@love.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 input-love py-0!">
              <Lock size={16} className="text-rose-deep/60 shrink-0 ml-2" />
              <input
                type={showPw ? "text" : "password"}
                required
                minLength={6}
                className="flex-1 bg-transparent py-2.5 outline-none text-center"
                placeholder={isSignup ? "Choose a password (6+ characters)" : "Your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="text-rose-deep/60 hover:text-rose-deep shrink-0 mr-2"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              className="btn-love w-full justify-center"
              disabled={busy}
            >
              {isSignup ? <Sparkles size={16} /> : <LogIn size={16} />}
              {busy ? "One moment…" : isSignup ? "Start our story 💍" : "Come back to me 💗"}
            </motion.button>
          </form>

          <button
            className="mt-4 text-xs text-rose-deep hover:underline"
            onClick={() => { setMode(isSignup ? "signin" : "signup"); setShowPw(false); }}
          >
            {isSignup ? "Already wrote your story? Sign in" : "New here? Begin your story together"}
          </button>
        </motion.div>
      </div>
    </>
  );
}
