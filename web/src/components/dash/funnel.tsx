import { fmtN, fmtPct, safeDiv } from "@/lib/format";
import { cn } from "@/lib/utils";

export type FunnelStep = { label: string; value: number; hint?: string };

/** Step bars sized against the first step, with the step-to-step conversion between them. */
export function Funnel({ steps, accent = "#6e8cff", finalAccent = "#2fb57a" }: { steps: FunnelStep[]; accent?: string; finalAccent?: string }) {
  const top = Math.max(1, steps[0]?.value ?? 1);
  // Biggest relative drop between neighbours, so it can be called out.
  let worst = -1;
  let worstLoss = -1;
  for (let i = 1; i < steps.length; i++) {
    const loss = 1 - safeDiv(steps[i].value, steps[i - 1].value);
    if (steps[i - 1].value > 0 && loss > worstLoss) {
      worstLoss = loss;
      worst = i;
    }
  }
  return (
    <ol className="space-y-2.5">
      {steps.map((s, i) => {
        const w = Math.max(0.8, (s.value / top) * 100);
        const last = i === steps.length - 1;
        const stepConv = i > 0 ? safeDiv(s.value, steps[i - 1].value) * 100 : null;
        return (
          <li key={s.label}>
            {i > 0 ? (
              <div className="mb-1.5 flex items-center gap-2 pl-1 text-[11px] text-muted-foreground tabular">
                <span className={cn("h-px w-3 bg-white/15")} />
                {fmtPct(stepConv, 1)} continue
                {i === worst ? <span className="rounded-full bg-rose-500/10 px-1.5 py-0.5 font-medium text-rose-300">biggest drop</span> : null}
              </div>
            ) : null}
            <div className="flex items-center gap-3">
              <div className="w-36 shrink-0 text-[13px] font-medium text-foreground sm:w-44">
                {s.label}
                {s.hint ? <div className="text-[11px] font-normal text-muted-foreground">{s.hint}</div> : null}
              </div>
              <div className="relative h-8 flex-1 overflow-hidden rounded-lg bg-white/[0.04]">
                <div
                  className="h-full rounded-lg transition-[width] duration-700 ease-out"
                  style={{ width: `${w}%`, background: `linear-gradient(90deg, ${last ? finalAccent : accent}cc, ${last ? finalAccent : accent})` }}
                />
              </div>
              <div className="w-24 shrink-0 text-right text-[13px] tabular">
                <span className="font-semibold text-foreground">{fmtN(s.value)}</span>
                <span className="ml-1.5 text-xs text-muted-foreground">{fmtPct(safeDiv(s.value, top) * 100, s.value / top < 0.1 ? 1 : 0)}</span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
