"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DebtsOverviewResult } from "@/lib/api/debts";
import { MONTH_SHORT_UZ, monthLabel } from "@/lib/api/debts";
import { formatMoney } from "@/lib/utils";

interface Row {
  name: string;
  full: string;
  kutilgan: number;
  yigilgan: number;
  foiz: number;
}

/** Qisqa son formati o'q uchun (1.2M / 350K). */
function compact(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${Math.round(v / 1_000)}K`;
  return String(v);
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-ink">{r.full}</p>
      <p className="text-ink-muted">Kutilgan: <span className="tnum text-ink">{formatMoney(r.kutilgan)}</span></p>
      <p className="text-ink-muted">Yig‘ilgan: <span className="tnum text-ink">{formatMoney(r.yigilgan)}</span></p>
      <p className="text-ink-muted">Yig‘ish foizi: <span className="tnum text-ink">{Math.round(r.foiz)}%</span></p>
    </div>
  );
}

/** "To'langan va Kutilgan" — kutilgan/yig'ilgan summa (bar) + yig'ish foizi (line, o'ng o'q). */
export function DebtsChart({ data }: { data?: DebtsOverviewResult }) {
  const rows: Row[] = (data?.chart ?? []).map((c) => ({
    name: `${MONTH_SHORT_UZ[c.month - 1]} ${String(c.year).slice(2)}`,
    full: monthLabel(c, true),
    kutilgan: c.expected,
    yigilgan: c.collected,
    foiz: c.rate,
  }));

  return (
    <div className="card p-5">
      <h3 className="font-display text-lg font-semibold text-ink">To‘langan va Kutilgan</h3>
      <p className="mb-4 text-sm text-ink-muted">Yig‘ilgan summa vs Kutilgan summa</p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-line" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="currentColor" className="text-ink-muted" />
            <YAxis
              yAxisId="sum"
              tickFormatter={compact}
              tick={{ fontSize: 11 }}
              stroke="currentColor"
              className="text-ink-muted"
              width={48}
            />
            <YAxis
              yAxisId="pct"
              orientation="right"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11 }}
              stroke="currentColor"
              className="text-ink-muted"
              width={40}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="sum" dataKey="kutilgan" name="Kutilgan summa" fill="#2dd4bf" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar yAxisId="sum" dataKey="yigilgan" name="Yig‘ilgan summa" fill="#f472b6" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Line yAxisId="pct" type="monotone" dataKey="foiz" name="Yig‘ish foizi" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
