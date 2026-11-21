import { addDays, format } from "date-fns";

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
