"use client";

import { useMemo } from "react";
import { CircleDollarSign, HandCoins, Layers, Percent, Receipt, Target, UserPlus, Wallet } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-state";
import { useCreatorNames, usePayments, useScreen } from "@/lib/use-api";
import { useReportFreshness } from "@/components/dash/freshness";
import { ScreenGate } from "@/components/dash/screen-gate";
import { PageHeader } from "@/components/dash/page-header";
import { Panel } from "@/components/dash/panel";
import { StatRow, StatTile } from "@/components/dash/stat-tile";
import { TrendArea, TrendBars } from "@/components/dash/charts";
import { PaymentsPanel } from "@/components/dash/payments-panel";
import { dayLabel, fmtCompact, fmtINR, fmtINRCompact, fmtN, fmtPct, safeDiv } from "@/lib/format";
import { cn } from "@/lib/utils";

const KEYWORD_CAMPAIGN = "23951249428";

function campaignName(cid: string) {
  if (cid === KEYWORD_CAMPAIGN) return "Keyword search";
  if (/^\d+$/.test(cid)) return `Campaign ${cid}`;
  return cid.replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase());
}

export default function ReportPage() {
  const { rangeLabel, usdToInr, view } = useDashboard();
  const api = useScreen("report");
  useReportFreshness(api);
  const d = api.data;

  // Ad spend belongs to the perf side and creator payments to the influencer side,
  // so each view shows only its own: Perf hides payments, Influencer hides ad spend.
  const showAds = view !== "influencer";
  const showPay = view !== "perf";
  const pay = usePayments(showPay);
  const names = useCreatorNames();
  const creatorNames = useMemo(() => [...new Set(Object.values(names.data ?? {}))].sort(), [names.data]);
  const payTotal = showPay && pay.data?.kv ? pay.data.total : null;
  const payCount = pay.data?.kv ? pay.data.entries.length : 0;

  const m = useMemo(() => {
    if (!d) return null;
    const revenue = d.inr + usdToInr(d.usd);
    const googleTotal = d.google.reduce((a, g) => a + g.spend, 0);
    const keyword = d.google.find((g) => g.cid === KEYWORD_CAMPAIGN)?.spend ?? 0;
    // The keyword campaign is billed to the influencer bucket, so ad spend excludes it.
    const adSpend = googleTotal - keyword + d.meta.spend;
    const perf =
      view === "perf"
        ? { sales: d.sales, revenue }
        : d.bucket
          ? { sales: d.bucket.perf.sales, revenue: d.bucket.perf.inr + usdToInr(d.bucket.perf.usd) }
          : null;
    const infl = d.bucket
      ? { signups: d.bucket.influencer.signups, sales: d.bucket.influencer.sales, revenue: d.bucket.influencer.inr + usdToInr(d.bucket.influencer.usd) }
      : null;
    const perfB = d.bucket
      ? { signups: d.bucket.perf.signups, sales: d.bucket.perf.sales, revenue: d.bucket.perf.inr + usdToInr(d.bucket.perf.usd) }
      : null;
    const revByDay = new Map(d.trend.revenueParts.map(([day, inr, usd]) => [day, inr + usdToInr(usd)] as const));
    const su = new Map(d.trend.signups);
    const days = [...new Set([...su.keys(), ...revByDay.keys()])].sort();
    // Spend that ROAS and CAC divide by. Overall is blended (ads + creators) once payments
    // are readable; until then it keeps the old paid-ads-only definition.
    const legacyOverall = view === "overall" && payTotal == null;
    const spend = legacyOverall ? adSpend : view === "perf" ? adSpend : view === "influencer" ? payTotal : adSpend + (payTotal ?? 0);
    const base = legacyOverall ? perf : { sales: d.sales, revenue };
    return {
      revenue, adSpend, perf, infl, perfB, spend,
      totalSpend: adSpend + (payTotal ?? 0),
      roas: base && spend != null && spend > 0 ? base.revenue / spend : null,
      cac: base && spend != null && spend > 0 && base.sales > 0 ? spend / base.sales : null,
      signupSeries: days.map((day) => ({ label: dayLabel(day), value: su.get(day) ?? 0 })),
      revSeries: days.map((day) => ({ label: dayLabel(day), value: Math.round(revByDay.get(day) ?? 0) })),
    };
  }, [d, usdToInr, view, payTotal]);

  const basis =
    view === "perf"
      ? "ROAS and CAC use paid-ad spend (Google without the keyword campaign, plus Meta) against this view's revenue."
      : view === "influencer"
        ? payTotal == null
          ? "Creator payments are not available yet, so ROAS and CAC show n/a in this view."
          : "ROAS and CAC use the creator payments logged for this range against influencer revenue. The keyword search campaign is not counted."
        : payTotal == null
          ? "ROAS and CAC use paid-ad spend against perf-attributed revenue. Creator payments are not available yet, so they are left out."
          : "ROAS and CAC are blended: all revenue against ad spend plus creator payments.";

  const paySubtitle = !showPay
    ? undefined
    : pay.data?.kv
      ? [payCount ? `${fmtN(payCount)} payment${payCount === 1 ? "" : "s"}` : "none logged", pay.data.owed && pay.data.owed.total > 0 ? `${fmtINR(pay.data.owed.total)} owed` : ""].filter(Boolean).join(" · ")
      : pay.data
        ? "storage not connected"
        : pay.error?.code === "locked" ? "unlock to load" : pay.loading ? "loading" : "unavailable";

  return (
    <>
      <PageHeader eyebrow="CEO report" title={`Spend, ROAS and CAC · ${rangeLabel}`} description={basis} />
      <ScreenGate loading={api.loading} error={api.error} hasData={!!d} onRetry={() => api.refetch(false)}>
        {d && m ? (
          <div className="space-y-4">
            <StatRow cols={view === "overall" ? 4 : 6}>
              <StatTile label="Signups" icon={<UserPlus className="h-3.5 w-3.5" />} value={d.signups} accent="blue" subtitle="tracked signup events" />
              <StatTile label="Sales" icon={<Receipt className="h-3.5 w-3.5" />} value={d.sales} accent="green" subtitle={`${fmtN(d.payers)} payers`} />
              <StatTile label="Conversion" icon={<Percent className="h-3.5 w-3.5" />} value={safeDiv(d.sales, d.signups) * 100} format={(n) => fmtPct(n, 2)} accent="violet" />
              <StatTile label="Revenue" icon={<CircleDollarSign className="h-3.5 w-3.5" />} value={m.revenue} format={fmtINR} accent="green" subtitle={`${fmtINR(d.inr)} + $${Math.round(d.usd)}`} />
              {showAds ? (
                <StatTile label="Ad spend" icon={<Wallet className="h-3.5 w-3.5" />} value={m.adSpend} format={fmtINR} accent="amber" subtitle="Google + Meta, paid only" />
              ) : null}
              {showPay ? (
                <StatTile
                  label="Influencer payments" icon={<HandCoins className="h-3.5 w-3.5" />} accent="violet"
                  value={payTotal ?? 0} format={(n) => (payTotal == null ? "n/a" : fmtINR(n))} subtitle={paySubtitle}
                />
              ) : null}
              {view === "overall" ? (
                <StatTile
                  label="Total spend" icon={<Layers className="h-3.5 w-3.5" />} value={m.totalSpend} format={fmtINR} accent="amber"
                  subtitle={payTotal == null ? "ads only, payments unavailable" : "ads + creator payments"}
                />
              ) : null}
              <StatTile
                label="ROAS" icon={<Target className="h-3.5 w-3.5" />} accent="rose"
                value={m.roas ?? 0} format={(n) => (m.roas == null ? "n/a" : `${n.toFixed(2)}x`)}
                subtitle={m.cac != null ? `CAC ${fmtINR(m.cac)} per sale` : "needs spend and sales"}
              />
            </StatRow>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Signups per day"><TrendBars data={m.signupSeries} fmt={fmtN} name="signups" height={230} /></Panel>
              <Panel title="Revenue per day"><TrendArea data={m.revSeries} fmt={fmtINR} yFmt={fmtINRCompact} color="#2fb57a" names={["revenue"]} height={230} /></Panel>
            </div>

            {showPay ? (
              <PaymentsPanel
                data={pay.data} error={pay.error} loading={pay.loading} rangeLabel={rangeLabel} creatorNames={creatorNames}
                onChanged={() => pay.refetch(false)}
              />
            ) : null}

            {m.infl && m.perfB ? (
              <Panel title="Influencer vs performance" subtitle="How each attribution bucket contributes">
                <div className="grid gap-6 sm:grid-cols-2">
                  {([["Influencer", m.infl, "#a78bfa"], ["Performance", m.perfB, "#6e8cff"]] as const).map(([name, v, c]) => {
                    const share = safeDiv(v.revenue, m.infl!.revenue + m.perfB!.revenue) * 100;
                    return (
                      <div key={name}>
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><span className="h-2 w-2 rounded-full" style={{ background: c }} />{name}</div>
                        <dl className="mt-3 grid grid-cols-3 gap-3 text-xs">
                          <div><dt className="text-muted-foreground">Signups</dt><dd className="mt-0.5 text-base font-semibold text-foreground tabular">{fmtN(v.signups)}</dd></div>
                          <div><dt className="text-muted-foreground">Sales</dt><dd className="mt-0.5 text-base font-semibold text-foreground tabular">{fmtN(v.sales)}</dd></div>
                          <div><dt className="text-muted-foreground">Revenue</dt><dd className="mt-0.5 text-base font-semibold text-foreground tabular">{fmtINRCompact(v.revenue)}</dd></div>
                        </dl>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full" style={{ width: `${share}%`, background: c }} /></div>
                        <div className="mt-1 text-[11px] text-muted-foreground tabular">{fmtPct(share, 0)} of bucketed revenue · {fmtPct(safeDiv(v.sales, v.signups) * 100, 2)} conversion</div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            ) : null}

            <div className={cn("grid gap-4", showAds && "lg:grid-cols-2")}>
              {showAds ? (
              <Panel title="Ad campaigns" subtitle="Google campaigns and Meta in this range" padded={false}>
                <div className="overflow-x-auto px-5 pb-5">
                  <table className="w-full min-w-[420px] text-[13px] tabular">
                    <thead><tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 font-medium">Campaign</th><th className="pb-2 text-right font-medium">Spend</th><th className="pb-2 text-right font-medium">Clicks</th><th className="pb-2 text-right font-medium">CPC</th><th className="pb-2 text-right font-medium">CTR</th>
                    </tr></thead>
                    <tbody>
                      {[
                        ...d.google.map((g) => ({ ...g, name: campaignName(g.cid), note: g.cid === KEYWORD_CAMPAIGN ? "Google, billed to influencer" : "Google" })),
                        { cid: "meta", name: "Meta ads", note: "Meta", ...d.meta },
                      ].map((r) => (
                        <tr key={r.cid} className="border-t border-white/[0.05]">
                          <td className="py-2.5"><div className="text-foreground">{r.name}</div><div className="text-[11px] text-muted-foreground">{r.note}</div></td>
                          <td className="py-2.5 text-right text-foreground">{fmtINR(r.spend)}</td>
                          <td className="py-2.5 text-right text-muted-foreground">{fmtN(r.clicks)}</td>
                          <td className="py-2.5 text-right text-muted-foreground">{r.clicks ? fmtINR(r.spend / r.clicks) : "n/a"}</td>
                          <td className="py-2.5 text-right text-muted-foreground">{r.impr ? fmtPct(safeDiv(r.clicks, r.impr) * 100, 1) : "n/a"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
              ) : null}
              <Panel title="Campaign codes" subtitle="Codes in the influencer bucket" padded={false}>
                <div className="overflow-x-auto px-5 pb-5">
                  <table className="w-full min-w-[360px] text-[13px] tabular">
                    <thead><tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 font-medium">Code</th><th className="pb-2 text-right font-medium">Signups</th><th className="pb-2 text-right font-medium">Sales</th><th className="pb-2 text-right font-medium">Conv</th>
                    </tr></thead>
                    <tbody>
                      {d.creators.map((c) => (
                        <tr key={c.code} className="border-t border-white/[0.05]">
                          <td className="max-w-[14rem] truncate py-2.5 text-foreground">{campaignName(c.code)}</td>
                          <td className="py-2.5 text-right text-muted-foreground">{fmtCompact(c.signups)}</td>
                          <td className="py-2.5 text-right text-foreground">{fmtN(c.sales)}</td>
                          <td className="py-2.5 text-right"><span className={cn("text-xs font-semibold", safeDiv(c.sales, c.signups) >= 0.01 ? "text-emerald-400" : "text-muted-foreground")}>{fmtPct(safeDiv(c.sales, c.signups) * 100, 2)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>
          </div>
        ) : null}
      </ScreenGate>
    </>
  );
}
