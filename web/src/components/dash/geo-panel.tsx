"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Panel } from "@/components/dash/panel";
import { ShareBar, type Segment } from "@/components/dash/device-panel";
import type { GeoRow, GeoSplit } from "@/lib/derive";
import { fmtN, fmtPct, safeDiv } from "@/lib/format";
import { cn } from "@/lib/utils";

type Mode = "countries" | "cities";
const MODES: Array<{ key: Mode; label: string }> = [
  { key: "countries", label: "Countries" },
  { key: "cities", label: "Cities" },
];
const TOP_COLORS = ["#a78bfa", "#38bdf8", "#f5c451", "#2fb57a", "#f472b6"];
const OTHER_COLOR = "#6b6b73";
const UNSEEN_COLOR = "#4a4a50";
const PREVIEW_ROWS = 10;

let regionNames: Intl.DisplayNames | null = null;
function countryName(cc: string) {
  if (!cc) return "Unknown country";
  try {
    regionNames ??= new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(cc.toUpperCase()) ?? cc;
  } catch {
    return cc;
  }
}

/** Two-letter country code to its flag emoji (regional indicator pair). */
function flag(cc: string) {
  if (!/^[A-Za-z]{2}$/.test(cc)) return null;
  return String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function label(r: GeoRow) {
  if (r.city === null) return { name: countryName(r.cc), hint: null as string | null };
  return { name: r.city || "City not known", hint: countryName(r.cc) };
}

type Metric = "visitors" | "signups" | "pro";
const sum = (rows: GeoRow[], k: Metric) => rows.reduce((a, r) => a + r[k], 0);

/** Visitors, signups and Pro buyers by country or city for the selected range. */
export function GeoPanel({ split, rangeLabel }: { split: GeoSplit | null; rangeLabel: string }) {
  const [mode, setMode] = useState<Mode>("countries");
  const [expanded, setExpanded] = useState(false);

  const rows = useMemo(
    () => (split ? [...(mode === "countries" ? split.countries : split.cities)].sort((a, b) => b.visitors - a.visitors) : []),
    [split, mode],
  );

  const toggle = (
    <div role="radiogroup" aria-label="Group locations by" className="relative inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
      {MODES.map((m) => {
        const active = mode === m.key;
        return (
          <button
            key={m.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              setMode(m.key);
              setExpanded(false);
            }}
            className={cn(
              "relative rounded-md px-3 py-1.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active ? (
              <motion.span
                layoutId="geo-pill"
                className="absolute inset-0 rounded-md bg-white/[0.09] shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            ) : null}
            <span className="relative">{m.label}</span>
          </button>
        );
      })}
    </div>
  );

  if (!split) {
    return (
      <Panel title="Locations" subtitle={`Visitors, signups and Pro buyers by country or city · ${rangeLabel}`}>
        <p className="py-6 text-center text-sm text-muted-foreground">Location numbers appear after the next refresh.</p>
      </Panel>
    );
  }

  // Totals each metric must add up to. Signups and Pro buyers with no page view in the
  // range have no location; they get their own row so the table matches the cards.
  const located: Record<Metric, number> = {
    visitors: split.visitors,
    signups: Math.max(0, split.signups - split.signupsUnseen),
    pro: Math.max(0, split.pro - split.proUnseen),
  };
  const totals: Record<Metric, number> = { visitors: split.visitors, signups: split.signups, pro: split.pro };
  const unseen: Record<Metric, number> = { visitors: 0, signups: split.signupsUnseen, pro: split.proUnseen };

  const top = rows.slice(0, TOP_COLORS.length);
  const segments = (k: Metric): Segment[] => [
    ...top.map((r, i) => ({ key: r.key, label: label(r).name, value: r[k], color: TOP_COLORS[i] })),
    { key: "other", label: mode === "countries" ? "Other countries" : "Other cities", value: Math.max(0, located[k] - sum(top, k)), color: OTHER_COLOR },
    { key: "unseen", label: "Location not seen", value: unseen[k], color: UNSEEN_COLOR },
  ];

  const shown = expanded ? rows : rows.slice(0, PREVIEW_ROWS);
  const rest: Record<Metric, number> = {
    visitors: Math.max(0, located.visitors - sum(shown, "visitors")),
    signups: Math.max(0, located.signups - sum(shown, "signups")),
    pro: Math.max(0, located.pro - sum(shown, "pro")),
  };
  const restCount = rows.length - shown.length;
  // A place with a real share of visitors and nobody signing up is usually automated traffic.
  const botFloor = Math.max(100, split.visitors * 0.01);

  return (
    <Panel title="Locations" subtitle={`Visitors, signups and Pro buyers by country or city · ${rangeLabel}`} action={toggle}>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-2">
          <ShareBar title="Visitors" total={totals.visitors} segments={segments("visitors")} />
          <ShareBar title="Signups" total={totals.signups} segments={segments("signups")} />
          <ShareBar title="Pro" total={totals.pro} segments={segments("pro")} />
        </div>
        <div className="lg:col-span-3">
          <div className={cn("overflow-x-auto", expanded && "max-h-[32rem] overflow-y-auto")}>
            <table className="w-full text-[13px] tabular">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 font-medium">{mode === "countries" ? "Country" : "City"}</th>
                  <th className="pb-2 pl-3 text-right font-medium">Visitors</th>
                  <th className="pb-2 pl-3 text-right font-medium">Signups</th>
                  <th className="pb-2 pl-3 text-right font-medium">Pro</th>
                  <th className="hidden pb-2 pl-3 text-right font-medium sm:table-cell">Signup rate</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => {
                  const { name, hint } = label(r);
                  const f = flag(r.cc);
                  const noSignups = r.signups === 0 && r.visitors >= botFloor;
                  return (
                    <tr key={r.key} className="border-t border-white/[0.05]">
                      <td className="py-2">
                        <div className="flex items-center gap-2.5">
                          <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-[15px] leading-none">
                            {f ?? "·"}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-foreground">{name}</div>
                            {hint || noSignups ? (
                              <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                                {hint ? <span className="truncate">{hint}</span> : null}
                                {noSignups ? (
                                  <span
                                    className="rounded bg-amber-400/10 px-1.5 text-amber-300"
                                    title="Many visits and nobody signed up. This is usually automated traffic such as bots or crawlers."
                                  >
                                    No signups
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 pl-3 text-right text-foreground">{fmtN(r.visitors)}</td>
                      <td className="py-2 pl-3 text-right text-foreground">{fmtN(r.signups)}</td>
                      <td className="py-2 pl-3 text-right text-foreground">{fmtN(r.pro)}</td>
                      <td className="hidden py-2 pl-3 text-right text-muted-foreground sm:table-cell">
                        {r.visitors ? fmtPct(safeDiv(r.signups, r.visitors) * 100) : "–"}
                      </td>
                    </tr>
                  );
                })}
                {rest.visitors + rest.signups + rest.pro > 0 ? (
                  <tr className="border-t border-white/[0.05] text-muted-foreground">
                    <td className="py-2">
                      <div className="flex items-center gap-2.5">
                        <span className="h-7 w-7 shrink-0" />
                        <div>
                          <div>{mode === "countries" ? "Other countries" : "Other cities"}</div>
                          <div className="text-[11px]">
                            {mode === "cities" && expanded
                              ? "Smaller cities outside the top 300"
                              : restCount > 0
                                ? `${fmtN(restCount)} more${mode === "cities" ? " and smaller cities" : ""}`
                                : "Smaller cities"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 pl-3 text-right">{fmtN(rest.visitors)}</td>
                    <td className="py-2 pl-3 text-right">{fmtN(rest.signups)}</td>
                    <td className="py-2 pl-3 text-right">{fmtN(rest.pro)}</td>
                    <td className="hidden py-2 pl-3 text-right sm:table-cell">
                      {rest.visitors ? fmtPct(safeDiv(rest.signups, rest.visitors) * 100) : "–"}
                    </td>
                  </tr>
                ) : null}
                {split.signupsUnseen + split.proUnseen > 0 ? (
                  <tr className="border-t border-white/[0.05] text-muted-foreground">
                    <td className="py-2">
                      <div className="flex items-center gap-2.5">
                        <span className="h-7 w-7 shrink-0" />
                        <div>
                          <div>Location not seen</div>
                          <div className="text-[11px]">No page view in this period</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 pl-3 text-right">–</td>
                    <td className="py-2 pl-3 text-right text-foreground">{fmtN(split.signupsUnseen)}</td>
                    <td className="py-2 pl-3 text-right text-foreground">{fmtN(split.proUnseen)}</td>
                    <td className="hidden py-2 pl-3 text-right sm:table-cell">–</td>
                  </tr>
                ) : null}
                <tr className="border-t border-white/[0.12] font-semibold">
                  <td className="py-2 text-foreground">Total</td>
                  <td className="py-2 pl-3 text-right text-foreground">{fmtN(totals.visitors)}</td>
                  <td className="py-2 pl-3 text-right text-foreground">{fmtN(totals.signups)}</td>
                  <td className="py-2 pl-3 text-right text-foreground">{fmtN(totals.pro)}</td>
                  <td className="hidden py-2 pl-3 text-right text-foreground sm:table-cell">
                    {totals.visitors ? fmtPct(safeDiv(totals.signups, totals.visitors) * 100) : "–"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {rows.length > PREVIEW_ROWS ? (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mt-3 rounded-md text-xs font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              {expanded ? `Show top ${PREVIEW_ROWS}` : `Show all ${fmtN(rows.length)} ${mode === "countries" ? "countries" : "cities"}`}
            </button>
          ) : null}
        </div>
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        Location is where each visitor&apos;s page views in this period came from, looked up from their IP address. Pro
        counts people who paid in this period, the same people as the Payers card. Signups and Pro buyers with no page view in
        this period have no location. Cities list the top 300 by visitors.
      </p>
    </Panel>
  );
}
