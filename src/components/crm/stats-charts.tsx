"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---- formatting helpers -------------------------------------------------

export const fmtInt = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
export const fmtPct = (n: number): string => `${Math.round(n * 10) / 10}%`;

/** rgb(var(--token) / alpha) — resolves the Lime Terminal CSS variables in SVG/CSS. */
const tok = (name: string, alpha = 1): string =>
  alpha === 1 ? `rgb(var(--${name}))` : `rgb(var(--${name}) / ${alpha})`;

/** Per-status colours, shared across funnel / donut / heatmap. */
export const STATUS_COLOR: Record<string, string> = {
  new: tok("ink-muted"),
  contacted: tok("caution"),
  interested: tok("amber"),
  trial_lesson: tok("navy-soft"),
  contract: tok("positive"),
  rejected: tok("negative"),
  enrolled: tok("accent"),
};

/** Categorical palette for sources / managers bars. */
export const SERIES = [tok("accent"), tok("positive"), tok("caution"), tok("amber"), tok("negative"), tok("ink-soft")];

// ---- KPI card -----------------------------------------------------------

export function KpiCard({
  label,
  value,
  delta,
  hint,
  icon,
}: {
  label: string;
  value: string;
  delta?: number | null;
  hint?: string;
  icon?: React.ReactNode;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-ink-muted">{label}</p>
        {icon && <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/12 text-accent">{icon}</span>}
      </div>
      <p className="mt-2 font-display text-3xl font-semibold text-ink tnum">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {delta !== undefined && delta !== null && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
              up ? "bg-positive/12 text-positive" : "bg-negative/12 text-negative",
            )}
          >
            {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {fmtPct(Math.abs(delta))}
          </span>
        )}
        {hint && <span className="text-ink-muted">{hint}</span>}
      </div>
    </Card>
  );
}

// ---- Trend line (SVG area) ----------------------------------------------

export function TrendLine({ data, height = 180 }: { data: { date: string; count: number }[]; height?: number }) {
  const w = 720;
  const pad = { top: 12, right: 8, bottom: 22, left: 8 };
  const innerW = w - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(1, ...data.map((d) => d.count));
  const n = data.length;

  const x = (i: number) => pad.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.count)}`).join(" ");
  const area = `${line} L${x(n - 1)},${pad.top + innerH} L${x(0)},${pad.top + innerH} Z`;

  if (n === 0) return <EmptyChart height={height} />;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tok("accent", 0.35)} />
          <stop offset="100%" stopColor={tok("accent", 0)} />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#trendFill)" />
      <path d={line} fill="none" stroke={tok("accent")} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <circle key={d.date} cx={x(i)} cy={y(d.count)} r={n <= 30 ? 3 : 0} fill={tok("accent")} />
      ))}
      {data.map((d, i) =>
        n <= 12 || i % Math.ceil(n / 8) === 0 ? (
          <text
            key={`l-${d.date}`}
            x={x(i)}
            y={height - 6}
            textAnchor="middle"
            fontSize="10"
            fill={tok("ink-muted")}
          >
            {d.date.slice(5)}
          </text>
        ) : null,
      )}
    </svg>
  );
}

// ---- Donut --------------------------------------------------------------

export function Donut({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: { label: string; value: number; color: string }[];
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  const r = 60;
  const c = 2 * Math.PI * r;
  let offset = 0;

  if (total === 0) return <EmptyChart height={180} />;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 160 160" className="h-44 w-44 shrink-0">
        <g transform="rotate(-90 80 80)">
          {segments.map((s) => {
            const len = (s.value / total) * c;
            const seg = (
              <circle
                key={s.label}
                cx="80"
                cy="80"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="20"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return seg;
          })}
        </g>
        <text x="80" y="74" textAnchor="middle" fontSize="22" fontWeight="600" fill={tok("ink")}>
          {centerValue}
        </text>
        <text x="80" y="94" textAnchor="middle" fontSize="11" fill={tok("ink-muted")}>
          {centerLabel}
        </text>
      </svg>
      <ul className="space-y-1.5 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="text-ink-soft">{s.label}</span>
            <span className="ml-auto font-medium text-ink tnum">{fmtInt(s.value)}</span>
            <span className="w-12 text-right text-ink-muted tnum">{fmtPct((s.value / total) * 100)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---- Funnel (descending bars) -------------------------------------------

export function Funnel({
  stages,
}: {
  stages: { label: string; count: number; reachedPct: number; stepConversion: number | null }[];
}) {
  const max = Math.max(1, ...stages.map((s) => s.count));
  return (
    <div className="space-y-2">
      {stages.map((s, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-sm text-ink-soft">{s.label}</span>
          <div className="relative h-9 flex-1 overflow-hidden rounded-lg bg-parchment-deep">
            <div
              className="flex h-full items-center rounded-lg px-3"
              style={{ width: `${(s.count / max) * 100}%`, background: tok("accent", 0.85) }}
            >
              <span className="text-sm font-semibold text-accent-fg tnum">{fmtInt(s.count)}</span>
            </div>
          </div>
          <span className="w-14 shrink-0 text-right text-xs text-ink-muted tnum">{fmtPct(s.reachedPct)}</span>
          <span className="w-16 shrink-0 text-right text-xs tnum">
            {s.stepConversion === null ? (
              <span className="text-ink-muted/50">—</span>
            ) : (
              <span className="text-positive">{fmtPct(s.stepConversion)}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---- Horizontal bar list ------------------------------------------------

export function BarList({
  rows,
  unit,
}: {
  rows: { label: string; value: number; sub?: string; color?: string }[];
  unit?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <EmptyChart height={120} />;
  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <div key={i}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate text-ink-soft">{r.label}</span>
            <span className="shrink-0 font-medium text-ink tnum">
              {fmtInt(r.value)}
              {unit}
              {r.sub && <span className="ml-1.5 text-xs font-normal text-ink-muted">{r.sub}</span>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-parchment-deep">
            <div
              className="h-full rounded-full"
              style={{ width: `${(r.value / max) * 100}%`, background: r.color ?? SERIES[i % SERIES.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Heatmap (source × status) ------------------------------------------

export function Heatmap({
  rows,
  cols,
  cell,
  colLabel,
}: {
  rows: string[];
  cols: string[];
  cell: (row: string, col: string) => number;
  colLabel: (col: string) => string;
}) {
  const max = Math.max(1, ...rows.flatMap((r) => cols.map((c) => cell(r, c))));
  if (rows.length === 0) return <EmptyChart height={120} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate" style={{ borderSpacing: "3px" }}>
        <thead>
          <tr>
            <th className="w-32" />
            {cols.map((c) => (
              <th key={c} className="px-1 pb-1 text-center text-xs font-medium text-ink-muted">
                {colLabel(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r}>
              <td className="pr-2 text-right text-sm text-ink-soft">{r}</td>
              {cols.map((c) => {
                const v = cell(r, c);
                return (
                  <td
                    key={c}
                    className="h-10 rounded-md text-center text-sm font-medium tnum"
                    style={{
                      background: v === 0 ? tok("parchment-deep") : tok("accent", 0.15 + 0.7 * (v / max)),
                      color: v / max > 0.5 ? tok("accent-fg") : tok("ink-soft"),
                    }}
                  >
                    {v || ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- Empty state --------------------------------------------------------

export function EmptyChart({ height = 160, label }: { height?: number; label?: string }) {
  return (
    <div
      className="grid place-items-center rounded-lg border border-dashed border-line text-sm text-ink-muted"
      style={{ height }}
    >
      {label ?? "—"}
    </div>
  );
}
