"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { getIdentity, setIdentity, otherSlot } from "./identity";

export function usePeople() {
  const [people, setPeople] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncIdentity = () => setMe(getIdentity());
    syncIdentity();
    window.addEventListener("us-identity-changed", syncIdentity);
    window.addEventListener("storage", syncIdentity);
    return () => {
      window.removeEventListener("us-identity-changed", syncIdentity);
      window.removeEventListener("storage", syncIdentity);
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("people").select("*").order("slot");
    if (data && data.length) setPeople(data);
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

  const pickSlot = useCallback(async (slot, name) => {
    let person = null;
    if (supabase) {
      const { data } = await supabase
        .from("people")
        .update({ name: name || (slot === "a" ? "Partner A" : "Partner B") })
        .eq("slot", slot)
        .select()
        .single();
      person = data;
    }
    setIdentity({ slot, name: person?.name || name || slot, emoji: person?.emoji || "💗" });
    await refresh();
  }, [refresh]);

  const mePerson = me ? people.find((p) => p.slot === me.slot) : null;
  const partner = me ? people.find((p) => p.slot === otherSlot(me.slot)) : null;

  return { people, me, mePerson, partner, pickSlot, refresh, loading };
}
