import type { OverviewData } from "@/lib/types";
import { dayLabel } from "@/lib/format";

export type Fxer = (usd: number) => number;

export const totalRevenue = (d: Pick<OverviewData, "revInr" | "revUsd">, fx: Fxer) => (d.revInr ?? 0) + fx(d.revUsd ?? 0);

export const prevRevenue = (d: Pick<OverviewData, "prevRevInr" | "prevRevUsd">, fx: Fxer): number | null =>
  d.prevRevInr == null ? null : (d.prevRevInr ?? 0) + fx(d.prevRevUsd ?? 0);

/** One point per signup day, revenue filled from dailyPay (zero when nothing was paid that day). */
export function revenueSeries(d: OverviewData, fx: Fxer) {
  const pay = new Map<string, number>();
  for (const [day, , inr, usd] of d.dailyPay ?? []) pay.set(day, (inr ?? 0) + fx(usd ?? 0));
  return (d.growth ?? []).map(([day]) => ({ day, label: dayLabel(day), value: Math.round(pay.get(day) ?? 0) }));
}

export const signupSeries = (d: OverviewData) =>
  (d.growth ?? []).map(([day, n]) => ({ day, label: dayLabel(day), value: n ?? 0 }));

export const totalVisitors = (d: OverviewData) => (d.visitorsBySource ?? []).reduce((a, r) => a + (r[2] ?? 0), 0);
export const totalPayments = (d: OverviewData) => (d.dailyPay ?? []).reduce((a, r) => a + (r[1] ?? 0), 0);

/** IST calendar facts for run-rate maths. */
export function istToday() {
  const t = new Date(Date.now() + 5.5 * 3600000);
  const y = t.getUTCFullYear();
  const m = t.getUTCMonth();
  const day = t.getUTCDate();
  return { y, m, day, daysInMonth: new Date(Date.UTC(y, m + 1, 0)).getUTCDate(), iso: t.toISOString().slice(0, 10), monthKey: `${y}-${String(m + 1).padStart(2, "0")}-01` };
}
