"use client";

import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export type Point = { label: string; value: number; value2?: number };

type TipProps = {
  active?: boolean;
  payload?: Array<{ value?: number | string; dataKey?: string; payload?: Point }>;
  label?: string | number;
  fmt: (n: number) => string;
  names: [string, string?];
  colors: [string, string?];
};

function Tip({ active, payload, label, fmt, names, colors }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-popover/95 px-3 py-2 shadow-xl backdrop-blur">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{String(payload[0]?.payload?.label ?? label)}</div>
      {payload.map((p, i) => (
        <div key={p.dataKey ?? i} className="mt-1 flex items-center gap-2 text-sm font-semibold text-foreground tabular">
          <span className="h-2 w-2 rounded-full" style={{ background: colors[i] ?? colors[0] }} />
          {fmt(Number(p.value) || 0)}
          <span className="text-xs font-normal text-muted-foreground">{names[i] ?? ""}</span>
        </div>
      ))}
    </div>
  );
}

export function TrendArea({
  data, fmt, yFmt, color = "#6e8cff", color2 = "#2fb57a", names = ["", undefined], height = 260,
}: {
  data: Point[];
  fmt: (n: number) => string;
  yFmt?: (n: number) => string;
  color?: string;
  color2?: string;
  names?: [string, string?];
  height?: number;
}) {
  if (!data.length) return <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>No data in this range</div>;
  const two = data.some((d) => d.value2 != null);
  const gid = `g-${color.replace("#", "")}`;
  const gid2 = `g-${color2.replace("#", "")}-2`;
  const step = Math.max(0, Math.floor(data.length / 7) - 1);
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={gid2} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color2} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color2} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} interval={step} tick={{ fill: "#7d869b", fontSize: 11 }} />
          <YAxis tickLine={false} axisLine={false} width={46} tick={{ fill: "#6a7388", fontSize: 11 }} tickFormatter={(v) => (yFmt ?? fmt)(Number(v))} />
          <Tooltip cursor={{ stroke: "rgba(255,255,255,.1)" }} content={<Tip fmt={fmt} names={names} colors={[color, color2]} />} />
          <Area isAnimationActive={false} type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${gid})`} dot={false} activeDot={{ r: 4 }} />
          {two ? <Area isAnimationActive={false} type="monotone" dataKey="value2" stroke={color2} strokeWidth={2} fill={`url(#${gid2})`} dot={false} activeDot={{ r: 4 }} /> : null}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrendBars({
  data, fmt, yFmt, color = "#6e8cff", name = "", height = 260, highlightLast = true,
}: {
  data: Point[];
  fmt: (n: number) => string;
  yFmt?: (n: number) => string;
  color?: string;
  name?: string;
  height?: number;
  highlightLast?: boolean;
}) {
  if (!data.length) return <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>No data in this range</div>;
  const step = Math.max(0, Math.floor(data.length / 8) - 1);
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={data.length > 20 ? 2 : "22%"}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} interval={step} tick={{ fill: "#7d869b", fontSize: 11 }} />
          <YAxis tickLine={false} axisLine={false} width={46} tick={{ fill: "#6a7388", fontSize: 11 }} tickFormatter={(v) => (yFmt ?? fmt)(Number(v))} />
          <Tooltip cursor={{ fill: "rgba(255,255,255,.04)" }} content={<Tip fmt={fmt} names={[name]} colors={[color]} />} />
          <Bar dataKey="value" radius={[5, 5, 1, 1]} isAnimationActive={false}>
            {data.map((_, i) => (
              <Cell key={i} fill={color} fillOpacity={highlightLast && i === data.length - 1 ? 1 : 0.78} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
