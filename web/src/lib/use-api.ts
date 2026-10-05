"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ApiEnvelope, CreatorsData, DailyData, InsightsData, MonetizationData, OverviewData, ReportData, RetentionData,
} from "@/lib/types";
import { useDashboard } from "@/lib/dashboard-state";

type Entry<T> = { env: ApiEnvelope<T>; fetchedAt: number };
// Module-level cache: navigating back to a screen paints instantly from the
// last response while a fresh one loads behind it (stale-while-revalidate).
const cache = new Map<string, Entry<unknown>>();

export type ApiError = { message: string; code?: string; retryAfter?: number };

const AUTO_REFRESH_MS = 120_000;

function buildUrl(name: string, params: Record<string, string | null | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  return `/api/${name}${s ? `?${s}` : ""}`;
}

export function useApi<T>(
  name: string,
  params: Record<string, string | null | undefined>,
  opts: { enabled?: boolean; autoRefresh?: boolean; unwrap?: (json: unknown) => unknown } = {},
) {
  const { enabled = true, autoRefresh = true, unwrap } = opts;
  const url = buildUrl(name, params);

  const [state, setState] = useState<{
    env: ApiEnvelope<T> | null;
    fetchedAt: number | null;
    error: ApiError | null;
    loading: boolean;
    refreshing: boolean;
  }>(() => {
    const hit = cache.get(url) as Entry<T> | undefined;
    return {
      env: hit?.env ?? null,
      fetchedAt: hit?.fetchedAt ?? null,
      error: null,
      loading: !hit,
      refreshing: false,
    };
  });
  const urlRef = useRef(url);
  urlRef.current = url;

  const load = useCallback(
    async (force: boolean, signal?: AbortSignal) => {
      const target = force ? `${url}${url.includes("?") ? "&" : "?"}fresh=${Date.now()}` : url;
      setState((s) => ({ ...s, refreshing: true, loading: s.env === null }));
      try {
        const res = await fetch(target, { signal, cache: "no-store" });
        let json: unknown = null;
        try {
          json = await res.json();
        } catch {
          /* non-JSON error body */
        }
        if (!res.ok) {
          const j = (json ?? {}) as { error?: string; code?: string; retryAfter?: number };
          throw { message: j.error || `HTTP ${res.status}`, code: j.code, retryAfter: j.retryAfter } as ApiError;
        }
        const env = (unwrap ? { ts: Date.now(), data: unwrap(json) } : json) as ApiEnvelope<T>;
        if (!env || typeof env !== "object" || !("data" in env)) {
          throw { message: "Unexpected response shape" } as ApiError;
        }
        const fetchedAt = Date.now();
        cache.set(url, { env, fetchedAt });
        if (urlRef.current === url) {
          setState({ env, fetchedAt, error: null, loading: false, refreshing: false });
        }
      } catch (e) {
        if ((e as { name?: string })?.name === "AbortError") return;
        const err = (e && typeof e === "object" && "message" in e ? e : { message: "Network error" }) as ApiError;
        if (urlRef.current === url) {
          // Keep the last good data on screen; surface the error alongside it.
          setState((s) => ({ ...s, error: err, loading: false, refreshing: false }));
        }
      }
    },
    [url],
  );

  useEffect(() => {
    if (!enabled) return;
    const hit = cache.get(url) as Entry<T> | undefined;
    setState({
      env: hit?.env ?? null,
      fetchedAt: hit?.fetchedAt ?? null,
      error: null,
      loading: !hit,
      refreshing: false,
    });
    const ctl = new AbortController();
    load(false, ctl.signal);
    return () => ctl.abort();
  }, [url, enabled, load]);

  useEffect(() => {
    if (!enabled || !autoRefresh) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load(false);
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [enabled, autoRefresh, load]);

  return {
    data: state.env?.data ?? null,
    /** When the server computed this snapshot (falls back to when we fetched it). */
    ts: state.env?.ts ?? state.fetchedAt,
    fetchedAt: state.fetchedAt,
    error: state.error,
    loading: state.loading,
    refreshing: state.refreshing,
    refetch: (force = true) => load(force),
  };
}

export function useOverview() {
  const { range, view, from, to } = useDashboard();
  return useApi<OverviewData>("overview", { range, view, from, to });
}

type ScreenMap = {
  report: ReportData;
  daily: DailyData;
  insights: InsightsData;
  monetization: MonetizationData;
  creators: CreatorsData;
  retention: RetentionData;
};

const FIXED_RANGE = new Set(["daily", "retention"]);

export function useScreen<N extends keyof ScreenMap>(name: N, opts: { usesView?: boolean } = {}) {
  const { range, view, from, to } = useDashboard();
  const { usesView = true } = opts;
  return useApi<ScreenMap[N]>("screen", {
    name,
    range: FIXED_RANGE.has(name) ? undefined : range,
    view: usesView ? view : undefined,
    from: FIXED_RANGE.has(name) ? undefined : from,
    to: FIXED_RANGE.has(name) ? undefined : to,
  });
}

/** Personal-data endpoints: attached to the gate key server-side, only after unlock. */
export function useOps<T>(name: "search" | "pro", extra: Record<string, string | null | undefined> = {}, enabled = true) {
  return useApi<T>("ops", { name, ...extra }, { enabled, autoRefresh: false });
}

/** Referral code -> creator handle, from the production cohort map. */
export function useCreatorNames() {
  return useApi<Record<string, string>>("influencer-names", {}, {
    autoRefresh: false,
    unwrap: (j) => (j && typeof j === "object" && "map" in (j as object) ? (j as { map: Record<string, string> }).map : {}),
  });
}
