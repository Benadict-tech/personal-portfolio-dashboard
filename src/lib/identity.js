"use client";

const KEY = "us-identity";

export function getIdentity() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function setIdentity(identity) {
  localStorage.setItem(KEY, JSON.stringify(identity));
  window.dispatchEvent(new Event("us-identity-changed"));
}

export function clearIdentity() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("us-identity-changed"));
}

export function otherSlot(slot) {
  return slot === "a" ? "b" : "a";
}
