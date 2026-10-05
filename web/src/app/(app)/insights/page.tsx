"use client";

import { FileUp, Flag, Info, UserPlus, Wallet } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-state";
import { useScreen } from "@/lib/use-api";
import { useReportFreshness } from "@/components/dash/freshness";
import { ScreenGate } from "@/components/dash/screen-gate";
import { PageHeader } from "@/components/dash/page-header";
import { Panel } from "@/components/dash/panel";
import { StatRow, StatTile } from "@/components/dash/stat-tile";
import { Funnel } from "@/components/dash/funnel";
import { fmtN, fmtPct, safeDiv } from "@/lib/format";

const LABELS = ["Signed up", "Started onboarding", "Finished onboarding", "Uploaded a resume", "Paid"];
const HINTS = ["Created an account in this range", "Opened the onboarding flow", "Completed onboarding", "Uploaded a first resume", "Made a payment"];

export default function InsightsPage() {
  const { rangeLabel } = useDashboard();
  const api = useScreen("insights");
  useReportFreshness(api);
  const f = api.data?.funnel;
  const steps = f ? LABELS.map((label, i) => ({ label, value: f[i] ?? 0, hint: HINTS[i] })) : [];
  const top = f?.[0] ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Funnel"
        title={`Where signups drop off · ${rangeLabel}`}
        description="People who signed up in this range, followed for up to 14 days through each step in order."
      />
      <ScreenGate loading={api.loading} error={api.error} hasData={!!f} onRetry={() => api.refetch(false)}>
        {f ? (
          <div className="space-y-4">
            <StatRow cols={4}>
              <StatTile label="Signed up" icon={<UserPlus className="h-3.5 w-3.5" />} value={f[0]} accent="blue" />
              <StatTile label="Finished onboarding" icon={<Flag className="h-3.5 w-3.5" />} value={safeDiv(f[2], top) * 100} format={(n) => fmtPct(n, 1)} accent="violet" subtitle={`${fmtN(f[2])} people`} />
              <StatTile label="Uploaded a resume" icon={<FileUp className="h-3.5 w-3.5" />} value={safeDiv(f[3], top) * 100} format={(n) => fmtPct(n, 1)} accent="amber" subtitle={`${fmtN(f[3])} people`} />
              <StatTile label="Paid" icon={<Wallet className="h-3.5 w-3.5" />} value={safeDiv(f[4], top) * 100} format={(n) => fmtPct(n, 2)} accent="green" subtitle={`${fmtN(f[4])} people`} />
            </StatRow>
            <Panel title="Signup funnel" subtitle="Bars are sized against signups. The line between steps shows how many continue.">
              <Funnel steps={steps} />
            </Panel>
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Signup counts here come from tracked signup events, so they run a little below the account totals on the Overview.
            </p>
          </div>
        ) : null}
      </ScreenGate>
    </>
  );
}
