"use client";

import { motion } from "framer-motion";
import { VIEWS, useDashboard } from "@/lib/dashboard-state";
import { cn } from "@/lib/utils";

export function ViewToggle({ className }: { className?: string }) {
  const { view, setView } = useDashboard();
  return (
    <div
      role="radiogroup"
      aria-label="Attribution view"
      className={cn("relative inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5", className)}
    >
      {VIEWS.map((v) => {
        const active = view === v.key;
        return (
          <button
            key={v.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setView(v.key)}
            className={cn(
              "relative rounded-md px-3 py-1.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active ? (
              <motion.span
                layoutId="view-pill"
                className="absolute inset-0 rounded-md bg-white/[0.09] shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            ) : null}
            <span className="relative">{v.label}</span>
          </button>
        );
      })}
    </div>
  );
}
