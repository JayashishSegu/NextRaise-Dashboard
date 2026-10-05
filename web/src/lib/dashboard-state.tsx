"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { View } from "@/lib/types";

export const RANGES = [
  { key: "today", label: "Today" },
  { key: "yest", label: "Yesterday" },
  { key: "7d", label: "Last 7 days" },
  { key: "14d", label: "Last 14 days" },
  { key: "thisMonth", label: "This month" },
  { key: "lastMonth", label: "Last month" },
  { key: "all", label: "All time" },
] as const;

export const VIEWS: Array<{ key: View; label: string }> = [
  { key: "influencer", label: "Influencer" },
  { key: "perf", label: "Perf" },
  { key: "overall", label: "Overall" },
];

type Fx = { rate: number; asOf: string | null; live: boolean };

type DashboardState = {
  range: string;
  rangeLabel: string;
  view: View;
  from: string | null;
  to: string | null;
  fx: Fx;
  setRange: (key: string) => void;
  setCustomRange: (from: string, to: string) => void;
  setView: (v: View) => void;
  /** toInr(usd) with the live FX rate. */
  usdToInr: (usd: number) => number;
  /** Link to another screen, carrying over only the controls that screen uses. */
  hrefFor: (item: { href: string; range: boolean; view: boolean }) => string;
};

const Ctx = createContext<DashboardState | null>(null);

// Seed used only until /fx answers; the live value replaces it within a round trip.
const FX_SEED: Fx = { rate: 96.4, asOf: null, live: false };

export function DashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const rawRange = sp.get("range") || "7d";
  const from = sp.get("from");
  const to = sp.get("to");
  const range = rawRange === "custom" && from && to ? "custom" : RANGES.some((r) => r.key === rawRange) ? rawRange : "7d";
  const rawView = sp.get("view");
  const view: View = rawView === "influencer" || rawView === "perf" ? rawView : "overall";

  const [fx, setFx] = useState<Fx>(FX_SEED);
  useEffect(() => {
    let off = false;
    fetch("/api/fx")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!off && j && typeof j.rate === "number" && j.rate > 0) {
          setFx({ rate: j.rate, asOf: j.asOf ?? null, live: j.source === "live" });
        }
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, []);

  const push = useCallback(
    (mut: (p: URLSearchParams) => void) => {
      const p = new URLSearchParams(sp.toString());
      mut(p);
      const q = p.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [sp, router, pathname],
  );

  const setRange = useCallback(
    (key: string) =>
      push((p) => {
        p.set("range", key);
        p.delete("from");
        p.delete("to");
      }),
    [push],
  );
  const setCustomRange = useCallback(
    (f: string, t: string) =>
      push((p) => {
        p.set("range", "custom");
        p.set("from", f);
        p.set("to", t);
      }),
    [push],
  );
  const setView = useCallback(
    (v: View) =>
      push((p) => {
        if (v === "overall") p.delete("view");
        else p.set("view", v);
      }),
    [push],
  );

  const value = useMemo<DashboardState>(
    () => ({
      range,
      rangeLabel:
        range === "custom" && from && to
          ? `${from} → ${to}`
          : RANGES.find((r) => r.key === range)?.label ?? range,
      view,
      from,
      to,
      fx,
      setRange,
      setCustomRange,
      setView,
      usdToInr: (usd: number) => usd * fx.rate,
      hrefFor: (item) => {
        const p = new URLSearchParams();
        if (item.range && rawRange !== "7d") {
          p.set("range", range);
          if (range === "custom" && from && to) {
            p.set("from", from);
            p.set("to", to);
          }
        }
        if (item.view && view !== "overall") p.set("view", view);
        const q = p.toString();
        return q ? `${item.href}?${q}` : item.href;
      },
    }),
    [range, rawRange, view, from, to, fx, setRange, setCustomRange, setView],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboard(): DashboardState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDashboard must be used inside <DashboardProvider>");
  return v;
}
