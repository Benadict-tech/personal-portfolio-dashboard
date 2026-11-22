import { addDays, differenceInCalendarDays, format } from "date-fns";

export function todayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

export function shiftDayStr(n) {
  return format(addDays(new Date(), n), "yyyy-MM-dd");
}

// is an undone task past its due time? carried-over tasks are always overdue
export function isTaskOverdue(t) {
  if (t.done || !t.due) return false;
  const today = todayStr();
  if (t.date < today) return true;
  return t.date === today && t.due <= format(new Date(), "HH:mm");
}

// how many minutes past its due time is this task? carried-over tasks count
// a full day. Negative/zero = not late yet.
export function minutesLate(t, now = new Date()) {
  if (t.done || !t.due) return -1;
  const today = todayStr();
  if (t.date < today) return 24 * 60 + 1;
  if (t.date > today) return -1;
  const [h, m] = t.due.split(":").map(Number);
  return now.getHours() * 60 + now.getMinutes() - (h * 60 + m);
}

// gentle escalation bands for overdue tasks — the longer it waits,
// the warmer the card glows
export function lateLevelOf(t, now = new Date()) {
  const late = minutesLate(t, now);
  if (late < 0) return 0;
  if (late >= 120) return 3;
  if (late >= 60) return 2;
  return 1;
}

// how many local days has this planner task been sitting undone?
export function daysLateOf(t, today = todayStr()) {
  if (t.done) return 0;
  return Math.max(
    0,
    differenceInCalendarDays(
      new Date(today + "T00:00:00"),
      new Date(t.date + "T00:00:00")
    )
  );
}

// combined nudge level — whichever is stronger: days old or minutes past due
export function taskLateLevel(t, now = new Date()) {
  if (t.done) return 0;
  return Math.max(Math.min(3, daysLateOf(t)), lateLevelOf(t, now));
}

// "17:30" -> "5:30pm"
export function fmtTime(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")}${h >= 12 ? "pm" : "am"}`;
}

export function monthStr(d = new Date()) {
  return format(d, "yyyy-MM");
}

export function fmtDate(d) {
  return format(new Date(d + "T00:00:00"), "EEE, MMM d");
}
