"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

// Run a supabase write and surface failures instead of silently swallowing them.
export async function runQuery(query, toast, successMsg) {
  const { error } = await query;
  if (error) {
    toast?.(error.message, "error");
    return false;
  }
  if (successMsg) toast?.(successMsg);
  return true;
}

// Small hook: query a table with optional filter, re-fetch on realtime changes.
// Pass `deps` when the filter depends on state (e.g. a month) so changes refetch.
export function useTable(table, { filter, order = "created_at", deps = [] } = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const filterRef = useRef(filter);
  filterRef.current = filter;

  const refresh = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let q = supabase.from(table).select("*");
    if (filterRef.current) q = filterRef.current(q);
    const { data, error } = await q.order(order, { ascending: true });
    if (data) setRows(data);
    if (error) console.warn(`useTable(${table}) query failed:`, error.message);
    setLoading(false);
  }, [table, order]);

  useEffect(() => {
    refresh();
    if (!supabase) return;
    const channel = supabase
      .channel(`${table}-changes-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // deps re-triggers refresh when caller inputs (month, date, project) change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, refresh, ...deps]);

  return { rows, loading, refresh };
}
