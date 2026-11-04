"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Plus, Target, Trash, TrendingDown, TrendingUp, X, PiggyBank } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import ConfirmDelete from "@/components/ConfirmDelete";
import { Page } from "@/components/Motion";
import VoiceButton, { appendVoice } from "@/components/VoiceButton";
import { supabase } from "@/lib/supabase";
import { runQuery, useTable } from "@/lib/db";
import { usePeople } from "@/lib/people";
import { monthStr, fmtDate } from "@/lib/dates";
import { evaluate } from "@/lib/calc";
import { useToast } from "@/lib/toast";

const PIE_COLORS = ["#fb6f92", "#e0345f", "#a4133c", "#c8b6ff", "#ffd166", "#ffb3c6"];
const CATEGORIES = ["food", "home", "travel", "dates", "gifts", "bills", "fun", "other"];

const fmtINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

export default function MoneyPage() {
  const { me } = usePeople();
  const [month, setMonth] = useState(monthStr());

  const { rows: items, refresh: refreshItems } = useTable("budget_items", {
    filter: (q) => q.eq("month", month),
    deps: [month],
  });
  const { rows: goals, refresh: refreshGoals } = useTable("savings_goals");

  const income = items.filter((i) => i.type === "income");
  const expenses = items.filter((i) => i.type === "expense");
  const totalIn = income.reduce((s, i) => s + Number(i.amount), 0);
  const totalOut = expenses.reduce((s, i) => s + Number(i.amount), 0);

  const byCat = {};
  expenses.forEach((e) => {
    byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount);
  });
  const chartData = Object.entries(byCat).map(([name, value]) => ({ name, value }));

  return (
    <Page className="pt-8">
      <h1 className="font-romantic text-6xl text-wine text-center">Love & Money</h1>
      <p className="text-center text-sm opacity-70 mt-2">
        Building our future, one saved rupee at a time.
      </p>

      {/* Budget */}
      <div className="card mt-8 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-bold text-wine text-lg flex items-center gap-2">
            <PiggyBank size={20} className="text-rose-deep" /> Monthly Budget
          </h2>
          <input
            type="month"
            className="input-love w-auto text-sm"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl bg-blush p-3">
            <div className="text-xs font-semibold text-wine/60">In</div>
            <div className="font-extrabold text-rose-deep flex items-center justify-center gap-1">
              <TrendingUp size={14} /> {fmtINR(totalIn)}
            </div>
          </div>
          <div className="rounded-2xl bg-blush p-3">
            <div className="text-xs font-semibold text-wine/60">Out</div>
            <div className="font-extrabold text-wine flex items-center justify-center gap-1">
              <TrendingDown size={14} /> {fmtINR(totalOut)}
            </div>
          </div>
          <div className={`rounded-2xl p-3 ${totalIn - totalOut >= 0 ? "bg-[#e8f9ee]" : "bg-[#ffe8e8]"}`}>
            <div className="text-xs font-semibold text-wine/60">Left</div>
            <div className="font-extrabold text-wine">{fmtINR(totalIn - totalOut)}</div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <ItemList title="Income" items={income} type="income" month={month} editable={Boolean(me)} refresh={refreshItems} />
          </div>
          <div>
            <ItemList title="Expenses" items={expenses} type="expense" month={month} editable={Boolean(me)} refresh={refreshItems} />
          </div>
        </div>

        {chartData.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-bold text-wine mb-2">Where it goes</h3>
            <div className="h-52">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmtINR(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {chartData.map((d, i) => (
                <span key={d.name} className="text-xs font-semibold flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {d.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Savings goals */}
      <SavingsGoals goals={goals} editable={Boolean(me)} refresh={refreshGoals} />

      {/* Calculator */}
      <Calculator />
    </Page>
  );
}

function ItemList({ title, items, type, month, editable, refresh }) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const toast = useToast();

  const add = async (e) => {
    e.preventDefault();
    if (!amount || !supabase) return;
    const ok = await runQuery(
      supabase.from("budget_items").insert({
        type,
        category: type === "expense" ? category : "income",
        amount: Number(amount),
        month,
        note: label.trim(),
      }),
      toast,
      "Added to budget"
    );
    if (ok) {
      setLabel("");
      setAmount("");
      refresh();
    }
  };

  return (
    <div className="rounded-2xl border border-line p-4">
      <h3 className="font-bold text-wine text-sm">{title}</h3>
      <div className="mt-2 space-y-1.5">
        {items.map((i) => (
          <div key={i.id} className="flex items-center gap-2 text-sm">
            <span className="px-2 py-0.5 rounded-full bg-blush text-wine text-[10px] font-bold uppercase">
              {i.category}
            </span>
            <span className="flex-1 truncate">{i.note || "—"}</span>
            <span className="font-semibold">{fmtINR(Number(i.amount))}</span>
            {editable && (
              <ConfirmDelete
                onConfirm={async () => {
                  if (!supabase) return false;
                  const ok = await runQuery(
                    supabase.from("budget_items").delete().eq("id", i.id),
                    toast
                  );
                  if (ok) refresh();
                  return ok;
                }}
                label={i.note || i.category}
              >
                <Trash size={13} />
              </ConfirmDelete>
            )}
          </div>
        ))}
        {!items.length && <p className="text-xs opacity-50">None yet</p>}
      </div>
      {editable && (
        <form onSubmit={add} className="mt-3 space-y-2">
          <div className="flex gap-2">
            <input
              className="input-love text-xs flex-2"
              placeholder="Note"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <VoiceButton onResult={(t) => setLabel((v) => appendVoice(v, t))} className="w-8 h-8" />
            <input
              type="number" step="0.01" min="0"
              className="input-love text-xs flex-1"
              placeholder="₹"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {type === "expense" && (
              <select
                className="input-love text-xs"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            )}
            <button className="btn-ghost text-xs" type="submit" disabled={!amount}>
              <Plus size={13} /> Add
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function SavingsGoals({ goals, editable, refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [addAmounts, setAddAmounts] = useState({});
  const toast = useToast();

  const addToGoal = async (g) => {
    const amt = Number(addAmounts[g.id]);
    if (!amt || !supabase) return;
    const ok = await runQuery(
      supabase
        .from("savings_goals")
        .update({ saved_amount: Number(g.saved_amount) + amt })
        .eq("id", g.id),
      toast,
      `Saved ${fmtINR(amt)} toward ${g.title} 💰`
    );
    if (ok) {
      setAddAmounts((s) => ({ ...s, [g.id]: "" }));
      refresh();
    }
  };

  return (
    <div className="card mt-6 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-wine text-lg flex items-center gap-2">
          <Target size={20} className="text-rose-deep" /> Savings Goals
        </h2>
        <button className="btn-ghost text-sm" onClick={() => setShowForm(true)} disabled={!editable}>
          <Plus size={14} /> New goal
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {goals.map((g) => {
          const pct = Math.min(100, (Number(g.saved_amount) / Number(g.target_amount || 1)) * 100);
          return (
            <div key={g.id} className="rounded-2xl border border-line p-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{g.emoji}</span>
                <div className="flex-1">
                  <div className="font-bold text-wine text-sm">{g.title}</div>
                  <div className="text-xs opacity-60">
                    {fmtINR(Number(g.saved_amount))} of {fmtINR(Number(g.target_amount))}
                    {g.deadline && ` · by ${fmtDate(g.deadline)}`}
                  </div>
                </div>
                {editable && (
                  <ConfirmDelete
                    onConfirm={async () => {
                      if (!supabase) return false;
                      const ok = await runQuery(
                        supabase.from("savings_goals").delete().eq("id", g.id),
                        toast
                      );
                      if (ok) refresh();
                      return ok;
                    }}
                    label={g.title}
                  />
                )}
              </div>
              <div className="mt-3 h-3 rounded-full bg-blush overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-linear-to-r from-rose to-rose-deep"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-xs font-bold text-rose-deep">{pct.toFixed(0)}%</span>
                {pct >= 100 && <span className="text-xs font-bold text-rose-deep">🎉 Goal reached!</span>}
              </div>
              {editable && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="number" step="0.01" min="0"
                    className="input-love text-xs"
                    placeholder="Add amount"
                    value={addAmounts[g.id] || ""}
                    onChange={(e) => setAddAmounts((s) => ({ ...s, [g.id]: e.target.value }))}
                  />
                  <button className="btn-ghost text-xs" onClick={() => addToGoal(g)}>
                    <Heart size={12} /> Add
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {!goals.length && (
          <p className="text-sm opacity-50 col-span-2 text-center py-4">
            No goals yet — what are we saving for? ✈️
          </p>
        )}
      </div>

      <AnimatePresence>
        {showForm && <GoalForm onClose={() => setShowForm(false)} refresh={refresh} />}
      </AnimatePresence>
    </div>
  );
}

function GoalForm({ onClose, refresh }) {
  const [form, setForm] = useState({ title: "", emoji: "✈️", target_amount: "", deadline: "" });
  const toast = useToast();
  const EMOJIS = ["✈️", "🏠", "💍", "🚗", "🎁", "🎯", "📱", "🐶"];

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.target_amount || !supabase) return;
    const ok = await runQuery(
      supabase.from("savings_goals").insert({
        title: form.title.trim(),
        emoji: form.emoji,
        target_amount: Number(form.target_amount),
        deadline: form.deadline || null,
      }),
      toast,
      "Goal created 🎯"
    );
    if (ok) {
      refresh();
      onClose();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-(--overlay) p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        className="card w-full max-w-sm p-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-wine text-lg">New savings goal</h3>
          <button type="button" onClick={onClose} className="text-rose-deep/60">
            <X size={18} />
          </button>
        </div>

        <input
          autoFocus
          className="input-love mt-4"
          placeholder="Goal (e.g. Trip to Paris)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <div className="mt-3 flex gap-1.5 flex-wrap">
          {EMOJIS.map((em) => (
            <button
              type="button"
              key={em}
              onClick={() => setForm({ ...form, emoji: em })}
              className={`w-9 h-9 rounded-xl text-lg border-2 ${
                form.emoji === em ? "border-rose-deep bg-blush" : "border-line"
              }`}
            >
              {em}
            </button>
          ))}
        </div>

        <input
          type="number" step="0.01" min="0"
          className="input-love mt-3"
          placeholder="Target amount (₹)"
          value={form.target_amount}
          onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
        />
        <input
          type="date"
          className="input-love mt-3"
          value={form.deadline}
          onChange={(e) => setForm({ ...form, deadline: e.target.value })}
        />

        <button className="btn-love w-full justify-center mt-5" disabled={!form.title.trim() || !form.target_amount}>
          <Heart size={15} /> Start saving
        </button>
      </motion.form>
    </motion.div>
  );
}

function Calculator() {
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState(null);

  const press = (v) => {
    if (v === "=") {
      try {
        if (!/^[\d\s+\-*/().%]+$/.test(expr)) throw new Error();
        const r = evaluate(expr);
        setResult(Number.isFinite(r) ? Math.round(r * 10000) / 10000 : "Error");
      } catch {
        setResult("Error");
      }
    } else if (v === "C") {
      setExpr("");
      setResult(null);
    } else if (v === "⌫") {
      setExpr((e) => e.slice(0, -1));
    } else {
      setExpr((e) => e + v);
      setResult(null);
    }
  };

  const keys = ["C", "⌫", "%", "/", "7", "8", "9", "*", "4", "5", "6", "-", "1", "2", "3", "+", "0", ".", "="];

  return (
    <div className="card mt-6 p-5 max-w-sm mx-auto">
      <h2 className="font-bold text-wine text-lg text-center">Calculator</h2>
      <div className="mt-3 rounded-2xl bg-blush p-4 text-right">
        <div className="text-sm text-wine/60 min-h-5 truncate">{expr || "0"}</div>
        <div className="text-2xl font-extrabold text-rose-deep min-h-8">
          {result !== null ? result : ""}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            className={`py-3 rounded-xl font-bold transition-all ${
              k === "="
                ? "bg-linear-to-r from-rose to-rose-deep text-on-accent col-span-2"
                : /[+\-*/%]/.test(k)
                ? "bg-blush text-rose-deep"
                : "bg-card border border-line hover:bg-blush/60"
            }`}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}
