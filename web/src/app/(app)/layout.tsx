import { Suspense } from "react";
import { AppShell } from "@/components/dash/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="h-dvh bg-background" />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
