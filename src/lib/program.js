"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { addDays, format } from "date-fns";
import { supabase } from "./supabase";
import { todayStr } from "./dates";

// ---------- program constants ----------

export const TOTAL_DAYS = 90;
export const SLOTS = ["a", "b"];

// Fixed journey start: Nov 23–24 are practice days, Day 1 = Nov 25.
export const PROGRAM_START = "2026-11-25";
export const TRIAL_DAYS = 2;
export const TRIAL_LABEL = "Trial day";

// The couple's planned rest days — tasks are excluded, days don't count
// toward the 90. Stored on program_settings.break_dates at seed time so it
// can be tuned in Supabase without a deploy.
export const PLANNED_BREAK_LABEL = "Planned break";

export const SUGGESTED_TIMES = ["morning", "afternoon", "evening", "anytime"];

export const CATEGORIES = [
  { key: "morning", label: "Morning Ritual" },
  { key: "nutrition", label: "Nutrition & Nourishment" },
  { key: "movement", label: "Movement & Wellness" },
  { key: "quest", label: "Daily Quest" },
  { key: "hair", label: "Hair Care Ritual" },
  { key: "evening", label: "Evening Reflection & Sleep" },
];

export const STATUS = {
  pending: { label: "Pending" },
  completed: { label: "Completed" },
  skipped: { label: "Skipped" },
  missed: { label: "Missed" },
  not_applicable: { label: "Not applicable" },
  planned_break: { label: "Planned break" },
};

const CLOSED = ["completed", "skipped", "missed"];

// Ticking clock hook — re-renders every minute so "how late is it" stays live.
export function useNow(stepMs = 60_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), stepMs);
    return () => clearInterval(iv);
  }, [stepMs]);
  return now;
}

// How deep into the local day are we? Drives the gentle escalation styling —
// never a deadline, just the sky slowly filling with lanterns.
// 0 = morning · 1 = afternoon (12pm+) · 2 = evening (5pm+) · 3 = night (9pm+)
export function lateLevel(now = new Date()) {
  const h = now.getHours();
  if (h >= 21 || h < 5) return 3;
  if (h >= 17) return 2;
  if (h >= 12) return 1;
  return 0;
}

// Small informational hint under each activity — a suggestion, never a deadline.
export function suggestedLabel(task) {
  if (task.unit === "hours") return "Target: 7–9 hours per night";
  if (task.activity_name === "Go for a walk")
    return "Suggested: Evening · 20–30 minutes — anytime today works too";
  const t = task.suggested_time;
  if (t === "anytime") return "Suggested: Anytime — complete whenever suits you today";
  const name = t.charAt(0).toUpperCase() + t.slice(1);
  const qty =
    task.quantity && task.unit ? ` · ${task.quantity} ${task.unit}` : "";
  return `Suggested: ${name}${qty} — complete anytime today`;
}

// ---------- activity templates ----------

// ---------- rotating daily content ----------

const FRUITS = [
  "a papaya", "a guava", "a kiwi", "a handful of berries", "a pomegranate",
  "an orange", "an apple", "a banana", "pineapple", "a pear",
];

const NUTS = [
  "almonds + walnuts", "pumpkin seeds", "sunflower seeds", "flax seeds",
  "the Corona trail mix", "cashews + raisins", "chia seed pudding", "mixed seeds",
];

// per-partner protein pools — husband eats non-veg, wife eats eggs/veg (+ chicken sometimes)
const PROTEIN = {
  a: ["eggs", "chicken", "fish", "paneer + dal", "a Greek yogurt bowl", "prawns",
      "lean mutton", "soya chunks", "sprouts + eggs", "a chicken salad"],
  b: ["eggs", "paneer", "dal & rice", "rajma or chana", "soya chunks",
      "a Greek yogurt bowl", "sprouts", "chicken", "paneer bhurji", "a chickpea salad"],
};

const SOUPS = {
  a: ["Spinach & Lentil Soup", "Golden Carrot-Ginger Soup", "Tomato-Basil Soup",
      "Mushroom Soup", "Chicken & Vegetable Soup", "Sweet Corn Soup", "Pumpkin Soup"],
  b: ["Spinach & Lentil Soup", "Golden Carrot-Ginger Soup", "Tomato-Basil Soup",
      "Mushroom Soup", "Sweet Corn Soup", "Pumpkin Soup", "Veg Manchow Soup"],
};

const EXERCISES = [
  "a 20-minute yoga flow", "a stretching session", "light strength (squats, wall push-ups, plank)",
  "a dance workout video", "a cycle ride", "stair climbing rounds", "a brisk long walk",
  "badminton or active play", "a full-body mobility routine",
];

const WELLNESS = [
  "5 minutes of box breathing", "a gratitude journal entry", "a 10-minute meditation",
  "a digital sunset — no screens for an hour", "some unhurried hobby time",
  "a call with someone you love", "quiet time outdoors",
];

// Weekly themes — each day of the week gets a different little mission.
const WEEK_THEMES = [
  { name: "Hydration Hero", quests: [
    "Infuse your water with lemon, mint or cucumber today.",
    "One extra glass of water before every meal.",
    "Swap one tea/coffee for herbal tea.",
    "Finish your bottle twice before dinner."] },
  { name: "Greens Week", quests: [
    "Add one green thing to every meal today.",
    "Try a vegetable you haven't had this month.",
    "Start one meal with a small salad.",
    "Hide spinach in your soup or dal."] },
  { name: "Sugar Smart", quests: [
    "Skip dessert today — fruit is your sweet.",
    "Read one food label and count the added sugar.",
    "No sugary drinks all day.",
    "When a craving hits, wait 10 minutes first."] },
  { name: "Scalp Kindness", quests: [
    "No heat styling today — air dry only.",
    "Loose hairstyles all day, nothing tight.",
    "Sleep on a clean pillowcase tonight.",
    "Pat your hair dry — no rubbing with the towel."] },
  { name: "Protein Power", quests: [
    "Protein at every single meal today.",
    "Cook one new protein recipe.",
    "Check your palm-size protein portions.",
    "Swap one snack for a protein snack."] },
  { name: "Move More", quests: [
    "Take the stairs instead of the lift today.",
    "One extra 10-minute walk somewhere in your day.",
    "A 2-minute stretch break every hour.",
    "A slow stroll after dinner tonight."] },
  { name: "Mind & Calm", quests: [
    "Box breathing: 4 counts in, hold 4, out 4 — five rounds.",
    "Write down three good things from today.",
    "A guided meditation — any app, 10 minutes.",
    "Brain-dump your worries on paper before bed."] },
  { name: "Sleep Ritual", quests: [
    "Pick tonight's bedtime now — and keep it.",
    "Screens off one hour before bed.",
    "Make your room cool, dark and quiet tonight.",
    "A warm non-caffeinated drink as your wind-down."] },
  { name: "Us Week", quests: [
    "Cook the same recipe apart — compare photos tonight.",
    "Take a walk 'together' over a call.",
    "Send each other a photo of today's meal.",
    "Make your partner's favourite recipe."] },
  { name: "Gut Friendly", quests: [
    "One fermented food today — curd, kefir or buttermilk.",
    "Add a fibre boost — seeds, veg or whole grains.",
    "Eat one meal slowly, no screens.",
    "Curd rice or a probiotic snack today."] },
];

// ---------- activity templates ----------

// One entry = one task instance. Content rotates deterministically by `seq`
// (position in the journey) so both partners see the same daily picks —
// except diet pools, which differ by slot. `dayNumber` drives phases and
// milestones; trial days pass null and get the full base routine.
function templatesFor(date, dayNumber, slot, seq) {
  const wd = date.getDay();
  const phase = !dayNumber ? 0 : dayNumber <= 30 ? 1 : dayNumber <= 60 ? 2 : 3;
  const pick = (arr) => arr[seq % arr.length];
  const diet = slot === "b" ? "b" : "a";

  const waterQty = phase >= 2 ? 9 : 8;
  const walkQty = phase >= 3 ? 40 : 30;

  const T = [
    // Morning / anytime
    {
      activity_name: "Drink enough water",
      category: "morning",
      suggested_time: "morning",
      quantity: waterQty,
      unit: "glasses",
      description: `Sip steadily through the day — target ${waterQty} glasses.`,
      instructions: "Keep a bottle nearby and refill it. Record how many glasses you actually had.",
      benefits: "Hydration supports scalp health and nutrient delivery to follicles.",
    },
    {
      activity_name: `Nuts & seeds — ${pick(NUTS)}`,
      category: "morning",
      suggested_time: "morning",
      quantity: 1,
      unit: "handful",
      description: "A small handful is enough — raw or lightly roasted.",
      benefits: "Zinc, selenium and omega-3s that support hair strength.",
    },
    {
      activity_name: `Protein — ${pick(PROTEIN[diet])}`,
      category: "morning",
      suggested_time: "morning",
      description: "Start the day with a proper protein serving.",
      benefits: "Hair is made of keratin — morning protein sets the day up.",
    },
    {
      activity_name: `Fruit of the day — ${pick(FRUITS)}`,
      category: "morning",
      suggested_time: "anytime",
      quantity: 1,
      unit: "fruit",
      benefits: "Vitamin C aids collagen production and iron absorption.",
    },
    // Nutrition
    {
      activity_name: "Vegetables with a meal",
      category: "nutrition",
      suggested_time: "afternoon",
      description: "A real serving of cooked or raw vegetables.",
      benefits: "Iron, folate and antioxidants for the growth phase.",
    },
    {
      activity_name: "Adequate protein today",
      category: "nutrition",
      suggested_time: "anytime",
      description: "Hit your protein target across the day's meals.",
    },
    {
      activity_name: "Today's homemade meal",
      category: "nutrition",
      suggested_time: "evening",
      description: "Cook or eat the planned homemade meal — no takeout swap.",
      benefits: "You control the oil, salt and sugar that way.",
    },
    {
      activity_name: `Soup — ${pick(SOUPS[diet])}`,
      category: "nutrition",
      suggested_time: "evening",
      quantity: 1,
      unit: "bowl",
      description: "From the recipe library — or your own take on it.",
      benefits: "Warm, nutrient-dense and easy on the stomach.",
    },
    {
      activity_name: "Limit added sugar",
      category: "nutrition",
      suggested_time: "anytime",
      description: "Keep sweets and sugary drinks to a minimum today.",
      benefits: "Less inflammation, steadier insulin — kinder to follicles.",
    },
    // Movement & wellness
    {
      activity_name: "Go for a walk",
      category: "movement",
      suggested_time: "evening",
      quantity: walkQty,
      unit: "min",
      description: `An easy walk whenever it fits — target ${walkQty} minutes.`,
      benefits: "Circulation, mood and sleep quality all improve.",
    },
    {
      activity_name: `Wellness — ${pick(WELLNESS)}`,
      category: "movement",
      suggested_time: "anytime",
      quantity: 10,
      unit: "min",
      description: "Today's little stress-reset, whenever it fits.",
      benefits: "Stress is a real shedding trigger; a few minutes helps.",
    },
    // Hair care
    {
      activity_name: "Apply hair serum",
      category: "hair",
      suggested_time: "evening",
      description: "Apply serum per the product instructions.",
      instructions: "Follow the label — a few drops on damp or dry hair, mid-lengths to ends.",
      is_reschedulable: false,
    },
    {
      activity_name: "Scalp check-in",
      category: "hair",
      suggested_time: "evening",
      description: "Note any itching, flaking, redness or tenderness.",
      instructions: "Write what you observe in the notes — it helps your dermatologist.",
    },
    // Evening reflection & sleep
    {
      activity_name: "Log bedtime & wake-up",
      category: "evening",
      suggested_time: "evening",
      description: "Record when you slept and when you woke in the notes.",
    },
    {
      activity_name: "Sleep 7–9 hours",
      category: "evening",
      suggested_time: "evening",
      quantity: 8,
      unit: "hours",
      description: "Record how many hours you actually slept.",
      benefits: "Growth and repair hormones peak during deep sleep.",
    },
    // Medication — follows the prescription, NOT the flexible rule
    {
      activity_name: "Medication — morning dose",
      category: "hair",
      suggested_time: "morning",
      frequency: "daily",
      is_medical: true,
      is_mandatory: true,
      is_reschedulable: false,
      min_interval_minutes: 360,
      description: "Apply/take the prescribed treatment as directed.",
      instructions:
        "Follow your dermatologist's instructions exactly. Never double a dose after a missed one — just take the next scheduled dose.",
    },
    {
      activity_name: "Medication — evening dose",
      category: "hair",
      suggested_time: "evening",
      frequency: "daily",
      is_medical: true,
      is_mandatory: true,
      is_reschedulable: false,
      min_interval_minutes: 360,
      description: "Apply/take the prescribed treatment as directed.",
      instructions:
        "Follow your dermatologist's instructions exactly. Never double a dose after a missed one — just take the next scheduled dose.",
    },
  ];

  // Daily quest — the week's theme, a different mission each day
  {
    const theme = dayNumber
      ? WEEK_THEMES[Math.floor((dayNumber - 1) / 7) % WEEK_THEMES.length]
      : { name: "Warm-up", quests: ["Get a feel for the checklist — no pressure today.", "Notice which activities fit your rhythm best."] };
    T.push({
      activity_name: `Daily quest — ${theme.name}`,
      category: "quest",
      suggested_time: "anytime",
      description: theme.quests[((dayNumber || seq) - 1 + theme.quests.length) % theme.quests.length],
      benefits: "Small themed missions keep the routine fresh.",
    });
  }

  // Scheduled shampoo — twice a week (Mon & Thu)
  if (wd === 1 || wd === 4) {
    T.push({
      activity_name: "Scheduled shampoo",
      category: "hair",
      suggested_time: "evening",
      frequency: "twice_weekly",
      description: "Wash with the scheduled shampoo routine.",
      instructions: "Lukewarm water, gentle massage — no nails on the scalp.",
    });
  }
  // Coconut oil — twice a week (Tue & Sat), per the configured plan
  if (wd === 2 || wd === 6) {
    T.push({
      activity_name: "Coconut oil treatment",
      category: "hair",
      suggested_time: "evening",
      frequency: "twice_weekly",
      quantity: 30,
      unit: "min",
      description: "Apply coconut oil per the plan, leave it in, then wash.",
      instructions: "Warm a little oil, massage into the scalp, leave ~30 minutes.",
    });
  }
  // Rotating exercise — Sun / Wed / Fri
  if (wd === 0 || wd === 3 || wd === 5) {
    T.push({
      activity_name: `Exercise — ${pick(EXERCISES)}`,
      category: "movement",
      suggested_time: "anytime",
      quantity: phase >= 3 ? 30 : 20,
      unit: "min",
      description: "Today's movement pick — keep it light and fun.",
    });
  }

  // ---- phase escalations & milestones (official days only) ----

  // Phase 2+: scalp massage three times a week
  if (phase >= 2 && (wd === 1 || wd === 3 || wd === 6)) {
    T.push({
      activity_name: "Scalp massage",
      category: "hair",
      suggested_time: "evening",
      quantity: 5,
      unit: "min",
      description: "Gentle fingertip massage — small circles, no nails.",
      benefits: "Boosts blood flow to the follicles.",
    });
  }
  // Phase 3: weekly hair mask on Sundays + longer mindfulness
  if (phase >= 3 && wd === 0) {
    T.push({
      activity_name: "Weekly hair mask",
      category: "hair",
      suggested_time: "evening",
      frequency: "weekly",
      quantity: 20,
      unit: "min",
      description: "Deep-conditioning mask — curd+egg or your favourite pack.",
    });
  }
  // Progress photo day every 15 official days
  if (dayNumber && dayNumber % 15 === 0) {
    T.push({
      activity_name: "Progress photo day 📸",
      category: "quest",
      suggested_time: "anytime",
      is_mandatory: true,
      description: "Same spot, same lighting — crown, hairline and side shots.",
      instructions: "Compare with your last set and note any change in the notes.",
      benefits: "Progress you can't feel day-to-day becomes visible over weeks.",
    });
  }
  // Reflection day at each phase boundary
  if (dayNumber === 30 || dayNumber === 60 || dayNumber === 90) {
    T.push({
      activity_name: `Reflection day — ${dayNumber} days in`,
      category: "evening",
      suggested_time: "evening",
      is_mandatory: true,
      description: "Look back at the month: shedding, density, energy, consistency.",
      instructions: "Write a few lines in the notes — what improved, what needs work.",
    });
  }

  return T;
}

// ---------- seeding ----------

function decBreakDates(startStr) {
  // Dec 3–5 of whichever year the break falls in for this program window
  const start = new Date(startStr + "T00:00:00");
  const end = addDays(start, TOTAL_DAYS + 7);
  const year =
    start.getMonth() <= 10 ? start.getFullYear() : end.getFullYear();
  return [3, 4, 5].map((d) => `${year}-12-0${d}`);
}

export async function getSettings() {
  if (!supabase) return null;
  const { data } = await supabase.from("program_settings").select("*").eq("id", 1).maybeSingle();
  return data;
}

// Idempotent: whoever loads the journey first creates the spine; both
// partners share the same program_settings row so they always agree.
export async function ensureProgramSeeded({ rebuild = false } = {}) {
  if (!supabase) return { ok: false, error: "Supabase is not configured" };

  if (rebuild) {
    // regenerate the whole plan — completion history is wiped with the tasks
    await supabase.from("program_tasks").delete().neq("id", 0);
  }

  let settings = await getSettings();
  if (!settings) {
    const { data, error } = await supabase
      .from("program_settings")
      .insert({ id: 1, start_date: PROGRAM_START, total_days: TOTAL_DAYS, break_dates: decBreakDates(PROGRAM_START) })
      .select()
      .single();
    // lost the race — the partner seeded first, which is fine
    settings = error ? await getSettings() : data;
    if (!settings)
      return { ok: false, error: error?.message || "Couldn't create program settings — are you signed in with a claimed heart?" };
  }

  const { count: dayCount } = await supabase
    .from("program_days")
    .select("id", { count: "exact", head: true });

  // an earlier attempt may have saved a different start date — align it to
  // the fixed start while no calendar has been generated yet
  if (!dayCount && settings.start_date !== PROGRAM_START) {
    await supabase
      .from("program_settings")
      .update({ start_date: PROGRAM_START, break_dates: decBreakDates(PROGRAM_START) })
      .eq("id", 1);
    settings.start_date = PROGRAM_START;
    settings.break_dates = decBreakDates(PROGRAM_START);
  }

  let programDays;
  if (dayCount && dayCount > 0) {
    // days already exist — but a previous attempt may have died before the
    // tasks were written. Only generate tasks that are missing.
    const { data: existing } = await supabase
      .from("program_days")
      .select("*")
      .order("calendar_date", { ascending: true });
    programDays = existing || [];
    const { count: taskCount } = await supabase
      .from("program_tasks")
      .select("id", { count: "exact", head: true });
    if (taskCount && taskCount > 0) return { ok: true };
    if (!programDays.length)
      return { ok: true }; // days exist but we can't read them — partner's RLS scope
  } else {
    const breaks = new Set(settings.break_dates || []);
    const days = [];
    const start = new Date(settings.start_date + "T00:00:00");

    // trial days first — real tasks, but not counted toward the 90
    for (let i = TRIAL_DAYS; i >= 1; i--) {
      days.push({
        calendar_date: format(addDays(start, -i), "yyyy-MM-dd"),
        day_number: null,
        is_break: false,
        label: TRIAL_LABEL,
      });
    }

    // then the official calendar until every program day is assigned
    let cursor = start;
    let dayNumber = 0;
    while (dayNumber < settings.total_days) {
      const dateStr = format(cursor, "yyyy-MM-dd");
      const isBreak = breaks.has(dateStr);
      // identical keys on every row — PostgREST fills absent keys with null
      days.push({
        calendar_date: dateStr,
        day_number: isBreak ? null : ++dayNumber,
        is_break: isBreak,
        label: isBreak ? PLANNED_BREAK_LABEL : "",
      });
      cursor = addDays(cursor, 1);
    }

    const { data: insertedDays, error: dayErr } = await supabase
      .from("program_days")
      .insert(days)
      .select();
    if (dayErr) {
      const { data: existing } = await supabase.from("program_days").select("*");
      if (!existing?.length) return { ok: false, error: `program_days: ${dayErr.message}` };
      programDays = existing;
    } else {
      programDays = insertedDays;
    }
  }

  const dayId = new Map(programDays.map((d) => [d.calendar_date, d.id]));
  const tasks = [];

  let seq = 0;
  for (const d of programDays) {
    if (d.is_break) continue;
    const date = new Date(d.calendar_date + "T00:00:00");
    const daySeq = seq++;
    for (const slot of SLOTS) {
      for (const t of templatesFor(date, d.day_number, slot, daySeq)) {
        // identical keys on every row — PostgREST nulls absent keys, and most
        // of these columns are not-null even though they carry defaults
        tasks.push({
          user_id: slot,
          program_day_id: dayId.get(d.calendar_date),
          activity_name: t.activity_name,
          description: t.description || "",
          category: t.category || "anytime",
          suggested_time: t.suggested_time || "anytime",
          frequency: t.frequency || "once",
          scheduled_date: d.calendar_date,
          due_date: d.calendar_date,
          quantity: t.quantity ?? null,
          unit: t.unit || "",
          instructions: t.instructions || "",
          benefits: t.benefits || "",
          completion_status: "pending",
          is_mandatory: Boolean(t.is_mandatory),
          is_medical: Boolean(t.is_medical),
          is_reschedulable: t.is_reschedulable ?? true,
          contributes_to_score: true,
          min_interval_minutes: t.min_interval_minutes ?? null,
        });
      }
    }
  }

  // insert in batches — the program is ~2,500 tasks total
  for (let i = 0; i < tasks.length; i += 400) {
    const { error } = await supabase.from("program_tasks").insert(tasks.slice(i, i + 400));
    if (error)
      return { ok: false, error: `program_tasks batch ${Math.floor(i / 400) + 1}: ${error.message}` };
  }
  return { ok: true };
}

// ---------- hooks ----------

export function useProgram() {
  const [settings, setSettings] = useState(null);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState(null);

  const refresh = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const s = await getSettings();
    setSettings(s);
    const { data } = await supabase
      .from("program_days")
      .select("*")
      .order("calendar_date", { ascending: true });
    setDays(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) refresh();
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const seed = useCallback(async (rebuild = false) => {
    setSeeding(true);
    setSeedError(null);
    const result = await ensureProgramSeeded({ rebuild });
    if (!result.ok) setSeedError(result.error || "Seeding failed");
    await refresh();
    setSeeding(false);
    return result;
  }, [refresh]);

  const today = todayStr();
  const dayByDate = Object.fromEntries(days.map((d) => [d.calendar_date, d]));
  // the official day only counts rows that carry a day_number — trial days
  // and planned breaks don't move the counter
  const currentDay =
    days.find((d) => d.calendar_date === today && d.day_number != null) ||
    [...days].reverse().find((d) => d.day_number != null && d.calendar_date <= today) ||
    null;

  return { settings, days, dayByDate, currentDay, loading, seeding, seedError, seed, refresh };
}

// All tasks for one partner on one local calendar date, live via realtime.
export function useDayTasks(slot, dateStr) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!supabase || !slot || !dateStr) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("program_tasks")
      .select("*")
      .eq("user_id", slot)
      .eq("scheduled_date", dateStr)
      .order("id", { ascending: true });
    setTasks(data || []);
    setLoading(false);
  }, [slot, dateStr]);

  useEffect(() => {
    Promise.resolve().then(refresh);
    if (!supabase) return;
    const channel = supabase
      .channel(`ptasks-${slot}-${dateStr}-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "program_tasks" }, () => refresh())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [refresh, slot, dateStr]);

  return { tasks, loading, refresh };
}

// Full task history for one partner (analytics + partner dashboard).
// Paginated because a whole program is ~1,300 rows per person.
export function useAllTasks(slot) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!supabase || !slot) {
      setLoading(false);
      return;
    }
    const all = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from("program_tasks")
        .select("*")
        .eq("user_id", slot)
        .order("scheduled_date", { ascending: true })
        .order("id", { ascending: true })
        .range(from, from + 999);
      if (error || !data) break;
      all.push(...data);
      if (data.length < 1000) break;
    }
    setTasks(all);
    setLoading(false);
  }, [slot]);

  useEffect(() => {
    Promise.resolve().then(refresh);
    if (!supabase || !slot) return;
    const channel = supabase
      .channel(`ptasks-all-${slot}-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "program_tasks" }, () => refresh())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [refresh, slot]);

  return { tasks, loading, refresh };
}

// Once per mount, close out yesterday's (and older) pending tasks as missed —
// end of the LOCAL calendar day is the only deadline that exists.
export function useMissedSweep(slot) {
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current || !supabase || !slot) return;
    ran.current = true;
    supabase
      .from("program_tasks")
      .update({ completion_status: "missed" })
      .eq("user_id", slot)
      .eq("completion_status", "pending")
      .lt("scheduled_date", todayStr())
      .then(() => {});
  }, [slot]);
}

// ---------- task actions ----------

// How long since this partner last logged this medical activity?
export async function medIntervalCheck(task) {
  if (!task.is_medical || !supabase) return { ok: true };
  const { data } = await supabase
    .from("med_logs")
    .select("applied_at")
    .eq("user_id", task.user_id)
    .eq("activity_name", task.activity_name.split(" — ")[0])
    .order("applied_at", { ascending: false })
    .limit(1);
  const last = data?.[0]?.applied_at;
  const required = task.min_interval_minutes;
  if (!last || !required) return { ok: true };
  const sinceMin = (Date.now() - new Date(last).getTime()) / 60000;
  return sinceMin >= required
    ? { ok: true }
    : { ok: false, sinceMin: Math.round(sinceMin), required };
}

export async function completeTask(task, { notes, quantity } = {}) {
  if (!supabase) return false;
  const patch = {
    completion_status: "completed",
    completed_at: new Date().toISOString(),
    ...(notes !== undefined ? { notes } : {}),
    ...(quantity !== undefined && quantity !== "" ? { completed_quantity: Number(quantity) } : {}),
  };
  const { error } = await supabase.from("program_tasks").update(patch).eq("id", task.id);
  if (error) return false;
  if (task.is_medical) {
    await supabase.from("med_logs").insert({
      user_id: task.user_id,
      task_id: task.id,
      activity_name: task.activity_name.split(" — ")[0],
    });
  }
  return true;
}

export async function skipTask(task, reason) {
  if (!supabase) return false;
  const { error } = await supabase
    .from("program_tasks")
    .update({ completion_status: "skipped", skip_reason: reason || "" })
    .eq("id", task.id);
  return !error;
}

export async function undoTask(task) {
  if (!supabase) return false;
  const { error } = await supabase
    .from("program_tasks")
    .update({ completion_status: "pending", completed_at: null, skip_reason: "" })
    .eq("id", task.id);
  return !error;
}

export async function saveTaskDetails(task, { notes, quantity }) {
  if (!supabase) return false;
  const patch = {};
  if (notes !== undefined) patch.notes = notes;
  if (quantity !== undefined && quantity !== "") patch.completed_quantity = Number(quantity);
  const { error } = await supabase.from("program_tasks").update(patch).eq("id", task.id);
  return !error;
}

// ---------- analytics (completion, not punctuality) ----------

const eligible = (t) =>
  t.contributes_to_score && !["not_applicable", "planned_break"].includes(t.completion_status);

export function summarize(tasks) {
  const el = tasks.filter(eligible);
  const done = el.filter((t) => t.completion_status === "completed");
  return {
    total: el.length,
    completed: done.length,
    pending: el.filter((t) => t.completion_status === "pending").length,
    skipped: el.filter((t) => t.completion_status === "skipped").length,
    missed: el.filter((t) => t.completion_status === "missed").length,
    pct: el.length ? Math.round((done.length / el.length) * 100) : 0,
  };
}

export function categorySummary(tasks, category) {
  return summarize(tasks.filter((t) => t.category === category));
}

export function medAdherence(tasks) {
  const meds = tasks.filter((t) => t.is_medical && eligible(t));
  const done = meds.filter((t) => t.completion_status === "completed").length;
  return { total: meds.length, done, pct: meds.length ? Math.round((done / meds.length) * 100) : 0 };
}

export function sleepStats(tasks) {
  const slept = tasks.filter(
    (t) => t.unit === "hours" && t.completion_status === "completed" && t.completed_quantity
  );
  const avg = slept.length
    ? slept.reduce((s, t) => s + Number(t.completed_quantity), 0) / slept.length
    : 0;
  return { nights: slept.length, avg: Math.round(avg * 10) / 10 };
}

// completion % for each calendar date that has tasks — the chart series
export function dailySeries(tasks) {
  const byDate = new Map();
  for (const t of tasks) {
    if (!eligible(t)) continue;
    const d = byDate.get(t.scheduled_date) || { total: 0, done: 0 };
    d.total++;
    if (t.completion_status === "completed") d.done++;
    byDate.set(t.scheduled_date, d);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, v]) => ({ date, pct: Math.round((v.done / v.total) * 100), ...v }));
}

// consistency over the trailing N days that actually have tasks
export function rollingConsistency(tasks, nDays) {
  const from = format(addDays(new Date(), -nDays + 1), "yyyy-MM-dd");
  return summarize(tasks.filter((t) => t.scheduled_date >= from)).pct;
}

// ---------- encouragements ----------

export function useEncouragements() {
  const [rows, setRows] = useState([]);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("encouragements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    setRows(data || []);
  }, []);

  useEffect(() => {
    Promise.resolve().then(refresh);
    if (!supabase) return;
    const channel = supabase
      .channel(`enc-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "encouragements" }, () => refresh())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [refresh]);

  const send = useCallback(
    async (from_slot, to_slot, message) => {
      if (!supabase || !message.trim()) return false;
      const { error } = await supabase
        .from("encouragements")
        .insert({ from_slot, to_slot, message: message.trim() });
      return !error;
    },
    []
  );

  return { encouragements: rows, send, refresh };
}

export { CLOSED };
