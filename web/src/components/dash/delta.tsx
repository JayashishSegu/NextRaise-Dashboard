import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Change pill. `invert` flips colours for metrics where up is bad (spend, churn). */
export function Delta({
  pct,
  invert = false,
  className,
  suffix,
}: {
  pct: number | null | undefined;
  invert?: boolean;
  className?: string;
  suffix?: string;
}) {
  if (pct == null || !isFinite(pct)) {
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-medium text-muted-foreground", className)}>
        <Minus className="h-3 w-3" />
        {suffix ?? "n/a"}
      </span>
    );
  }
  const up = pct >= 0;
  const good = invert ? !up : up;
  return (
    <span
      className={cn(
        "tabular inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        good ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400",
        className,
      )}
    >
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {(up ? "+" : "") + pct.toFixed(Math.abs(pct) >= 100 ? 0 : 1)}%{suffix ? ` ${suffix}` : ""}
    </span>
  );
}
