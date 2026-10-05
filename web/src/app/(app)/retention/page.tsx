"use client";

import { useMemo } from "react";
import { Info, Repeat2 } from "lucide-react";
import { useScreen } from "@/lib/use-api";
import { useReportFreshness } from "@/components/dash/freshness";
import { ScreenGate } from "@/components/dash/screen-gate";
import { PageHeader } from "@/components/dash/page-header";
import { Panel } from "@/components/dash/panel";
import { StatRow, StatTile } from "@/components/dash/stat-tile";
import { dayLabel, fmtN, fmtPct, safeDiv } from "@/lib/format";

const WEEKS = [0, 1, 2, 3, 4, 5, 6];
const DAY = 86400000;
const utc = (iso: string) => Date.parse(iso + "T00:00:00Z");

export default function RetentionPage() {
  const api = useScreen("retention", { usesView: false });
  useReportFreshness(api);
  const d = api.data;

  const m = useMemo(() => {
    if (!d) return null;
    const asOf = utc(d.asOf);
    const size = new Map(d.sizes.map(([c, n]) => [c, n] as const));
    const cell = new Map(d.cells.map(([c, wk, n]) => [`${c}|${wk}`, n] as const));
    const cohorts = [...size.keys()].sort().reverse().slice(0, 8);
    // A week only counts once it has fully elapsed; the current one is partial.
    const complete = (c: string, wk: number) => utc(c) + 7 * (wk + 1) * DAY <= asOf + DAY;
    const rows = cohorts.map((c) => ({
      cohort: c,
      size: size.get(c) ?? 0,
      cells: WEEKS.map((wk) => {
        const started = utc(c) + 7 * wk * DAY <= asOf;
        const n = cell.get(`${c}|${wk}`) ?? 0;
        return { wk, started, complete: complete(c, wk), n, pct: safeDiv(n, size.get(c) ?? 0) * 100 };
      }),
    }));
    // Weighted: all returning users over all cohort members, for cohorts whose week is complete.
    const avg = (wk: number) => {
      let n = 0;
      let sz = 0;
      for (const r of rows) {
        const c = r.cells[wk];
        if (c.complete) {
          n += c.n;
          sz += r.size;
        }
      }
      return sz ? (n / sz) * 100 : null;
    };
    return { rows, w1: avg(1), w2: avg(2), w4: avg(4) };
  }, [d]);

  return (
    <>
      <PageHeader
        eyebrow="Retention"
        title="Who comes back"
        description="Weekly signup cohorts, and the share of each cohort that did something real in the product in later weeks."
      />
      <ScreenGate loading={api.loading} error={api.error} hasData={!!d} onRetry={() => api.refetch(false)}>
        {d && m ? (
          <div className="space-y-4">
            <StatRow cols={3}>
              {([["Week 1", m.w1], ["Week 2", m.w2], ["Week 4", m.w4]] as const).map(([label, v]) => (
                <StatTile key={label} label={`${label} return`} icon={<Repeat2 className="h-3.5 w-3.5" />} value={v ?? 0} format={(n) => (v == null ? "n/a" : fmtPct(n, 1))} accent="violet" subtitle="weighted across finished weeks" />
              ))}
            </StatRow>
            <Panel title="Cohort grid" subtitle="Rows are signup weeks (Monday start). Columns are weeks since signup. Dashed cells are still in progress.">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-separate border-spacing-1 text-center text-[12px] tabular">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-2 py-1 text-left font-medium">Cohort</th>
                      <th className="px-2 py-1 text-right font-medium">Size</th>
                      {WEEKS.map((w) => <th key={w} className="px-2 py-1 font-medium">W{w}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {m.rows.map((r) => (
                      <tr key={r.cohort}>
                        <td className="whitespace-nowrap px-2 py-1 text-left text-foreground">{dayLabel(r.cohort)}</td>
                        <td className="px-2 py-1 text-right text-muted-foreground">{fmtN(r.size)}</td>
                        {r.cells.map((c) => {
                          if (!c.started) return <td key={c.wk} className="rounded-md px-2 py-2 text-muted-foreground/40">·</td>;
                          const scale = c.wk === 0 ? 1 : 0.15;
                          const a = Math.min(1, c.pct / 100 / scale) * 0.75;
                          return (
                            <td
                              key={c.wk}
                              title={`${fmtN(c.n)} of ${fmtN(r.size)} active${c.complete ? "" : " so far (week in progress)"}`}
                              className={`rounded-md px-2 py-2 font-medium text-foreground ${c.complete ? "" : "border border-dashed border-white/20"}`}
                              style={{ background: `rgba(110,140,255,${0.06 + a})` }}
                            >
                              {c.pct >= 10 ? c.pct.toFixed(0) : c.pct.toFixed(1)}%
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Active means a core product action that week: {d.events.map((e) => e.replace(/_/g, " ")).join(", ")}. Cohort sizes are accounts created in the database.
            </p>
          </div>
        ) : null}
      </ScreenGate>
    </>
  );
}
