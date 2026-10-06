"use client";

import { useMemo, useState } from "react";
import { MetalText } from "metal-fx";
import { CircleDollarSign, Clock, Download, Flame, PhoneCall, UserX } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-state";
import { useOps } from "@/lib/use-api";
import type { ProUsersData } from "@/lib/types";
import { useReportFreshness } from "@/components/dash/freshness";
import { ScreenGate } from "@/components/dash/screen-gate";
import { PageHeader } from "@/components/dash/page-header";
import { Panel } from "@/components/dash/panel";
import { StatRow, StatTile } from "@/components/dash/stat-tile";
import { CopyButton } from "@/components/dash/copy-button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { planLabel } from "@/lib/channels";
import { dateIst, fmtINR, fmtN, parseUtc } from "@/lib/format";
import { cn } from "@/lib/utils";

type Row = {
  id: string; name: string; email: string; plan: string; planKey: string; status: "active" | "expiring" | "ended";
  daysLeft: number | null; ends: string | null; paid: number; phone: string; code: string; since: string | null;
};
type Filter = "all" | "expiring" | "ended";

const DAY = 86400000;
const STATUS_STYLE = {
  active: "bg-emerald-500/10 text-emerald-400",
  expiring: "bg-amber-400/10 text-amber-300",
  ended: "bg-rose-500/10 text-rose-300",
} as const;

export default function ProUsersPage() {
  const { usdToInr } = useDashboard();
  const api = useOps<ProUsersData>("pro");
  useReportFreshness(api);
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo<Row[]>(() => {
    const now = Date.now();
    return (api.data?.users ?? []).map((u) => {
      const end = parseUtc(u.ends);
      const daysLeft = end == null ? null : Math.ceil((end - now) / DAY);
      const status: Row["status"] = daysLeft != null && daysLeft < 0 ? "ended" : daysLeft != null && daysLeft <= 7 ? "expiring" : "active";
      return {
        id: u.id, name: u.name ?? "", email: u.email, plan: planLabel(u.planKey ?? u.plan), planKey: u.planKey ?? u.plan ?? "",
        status, daysLeft, ends: u.ends, paid: Math.round(u.inr + usdToInr(u.usd)), phone: u.phone ?? "", code: u.code ?? "", since: u.firstPay ?? u.created,
      };
    });
  }, [api.data, usdToInr]);

  const counts = useMemo(() => ({
    all: rows.length,
    expiring: rows.filter((r) => r.status === "expiring").length,
    ended: rows.filter((r) => r.status === "ended").length,
    revenue: rows.reduce((a, r) => a + r.paid, 0),
    phones: rows.filter((r) => r.phone).length,
  }), [rows]);

  const shown = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  const cols: DataTableColumn<Row>[] = [
    {
      id: "name", header: "User", accessorKey: "name", sortable: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <div className="min-w-0"><div className="truncate font-medium text-foreground">{row.name || "No name"}</div><div className="truncate text-[11px] text-muted-foreground">{row.email}</div></div>
          <CopyButton text={row.email} label="Copy email" />
        </div>
      ),
    },
    { id: "plan", header: "Plan", accessorKey: "plan", sortable: true },
    {
      id: "status", header: "Status", accessorKey: "status", sortable: true,
      cell: ({ row }) => (
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold capitalize", STATUS_STYLE[row.status])}>
          {row.status === "expiring" ? `${row.daysLeft}d left` : row.status === "ended" ? "Ended" : "Active"}
        </span>
      ),
    },
    { id: "ends", header: "Expires", accessorKey: "ends", sortable: true, cell: ({ row }) => <span className="tabular text-muted-foreground">{row.ends ? dateIst(row.ends) : "n/a"}</span> },
    { id: "paid", header: "Paid", accessorKey: "paid", sortable: true, cell: ({ row }) => <span className="tabular font-medium text-foreground">{fmtINR(row.paid)}</span> },
    {
      id: "phone", header: "Phone", accessorKey: "phone",
      cell: ({ row }) => row.phone ? <span className="inline-flex items-center gap-1 tabular text-muted-foreground">{row.phone}<CopyButton text={row.phone} label="Copy phone" /></span> : <span className="text-muted-foreground/50">none</span>,
    },
    { id: "code", header: "Referral", accessorKey: "code", sortable: true, cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.code || "n/a"}</span> },
  ];

  function exportCsv() {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const head = ["Name", "Email", "Phone", "Plan", "Status", "Expires", "Paid INR equiv", "Referral code"];
    const body = shown.map((r) => [r.name, r.email, r.phone, r.plan, r.status, r.ends ?? "", r.paid, r.code].map(esc).join(","));
    const blob = new Blob([[head.map(esc).join(","), ...body].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pro-users-${filter}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  return (
    <>
      <PageHeader
        eyebrow="People"
        title={<span className="inline-flex items-center gap-2.5"><MetalText font="600 28px/1.1 sans-serif" color="#E2E2E2">Pro</MetalText>users</span>}
        description="Everyone with a live Pro subscription. Same definition as Active Pro on the Overview."
        actions={
          <button type="button" onClick={exportCsv} disabled={!shown.length} className="inline-flex h-8 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-foreground outline-none hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        }
      />
      <ScreenGate loading={api.loading} error={api.error} hasData={!!api.data} onRetry={() => api.refetch(false)}>
        {api.data ? (
          <div className="space-y-4">
            <StatRow cols={4}>
              <StatTile label="Pro users" icon={<Flame className="h-3.5 w-3.5" />} value={counts.all} accent="violet" onClick={() => setFilter("all")} />
              <StatTile label="Expiring in 7 days" icon={<Clock className="h-3.5 w-3.5" />} value={counts.expiring} accent="amber" onClick={() => setFilter("expiring")} subtitle="worth a nudge" />
              <StatTile label="Past end date" icon={<UserX className="h-3.5 w-3.5" />} value={counts.ended} accent="rose" onClick={() => setFilter("ended")} subtitle="still marked active" />
              <StatTile label="Lifetime paid" icon={<CircleDollarSign className="h-3.5 w-3.5" />} value={counts.revenue} format={fmtINR} accent="green" subtitle={`${fmtN(counts.phones)} with a phone number`} />
            </StatRow>
            <Panel
              title={filter === "all" ? "All Pro users" : filter === "expiring" ? "Expiring in the next 7 days" : "Past their end date"}
              subtitle={`${fmtN(shown.length)} shown`}
              padded={false}
              action={
                <div className="flex items-center gap-2">
                  {shown.some((r) => r.phone) ? (
                    <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:inline-flex"><PhoneCall className="h-3.5 w-3.5" />
                      <CopyButton text={shown.filter((r) => r.phone).map((r) => r.phone).join("\n")} label="Copy all phones" />
                    </span>
                  ) : null}
                  <div role="group" aria-label="Filter" className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
                    {(["all", "expiring", "ended"] as const).map((f) => (
                      <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={cn("rounded-md px-2.5 py-1 text-xs font-medium capitalize outline-none focus-visible:ring-2 focus-visible:ring-ring", filter === f ? "bg-white/[0.09] text-foreground" : "text-muted-foreground hover:text-foreground")}>{f}</button>
                    ))}
                  </div>
                </div>
              }
            >
              <div className="px-2 pb-3 pt-3 sm:px-4">
                <DataTable<Row> columns={cols} data={shown} sortable filterable={{ placeholder: "Search name, email, phone", searchKeys: ["name", "email", "phone", "plan", "code"] }} paginated={{ pageSize: 12 }} density="compact" getRowId={(r) => r.id} />
              </div>
            </Panel>
          </div>
        ) : null}
      </ScreenGate>
    </>
  );
}
