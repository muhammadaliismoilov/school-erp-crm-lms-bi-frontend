"use client";

import { useMemo } from "react";
import { CalendarOff } from "lucide-react";
import type { Student } from "@/lib/api/students";
import { useStudentSchedule, type ScheduleCell } from "@/lib/api/student-profile";
import { Card, Spinner } from "@/components/ui/card";

const DAY_LABELS: Record<number, string> = {
  1: "Dushanba",
  2: "Seshanba",
  3: "Chorshanba",
  4: "Payshanba",
  5: "Juma",
  6: "Shanba",
  7: "Yakshanba",
};

const SUBJECT_COLORS = [
  "bg-emerald-500/12 text-emerald-700 border-emerald-500/25",
  "bg-sky-500/12 text-sky-700 border-sky-500/25",
  "bg-violet-500/12 text-violet-700 border-violet-500/25",
  "bg-amber-500/12 text-amber-700 border-amber-500/25",
  "bg-rose-500/12 text-rose-700 border-rose-500/25",
  "bg-cyan-500/12 text-cyan-700 border-cyan-500/25",
  "bg-fuchsia-500/12 text-fuchsia-700 border-fuchsia-500/25",
];

function colorFor(subject: string): string {
  let hash = 0;
  for (let i = 0; i < subject.length; i += 1) hash = (hash * 31 + subject.charCodeAt(i)) >>> 0;
  return SUBJECT_COLORS[hash % SUBJECT_COLORS.length];
}

export function ScheduleTab({ student }: { student: Student }) {
  const { data, isLoading } = useStudentSchedule(student.id);

  const cellLookup = useMemo(() => {
    const map = new Map<string, ScheduleCell>();
    for (const c of data?.cells ?? []) map.set(`${c.weekday}:${c.periodId}`, c);
    return map;
  }, [data]);

  if (isLoading || !data) {
    return (
      <div className="grid place-items-center py-20">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!data.classLabel || data.periods.length === 0) {
    return (
      <div className="card grid place-items-center gap-2 py-20 text-center">
        <CalendarOff className="h-8 w-8 text-ink-muted/60" />
        <p className="font-medium text-ink">Dars jadvali mavjud emas</p>
        <p className="text-sm text-ink-muted">
          {data.classLabel ? "Ushbu sinf uchun jadval tuzilmagan" : "O‘quvchi sinfga biriktirilmagan"}
        </p>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h3 className="font-display text-base font-semibold text-ink">Haftalik dars jadvali</h3>
        <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">{data.classLabel}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-parchment-deep/40">
              <th className="label px-3 py-3 text-left">Vaqt</th>
              {data.days.map((d) => (
                <th key={d} className="label px-3 py-3 text-center">{DAY_LABELS[d]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.periods.map((p) => (
              <tr key={p.id} className="border-b border-line/60 last:border-0">
                <td className="whitespace-nowrap px-3 py-2 align-top">
                  <div className="font-medium text-ink">{p.code}</div>
                  <div className="text-xs text-ink-muted tnum">
                    {p.startTime?.slice(0, 5)}–{p.endTime?.slice(0, 5)}
                  </div>
                </td>
                {data.days.map((d) => {
                  const cell = cellLookup.get(`${d}:${p.id}`);
                  return (
                    <td key={d} className="px-2 py-2 align-top">
                      {cell ? (
                        <div className={`rounded-lg border px-2.5 py-1.5 ${colorFor(cell.subject)}`}>
                          <div className="text-xs font-semibold leading-tight">{cell.subject || "—"}</div>
                          {cell.teacher && <div className="mt-0.5 truncate text-[11px] opacity-80">{cell.teacher}</div>}
                          {cell.room && <div className="text-[11px] opacity-70">{cell.room}-xona</div>}
                        </div>
                      ) : (
                        <div className="h-full min-h-[2rem]" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
