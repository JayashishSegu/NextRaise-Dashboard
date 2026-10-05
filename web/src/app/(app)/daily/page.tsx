"use client";

import { useMemo } from "react";
import { CalendarCheck, CircleDollarSign, Sparkles, Trophy, UserPlus } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-state";
import { useScreen } from "@/lib/use-api";
import { useReportFreshness } from "@/components/dash/freshness";
import { ScreenGate } from "@/components/dash/screen-gate";
import { PageHeader } from "@/components/dash/page-header";
import { Panel } from "@/components/dash/panel";
import { StatRow, StatTile } from "@/components/dash/stat-tile";
import { TrendArea, TrendBars } from "@/components/dash/charts";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { dayLabel, fmtINR, fmtINRCompact, fmtN, fmtPct, safeDiv, weekdayShort } from "@/lib/format";

type DayRow = {
  id: string;
  date: string;
  weekday: string;
  signups: number;
  activations: number;
  rate: number;
  payments: number;
  revenue: number;
};

export default function DailyPage() {
  const { usdToInr } = useDashboard();
  const api = useScreen("daily");
  useReportFreshness(api);
  const d = api.data;

  const m = useMemo(() => {
    if (!d) return null;
    const ev = new Map(d.ev.map((r) => [r[0], r] as const));
    const pay = new Map(d.pay.map((r) => [r[0], r] as const));
    // Accounts created per day come from the database when the API provides them.
    const su = new Map((d.su ?? []).map((r) => [r[0], r[1]] as const));
    const days = [...new Set([...ev.keys(), ...pay.keys(), ...su.keys()])].sort().slice(-31);
    const rows: DayRow[] = days.map((day) => {
      const e = ev.get(day);
      const p = pay.get(day);
      const signups = su.get(day) ?? e?.[1] ?? 0;
      const activations = e?.[2] ?? 0;
      return {
        id: day, date: day, weekday: weekdayShort(day), signups, activations,
        // Activation rate compares like with like: tracked activations over tracked signups.
        rate: safeDiv(activations, e?.[1] ?? 0) * 100,
        payments: p?.[3] ?? 0,
        revenue: Math.round((p?.[1] ?? 0) + usdToInr(p?.[2] ?? 0)),
      };
    });
    const total = (f: (r: DayRow) => number) => rows.reduce((a, r) => a + f(r), 0);
    const best = rows.reduce<DayRow | null>((b, r) => (!b || r.signups > b.signups ? r : b), null);
    const trackedSignups = d.ev.reduce((a, r) => a + r[1], 0);
    const trackedActivations = d.ev.reduce((a, r) => a + r[2], 0);
    return {
      rows, best,
      signups: total((r) => r.signups),
      revenue: total((r) => r.revenue),
      avg: safeDiv(total((r) => r.signups), rows.length),
      activationRate: safeDiv(trackedActivations, trackedSignups) * 100,
    };
  }, [d, usdToInr]);

  const columns: DataTableColumn<DayRow>[] = [
    { id: "date", header: "Day", accessorKey: "date", sortable: true, cell: ({ row }) => <span className="text-foreground">{dayLabel(row.date)} <span className="text-muted-foreground">{row.weekday}</span></span> },
    { id: "signups", header: "Signups", accessorKey: "signups", sortable: true, cell: ({ row }) => <span className="tabular">{fmtN(row.signups)}</span> },
    { id: "activations", header: "Activated", accessorKey: "activations", sortable: true, cell: ({ row }) => <span className="tabular">{fmtN(row.activations)}</span> },
    { id: "rate", header: "Rate", accessorKey: "rate", sortable: true, cell: ({ row }) => <span className="tabular">{fmtPct(row.rate, 0)}</span> },
    { id: "payments", header: "Payments", accessorKey: "payments", sortable: true, cell: ({ row }) => <span className="tabular">{fmtN(row.payments)}</span> },
    { id: "revenue", header: "Revenue", accessorKey: "revenue", sortable: true, cell: ({ row }) => <span className="tabular font-medium text-foreground">{fmtINR(row.revenue)}</span> },
  ];

  return (
    <>
      <PageHeader eyebrow="Rolling 30 days" title="Day by day" description="Accounts created, people who finished onboarding, and revenue for every day of the last month." />
      <ScreenGate loading={api.loading} error={api.error} hasData={!!d} onRetry={() => api.refetch(false)}>
        {d && m ? (
          <div className="space-y-4">
            <StatRow>
              <StatTile label="Signups" icon={<UserPlus className="h-3.5 w-3.5" />} value={m.signups} accent="blue" subtitle={`${fmtN(Math.round(m.avg))} per day`} />
              <StatTile label="Best day" icon={<Trophy className="h-3.5 w-3.5" />} value={m.best?.signups ?? 0} accent="amber" subtitle={m.best ? `${dayLabel(m.best.date)}, ${m.best.weekday}` : undefined} />
              <StatTile label="Activation" icon={<Sparkles className="h-3.5 w-3.5" />} value={m.activationRate} format={(n) => fmtPct(n, 0)} accent="violet" subtitle="finished onboarding" />
              <StatTile label="Revenue" icon={<CircleDollarSign className="h-3.5 w-3.5" />} value={m.revenue} format={fmtINR} accent="green" subtitle={`${fmtINR(safeDiv(m.revenue, m.rows.length))} per day`} />
              <StatTile label="Days tracked" icon={<CalendarCheck className="h-3.5 w-3.5" />} value={m.rows.length} accent="slate" />
            </StatRow>
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Signups and activations" subtitle="Blue: accounts created. Green: finished onboarding.">
                <TrendArea data={m.rows.map((r) => ({ label: dayLabel(r.date), value: r.signups, value2: r.activations }))} fmt={fmtN} names={["signups", "activated"]} height={240} />
              </Panel>
              <Panel title="Revenue" subtitle="Completed payments, USD at the live rate">
                <TrendBars data={m.rows.map((r) => ({ label: dayLabel(r.date), value: r.revenue }))} fmt={fmtINR} yFmt={fmtINRCompact} color="#2fb57a" name="revenue" height={240} />
              </Panel>
            </div>
            <Panel title="Every day" padded={false}>
              <div className="px-2 pb-3 sm:px-4">
                <DataTable<DayRow> columns={columns} data={[...m.rows].reverse()} sortable paginated={{ pageSize: 10 }} density="compact" getRowId={(r) => r.id} />
              </div>
            </Panel>
          </div>
        ) : null}
      </ScreenGate>
    </>
  );
}
