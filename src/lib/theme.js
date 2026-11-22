"use client";

import { useCallback, useEffect, useState } from "react";

export const THEMES = [
  { key: "corona-day", label: "Corona Day", desc: "Lavender daylight & royal purple", swatches: ["#fcf9ff", "#6b21a8", "#f59e0b"] },
  { key: "lantern-night", label: "Lantern Night", desc: "Floating lanterns & twilight violet", swatches: ["#130924", "#a855f7", "#fbbf24"] },
  { key: "classic", label: "First Blush", desc: "Soft pink & rose", swatches: ["#fff5f7", "#fb6f92", "#a4133c"] },
  { key: "luxe", label: "Midnight Tryst", desc: "Charcoal & champagne gold", swatches: ["#0e0a12", "#cfa46f", "#e8d5b5"] },
  { key: "editorial", label: "Love Letter", desc: "Cream & terracotta", swatches: ["#faf5ef", "#c96f4a", "#6b4a36"] },
];

export const TANGLED_THEMES = ["corona-day", "lantern-night"];

const KEY = "us-theme";

export function getTheme() {
  if (typeof window === "undefined") return "corona-day";
  return localStorage.getItem(KEY) || "corona-day";
}

export function applyTheme(key) {
  document.documentElement.dataset.theme = key;
  localStorage.setItem(KEY, key);
  window.dispatchEvent(new Event("us-theme-changed"));
}

export function useTheme() {
  const [theme, setTheme] = useState("corona-day");

  useEffect(() => {
    const sync = () => setTheme(getTheme());
    sync();
    window.addEventListener("us-theme-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("us-theme-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const set = useCallback((key) => applyTheme(key), []);
  return { theme, setTheme: set };
}

// The Kingdom of Corona look — corona-day ⇄ lantern-night, built on the
// app's existing theme engine (localStorage + data-theme, so no flash).
export function useTangledTheme() {
  const { theme, setTheme } = useTheme();
  const mode = theme === "lantern-night" ? "lantern-night" : "corona-day";
  const toggleMode = useCallback(
    () => setTheme(mode === "lantern-night" ? "corona-day" : "lantern-night"),
    [mode, setTheme]
  );
  return { theme, mode, setTheme, toggleMode, isNight: mode === "lantern-night" };
}
