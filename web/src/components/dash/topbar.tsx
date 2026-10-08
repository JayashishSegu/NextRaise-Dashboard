"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, Check, Command as CommandIcon, Info, RefreshCw, X } from "lucide-react";
import { navForPath } from "@/lib/nav";
import { timeAgo } from "@/lib/format";
import { useFreshness, useNow } from "@/components/dash/freshness";
import { RangeMenu } from "@/components/dash/range-menu";
import { ViewToggle } from "@/components/dash/view-toggle";
import { ThinkingOrb } from "@/components/ui/thinking-orbs";
import { cn } from "@/lib/utils";

export function Topbar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const pathname = usePathname();
  const item = navForPath(pathname);
  const { ts, refreshing, error, notice, refetch } = useFreshness();
  const [dismissed, setDismissed] = useState<number | null>(null);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setDismissed(notice.id), notice.tone === "warn" ? 14000 : 7000);
    return () => clearTimeout(id);
  }, [notice]);
  const showNotice = notice && dismissed !== notice.id ? notice : null;
  const now = useNow();
  const ageMin = ts ? (now - ts) / 60000 : null;
  const tone = error ? "bg-amber-400" : refreshing ? "bg-primary animate-pulse" : ageMin != null && ageMin < 10 ? "bg-emerald-400" : "bg-amber-400";
  const label = error && !ts ? "Could not load" : refreshing && !ts ? "Loading" : `Updated ${timeAgo(ts, now)}`;

  return (
    <>
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
          {refreshing ? (
            <ThinkingOrb state="working" size={20} theme="dark" color="#a9bcff" aria-label="Loading" />
          ) : (
            <span className={cn("h-1.5 w-1.5 rounded-full", tone)} aria-hidden />
          )}
          <span className="tabular">{label}</span>
          {refreshing ? null : <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />}
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
    {showNotice ? (
      <div
        role="status" aria-live="polite"
        className={cn(
          "fixed bottom-5 left-1/2 z-50 flex w-[min(92vw,34rem)] -translate-x-1/2 items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-2xl shadow-black/70 backdrop-blur-xl",
          showNotice.tone === "warn" ? "border-amber-400/30 bg-amber-950/80 text-amber-100"
            : showNotice.tone === "info" ? "border-white/15 bg-zinc-900/90 text-foreground"
            : "border-emerald-400/25 bg-emerald-950/80 text-emerald-100",
        )}
      >
        {showNotice.tone === "warn" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          : showNotice.tone === "info" ? <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          : <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
        <span className="min-w-0 flex-1">{showNotice.text}</span>
        <button type="button" onClick={() => setDismissed(showNotice.id)} aria-label="Dismiss" className="-mr-1 rounded p-0.5 opacity-70 outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring">
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    ) : null}
    </>
  );
}
