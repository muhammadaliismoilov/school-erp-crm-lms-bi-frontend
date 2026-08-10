"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStudentGrades } from "@/lib/api/student-profile";
import { Card, Spinner } from "@/components/ui/card";
import { StatCard } from "@/components/students/stat-card";
import { Award, BarChart3, GraduationCap, TrendingUp } from "lucide-react";
import { ACCENT_GREEN } from "@/lib/charts/palette";

const DIST = [
  { key: "excellent", label: "A'lo (5)", color: "bg-emerald-500" },
  { key: "good", label: "Yaxshi (4)", color: "bg-sky-500" },
  { key: "satisfactory", label: "Qoniqarli (3)", color: "bg-amber-500" },
  { key: "poor", label: "Past (2)", color: "bg-rose-500" },
] as const;

export function GradesTab({ studentId }: { studentId: string }) {
  const { data, isLoading } = useStudentGrades(studentId);

  const chartData = useMemo(
    () =>
      (data?.gpaDynamics ?? []).map((d) => ({
        name: d.name || `${d.number}-chorak`,
        gpa: d.gpa ?? 0,
      })),
    [data],
  );

  if (isLoading || !data) {
    return (
      <div className="grid place-items-center py-20">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const dist = data.distribution;
  const distTotal = dist.excellent + dist.good + dist.satisfactory + dist.poor;
  const totalGrades = distTotal;

  return (
    <div className="space-y-5">
      {/* Baholar jurnali stat */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Jami baholar" value={totalGrades} icon={<BarChart3 className="h-5 w-5" />} tone="accent" />
        <StatCard label="O‘rtacha GPA" value={data.gpa != null ? data.gpa.toFixed(2) : "—"} icon={<TrendingUp className="h-5 w-5" />} tone="sky" />
        <StatCard label="A'lo baholar" value={dist.excellent} icon={<Award className="h-5 w-5" />} tone="violet" />
        <StatCard label="Past baholar" value={dist.poor} icon={<GraduationCap className="h-5 w-5" />} tone="rose" />
      </div>

      {/* GPA dinamikasi */}
      <Card className="p-5">
        <h3 className="mb-4 font-display text-base font-semibold text-ink">GPA dinamikasi (choraklik)</h3>
        {chartData.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-muted">Hozircha ma'lumot yo‘q</p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gpaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT_GREEN} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={ACCENT_GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-line" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="currentColor" className="text-ink-muted" />
                <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} stroke="currentColor" className="text-ink-muted" />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid var(--line, #e5e7eb)" }}
                  formatter={(v) => [Number(v).toFixed(2), "GPA"]}
                />
                <Area type="monotone" dataKey="gpa" stroke={ACCENT_GREEN} strokeWidth={2} fill="url(#gpaFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Chorak bo'yicha taqsimot */}
      <Card className="p-5">
        <h3 className="mb-4 font-display text-base font-semibold text-ink">Baholar taqsimoti</h3>
        {distTotal === 0 ? (
          <p className="py-6 text-center text-sm text-ink-muted">Hozircha choraklik baholar yo‘q</p>
        ) : (
          <>
            <div className="mb-3 flex h-3 w-full overflow-hidden rounded-full bg-line">
              {DIST.map((d) => {
                const count = dist[d.key];
                const pct = distTotal ? (count / distTotal) * 100 : 0;
                return pct > 0 ? <div key={d.key} className={d.color} style={{ width: `${pct}%` }} /> : null;
              })}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {DIST.map((d) => (
                <div key={d.key} className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${d.color}`} />
                  <span className="text-sm text-ink-soft">{d.label}</span>
                  <span className="ml-auto font-display font-semibold text-ink tnum">{dist[d.key]}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Fanlar bo'yicha chorak baholar */}
      <Card className="overflow-hidden p-0">
        <h3 className="border-b border-line px-5 py-4 font-display text-base font-semibold text-ink">
          Fanlar bo‘yicha chorak baholar
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-parchment-deep/40">
                <th className="label px-4 py-3 text-left">Fan</th>
                {data.quarters.map((q) => (
                  <th key={q.id} className="label px-4 py-3 text-center">{q.number}-chorak</th>
                ))}
                <th className="label px-4 py-3 text-center">O‘rtacha</th>
              </tr>
            </thead>
            <tbody>
              {data.quarterGrades.length === 0 ? (
                <tr>
                  <td colSpan={data.quarters.length + 2} className="py-10 text-center text-sm text-ink-muted">
                    Bu o‘quvchida choraklik baholar topilmadi
                  </td>
                </tr>
              ) : (
                data.quarterGrades.map((row) => {
                  const vals = data.quarters.map((q) => row.grades[q.number]).filter((v): v is number => v != null);
                  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
                  return (
                    <tr key={row.subjectId} className="border-b border-line/60 last:border-0">
                      <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
                      {data.quarters.map((q) => (
                        <td key={q.id} className="px-4 py-3 text-center tnum text-ink-soft">
                          {row.grades[q.number] ?? "—"}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center font-semibold tnum text-accent">
                        {avg != null ? avg.toFixed(1) : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Progress test natijalari */}
      <Card className="overflow-hidden p-0">
        <h3 className="border-b border-line px-5 py-4 font-display text-base font-semibold text-ink">
          Progress test natijalari
        </h3>
        {data.progressTests.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-muted">Hozircha progress test natijalari yo‘q</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-parchment-deep/40">
                  <th className="label px-4 py-3 text-left">Imtihon</th>
                  <th className="label px-4 py-3 text-center">Ball</th>
                  <th className="label px-4 py-3 text-center">Maksimal</th>
                  <th className="label px-4 py-3 text-center">Foiz</th>
                </tr>
              </thead>
              <tbody>
                {data.progressTests.map((t) => {
                  const pct = t.maxScore ? Math.round((t.score / t.maxScore) * 100) : 0;
                  return (
                    <tr key={t.examId} className="border-b border-line/60 last:border-0">
                      <td className="px-4 py-3 font-medium text-ink">{t.title}</td>
                      <td className="px-4 py-3 text-center tnum text-ink-soft">{t.score}</td>
                      <td className="px-4 py-3 text-center tnum text-ink-muted">{t.maxScore}</td>
                      <td className="px-4 py-3 text-center font-semibold tnum text-accent">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
