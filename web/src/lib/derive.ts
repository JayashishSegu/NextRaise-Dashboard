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

export const DEVICE_KEYS = ["mobile", "desktop", "both", "tablet"] as const;
export type DeviceKey = (typeof DEVICE_KEYS)[number];
export type DeviceSplit = {
  rows: Array<{ key: DeviceKey; visitors: number; signups: number }>;
  /** Same figure as the Visitors card. */
  visitors: number;
  /** Same figure as the Signups card. */
  signups: number;
  /** Signups with no page view in the range (server-side signup, blocked tracking), so the rows add up to the card. */
  noPageview: number;
};

/** Device columns 3..10 of visitorsBySource. null when the snapshot predates the device split. */
export function deviceSplit(d: OverviewData): DeviceSplit | null {
  const rows = d.visitorsBySource ?? [];
  if (rows.length && rows[0].length < 11) return null;
  const v = [0, 0, 0, 0];
  const s = [0, 0, 0, 0];
  for (const r of rows) {
    for (let i = 0; i < 4; i++) {
      v[i] += Number(r[3 + i]) || 0;
      s[i] += Number(r[7 + i]) || 0;
    }
  }
  const signups = d.curSignups ?? 0;
  return {
    rows: DEVICE_KEYS.map((key, i) => ({ key, visitors: v[i], signups: s[i] })),
    visitors: totalVisitors(d),
    signups,
    noPageview: Math.max(0, signups - s.reduce((a, b) => a + b, 0)),
  };
}

export type GeoRow = { key: string; cc: string; city: string | null; visitors: number; signups: number; pro: number };
export type GeoSplit = {
  /** Every country seen in the range, most visitors first. */
  countries: GeoRow[];
  /** Top 300 cities by visitors (city "" = location found but no city). */
  cities: GeoRow[];
  /** Sum of the country rows: every visitor with a page view in the range. */
  visitors: number;
  /** Same figure as the Signups card. */
  signups: number;
  /** Same figure as the Payers card (people who paid in the range). */
  pro: number;
  /** Signups and payers with no page view in the range, so no location; makes the rows add up to the cards. */
  signupsUnseen: number;
  proUnseen: number;
};

/** Visitors, signups and Pro by country and city (from their page views in the range). null when the snapshot predates the location split. */
export function geoSplit(d: OverviewData): GeoSplit | null {
  if (!d.visitorsByCountry) return null;
  const row = (cc: unknown, city: string | null, v: unknown, s: unknown, p: unknown): GeoRow => ({
    key: `${cc ?? ""}|${city ?? ""}`,
    cc: String(cc ?? ""),
    city,
    visitors: Number(v) || 0,
    signups: Number(s) || 0,
    pro: Number(p) || 0,
  });
  const countries = d.visitorsByCountry.map(([cc, v, s, p]) => row(cc, null, v, s, p));
  const cities = (d.visitorsByCity ?? []).map(([cc, city, v, s, p]) => row(cc, String(city ?? ""), v, s, p));
  const sum = (k: "visitors" | "signups" | "pro") => countries.reduce((a, r) => a + r[k], 0);
  const signups = d.curSignups ?? 0;
  const pro = d.revPayers ?? 0;
  return {
    countries,
    cities,
    visitors: sum("visitors"),
    signups,
    pro,
    signupsUnseen: Math.max(0, signups - sum("signups")),
    proUnseen: Math.max(0, pro - sum("pro")),
  };
}

/** IST calendar facts for run-rate maths. */
export function istToday() {
  const t = new Date(Date.now() + 5.5 * 3600000);
  const y = t.getUTCFullYear();
  const m = t.getUTCMonth();
  const day = t.getUTCDate();
  return { y, m, day, daysInMonth: new Date(Date.UTC(y, m + 1, 0)).getUTCDate(), iso: t.toISOString().slice(0, 10), monthKey: `${y}-${String(m + 1).padStart(2, "0")}-01` };
}
