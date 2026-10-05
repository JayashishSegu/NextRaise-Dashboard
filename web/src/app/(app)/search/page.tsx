"use client";

import { useEffect, useState } from "react";
import { Gift, Phone, Search as SearchIcon, UserRound } from "lucide-react";
import { useOps } from "@/lib/use-api";
import type { SearchAccount, SearchData } from "@/lib/types";
import { useReportFreshness } from "@/components/dash/freshness";
import { ScreenGate } from "@/components/dash/screen-gate";
import { PageHeader } from "@/components/dash/page-header";
import { Panel } from "@/components/dash/panel";
import { CopyButton } from "@/components/dash/copy-button";
import { planLabel } from "@/lib/channels";
import { dateIst, fmtINR, fmtN, fmtUsd } from "@/lib/format";
import { initials } from "@/lib/mask";
import { cn } from "@/lib/utils";

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

const payTone = (s: string | null) => (s === "completed" ? "text-emerald-400" : s === "failed" ? "text-rose-300" : "text-amber-300");

export default function SearchPage() {
  const [q, setQ] = useState("");
  const dq = useDebounced(q.trim(), 350);
  const ready = dq.length >= 2;
  const api = useOps<SearchData>("search", { q: dq }, ready);
  useReportFreshness(api);

  return (
    <>
      <PageHeader eyebrow="People" title="Find an account" description="Search by email or name. Matches the login email, the account name, and names on uploaded resumes." />
      <div className="relative mb-5 max-w-xl">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          id="account-search" type="search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="name@gmail.com or a name" aria-label="Search accounts"
          className="h-11 w-full rounded-xl border border-white/10 bg-card pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
        />
      </div>

      {!ready ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center text-sm text-muted-foreground">Type at least two characters to search.</div>
      ) : (
        <ScreenGate loading={api.loading} error={api.error} hasData={!!api.data} onRetry={() => api.refetch(false)} skeleton={<div className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" />}>
          {api.data && api.data.q === dq.toLowerCase().replace(/\s+/g, " ") ? (
            api.data.accounts.length ? (
              <div className="space-y-4">{api.data.accounts.map((a) => <Account key={a.id} a={a} />)}</div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center text-sm text-muted-foreground">No account matches &ldquo;{dq}&rdquo;.</div>
            )
          ) : (
            <div className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" />
          )}
        </ScreenGate>
      )}
    </>
  );
}

function Account({ a }: { a: SearchAccount }) {
  const isPro = (a.plan ?? "").toLowerCase().includes("pro");
  return (
    <Panel padded={false}>
      <div className="flex flex-wrap items-center gap-3 px-5 pt-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-sm font-semibold text-muted-foreground">{initials(a.name || a.email)}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-semibold text-foreground">{a.name || "No name"}</h2>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", isPro ? "bg-violet-400/10 text-violet-300" : "bg-white/[0.06] text-muted-foreground")}>{planLabel(a.plan)}</span>
            {a.status && a.status !== "active" ? <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[11px] font-semibold capitalize text-amber-300">{a.status}</span> : null}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">{a.email}<CopyButton text={a.email} label="Copy email" /></div>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 px-5 text-sm sm:grid-cols-4">
        <Fact label="Signed up" value={dateIst(a.createdAt)} />
        <Fact label="Subscription ends" value={a.subEnd ? dateIst(a.subEnd) : "n/a"} />
        <Fact label="Paid" value={a.paid.count ? `${a.paid.inr ? fmtINR(a.paid.inr) : ""}${a.paid.inr && a.paid.usd ? " + " : ""}${a.paid.usd ? fmtUsd(a.paid.usd) : ""}` : "nothing yet"} sub={a.paid.count ? `${fmtN(a.paid.count)} payment${a.paid.count === 1 ? "" : "s"}, last ${dateIst(a.paid.last)}` : undefined} />
        <Fact label="Referral code" value={a.referralCode ?? "n/a"} />
      </dl>

      {a.referredBy ? (
        <div className="mx-5 mt-4 flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2 text-xs text-muted-foreground">
          <Gift className="h-3.5 w-3.5 shrink-0 text-violet-300" />
          Referred by <span className="font-medium text-foreground">{a.referredBy.name || a.referredBy.email || "an unknown account"}</span>
          {a.referredBy.code ? <span>({a.referredBy.code})</span> : null}
        </div>
      ) : null}

      {a.resumes.length ? (
        <div className="mt-4 border-t border-white/[0.06] px-5 py-4">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Resumes ({a.resumes.length})</div>
          <ul className="space-y-1.5">
            {a.resumes.map((r, i) => (
              <li key={i} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="inline-flex items-center gap-1.5 text-foreground"><UserRound className="h-3.5 w-3.5 text-muted-foreground" />{r.name || "Untitled"}</span>
                {r.phone ? <span className="inline-flex items-center gap-1 text-muted-foreground tabular"><Phone className="h-3.5 w-3.5" />{r.phone}<CopyButton text={r.phone} label="Copy phone" /></span> : null}
                {r.email ? <span className="text-xs text-muted-foreground">{r.email}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {a.payments.length ? (
        <div className="overflow-x-auto border-t border-white/[0.06] px-5 py-4">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Payment history</div>
          <table className="w-full min-w-[420px] text-[13px] tabular">
            <tbody>
              {a.payments.map((p, i) => (
                <tr key={i} className="border-t border-white/[0.04] first:border-0">
                  <td className="py-1.5 text-foreground">{planLabel(p.plan)}</td>
                  <td className="py-1.5 text-muted-foreground">{dateIst(p.at)}</td>
                  <td className="py-1.5 text-muted-foreground">{p.provider ?? ""}</td>
                  <td className={cn("py-1.5 capitalize", payTone(p.status))}>{p.status}</td>
                  <td className="py-1.5 text-right font-medium text-foreground">{p.currency === "USD" ? fmtUsd(p.amount) : fmtINR(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Panel>
  );
}

function Fact({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate font-medium text-foreground">{value}</dd>
      {sub ? <div className="text-[11px] text-muted-foreground">{sub}</div> : null}
    </div>
  );
}
