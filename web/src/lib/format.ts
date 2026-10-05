// Number + time formatting shared by every screen. en-IN grouping everywhere
// (1,00,000 not 100,000) so figures match the production dashboard.

const IN = new Intl.NumberFormat("en-IN");

export const fmtN = (n: number | null | undefined) => IN.format(Math.round(n ?? 0));

export const fmtINR = (n: number | null | undefined) =>
  "₹" + IN.format(Math.round(n ?? 0));

/** ₹6.1L / ₹45k: for tight spaces and axis ticks. */
export const fmtINRCompact = (n: number | null | undefined) => {
  const v = Math.round(n ?? 0);
  const a = Math.abs(v);
  if (a >= 10_000_000) return `₹${(v / 10_000_000).toFixed(1)}Cr`;
  if (a >= 100_000) return `₹${(v / 100_000).toFixed(a >= 1_000_000 ? 1 : 2).replace(/\.?0+$/, "")}L`;
  if (a >= 1_000) return `₹${(v / 1_000).toFixed(a >= 10_000 ? 0 : 1).replace(/\.0$/, "")}k`;
  return `₹${v}`;
};

export const fmtCompact = (n: number | null | undefined) => {
  const v = Math.round(n ?? 0);
  const a = Math.abs(v);
  if (a >= 100_000) return `${(v / 100_000).toFixed(1).replace(/\.0$/, "")}L`;
  if (a >= 1_000) return `${(v / 1_000).toFixed(a >= 10_000 ? 0 : 1).replace(/\.0$/, "")}k`;
  return String(v);
};

export const fmtUsd = (n: number | null | undefined) =>
  "$" + (n ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

export const fmtPct = (n: number | null | undefined, digits = 1) =>
  `${(n ?? 0).toFixed(digits)}%`;

export function pctChange(cur: number, prev: number | null | undefined): number | null {
  if (!prev) return null;
  return ((cur - prev) / prev) * 100;
}

export function safeDiv(a: number, b: number): number {
  return b ? a / b : 0;
}

/** "5m ago" / "2h ago" / "yesterday": for the freshness pill. */
export function timeAgo(ts: number | null | undefined, now = Date.now()): string {
  if (!ts) return "never";
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/** "2026-10-04" → "4 Oct". */
export function dayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function weekdayShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", {
    weekday: "short",
    timeZone: "UTC",
  });
}

/** Timestamps from the API are UTC strings like "2026-10-05 11:11:26.883000". */
export function parseUtc(s: string | null | undefined): number | null {
  if (!s) return null;
  const t = Date.parse(s.includes("T") ? s : s.replace(" ", "T") + "Z");
  return Number.isNaN(t) ? null : t;
}

export function agoUtc(s: string | null | undefined): string {
  return timeAgo(parseUtc(s));
}

/** Date part only, in IST, for table cells: "5 Oct 2026". */
export function dateIst(s: string | null | undefined): string {
  const t = parseUtc(s);
  if (t == null) return "n/a";
  return new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}
