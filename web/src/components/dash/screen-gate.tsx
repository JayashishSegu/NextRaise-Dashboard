"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, Lock, RefreshCw, TimerReset } from "lucide-react";
import type { ApiError } from "@/lib/use-api";
import { Skeleton } from "@/components/ui/skeleton";
import { ThinkingOrb } from "thinking-orbs";
import { BorderBeam } from "border-beam";

export function PanelSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-card p-5">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-4 w-full" style={{ height }} />
    </div>
  );
}

/** First load of a screen: a searching orb and a plain-words note, which gets more candid if it takes a while. */
function LoadingBanner() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(id);
  }, []);
  return (
    <BorderBeam size="pulse-inner" colorVariant="mono" theme="dark" className="mb-4 rounded-2xl">
      <div role="status" className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 py-4">
        <ThinkingOrb state="searching" size={64} theme="dark" color="#a9bcff" aria-hidden />
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground">{slow ? "Still crunching the numbers" : "Loading the numbers"}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {slow ? "The first load of a range can take around 10 seconds. After that it is saved and opens instantly." : "Pulling the latest from the database."}
          </div>
        </div>
      </div>
    </BorderBeam>
  );
}

export function DefaultSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/[0.07] bg-card p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-7 w-28" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>
      <PanelSkeleton height={280} />
      <div className="grid gap-4 lg:grid-cols-2">
        <PanelSkeleton height={180} />
        <PanelSkeleton height={180} />
      </div>
    </div>
  );
}

function Notice({ icon, title, body, action }: { icon: ReactNode; title: string; body: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-white/[0.07] bg-card px-6 py-14 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.05] text-muted-foreground">{icon}</div>
      <h2 className="mt-4 text-base font-semibold text-foreground">{title}</h2>
      <div className="mt-1.5 max-w-md text-sm text-muted-foreground">{body}</div>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function LockedNotice({ code }: { code?: string }) {
  return (
    <Notice
      icon={<Lock className="h-5 w-5" />}
      title={code === "gate-unset" ? "Personal data is locked" : "Access key rejected"}
      body={
        code === "gate-unset" ? (
          <>
            This screen shows emails and phone numbers, so the production API only serves it once a gate key is set on that
            deployment. Set <code className="rounded bg-white/5 px-1 py-0.5 text-foreground">NR_GATE_KEY</code> and{" "}
            <code className="rounded bg-white/5 px-1 py-0.5 text-foreground">NR_ACCESS_CODE</code> on the Vercel project and redeploy.
          </>
        ) : (
          "The access code or gate key was rejected."
        )
      }
    />
  );
}

export function ScreenGate({
  loading,
  error,
  hasData,
  onRetry,
  skeleton,
  children,
}: {
  loading: boolean;
  error: ApiError | null;
  hasData: boolean;
  onRetry: () => void;
  skeleton?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  if (!hasData && loading) return <><LoadingBanner />{skeleton ?? <DefaultSkeleton />}</>;
  if (!hasData && error) {
    if (error.code === "gate-unset" || error.code === "gate") return <LockedNotice code={error.code} />;
    if (error.code === "locked") {
      return (
        <Notice
          icon={<Lock className="h-5 w-5" />}
          title="Unlock to continue"
          body="Your unlock expired. Enter the access code again to see personal data."
          action={<a href={`/unlock?next=${encodeURIComponent(pathname)}`} className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">Unlock</a>}
        />
      );
    }
    const budget = error.code === "budget";
    return (
      <Notice
        icon={budget ? <TimerReset className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
        title={budget ? "PostHog read budget is used up" : "This screen could not load"}
        body={
          budget
            ? `PostHog allows a fixed amount of reads per hour. It refills continuously${error.retryAfter ? `; try again in about ${Math.max(1, Math.round(error.retryAfter / 60))} min` : ""}.`
            : error.message
        }
        action={
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        }
      />
    );
  }
  return (
    <>
      {error ? (
        <div role="status" className="mb-4 flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-2.5 text-xs text-amber-200">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Showing the last snapshot. The refresh failed: {error.message}
        </div>
      ) : null}
      {children}
    </>
  );
}
