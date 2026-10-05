"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleDollarSign, Eye, Flame, TrendingUp, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { useDashboard } from "@/lib/dashboard-state";
import { useOverview } from "@/lib/use-api";
import { useReportFreshness } from "@/components/dash/freshness";
import { ScreenGate } from "@/components/dash/screen-gate";
import { PageHeader } from "@/components/dash/page-header";
import { Panel } from "@/components/dash/panel";
import { StatRow, StatTile } from "@/components/dash/stat-tile";
import { TrendArea, TrendBars } from "@/components/dash/charts";
import { BarList } from "@/components/dash/bar-list";
import { Delta } from "@/components/dash/delta";
import { AnimatedNumber } from "@/components/dash/animated-number";
import { CHANNEL_COLOR, channelOf, planLabel } from "@/lib/channels";
import { agoUtc, fmtINR, fmtINRCompact, fmtN, fmtPct, pctChange, safeDiv } from "@/lib/format";
import { firstName, initials, maskEmail } from "@/lib/mask";
import { prevRevenue, revenueSeries, signupSeries, totalPayments, totalRevenue, totalVisitors } from "@/lib/derive";
import { cn } from "@/lib/utils";

type Tab = "revenue" | "signups";

export default function OverviewPage() {
  const { rangeLabel, usdToInr, view } = useDashboard();
  const router = useRouter();
  const api = useOverview();
  useReportFreshness(api);
  const [tab, setTab] = useState<Tab>("revenue");
  const d = api.data;

  const m = useMemo(() => {
    if (!d) return null;
    const rev = totalRevenue(d, usdToInr);
    const prevRev = prevRevenue(d, usdToInr);
    const revSeries = revenueSeries(d, usdToInr);
    const suSeries = signupSeries(d);
    const visitors = totalVisitors(d);
    const channels = new Map<string, { visitors: number; signups: number; paid: number }>();
    const bump = (k: string, f: "visitors" | "signups" | "paid", n: number) => {
      const c = channels.get(k) ?? { visitors: 0, signups: 0, paid: 0 };
      c[f] += n;
      channels.set(k, c);
    };
    for (const [s, md, n] of d.visitorsBySource ?? []) bump(channelOf(s, md), "visitors", n ?? 0);
    for (const [s, md, n] of d.sources ?? []) bump(channelOf(s, md), "signups", n ?? 0);
    for (const [s, md, n] of d.payersBySource ?? []) bump(channelOf(s, md), "paid", n ?? 0);
    const chRows = [...channels.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => (b.visitors || b.signups) - (a.visitors || a.signups))
      .slice(0, 6);
    return {
      rev, prevRev, revSeries, suSeries, visitors, chRows,
      revDelta: prevRev != null ? pctChange(rev, prevRev) : null,
      suDelta: pctChange(d.curSignups, d.prevSignups),
      payments: totalPayments(d),
      activePro: d.counts?.[7] ?? 0,
      allUsers: d.counts?.[0] ?? 0,
    };
  }, [d, usdToInr]);

  const spark = (s: Array<{ value: number }>) => s.slice(-14).map((p) => p.value);

  return (
    <>
      <PageHeader
        eyebrow={view === "overall" ? "Overall" : view === "perf" ? "Performance" : "Influencer"}
        title={`Growth and revenue · ${rangeLabel}`}
        description="Live numbers from the production data. Signups are accounts created in the database."
      />
      <ScreenGate loading={api.loading} error={api.error} hasData={!!d} onRetry={() => api.refetch(false)}>
        {d && m ? (
          <div className="space-y-4">
            <StatRow>
              <StatTile
                label="Visitors" icon={<Eye className="h-3.5 w-3.5" />} accent="slate"
                value={m.visitors}
                subtitle={m.visitors ? `${fmtPct(safeDiv(d.curSignups, m.visitors) * 100)} sign up` : "no pageviews yet"}
                onClick={() => router.push("/acquire")}
              />
              <StatTile
                label="Revenue" icon={<CircleDollarSign className="h-3.5 w-3.5" />} accent="green"
                value={m.rev} format={fmtINR} deltaPct={m.revDelta}
                subtitle={`${fmtN(m.payments)} payments${d.revUsd > 0 ? ` · incl. $${Math.round(d.revUsd)}` : ""}`}
                series={spark(m.revSeries)} onClick={() => router.push("/monetization")}
              />
              <StatTile
                label="Signups" icon={<UserPlus className="h-3.5 w-3.5" />} accent="blue"
                value={d.curSignups} deltaPct={m.suDelta}
                subtitle={`${fmtPct(safeDiv(d.revPayers, d.curSignups) * 100, 2)} paid`}
                series={spark(m.suSeries)} onClick={() => router.push("/daily")}
              />
              <StatTile
                label="Active Pro" icon={<Flame className="h-3.5 w-3.5" />} accent="violet"
                value={m.activePro}
                subtitle={d.subsOk ? `${fmtPct(safeDiv(m.activePro, m.allUsers) * 100, 2)} of ${fmtN(m.allUsers)} users` : "subscription data unavailable"}
                onClick={() => router.push("/pro-users")}
              />
              <StatTile
                label="Payers" icon={<TrendingUp className="h-3.5 w-3.5" />} accent="amber"
                value={d.revPayers}
                subtitle={d.revPayers ? `${fmtINR(m.rev / d.revPayers)} per payer` : "no payers yet"}
                onClick={() => router.push("/monetization")}
              />
            </StatRow>

            <Panel padded={false}>
              <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {tab === "revenue" ? "Revenue" : "New signups"} · {rangeLabel}
                  </div>
                  <div className="mt-2 flex flex-wrap items-baseline gap-3">
                    <span className="text-4xl font-semibold tracking-tight text-foreground tabular">
                      {tab === "revenue" ? <AnimatedNumber value={m.rev} format={fmtINR} /> : <AnimatedNumber value={d.curSignups} format={fmtN} />}
                    </span>
                    <Delta pct={tab === "revenue" ? m.revDelta : m.suDelta} />
                    <span className="text-xs text-muted-foreground tabular">
                      vs {tab === "revenue" ? (m.prevRev != null ? fmtINR(m.prevRev) : "n/a") : d.prevSignups != null ? fmtN(d.prevSignups) : "n/a"} prior
                    </span>
                  </div>
                </div>
                <div role="tablist" aria-label="Chart metric" className="relative inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
                  {(["revenue", "signups"] as const).map((t) => (
                    <button
                      key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                      className={cn("relative rounded-md px-3 py-1.5 text-xs font-medium capitalize outline-none focus-visible:ring-2 focus-visible:ring-ring", tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
                    >
                      {tab === t ? <motion.span layoutId="hero-tab" className="absolute inset-0 rounded-md bg-white/[0.09]" transition={{ type: "spring", stiffness: 500, damping: 38 }} /> : null}
                      <span className="relative">{t}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-3 pb-4 pt-4 sm:px-5">
                {(tab === "revenue" ? m.revSeries : m.suSeries).length <= 2 ? (
                  <SingleDay
                    current={tab === "revenue" ? m.rev : d.curSignups}
                    prior={tab === "revenue" ? m.prevRev : d.prevSignups}
                    format={tab === "revenue" ? fmtINR : fmtN}
                    label={rangeLabel}
                  />
                ) : tab === "revenue" ? (
                  <TrendArea data={m.revSeries.map((p) => ({ label: p.label, value: p.value }))} fmt={fmtINR} yFmt={fmtINRCompact} color="#6e8cff" names={["revenue"]} />
                ) : (
                  <TrendBars data={m.suSeries.map((p) => ({ label: p.label, value: p.value }))} fmt={fmtN} name="signups" />
                )}
              </div>
            </Panel>

            <div className="grid gap-4 lg:grid-cols-5">
              <Panel className="lg:col-span-3" title="Acquisition" subtitle="Visitors, signups and payers by channel"
                action={<button onClick={() => router.push("/acquire")} className="text-xs font-medium text-primary hover:underline">See all</button>}>
                <BarList
                  items={m.chRows.map((c) => ({
                    key: c.name, label: c.name, value: c.visitors || c.signups, color: CHANNEL_COLOR[c.name as keyof typeof CHANNEL_COLOR],
                    display: fmtN(c.visitors || c.signups),
                    sub: c.visitors ? `${fmtN(c.signups)} signed · ${fmtN(c.paid)} paid` : `${fmtN(c.paid)} paid`,
                  }))}
                />
              </Panel>
              <Panel className="lg:col-span-2" title="Signup to Pro" subtitle="Share of signups now on a Pro plan">
                <table className="w-full text-[13px] tabular">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 font-medium">Period</th><th className="pb-2 text-right font-medium">Signups</th>
                      <th className="pb-2 text-right font-medium">Pro</th><th className="pb-2 text-right font-medium">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(d.convByPeriod ?? []).map((r) => (
                      <tr key={r.key} className="border-t border-white/[0.05]">
                        <td className="py-2 text-foreground">{r.label}</td>
                        <td className="py-2 text-right text-muted-foreground">{fmtN(r.signups)}</td>
                        <td className="py-2 text-right text-foreground">{fmtN(r.pro)}</td>
                        <td className="py-2 text-right">
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", r.rate >= 1.3 ? "bg-emerald-500/10 text-emerald-400" : r.rate >= 0.9 ? "bg-amber-400/10 text-amber-300" : "bg-rose-500/10 text-rose-300")}>
                            {r.rate.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Recent signups" subtitle="Newest accounts, emails masked">
                <ul className="divide-y divide-white/[0.05]">
                  {(d.signups ?? []).slice(0, 6).map((r) => (
                    <li key={r[0] + r[3]} className="flex items-center gap-3 py-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[11px] font-semibold text-muted-foreground">{initials(r[1] || r[0])}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-foreground">{firstName(r[1]) || "New user"}</div>
                        <div className="truncate text-xs text-muted-foreground">{maskEmail(r[0])}</div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground"><div className="text-foreground">{planLabel(r[2])}</div>{agoUtc(r[3])}</div>
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel title="Recent payments" subtitle="Latest completed payments, emails masked">
                <ul className="divide-y divide-white/[0.05]">
                  {(d.payments ?? []).slice(0, 6).map((r) => (
                    <li key={r[0] + r[3]} className="flex items-center gap-3 py-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[11px] font-semibold text-emerald-400">{r[5] === "USD" ? "$" : "₹"}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-foreground">{maskEmail(r[0])}</div>
                        <div className="truncate text-xs text-muted-foreground">{planLabel(r[2])} · {agoUtc(r[3])}</div>
                      </div>
                      <div className="text-sm font-semibold text-emerald-400 tabular">+{r[5] === "USD" ? `$${Math.round(r[4])}` : fmtINR(r[4])}</div>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>
        ) : null}
      </ScreenGate>
    </>
  );
}

function SingleDay({ current, prior, format, label }: { current: number; prior: number | null; format: (n: number) => string; label: string }) {
  const max = Math.max(1, current, prior ?? 0);
  const rows: Array<[string, number | null, string]> = [[label, current, "#6e8cff"], ["Prior period", prior, "#475069"]];
  return (
    <div className="space-y-5 px-2 py-4">
      {rows.map(([name, v, c]) => (
        <div key={name} className="grid grid-cols-[110px_1fr_auto] items-center gap-4">
          <div className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{name}</div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.05]">
            <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${v == null ? 0 : (v / max) * 100}%`, background: c }} />
          </div>
          <div className="w-28 text-right text-lg font-semibold tabular text-foreground">{v == null ? "n/a" : format(v)}</div>
        </div>
      ))}
    </div>
  );
}
