import type { ComponentType } from "react";
import { Monitor, MonitorSmartphone, Smartphone, Tablet } from "lucide-react";
import { Panel } from "@/components/dash/panel";
import type { DeviceKey, DeviceSplit } from "@/lib/derive";
import { fmtN, fmtPct, safeDiv } from "@/lib/format";

const DEVICE: Record<DeviceKey, { label: string; hint: string; color: string; Icon: ComponentType<{ className?: string }> }> = {
  mobile: { label: "Mobile", hint: "Phone only", color: "#a78bfa", Icon: Smartphone },
  desktop: { label: "Desktop", hint: "Laptop or PC only", color: "#38bdf8", Icon: Monitor },
  both: { label: "Both", hint: "Phone and computer", color: "#f5c451", Icon: MonitorSmartphone },
  tablet: { label: "Tablet", hint: "iPad and similar", color: "#2fb57a", Icon: Tablet },
};
const NO_PAGEVIEW = { label: "No page view seen", color: "#4a4a50" };

type Segment = { key: string; label: string; value: number; color: string };

function ShareBar({ title, total, segments }: { title: string; total: number; segments: Segment[] }) {
  const shown = segments.filter((s) => s.value > 0);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{title}</span>
        <span className="text-sm font-semibold text-foreground tabular">{fmtN(total)}</span>
      </div>
      <div
        role="img"
        aria-label={`${title}: ${shown.map((s) => `${s.label} ${fmtPct(safeDiv(s.value, total) * 100)}`).join(", ") || "none"}`}
        className="mt-2 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-white/[0.05]"
      >
        {shown.map((s) => (
          <div key={s.key} className="h-full transition-[width] duration-700" style={{ width: `${safeDiv(s.value, total) * 100}%`, background: s.color }} />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {shown.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.label} <span className="text-foreground tabular">{fmtPct(safeDiv(s.value, total) * 100, 0)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Visitors and signups split by the device people used during the selected range. */
export function DevicePanel({ split, rangeLabel }: { split: DeviceSplit | null; rangeLabel: string }) {
  return (
    <Panel title="Devices" subtitle={`Visitors and signups by phone or computer · ${rangeLabel}`}>
      {!split ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Device numbers appear after the next refresh.</p>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-5 lg:col-span-2">
              <ShareBar
                title="Visitors" total={split.visitors}
                segments={split.rows.map((r) => ({ key: r.key, label: DEVICE[r.key].label, value: r.visitors, color: DEVICE[r.key].color }))}
              />
              <ShareBar
                title="Signups" total={split.signups}
                segments={[
                  ...split.rows.map((r) => ({ key: r.key, label: DEVICE[r.key].label, value: r.signups, color: DEVICE[r.key].color })),
                  { key: "none", label: NO_PAGEVIEW.label, value: split.noPageview, color: NO_PAGEVIEW.color },
                ]}
              />
            </div>
            <div className="overflow-x-auto lg:col-span-3">
              <table className="w-full text-[13px] tabular">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 font-medium">Device</th>
                    <th className="pb-2 pl-3 text-right font-medium">Visitors</th>
                    <th className="pb-2 pl-3 text-right font-medium">Signups</th>
                    <th className="pb-2 pl-3 text-right font-medium">Signup rate</th>
                  </tr>
                </thead>
                <tbody>
                  {split.rows.map((r) => {
                    const { label, hint, color, Icon } = DEVICE[r.key];
                    return (
                      <tr key={r.key} className="border-t border-white/[0.05]">
                        <td className="py-2">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]" style={{ color }}>
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <div className="min-w-0">
                              <div className="text-foreground">{label}</div>
                              <div className="text-[11px] text-muted-foreground">{hint}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 pl-3 text-right text-foreground">{fmtN(r.visitors)}</td>
                        <td className="py-2 pl-3 text-right text-foreground">{fmtN(r.signups)}</td>
                        <td className="py-2 pl-3 text-right text-muted-foreground">{r.visitors ? fmtPct(safeDiv(r.signups, r.visitors) * 100) : "–"}</td>
                      </tr>
                    );
                  })}
                  {split.noPageview > 0 ? (
                    <tr className="border-t border-white/[0.05]">
                      <td className="py-2">
                        <div className="flex items-center gap-2.5">
                          <span className="h-7 w-7 shrink-0" />
                          <div>
                            <div className="text-muted-foreground">{NO_PAGEVIEW.label}</div>
                            <div className="text-[11px] text-muted-foreground">Signed up, no page view tracked</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 pl-3 text-right text-muted-foreground">–</td>
                      <td className="py-2 pl-3 text-right text-foreground">{fmtN(split.noPageview)}</td>
                      <td className="py-2 pl-3 text-right text-muted-foreground">–</td>
                    </tr>
                  ) : null}
                  <tr className="border-t border-white/[0.12] font-semibold">
                    <td className="py-2 text-foreground">Total</td>
                    <td className="py-2 pl-3 text-right text-foreground">{fmtN(split.visitors)}</td>
                    <td className="py-2 pl-3 text-right text-foreground">{fmtN(split.signups)}</td>
                    <td className="py-2 pl-3 text-right text-foreground">{split.visitors ? fmtPct(safeDiv(split.signups, split.visitors) * 100) : "–"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            Both means a signed-in person used a phone and a computer during this period. Anonymous visits from two devices
            cannot be linked, so they count as two visitors.
          </p>
        </>
      )}
    </Panel>
  );
}
