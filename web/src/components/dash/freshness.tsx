"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { ApiError, RefreshNotice } from "@/lib/use-api";

type State = { ts: number | null; refreshing: boolean; error: ApiError | null; notice: RefreshNotice | null; refetch: ((force?: boolean) => void) | null };
const IDLE: State = { ts: null, refreshing: false, error: null, notice: null, refetch: null };

const Ctx = createContext<{ state: State; set: (s: State) => void } | null>(null);

export function FreshnessProvider({ children }: { children: ReactNode }) {
  const [state, set] = useState<State>(IDLE);
  return <Ctx.Provider value={{ state, set }}>{children}</Ctx.Provider>;
}

export function useFreshness(): State {
  return useContext(Ctx)?.state ?? IDLE;
}

/** Each screen reports its data freshness so the topbar pill and refresh button follow the active screen. */
export function useReportFreshness(api: {
  ts: number | null;
  refreshing: boolean;
  error: ApiError | null;
  notice?: RefreshNotice | null;
  refetch: (force?: boolean) => Promise<void>;
}) {
  const ctx = useContext(Ctx);
  const refetchRef = useRef(api.refetch);
  refetchRef.current = api.refetch;
  const set = ctx?.set;
  useEffect(() => {
    set?.({ ts: api.ts, refreshing: api.refreshing, error: api.error, notice: api.notice ?? null, refetch: (f = true) => void refetchRef.current(f) });
  }, [set, api.ts, api.refreshing, api.error, api.notice]);
  useEffect(() => () => set?.(IDLE), [set]);
}

/** Re-renders on an interval so "4m ago" keeps moving. */
export function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}
