"use client";

import { useMemo } from "react";
import { FileUp, Flag, Sparkles, TrendingUp } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-state";
import { useScreen } from "@/lib/use-api";
import { useReportFreshness } from "@/components/dash/freshness";
import { ScreenGate } from "@/components/dash/screen-gate";
import { PageHeader } from "@/components/dash/page-header";
import { Panel } from "@/components/dash/panel";
import { StatRow, StatTile } from "@/components/dash/stat-tile";
import { TrendArea } from "@/components/dash/charts";
import { Funnel } from "@/components/dash/funnel";
import { dayLabel, fmtN, fmtPct, safeDiv } from "@/lib/format";

export default function ActivatePage() {
  const { rangeLabel } = useDashboard();
  const daily = useScreen("daily");
  const insights = useScreen("insights");
  useReportFreshness(daily);

  const m = useMemo(() => {
    const rows = (daily.data?.ev ?? []).filter((r) => r[1] > 0);
    const series = rows.map((r) => ({ label: dayLabel(r[0]), value: Math.round(safeDiv(r[2], r[1]) * 1000) / 10 }));
    const su = rows.reduce((a, r) => a + r[1], 0);
    const act = rows.reduce((a, r) => a + r[2], 0);
    const last7 = rows.slice(-7);
    const prev7 = rows.slice(-14, -7);
    const rate = (xs: typeof rows) => safeDiv(xs.reduce((a, r) => a + r[2], 0), xs.reduce((a, r) => a + r[1], 0)) * 100;
    return { series, su, act, rate30: safeDiv(act, su) * 100, rate7: rate(last7), ratePrev7: prev7.length ? rate(prev7) : null };
  }, [daily.data]);

  const f = insights.data?.funnel;

  return (
    <>
      <PageHeader eyebrow="Activation" title="Who gets to value" description="Activation is finishing onboarding. The trend shows the last 30 days; the funnel follows the range you pick." />
      <ScreenGate loading={daily.loading} error={daily.error} hasData={!!daily.data} onRetry={() => daily.refetch(false)}>
        {daily.data ? (
          <div className="space-y-4">
            <StatRow cols={4}>
              <StatTile label="30-day rate" icon={<Sparkles className="h-3.5 w-3.5" />} value={m.rate30} format={(n) => fmtPct(n, 1)} accent="violet" subtitle={`${fmtN(m.act)} of ${fmtN(m.su)} signups`} />
              <StatTile
                label="Last 7 days" icon={<TrendingUp className="h-3.5 w-3.5" />} value={m.rate7} format={(n) => fmtPct(n, 1)} accent="green"
                deltaPct={m.ratePrev7 != null && m.ratePrev7 > 0 ? ((m.rate7 - m.ratePrev7) / m.ratePrev7) * 100 : undefined}
                subtitle="vs the 7 days before"
              />
              <StatTile label="Finished onboarding" icon={<Flag className="h-3.5 w-3.5" />} value={f ? safeDiv(f[2], f[0]) * 100 : 0} format={(n) => fmtPct(n, 1)} accent="blue" subtitle={f ? `${fmtN(f[2])} · ${rangeLabel}` : "loading"} />
              <StatTile label="Uploaded a resume" icon={<FileUp className="h-3.5 w-3.5" />} value={f ? safeDiv(f[3], f[0]) * 100 : 0} format={(n) => fmtPct(n, 1)} accent="amber" subtitle={f ? `${fmtN(f[3])} · ${rangeLabel}` : "loading"} />
            </StatRow>
            <Panel title="Activation rate per day" subtitle="Percent of each day's signups who finished onboarding">
              <TrendArea data={m.series} fmt={(n) => `${n.toFixed(1)}%`} yFmt={(n) => `${n}%`} color="#a78bfa" names={["activated"]} height={250} />
            </Panel>
            {f ? (
              <Panel title={`Funnel · ${rangeLabel}`} subtitle="Signup to first payment">
                <Funnel
                  steps={[
                    { label: "Signed up", value: f[0] },
                    { label: "Started onboarding", value: f[1] },
                    { label: "Finished onboarding", value: f[2] },
                    { label: "Uploaded a resume", value: f[3] },
                    { label: "Paid", value: f[4] },
                  ]}
                />
              </Panel>
            ) : null}
          </div>
        ) : null}
      </ScreenGate>
    </>
  );
}
