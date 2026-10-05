"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar, SidebarFooter, SidebarHeader, SidebarItem, SidebarNav, SidebarSection, SidebarToggle } from "@/components/ui/sidebar";
import { ExternalLink } from "lucide-react";
import { NAV, NAV_GROUPS, CLASSIC_URL, navForPath } from "@/lib/nav";
import { DashboardProvider, useDashboard } from "@/lib/dashboard-state";
import { FreshnessProvider } from "@/components/dash/freshness";
import { Topbar } from "@/components/dash/topbar";
import { CommandMenu } from "@/components/dash/command-menu";
import { cn } from "@/lib/utils";

const MARK =
  "M135.74 93.1967C135.74 111.376 135.345 126.295 134.95 126.295C134.456 126.295 133.566 123.924 132.875 121.058C129.516 106.436 116.869 89.2447 102.346 79.7599C95.0344 74.9187 83.376 70.4727 75.472 69.4847C73.002 69.1883 69.544 68.6943 67.8644 68.3979L64.604 67.9039L64.4064 84.0083L64.11 100.113L48.1044 100.409L32 100.607V120.367V140.127H48.302H64.604V120.268V100.31L69.3464 101.002C75.3732 101.792 84.858 106.436 90.5884 111.475C96.22 116.415 101.654 126.888 102.543 134.594L103.235 140.127H135.345H167.356L167.158 100.31L166.862 60.5927L151.35 60.2963L135.74 59.9999V93.1967Z";

function Logo() {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0065F4]">
      <svg viewBox="0 0 200 200" className="h-4 w-4 text-white" fill="currentColor" aria-hidden>
        <path d={MARK} />
      </svg>
    </span>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hrefFor } = useDashboard();
  const [palette, setPalette] = useState(false);
  const current = navForPath(pathname);

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <div className="hidden md:flex">
        <Sidebar variant="collapsible" width={236} aria-label="Primary" className="border-r border-white/[0.06] bg-[var(--sidebar)]">
          <SidebarHeader>
            <div className="flex items-center gap-2.5 px-1 py-1">
              <Logo />
              <div className="min-w-0">
                <div className="text-sm font-semibold tracking-tight">NextRaise</div>
                <div className="truncate text-[11px] text-muted-foreground">Analytics</div>
              </div>
              <div className="ml-auto">
                <SidebarToggle className="text-muted-foreground hover:text-foreground" />
              </div>
            </div>
          </SidebarHeader>
          <SidebarNav>
            {NAV_GROUPS.map((g) => (
              <SidebarSection key={g} label={g}>
                {NAV.filter((n) => n.group === g).map((n) => (
                  <SidebarItem
                    key={n.id}
                    icon={<n.icon className="h-4 w-4" />}
                    active={current.id === n.id}
                    onClick={() => router.push(hrefFor(n))}
                  >
                    {n.label}
                  </SidebarItem>
                ))}
              </SidebarSection>
            ))}
          </SidebarNav>
          <SidebarFooter>
            <SidebarItem icon={<ExternalLink className="h-4 w-4" />} onClick={() => window.open(CLASSIC_URL, "_blank", "noopener")}>
              Classic dashboard
            </SidebarItem>
          </SidebarFooter>
        </Sidebar>
      </div>

      <div className="nr-ambient flex min-w-0 flex-1 flex-col overflow-y-auto">
        <Topbar onOpenPalette={() => setPalette(true)} />

        <nav aria-label="Screens" className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-white/[0.06] px-4 py-2 md:hidden">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => router.push(hrefFor(n))}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                current.id === n.id ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-16 pt-6 sm:px-8 sm:pt-8">
          <div key={pathname} className="nr-enter">
            {children}
          </div>
        </main>
      </div>

      <CommandMenu open={palette} onOpenChange={setPalette} />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <DashboardProvider>
      <FreshnessProvider>
        <Shell>{children}</Shell>
      </FreshnessProvider>
    </DashboardProvider>
  );
}
