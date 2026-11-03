"use client";

import { useCallback, useEffect, useState } from "react";

export const THEMES = [
  { key: "classic", label: "First Blush", desc: "Soft pink & rose", swatches: ["#fff5f7", "#fb6f92", "#a4133c"] },
  { key: "luxe", label: "Midnight Tryst", desc: "Charcoal & champagne gold", swatches: ["#0e0a12", "#cfa46f", "#e8d5b5"] },
  { key: "editorial", label: "Love Letter", desc: "Cream & terracotta", swatches: ["#faf5ef", "#c96f4a", "#6b4a36"] },
];

const KEY = "us-theme";

export function getTheme() {
  if (typeof window === "undefined") return "classic";
  return localStorage.getItem(KEY) || "classic";
}

export function applyTheme(key) {
  document.documentElement.dataset.theme = key;
  localStorage.setItem(KEY, key);
  window.dispatchEvent(new Event("us-theme-changed"));
}

export function useTheme() {
  const [theme, setTheme] = useState("classic");

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
