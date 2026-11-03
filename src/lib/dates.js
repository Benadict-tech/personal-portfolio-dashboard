import { format } from "date-fns";

export function todayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

export function monthStr(d = new Date()) {
  return format(d, "yyyy-MM");
}

export function fmtDate(d) {
  return format(new Date(d + "T00:00:00"), "EEE, MMM d");
}
