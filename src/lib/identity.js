"use client";

const KEY = "us-identity";

// In-memory fallback so identity still works for the session when
// localStorage is blocked (e.g. private browsing)
let sessionIdentity = null;

export function getIdentity() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(KEY)) || sessionIdentity;
  } catch {
    return sessionIdentity;
  }
}

export function setIdentity(identity) {
  sessionIdentity = identity;
  let saved = true;
  try {
    localStorage.setItem(KEY, JSON.stringify(identity));
  } catch {
    saved = false;
  }
  window.dispatchEvent(new Event("us-identity-changed"));
  return saved;
}

export function clearIdentity() {
  sessionIdentity = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // storage blocked — nothing to clear
  }
  window.dispatchEvent(new Event("us-identity-changed"));
}

export function otherSlot(slot) {
  return slot === "a" ? "b" : "a";
}
