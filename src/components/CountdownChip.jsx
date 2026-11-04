"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plane } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { todayStr } from "@/lib/dates";

function diffParts(target) {
  const ms = new Date(target + "T00:00:00") - new Date();
  if (ms <= 0) return null;
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return { d, h, m, s };
}

export default function CountdownChip() {
  const [visit, setVisit] = useState(null);
  const [parts, setParts] = useState(null);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("visits")
      .select("*")
      .gte("date", todayStr())
      .order("date", { ascending: true })
      .limit(1)
      .then(({ data }) => setVisit(data?.[0] || null));
  }, []);

  useEffect(() => {
    if (!visit) return;
    const tick = () => setParts(diffParts(visit.date));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [visit]);

  if (!visit || !parts) return null;

  return (
    <Link
      href="/timer"
      className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-linear-to-r from-rose to-rose-deep text-on-accent font-bold shadow-lg hover:scale-105 transition-transform"
    >
      <Plane size={18} />
      {parts.d}d {parts.h}h {parts.m}m {parts.s}s until {visit.title}
    </Link>
  );
}
