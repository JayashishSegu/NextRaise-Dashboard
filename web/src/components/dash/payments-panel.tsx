"use client";

import { useState } from "react";
import { Lock, Plus, Trash2, WalletCards } from "lucide-react";
import type { ApiError } from "@/lib/use-api";
import type { PaymentsData } from "@/lib/types";
import { Panel } from "@/components/dash/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { dayLabel, fmtINR, fmtN } from "@/lib/format";
import { cn } from "@/lib/utils";

const todayIst = () => new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);

async function call(method: "POST" | "DELETE", url: string, body?: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.ok) return { ok: true };
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: j.error || `Request failed (${res.status})` };
  } catch {
    return { ok: false, error: "Network error. Try again." };
  }
}

/**
 * Creator payments for the selected range: the list, a running total, and a form
 * to log a new payment. Payments are typed in by hand (no system records them),
 * so the empty and unavailable states say exactly what is missing.
 */
export function PaymentsPanel({
  data, error, loading, rangeLabel, creatorNames, onChanged,
}: {
  data: PaymentsData | null;
  error: ApiError | null;
  loading: boolean;
  rangeLabel: string;
  creatorNames: string[];
  onChanged: () => void;
}) {
  const [creator, setCreator] = useState("");
  const [code, setCode] = useState("");
  const [date, setDate] = useState(todayIst);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const title = "Influencer payments";

  if (!data && loading) {
    return (
      <Panel title={title}>
        <Skeleton className="h-24 w-full" />
      </Panel>
    );
  }
  if (!data && error) {
    const locked = error.code === "locked" || error.code === "gate" || error.code === "gate-unset";
    return (
      <Panel title={title} subtitle={rangeLabel}>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] text-muted-foreground"><Lock className="h-4 w-4" /></span>
          <p className="max-w-sm text-sm text-muted-foreground">
            {locked ? "Creator payments are money data, so they open only after you unlock." : error.message}
          </p>
          {error.code === "locked" ? (
            <a href="/unlock?next=%2Freport" className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">Unlock</a>
          ) : null}
        </div>
      </Panel>
    );
  }
  if (!data) return null;

  const connected = data.kv;
  const valid = connected && creator.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number(amount) > 0;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setMsg(null);
    const r = await call("POST", "/api/influencer-payments", { creator, code, date, amount: Number(amount), note });
    setBusy(false);
    if (!r.ok) return setMsg({ tone: "err", text: r.error ?? "Could not save" });
    const inRange = !!data && date >= data.window.start && date < data.window.end;
    setMsg({ tone: "ok", text: inRange ? "Payment saved." : `Saved, but ${dayLabel(date)} is outside ${rangeLabel}, so it will not show here.` });
    setAmount("");
    setNote("");
    onChanged();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this payment?")) return;
    const r = await call("DELETE", `/api/influencer-payments?id=${encodeURIComponent(id)}`);
    if (!r.ok) return setMsg({ tone: "err", text: r.error ?? "Could not delete" });
    setMsg(null);
    onChanged();
  }

  return (
    <Panel
      title={title}
      subtitle={`${rangeLabel} · ${fmtN(data.entries.length)} payment${data.entries.length === 1 ? "" : "s"} · ${fmtINR(data.total)}`}
      padded={false}
    >
      {!connected ? (
        <div className="mx-5 mb-5 flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-xs text-amber-200">
          <WalletCards className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Payments cannot be saved yet: the Redis store that holds them is not connected to this project. Once it is, this list and the
            tiles above fill in.
          </span>
        </div>
      ) : data.entries.length === 0 ? (
        <p className="px-5 pb-4 text-sm text-muted-foreground">Nothing logged for {rangeLabel.toLowerCase()}. Add the first payment below.</p>
      ) : (
        <div className="overflow-x-auto px-5 pb-4">
          <table className="w-full min-w-[460px] text-[13px] tabular">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Creator</th>
                <th className="pb-2 font-medium">Note</th>
                <th className="pb-2 text-right font-medium">Amount</th>
                <th className="w-8 pb-2" />
              </tr>
            </thead>
            <tbody>
              {data.entries.map((p) => (
                <tr key={p.id} className="border-t border-white/[0.05]">
                  <td className="py-2.5 text-muted-foreground">{dayLabel(p.date)}</td>
                  <td className="py-2.5">
                    <div className="text-foreground">{p.creator}</div>
                    {p.code ? <div className="text-[11px] text-muted-foreground">{p.code}</div> : null}
                  </td>
                  <td className="max-w-[16rem] truncate py-2.5 text-muted-foreground">{p.note || ""}</td>
                  <td className="py-2.5 text-right font-medium text-foreground">{fmtINR(p.amount)}</td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button" onClick={() => remove(p.id)} aria-label={`Delete payment to ${p.creator}`}
                      className="rounded-md p-1 text-muted-foreground outline-none hover:bg-white/[0.06] hover:text-rose-300 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={add} className="border-t border-white/[0.06] px-5 pb-5 pt-4">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Log a payment</div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
          <input
            list="payment-creators" value={creator} onChange={(e) => setCreator(e.target.value)} placeholder="Creator" aria-label="Creator" disabled={!connected}
            className="col-span-2 h-9 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary disabled:opacity-50 md:col-span-2"
          />
          <datalist id="payment-creators">{creatorNames.map((n) => <option key={n} value={n} />)}</datalist>
          <input
            value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code (optional)" aria-label="Referral code" disabled={!connected}
            className="h-9 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary disabled:opacity-50"
          />
          <input
            type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Payment date" disabled={!connected}
            className="h-9 min-w-0 rounded-lg border border-white/10 bg-white/[0.04] px-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-50 [color-scheme:dark]"
          />
          <input
            type="number" inputMode="decimal" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount ₹" aria-label="Amount in rupees" disabled={!connected}
            className="h-9 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary disabled:opacity-50"
          />
          <button
            type="submit" disabled={!valid || busy}
            className="col-span-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-40 md:col-span-1"
          >
            <Plus className="h-4 w-4" /> {busy ? "Saving" : "Add"}
          </button>
        </div>
        <input
          value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional), e.g. reel fee or 30% commission" aria-label="Note" disabled={!connected} maxLength={200}
          className="mt-2 h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary disabled:opacity-50"
        />
        {msg ? (
          <p role={msg.tone === "err" ? "alert" : "status"} className={cn("mt-2 text-xs", msg.tone === "err" ? "text-rose-300" : "text-emerald-400")}>{msg.text}</p>
        ) : null}
      </form>
    </Panel>
  );
}
