"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ApiEnvelope, CreatorsData, DailyData, InsightsData, OverviewData, PaymentsData, ReportData, RetentionData,
} from "@/lib/types";
import { useDashboard } from "@/lib/dashboard-state";

type Entry<T> = { env: ApiEnvelope<T>; fetchedAt: number };
// Module-level cache: navigating back to a screen paints instantly from the
// last response while a fresh one loads behind it (stale-while-revalidate).
const cache = new Map<string, Entry<unknown>>();

export type ApiError = { message: string; code?: string; retryAfter?: number };

/** What a manual Refresh actually did, in words. Never leave the person guessing why the numbers did not move. */
export type RefreshNotice = { id: number; tone: "ok" | "info" | "warn"; text: string };

function agoText(sec: number) {
  if (sec < 90) return "a moment ago";
  const m = Math.round(sec / 60);
  return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
}

export function describeRefresh(env: ApiEnvelope<unknown>, prevTs: number | null): Omit<RefreshNotice, "id"> {
  const age = typeof env.ageSec === "number" ? env.ageSec : Math.max(0, Math.round((Date.now() - env.ts) / 1000));
  if (env.busy) {
    return { tone: "info", text: `Another refresh of this view is still running, so these numbers are from ${agoText(age)}. Press Refresh again in a few seconds.` };
  }
  if (env.timedOut) {
    return { tone: "warn", text: `Refresh took longer than 30 seconds, so these numbers are still from ${agoText(age)}. Press Refresh again in a minute.` };
  }
  if (env.capped) {
    const mins = Math.max(1, Math.ceil((env.retryAfterSec ?? 600) / 60));
    return { tone: "warn", text: `Refresh limit for this hour reached, so these numbers are from ${agoText(age)}. It resets in about ${mins} min.` };
  }
  if (env.refreshFailed || env.source === "snapshot-error" || env.source === "snapshot-budget" || env.source === "snapshot-stale") {
    return { tone: "warn", text: `Could not refresh right now, so these numbers are from ${agoText(age)}.${env.budget ? " The PostHog read budget is used up and refills through the hour." : ""}` };
  }
  if (env.source === "snapshot-recent") {
    return { tone: "info", text: `Already up to date. These numbers were computed ${agoText(age)}.` };
  }
  if (prevTs != null && env.ts <= prevTs && age > 120) {
    return { tone: "warn", text: `No newer data came back. These numbers are still from ${agoText(age)}.` };
  }
  return { tone: "ok", text: "Refreshed with the latest numbers." };
}

function buildUrl(name: string, params: Record<string, string | null | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  return `/api/${name}${s ? `?${s}` : ""}`;
}

export function useApi<T>(
  name: string,
  params: Record<string, string | null | undefined>,
  opts: { enabled?: boolean; unwrap?: (json: unknown) => unknown } = {},
) {
  const { enabled = true, unwrap } = opts;
  const url = buildUrl(name, params);

  const [state, setState] = useState<{
    env: ApiEnvelope<T> | null;
    fetchedAt: number | null;
    error: ApiError | null;
    loading: boolean;
    refreshing: boolean;
    notice: RefreshNotice | null;
  }>(() => {
    const hit = cache.get(url) as Entry<T> | undefined;
    return {
      env: hit?.env ?? null,
      fetchedAt: hit?.fetchedAt ?? null,
      error: null,
      loading: !hit,
      refreshing: false,
      notice: null,
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
          setState((s) => ({
            env, fetchedAt, error: null, loading: false, refreshing: false,
            notice: force ? { id: Date.now(), ...describeRefresh(env as ApiEnvelope<unknown>, s.env?.ts ?? null) } : null,
          }));
        }
      } catch (e) {
        if ((e as { name?: string })?.name === "AbortError") return;
        const err = (e && typeof e === "object" && "message" in e ? e : { message: "Network error" }) as ApiError;
        if (urlRef.current === url) {
          // Keep the last good data on screen; surface the error alongside it.
          setState((s) => ({
            ...s, error: err, loading: false, refreshing: false,
            notice: force ? { id: Date.now(), tone: "warn", text: `Refresh failed: ${err.message}. Showing the last numbers${s.env ? ` from ${agoText(Math.round((Date.now() - s.env.ts) / 1000))}` : ""}.` } : s.notice,
          }));
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
      notice: null,
    });
    const ctl = new AbortController();
    load(false, ctl.signal);
    return () => ctl.abort();
  }, [url, enabled, load]);

  return {
    data: state.env?.data ?? null,
    /** When the server computed this snapshot (falls back to when we fetched it). */
    ts: state.env?.ts ?? state.fetchedAt,
    fetchedAt: state.fetchedAt,
    error: state.error,
    loading: state.loading,
    refreshing: state.refreshing,
    notice: state.notice,
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
export function useOps<T>(name: "search", extra: Record<string, string | null | undefined> = {}, enabled = true) {
  return useApi<T>("ops", { name, ...extra }, { enabled });
}

/** Referral code -> creator handle, from the production cohort map. */
export function useCreatorNames() {
  return useApi<Record<string, string>>("influencer-names", {}, {
    unwrap: (j) => (j && typeof j === "object" && "map" in (j as object) ? (j as { map: Record<string, string> }).map : {}),
  });
}

/** Creator payments in the selected range. Gated server-side, so it needs the unlock cookie. */
export function usePayments(enabled = true) {
  const { range, from, to } = useDashboard();
  return useApi<PaymentsData>("influencer-payments", { range, from, to }, { enabled });
}
