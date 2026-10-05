"use client";

import type { ReactNode } from "react";
import { Sparkline, SparklineChart } from "@/components/ui/sparkline";
import { AnimatedNumber } from "@/components/dash/animated-number";
import { Delta } from "@/components/dash/delta";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtN } from "@/lib/format";
import { cn } from "@/lib/utils";

export const ACCENT = {
  blue: "#6e8cff",
  green: "#2fb57a",
  amber: "#f5c451",
  violet: "#a78bfa",
  rose: "#ff8ca6",
  slate: "#8b93a7",
} as const;
export type Accent = keyof typeof ACCENT;

export function StatTile({
  label,
  value,
  format = fmtN,
  subtitle,
  deltaPct,
  deltaSuffix,
  invertDelta,
  series,
  accent = "blue",
  icon,
  onClick,
  className,
}: {
  label: string;
  value: number;
  format?: (n: number) => string;
  subtitle?: ReactNode;
  deltaPct?: number | null;
  deltaSuffix?: string;
  invertDelta?: boolean;
  series?: number[];
  accent?: Accent;
  icon?: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "group relative flex min-w-0 flex-col rounded-2xl border border-white/[0.07] bg-card p-4 text-left shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] transition-colors",
        onClick && "cursor-pointer outline-none hover:border-white/[0.14] focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          {icon ? <span style={{ color: ACCENT[accent] }}>{icon}</span> : null}
          <span className="truncate">{label}</span>
        </div>
      </div>
      <div className="mt-2.5 text-[28px] font-semibold leading-none tracking-tight text-foreground tabular">
        <AnimatedNumber value={value} format={format} />
      </div>
      {deltaPct !== undefined || subtitle ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground tabular">
          {deltaPct !== undefined ? <Delta pct={deltaPct} invert={invertDelta} suffix={deltaSuffix} /> : null}
          {subtitle ? <span className="min-w-0 truncate">{subtitle}</span> : null}
        </div>
      ) : null}
      {series && series.length > 1 ? (
        <div className="mt-3 h-9">
          <Sparkline data={series} color={ACCENT[accent]} className="h-full w-full">
            <SparklineChart />
          </Sparkline>
        </div>
      ) : null}
    </Tag>
  );
}

export function StatRow({ children, cols = 5 }: { children: ReactNode; cols?: 3 | 4 | 5 | 6 }) {
  const grid = { 3: "xl:grid-cols-3", 4: "xl:grid-cols-4", 5: "xl:grid-cols-5", 6: "xl:grid-cols-6" }[cols];
  return <div className={cn("grid grid-cols-2 gap-3 max-md:[&>*:last-child:nth-child(odd)]:col-span-2 md:grid-cols-3", grid)}>{children}</div>;
}

export function StatRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/[0.07] bg-card p-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-7 w-28" />
          <Skeleton className="mt-2 h-3 w-24" />
        </div>
      ))}
    </div>
  );
}
