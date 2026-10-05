"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { RANGES, useDashboard } from "@/lib/dashboard-state";
import { cn } from "@/lib/utils";

export function RangeMenu({ className }: { className?: string }) {
  const { range, rangeLabel, from, to, setRange, setCustomRange } = useDashboard();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(from ?? "");
  const [t, setT] = useState(to ?? "");
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (key: string) => {
    setRange(key);
    setOpen(false);
  };
  const validCustom = /^\d{4}-\d{2}-\d{2}$/.test(f) && /^\d{4}-\d{2}-\d{2}$/.test(t) && f <= t;

  return (
    <div ref={root} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-foreground outline-none transition-colors hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="max-w-[9rem] truncate">{rangeLabel}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div
          role="listbox"
          aria-label="Date range"
          className="absolute left-0 z-50 mt-2 w-60 max-w-[calc(100vw-2rem)] rounded-xl sm:left-auto sm:right-0 border border-white/10 bg-popover p-1.5 shadow-2xl shadow-black/60"
        >
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              role="option"
              aria-selected={range === r.key}
              onClick={() => pick(r.key)}
              className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[13px] text-foreground outline-none hover:bg-white/[0.06] focus-visible:bg-white/[0.06]"
            >
              {r.label}
              {range === r.key ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
            </button>
          ))}
          <div className="mt-1 border-t border-white/[0.07] px-2.5 pb-1.5 pt-2.5">
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Custom range</div>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={f}
                onChange={(e) => setF(e.target.value)}
                aria-label="From date"
                className="h-8 min-w-0 flex-1 rounded-md border border-white/10 bg-white/[0.04] px-2 text-xs text-foreground outline-none focus:border-primary [color-scheme:dark]"
              />
              <input
                type="date"
                value={t}
                onChange={(e) => setT(e.target.value)}
                aria-label="To date"
                className="h-8 min-w-0 flex-1 rounded-md border border-white/10 bg-white/[0.04] px-2 text-xs text-foreground outline-none focus:border-primary [color-scheme:dark]"
              />
            </div>
            <button
              type="button"
              disabled={!validCustom}
              onClick={() => {
                setCustomRange(f, t);
                setOpen(false);
              }}
              className="mt-2 h-8 w-full rounded-md bg-primary text-xs font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
            >
              Apply range
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
