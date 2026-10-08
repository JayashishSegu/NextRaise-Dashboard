"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ExternalLink, Eye, RefreshCw } from "lucide-react";
import { CommandDialog, type CommandGroup } from "@/components/ui/command";
import { NAV, NAV_GROUPS } from "@/lib/nav";
import { RANGES, VIEWS, useDashboard } from "@/lib/dashboard-state";
import { useFreshness } from "@/components/dash/freshness";

export function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const { hrefFor, setRange, setView } = useDashboard();
  const { refetch } = useFreshness();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const groups = useMemo<CommandGroup[]>(
    () => [
      ...NAV_GROUPS.map((g) => ({
        heading: g,
        items: NAV.filter((n) => n.group === g).map((n) => ({
          id: `go-${n.id}`,
          label: n.label,
          description: n.description,
          icon: <n.icon className="h-4 w-4" />,
          keywords: ["go", "open", n.id],
          onSelect: () => router.push(hrefFor(n)),
        })),
      })),
      {
        heading: "Date range",
        items: RANGES.map((r) => ({
          id: `range-${r.key}`,
          label: r.label,
          icon: <CalendarDays className="h-4 w-4" />,
          keywords: ["range", "date", "period"],
          onSelect: () => setRange(r.key),
        })),
      },
      {
        heading: "Attribution view",
        items: VIEWS.map((v) => ({
          id: `view-${v.key}`,
          label: v.label,
          icon: <Eye className="h-4 w-4" />,
          keywords: ["view", "bucket", "attribution"],
          onSelect: () => setView(v.key),
        })),
      },
      {
        heading: "Actions",
        items: [
          {
            id: "refresh",
            label: "Refresh data",
            icon: <RefreshCw className="h-4 w-4" />,
            keywords: ["reload", "update"],
            onSelect: () => refetch?.(true),
          },
        ],
      },
    ],
    [router, hrefFor, setRange, setView, refetch],
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      groups={groups}
      placeholder="Jump to a screen, change range or view..."
      emptyMessage="Nothing matches that."
      filter
    />
  );
}
