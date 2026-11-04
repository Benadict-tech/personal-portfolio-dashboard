"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// false during SSR + the hydration pass, true afterwards — use to defer
// anything that depends on the browser's clock/locale/timezone.
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
