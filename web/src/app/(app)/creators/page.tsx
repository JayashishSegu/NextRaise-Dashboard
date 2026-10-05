"use client";

import { useMemo } from "react";
import { Crown, CircleDollarSign, Info, UserCheck, Users } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-state";
import { useCreatorNames, useScreen } from "@/lib/use-api";
import { useReportFreshness } from "@/components/dash/freshness";
import { ScreenGate } from "@/components/dash/screen-gate";
import { PageHeader } from "@/components/dash/page-header";
import { Panel } from "@/components/dash/panel";
import { StatRow, StatTile } from "@/components/dash/stat-tile";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { creatorLabel } from "@/lib/channels";
import { agoUtc, fmtINR, fmtN, fmtPct, safeDiv } from "@/lib/format";
import { cn } from "@/lib/utils";

type Row = { id: string; name: string; code: string; referrals: number; pro: number; conv: number; revenue: number; perReferral: number; last: string };

export default function CreatorsPage() {
  const { rangeLabel, usdToInr } = useDashboard();
  const api = useScreen("creators", { usesView: false });
  const names = useCreatorNames();
  useReportFreshness(api);
  const d = api.data;

  const rows = useMemo<Row[]>(
    () =>
      (d?.rows ?? []).map(([code, referrals, pro, inr, usd, , last], i) => {
        const c = creatorLabel(code, names.data);
        const revenue = Math.round(inr + usdToInr(usd));
        return { id: `${code ?? "x"}-${i}`, name: c.name, code: c.code, referrals, pro, conv: safeDiv(pro, referrals) * 100, revenue, perReferral: safeDiv(revenue, referrals), last };
      }),
    [d, names.data, usdToInr],
  );
  const totals = useMemo(() => ({
    referrals: rows.reduce((a, r) => a + r.referrals, 0),
    pro: rows.reduce((a, r) => a + r.pro, 0),
    revenue: rows.reduce((a, r) => a + r.revenue, 0),
  }), [rows]);

  const cols: DataTableColumn<Row>[] = [
    { id: "name", header: "Creator", accessorKey: "name", sortable: true, cell: ({ row }) => (<div><div className="font-medium text-foreground">{row.name}</div><div className="text-[11px] text-muted-foreground">{row.code}</div></div>) },
    { id: "referrals", header: "Signups", accessorKey: "referrals", sortable: true, cell: ({ row }) => <span className="tabular">{fmtN(row.referrals)}</span> },
    { id: "pro", header: "On Pro", accessorKey: "pro", sortable: true, cell: ({ row }) => <span className="tabular">{fmtN(row.pro)}</span> },
    { id: "conv", header: "Conv", accessorKey: "conv", sortable: true, cell: ({ row }) => <span className={cn("tabular font-semibold", row.conv >= 3 ? "text-emerald-400" : row.conv >= 1 ? "text-amber-300" : "text-muted-foreground")}>{fmtPct(row.conv, 1)}</span> },
    { id: "revenue", header: "Revenue", accessorKey: "revenue", sortable: true, cell: ({ row }) => <span className="tabular font-medium text-foreground">{fmtINR(row.revenue)}</span> },
    { id: "perReferral", header: "Per signup", accessorKey: "perReferral", sortable: true, cell: ({ row }) => <span className="tabular text-muted-foreground">{fmtINR(row.perReferral)}</span> },
    { id: "last", header: "Last signup", accessorKey: "last", sortable: true, cell: ({ row }) => <span className="text-muted-foreground">{agoUtc(row.last)}</span> },
  ];

  return (
    <>
      <PageHeader eyebrow="Creators" title={`Creator codes · ${rangeLabel}`} description="Each row is one referral code: how many people signed up with it, how many are on Pro, and what they paid since launch." />
      <ScreenGate loading={api.loading} error={api.error} hasData={!!d} onRetry={() => api.refetch(false)}>
        {d ? (
          <div className="space-y-4">
            <StatRow cols={4}>
              <StatTile label="Creators" icon={<Crown className="h-3.5 w-3.5" />} value={rows.length} accent="violet" />
              <StatTile label="Referred signups" icon={<Users className="h-3.5 w-3.5" />} value={totals.referrals} accent="blue" />
              <StatTile label="On Pro" icon={<UserCheck className="h-3.5 w-3.5" />} value={totals.pro} accent="green" subtitle={fmtPct(safeDiv(totals.pro, totals.referrals) * 100, 1)} />
              <StatTile label="Revenue" icon={<CircleDollarSign className="h-3.5 w-3.5" />} value={totals.revenue} format={fmtINR} accent="amber" subtitle={`${fmtINR(safeDiv(totals.revenue, totals.referrals))} per signup`} />
            </StatRow>
            <Panel title="Creator leaderboard" padded={false}>
              <div className="px-2 pb-3 sm:px-4">
                <DataTable<Row> columns={cols} data={rows} sortable filterable={{ placeholder: "Search creators" }} paginated={{ pageSize: 12 }} density="compact" getRowId={(r) => r.id} />
              </div>
            </Panel>
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              ROAS needs each creator&apos;s budget, which is not recorded yet. Budgets are kept in a Vercel KV store on the production project, and that store has not been created.
            </p>
          </div>
        ) : null}
      </ScreenGate>
    </>
  );
}
