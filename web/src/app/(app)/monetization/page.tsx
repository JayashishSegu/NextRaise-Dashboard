"use client";

import { useMemo } from "react";
import { CalendarClock, CircleDollarSign, HeartPulse, Repeat2, Rocket, UserMinus } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-state";
import { useOverview, useScreen } from "@/lib/use-api";
import { useReportFreshness } from "@/components/dash/freshness";
import { ScreenGate } from "@/components/dash/screen-gate";
import { PageHeader } from "@/components/dash/page-header";
import { Panel } from "@/components/dash/panel";
import { StatRow, StatTile } from "@/components/dash/stat-tile";
import { TrendBars } from "@/components/dash/charts";
import { BarList } from "@/components/dash/bar-list";
import { CHANNEL_COLOR, channelOf, planLabel } from "@/lib/channels";
import { agoUtc, fmtINR, fmtINRCompact, fmtN, fmtPct, pctChange, safeDiv } from "@/lib/format";
import { maskEmail } from "@/lib/mask";
import { istToday, totalPayments, totalRevenue } from "@/lib/derive";

const monthShort = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" });

export default function MonetizationPage() {
  const { rangeLabel, usdToInr } = useDashboard();
  const screen = useScreen("monetization");
  const ov = useOverview();
  useReportFreshness(screen);
  const s = screen.data;
  const o = ov.data;

  const m = useMemo(() => {
    if (!s) return null;
    const monthly = s.monthly.map(([mo, payments, payers, inr, usd]) => ({ mo, label: monthShort(mo), payments, payers, value: Math.round(inr + usdToInr(usd)) }));
    const today = istToday();
    const cur = monthly.find((r) => r.mo === today.monthKey);
    const runRate = cur ? (cur.value / today.day) * today.daysInMonth : 0;
    const full = monthly.filter((r) => r.mo !== today.monthKey);
    const lastFull = full[full.length - 1];
    const priorFull = full[full.length - 2];
    const plans = s.plans.map(([k, payments, payers, inr, usd]) => ({ key: k, label: planLabel(k), payments, payers, value: Math.round(inr + usdToInr(usd)) }));
    const ch = new Map<string, { value: number; payers: number }>();
    for (const [src, md, , payers, inr, usd] of s.channels) {
      const c = channelOf(src, md);
      const x = ch.get(c) ?? { value: 0, payers: 0 };
      x.value += inr + usdToInr(usd);
      x.payers += payers;
      ch.set(c, x);
    }
    const channels = [...ch.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.value - a.value);
    return { monthly, cur, runRate, lastFull, momPct: lastFull && priorFull ? pctChange(lastFull.value, priorFull.value) : null, plans, channels };
  }, [s, usdToInr]);

  const rev = o ? totalRevenue(o, usdToInr) : 0;
  const active = o?.counts?.[7] ?? 0;
  const lapsed = o?.counts?.[12] ?? 0;
  const expired = o?.counts?.[11] ?? 0;

  return (
    <>
      <PageHeader eyebrow="Monetization" title={`Revenue and plans · ${rangeLabel}`} description="Run-rate and ARR project the current month from the days so far. USD is converted at the live rate." />
      <ScreenGate loading={screen.loading} error={screen.error} hasData={!!s} onRetry={() => screen.refetch(false)}>
        {s && m ? (
          <div className="space-y-4">
            <StatRow cols={6}>
              <StatTile label="Revenue" icon={<CircleDollarSign className="h-3.5 w-3.5" />} value={rev} format={fmtINR} accent="green" subtitle={o ? `${fmtN(totalPayments(o))} payments` : undefined} />
              <StatTile label="Run-rate" icon={<Rocket className="h-3.5 w-3.5" />} value={m.runRate} format={fmtINRCompact} accent="blue" subtitle="this month, projected" deltaPct={m.cur && m.lastFull ? pctChange(m.runRate, m.lastFull.value) : undefined} deltaSuffix="vs last month" />
              <StatTile label="ARR" icon={<CalendarClock className="h-3.5 w-3.5" />} value={m.runRate * 12} format={fmtINRCompact} accent="violet" subtitle="run-rate x 12" />
              <StatTile label="ARPU" icon={<Repeat2 className="h-3.5 w-3.5" />} value={o ? safeDiv(rev, o.revPayers) : 0} format={fmtINR} accent="amber" subtitle={o ? `${fmtN(o.revPayers)} payers` : undefined} />
              <StatTile label="Pro retention" icon={<HeartPulse className="h-3.5 w-3.5" />} value={safeDiv(active, active + expired) * 100} format={(n) => fmtPct(n, 0)} accent="green" subtitle={`${fmtN(active)} active, ${fmtN(expired)} ended`} />
              <StatTile label="30-day churn" icon={<UserMinus className="h-3.5 w-3.5" />} value={safeDiv(lapsed, active + lapsed) * 100} format={(n) => fmtPct(n, 1)} accent="rose" invertDelta subtitle={`${fmtN(lapsed)} lapsed in 30 days`} />
            </StatRow>

            <Panel title="Revenue by month" subtitle={m.cur ? `${m.cur.label} is partial (${istToday().day} of ${istToday().daysInMonth} days)` : "Since launch"}
              action={m.momPct != null && m.lastFull ? <span className="text-xs text-muted-foreground tabular">{m.lastFull.label} {m.momPct >= 0 ? "+" : ""}{m.momPct.toFixed(0)}% on the month before</span> : null}>
              <TrendBars data={m.monthly.map((r) => ({ label: r.label, value: r.value }))} fmt={fmtINR} yFmt={fmtINRCompact} color="#2fb57a" name="revenue" height={250} />
            </Panel>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Plan mix" subtitle={`Revenue by plan · ${rangeLabel}`}>
                <BarList items={m.plans.map((p) => ({ key: p.key ?? "none", label: p.label, value: p.value, display: fmtINRCompact(p.value), sub: `${fmtN(p.payments)} sold` }))} color="#6e8cff" />
              </Panel>
              <Panel title="Revenue by channel" subtitle="First-touch channel of the paying account">
                <BarList items={m.channels.map((c) => ({ key: c.name, label: c.name, value: c.value, display: fmtINRCompact(c.value), sub: `${fmtN(c.payers)} payers`, color: CHANNEL_COLOR[c.name as keyof typeof CHANNEL_COLOR] }))} />
              </Panel>
            </div>

            {o ? (
              <Panel title="Recent payments" subtitle="Latest completed payments, emails masked">
                <ul className="grid gap-x-8 sm:grid-cols-2">
                  {(o.payments ?? []).slice(0, 8).map((r) => (
                    <li key={r[0] + r[3]} className="flex items-center justify-between gap-3 border-b border-white/[0.05] py-2.5">
                      <div className="min-w-0"><div className="truncate text-[13px] font-medium text-foreground">{maskEmail(r[0])}</div><div className="text-xs text-muted-foreground">{planLabel(r[2])} · {agoUtc(r[3])}</div></div>
                      <div className="text-sm font-semibold text-emerald-400 tabular">+{r[5] === "USD" ? `$${Math.round(r[4])}` : fmtINR(r[4])}</div>
                    </li>
                  ))}
                </ul>
              </Panel>
            ) : null}
          </div>
        ) : null}
      </ScreenGate>
    </>
  );
}
