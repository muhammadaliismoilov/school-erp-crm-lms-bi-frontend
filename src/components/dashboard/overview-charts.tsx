"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardOverview } from "@/lib/api/dashboard";
import { formatMoney } from "@/lib/utils";
import { Card } from "@/components/ui/card";

const MONTH_SHORT = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];

/** Kompakt o'q yorlig'i: 54 049 000 → 54M. */
function compact(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${Math.round(v / 1_000_000)}M`;
  if (Math.abs(v) >= 1_000) return `${Math.round(v / 1_000)}K`;
  return String(v);
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
      <div className="mt-4 h-52">{children}</div>
    </Card>
  );
}

// ─── Tushum dinamikasi (12 oy) ──────────────────────────────────────────────

export function RevenueChart({ spark }: { spark: number[] }) {
  const now = new Date();
  const rows = spark.map((sum, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (spark.length - 1 - i), 1);
    return { name: `${MONTH_SHORT[d.getMonth()]}`, full: `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`, sum };
  });
  return (
    <ChartCard title="Tushum dinamikasi (12 oy)">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={1} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={compact} width={40} />
          <Tooltip
            cursor={{ fillOpacity: 0.06 }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg">
                  <p className="font-semibold text-ink">{(payload[0].payload as { full: string }).full}</p>
                  <p className="tnum text-ink-muted">{formatMoney((payload[0].payload as { sum: number }).sum)}</p>
                </div>
              ) : null
            }
          />
          <Bar dataKey="sum" fill="var(--accent, #d4a537)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Davomat trendi (30 kun) ────────────────────────────────────────────────

export function AttendanceTrendChart({ trend }: { trend: NonNullable<DashboardOverview["attendanceTrend"]> }) {
  const rows = trend.map((t) => ({
    name: t.date.slice(8), // kun raqami
    full: t.date,
    pct: t.pct,
    came: t.came,
  }));
  const hasData = rows.some((r) => r.pct !== null);
  return (
    <ChartCard title="Davomat trendi (30 kun)">
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={32} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg">
                    <p className="font-semibold text-ink">{(payload[0].payload as { full: string }).full}</p>
                    <p className="tnum text-ink-muted">
                      {(payload[0].payload as { pct: number | null }).pct ?? "—"}% ·{" "}
                      {(payload[0].payload as { came: number }).came} o'quvchi keldi
                    </p>
                  </div>
                ) : null
              }
            />
            <Line type="monotone" dataKey="pct" stroke="#10b981" strokeWidth={2} dot={false} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="grid h-full place-items-center text-sm text-ink-muted">
          Turniket ma'lumotlari kelgach trend shu yerda chiziladi
        </div>
      )}
    </ChartCard>
  );
}

// ─── Lidlar voronkasi ───────────────────────────────────────────────────────

const FUNNEL_LABELS: Record<string, string> = {
  new: "Yangi",
  contacted: "Aloqa qilindi",
  interested: "Qiziqdi",
  trial_lesson: "Sinov darsi",
  contract: "Shartnoma",
  rejected: "Rad etildi",
};

export function LeadFunnelChart({ funnel }: { funnel: NonNullable<DashboardOverview["leadFunnel"]> }) {
  const stages = funnel.filter((f) => f.status !== "rejected");
  const rejected = funnel.find((f) => f.status === "rejected");
  const max = Math.max(...stages.map((s) => s.count), 1);

  return (
    <ChartCard title="Lidlar voronkasi">
      <div className="flex h-full flex-col justify-center gap-2">
        {stages.map((s, i) => {
          const isLast = i === stages.length - 1;
          return (
            <div key={s.status} className="flex items-center gap-2 text-xs">
              <span className="w-24 shrink-0 text-ink-soft">{FUNNEL_LABELS[s.status] ?? s.status}</span>
              <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-parchment/60">
                <div
                  className={`h-full rounded-md ${isLast ? "bg-emerald-500/80" : "bg-amber/70"}`}
                  style={{ width: `${Math.max((s.count / max) * 100, s.count > 0 ? 6 : 0)}%` }}
                />
                <span className="tnum absolute inset-y-0 right-2 grid place-items-center font-semibold text-ink">
                  {s.count}
                </span>
              </div>
            </div>
          );
        })}
        {rejected && rejected.count > 0 && (
          <p className="mt-1 text-right text-xs text-ink-muted">
            Rad etilgan: <span className="tnum text-rose-500">{rejected.count}</span>
          </p>
        )}
      </div>
    </ChartCard>
  );
}
