"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { otherSlot } from "./identity";

// Identity = Supabase Auth session + a `people` row claimed via user_id.
export function usePeople() {
  const [people, setPeople] = useState([]);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);

  // listen for auth session changes (login, logout, token refresh)
  useEffect(() => {
    if (!supabase) {
      queueMicrotask(() => {
        setLoading(false);
        setAuthReady(true);
      });
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const refresh = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from("people").select("*").order("slot");
    if (data) setPeople(data);
    if (error) console.warn("people fetch failed:", error.message);
    setLoading(false);
  }, []);

  // (re)fetch people once auth is ready and whenever the session user changes —
  // RLS is authenticated-only, so fetching before login would return nothing
  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) refresh();
    });
    return () => {
      cancelled = true;
    };
  }, [refresh, authReady, user?.id]);

  // Claim a heart slot for the logged-in user.
  const pickSlot = useCallback(
    async (slot, name) => {
      if (!supabase || !user) return false;
      const existing = people.find((p) => p.slot === slot)?.name;
      const { data, error } = await supabase
        .from("people")
        .update({
          user_id: user.id,
          name: name || existing || (slot === "a" ? "Partner A" : "Partner B"),
        })
        .eq("slot", slot)
        .is("user_id", null) // only claim a free heart
        .select()
        .single();
      await refresh();
      // data null when the heart was already claimed → report failure
      return !error && Boolean(data);
    },
    [user, people, refresh]
  );

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, []);

  const mePerson = user ? people.find((p) => p.user_id === user.id) : null;
  const me = mePerson ? { slot: mePerson.slot, name: mePerson.name, emoji: mePerson.emoji } : null;
  const partner = mePerson ? people.find((p) => p.slot === otherSlot(mePerson.slot)) : null;

  return {
    people,
    me,
    mePerson,
    partner,
    user,
    authReady,
    pickSlot,
    signOut,
    refresh,
    loading: loading || !authReady,
  };
}
