"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { MetalFx } from "metal-fx";

function UnlockForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const next = sp.get("next");
  const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/unlock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
      if (res.ok) {
        router.replace(dest);
        router.refresh();
        return;
      }
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? "Could not unlock");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-card p-6 shadow-2xl shadow-black/50">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-muted-foreground"><Lock className="h-5 w-5" /></div>
      <h1 className="mt-4 text-lg font-semibold tracking-tight text-foreground">Personal data is locked</h1>
      <p className="mt-1 text-sm text-muted-foreground">Account search and Pro users show emails and phone numbers. Enter the access code to open them.</p>
      <label htmlFor="code" className="mt-5 block text-xs font-medium text-muted-foreground">Access code</label>
      <input
        id="code" type="password" autoComplete="current-password" autoFocus value={code} onChange={(e) => setCode(e.target.value)}
        className="mt-1.5 h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-foreground outline-none focus:border-primary"
      />
      {error ? <p role="alert" className="mt-2 text-xs text-rose-300">{error}</p> : null}
      <MetalFx preset="chromatic" strength={1} className="mt-4 block w-full">
        <button type="submit" disabled={busy || !code} className="h-10 w-full rounded-lg text-sm font-semibold text-foreground transition-opacity disabled:opacity-50">
        {busy ? "Checking" : "Unlock"}
      </button>
      </MetalFx>
    </form>
  );
}

export default function UnlockPage() {
  return (
    <main className="nr-ambient flex min-h-dvh items-center justify-center bg-background px-4">
      <Suspense fallback={null}>
        <UnlockForm />
      </Suspense>
    </main>
  );
}
