"use client";

import { useMemo } from "react";
import { Gift, Megaphone, ShoppingBag, Users } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-state";
import { useCreatorNames, useScreen } from "@/lib/use-api";
import { useReportFreshness } from "@/components/dash/freshness";
import { ScreenGate } from "@/components/dash/screen-gate";
import { PageHeader } from "@/components/dash/page-header";
import { Panel } from "@/components/dash/panel";
import { StatRow, StatTile } from "@/components/dash/stat-tile";
import { BarList } from "@/components/dash/bar-list";
import { creatorLabel } from "@/lib/channels";
import { fmtN, fmtPct, safeDiv } from "@/lib/format";

export default function ReferralsPage() {
  const { rangeLabel } = useDashboard();
  const api = useScreen("creators", { usesView: false });
  const names = useCreatorNames();
  useReportFreshness(api);
  const d = api.data;

  const m = useMemo(() => {
    if (!d) return null;
    const rows = d.rows.map(([code, referrals, pro]) => ({ code, referrals, pro }));
    return { total: rows.reduce((a, r) => a + r.referrals, 0), paid: rows.reduce((a, r) => a + r.pro, 0), top: rows.slice(0, 10) };
  }, [d]);

  const f = d?.funnel;
  return (
    <>
      <PageHeader eyebrow="Referrals" title="Referral codes in use" description={`Referred signups for ${rangeLabel.toLowerCase()}, plus how people use referral codes at checkout over the last ${f?.days ?? 90} days.`} />
      <ScreenGate loading={api.loading} error={api.error} hasData={!!d} onRetry={() => api.refetch(false)}>
        {d && m && f ? (
          <div className="space-y-4">
            <StatRow cols={4}>
              <StatTile label="Referred signups" icon={<Users className="h-3.5 w-3.5" />} value={m.total} accent="blue" subtitle={`${fmtN(m.paid)} on Pro (${fmtPct(safeDiv(m.paid, m.total) * 100, 1)})`} />
              <StatTile label="People applying a code" icon={<Megaphone className="h-3.5 w-3.5" />} value={f.people} accent="violet" subtitle={`${fmtN(f.applied)} attempts`} />
              <StatTile label="Referral purchases" icon={<ShoppingBag className="h-3.5 w-3.5" />} value={f.purchased} accent="green" subtitle={`${fmtPct(safeDiv(f.purchased, f.people) * 100, 0)} of people applying`} />
              <StatTile label="Rewards granted" icon={<Gift className="h-3.5 w-3.5" />} value={f.rewarded} accent="amber" subtitle={`${fmtN(f.discounted)} discounts shown`} />
            </StatRow>
            <Panel title="Top referral codes" subtitle={`Most referred signups · ${rangeLabel}`}>
              <BarList
                color="#a78bfa"
                items={m.top.map((r) => {
                  const c = creatorLabel(r.code, names.data);
                  return { key: r.code ?? "none", label: c.name, value: r.referrals, sub: `${c.code} · ${fmtN(r.pro)} pro` };
                })}
              />
            </Panel>
            <p className="text-xs text-muted-foreground">Discounts shown counts every time the discount appeared, so it can exceed the number of people who applied a code.</p>
          </div>
        ) : null}
      </ScreenGate>
    </>
  );
}
