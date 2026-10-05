"use client";

import { useMemo } from "react";
import { Compass, Eye, Trophy, UserPlus } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-state";
import { useOverview } from "@/lib/use-api";
import { useReportFreshness } from "@/components/dash/freshness";
import { ScreenGate } from "@/components/dash/screen-gate";
import { PageHeader } from "@/components/dash/page-header";
import { Panel } from "@/components/dash/panel";
import { StatRow, StatTile } from "@/components/dash/stat-tile";
import { BarList } from "@/components/dash/bar-list";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { CHANNEL_COLOR, channelOf, type Channel } from "@/lib/channels";
import { fmtN, fmtPct, safeDiv } from "@/lib/format";
import { cn } from "@/lib/utils";

type ChannelRow = { id: string; channel: Channel; visitors: number; signups: number; paid: number; signRate: number; paidRate: number };
type SourceRow = { id: string; source: string; medium: string; channel: Channel; signups: number; pro: number; rate: number };

const rateTone = (r: number) => (r >= 1.2 ? "text-emerald-400" : r >= 0.8 ? "text-amber-300" : "text-rose-300");

export default function AcquirePage() {
  const { rangeLabel } = useDashboard();
  const api = useOverview();
  useReportFreshness(api);
  const d = api.data;

  const m = useMemo(() => {
    if (!d) return null;
    const ch = new Map<Channel, { visitors: number; signups: number; paid: number }>();
    const add = (c: Channel, f: "visitors" | "signups" | "paid", n: number) => {
      const x = ch.get(c) ?? { visitors: 0, signups: 0, paid: 0 };
      x[f] += n;
      ch.set(c, x);
    };
    for (const [s, md, n] of d.visitorsBySource ?? []) add(channelOf(s, md), "visitors", n ?? 0);
    for (const [s, md, n] of d.sources ?? []) add(channelOf(s, md), "signups", n ?? 0);
    for (const [s, md, n] of d.payersBySource ?? []) add(channelOf(s, md), "paid", n ?? 0);
    const channels: ChannelRow[] = [...ch.entries()]
      .map(([channel, v]) => ({
        id: channel, channel, ...v,
        signRate: safeDiv(v.signups, v.visitors) * 100,
        paidRate: safeDiv(v.paid, v.signups) * 100,
      }))
      .sort((a, b) => b.signups - a.signups);
    const sources: SourceRow[] = (d.sources ?? []).map(([s, md, n, pro], i) => ({
      id: `${i}`, source: s || "direct", medium: md || "none", channel: channelOf(s, md), signups: n ?? 0, pro: pro ?? 0, rate: safeDiv(pro ?? 0, n ?? 0) * 100,
    }));
    const visitors = channels.reduce((a, c) => a + c.visitors, 0);
    const signups = channels.reduce((a, c) => a + c.signups, 0);
    return { channels, sources, visitors, signups, top: channels[0] };
  }, [d]);

  const channelCols: DataTableColumn<ChannelRow>[] = [
    { id: "channel", header: "Channel", accessorKey: "channel", sortable: true, cell: ({ row }) => (<span className="inline-flex items-center gap-2 font-medium text-foreground"><span className="h-2 w-2 rounded-full" style={{ background: CHANNEL_COLOR[row.channel] }} />{row.channel}</span>) },
    { id: "visitors", header: "Visitors", accessorKey: "visitors", sortable: true, cell: ({ row }) => <span className="tabular">{fmtN(row.visitors)}</span> },
    { id: "signups", header: "Signups", accessorKey: "signups", sortable: true, cell: ({ row }) => <span className="tabular text-foreground">{fmtN(row.signups)}</span> },
    { id: "signRate", header: "Visit to signup", accessorKey: "signRate", sortable: true, cell: ({ row }) => <span className="tabular">{row.visitors ? fmtPct(row.signRate, 1) : "n/a"}</span> },
    { id: "paid", header: "Paid", accessorKey: "paid", sortable: true, cell: ({ row }) => <span className="tabular text-foreground">{fmtN(row.paid)}</span> },
    { id: "paidRate", header: "Signup to paid", accessorKey: "paidRate", sortable: true, cell: ({ row }) => <span className={cn("tabular font-semibold", rateTone(row.paidRate))}>{fmtPct(row.paidRate, 2)}</span> },
  ];
  const sourceCols: DataTableColumn<SourceRow>[] = [
    { id: "source", header: "Source", accessorKey: "source", sortable: true, cell: ({ row }) => <span className="font-medium text-foreground">{row.source}</span> },
    { id: "medium", header: "Medium", accessorKey: "medium", sortable: true },
    { id: "channel", header: "Channel", accessorKey: "channel", sortable: true },
    { id: "signups", header: "Signups", accessorKey: "signups", sortable: true, cell: ({ row }) => <span className="tabular">{fmtN(row.signups)}</span> },
    { id: "pro", header: "Pro", accessorKey: "pro", sortable: true, cell: ({ row }) => <span className="tabular">{fmtN(row.pro)}</span> },
    { id: "rate", header: "Conv", accessorKey: "rate", sortable: true, cell: ({ row }) => <span className={cn("tabular font-semibold", rateTone(row.rate))}>{fmtPct(row.rate, 2)}</span> },
  ];

  return (
    <>
      <PageHeader eyebrow="Acquisition" title={`Channels · ${rangeLabel}`} description="Visitors, signups and payers by channel. Channels group the raw source and medium the same way as the classic dashboard." />
      <ScreenGate loading={api.loading} error={api.error} hasData={!!d} onRetry={() => api.refetch(false)}>
        {d && m ? (
          <div className="space-y-4">
            <StatRow cols={4}>
              <StatTile label="Visitors" icon={<Eye className="h-3.5 w-3.5" />} value={m.visitors} accent="slate" />
              <StatTile label="Signups" icon={<UserPlus className="h-3.5 w-3.5" />} value={m.signups} accent="blue" subtitle={m.visitors ? `${fmtPct(safeDiv(m.signups, m.visitors) * 100, 1)} of visitors` : undefined} />
              <StatTile label="Channels" icon={<Compass className="h-3.5 w-3.5" />} value={m.channels.length} accent="violet" subtitle="with signups or traffic" />
              <StatTile label="Top channel" icon={<Trophy className="h-3.5 w-3.5" />} value={m.top?.signups ?? 0} accent="amber" subtitle={m.top ? `${m.top.channel}, ${fmtPct(safeDiv(m.top.signups, m.signups) * 100, 0)} of signups` : undefined} />
            </StatRow>
            <div className="grid gap-4 lg:grid-cols-5">
              <Panel className="lg:col-span-2" title="Share of signups">
                <BarList items={m.channels.slice(0, 8).map((c) => ({ key: c.channel, label: c.channel, value: c.signups, color: CHANNEL_COLOR[c.channel], sub: fmtPct(safeDiv(c.signups, m.signups) * 100, 0) }))} />
              </Panel>
              <Panel className="lg:col-span-3" title="Channel performance" padded={false}>
                <div className="px-2 pb-3 sm:px-4"><DataTable<ChannelRow> columns={channelCols} data={m.channels} sortable density="compact" getRowId={(r) => r.id} /></div>
              </Panel>
            </div>
            <Panel title="Every source and medium" subtitle="Search or sort the raw first-touch values" padded={false}>
              <div className="px-2 pb-3 sm:px-4">
                <DataTable<SourceRow> columns={sourceCols} data={m.sources} sortable filterable={{ placeholder: "Search sources" }} paginated={{ pageSize: 10 }} density="compact" getRowId={(r) => r.id} />
              </div>
            </Panel>
            {(d.influencers ?? []).length ? (
              <Panel title="Instagram campaigns" subtitle="Campaign tags on influencer signups">
                <BarList items={d.influencers.slice(0, 10).map(([c, n, pro]) => ({ key: c, label: c.replace(/_/g, " "), value: n, sub: `${fmtN(pro)} pro` }))} color="#a78bfa" />
              </Panel>
            ) : null}
          </div>
        ) : null}
      </ScreenGate>
    </>
  );
}
