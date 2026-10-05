import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BarItem = { key?: string; label: ReactNode; value: number; display?: ReactNode; sub?: ReactNode; color?: string };

/** Ranked horizontal bars: label, value and an optional secondary line. */
export function BarList({ items, color = "#6e8cff", empty = "Nothing to show yet", className }: {
  items: BarItem[];
  color?: string;
  empty?: ReactNode;
  className?: string;
}) {
  if (!items.length) return <div className="py-6 text-center text-sm text-muted-foreground">{empty}</div>;
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className={cn("space-y-3.5", className)}>
      {items.map((i, idx) => (
        <li key={i.key ?? idx}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="min-w-0 truncate font-medium text-foreground">{i.label}</span>
            <span className="shrink-0 tabular text-foreground">
              {i.display ?? i.value.toLocaleString("en-IN")}
              {i.sub ? <span className="ml-2 text-xs text-muted-foreground">{i.sub}</span> : null}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{ width: `${Math.max(1.5, (i.value / max) * 100)}%`, background: i.color ?? color }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
