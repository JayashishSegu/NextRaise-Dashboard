"use client";

import { usePathname } from "next/navigation";
import { Command as CommandIcon, RefreshCw } from "lucide-react";
import { navForPath } from "@/lib/nav";
import { timeAgo } from "@/lib/format";
import { useFreshness, useNow } from "@/components/dash/freshness";
import { RangeMenu } from "@/components/dash/range-menu";
import { ViewToggle } from "@/components/dash/view-toggle";
import { cn } from "@/lib/utils";

export function Topbar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const pathname = usePathname();
  const item = navForPath(pathname);
  const { ts, refreshing, error, refetch } = useFreshness();
  const now = useNow();
  const ageMin = ts ? (now - ts) / 60000 : null;
  const tone = error ? "bg-amber-400" : refreshing ? "bg-primary animate-pulse" : ageMin != null && ageMin < 10 ? "bg-emerald-400" : "bg-amber-400";
  const label = error && !ts ? "Could not load" : refreshing && !ts ? "Loading" : `Updated ${timeAgo(ts, now)}`;

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:px-8">
        <div className="mr-auto flex min-w-0 items-center gap-2.5">
          <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate text-sm font-semibold tracking-tight text-foreground">{item.label}</span>
          <span className="hidden truncate text-xs text-muted-foreground lg:inline">{item.description}</span>
        </div>

        {item.view ? <ViewToggle /> : null}
        {item.range ? <RangeMenu /> : null}

        <button
          type="button"
          onClick={() => refetch?.(true)}
          disabled={!refetch || refreshing}
          title={error ? error.message : "Refresh now"}
          className="flex h-8 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-foreground outline-none transition-colors hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", tone)} aria-hidden />
          <span className="tabular">{label}</span>
          <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground", refreshing && "animate-spin")} aria-hidden />
        </button>

        <button
          type="button"
          onClick={onOpenPalette}
          aria-label="Open command palette"
          className="hidden h-8 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 text-xs text-muted-foreground outline-none transition-colors hover:bg-white/[0.06] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:flex"
        >
          <CommandIcon className="h-3.5 w-3.5" aria-hidden />
          <kbd className="font-sans text-[11px]">K</kbd>
        </button>
      </div>
    </header>
  );
}
