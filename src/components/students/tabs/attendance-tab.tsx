"use client";

import { CalendarCheck, CheckCircle2, Clock, FileText, XCircle } from "lucide-react";
import { useStudentAttendance, type AttendanceStatus } from "@/lib/api/student-profile";
import { Card, Spinner } from "@/components/ui/card";
import { StatCard } from "@/components/students/stat-card";
import { formatDate } from "@/lib/utils";

const STATUS: Record<AttendanceStatus, { label: string; cls: string }> = {
  present: { label: "Keldi", cls: "bg-emerald-500/12 text-emerald-600" },
  absent: { label: "Kelmadi", cls: "bg-rose-500/12 text-rose-600" },
  late: { label: "Kechikdi", cls: "bg-amber-500/12 text-amber-600" },
  excused: { label: "Sababli", cls: "bg-sky-500/12 text-sky-600" },
};

export function AttendanceTab({ studentId }: { studentId: string }) {
  const { data, isLoading } = useStudentAttendance(studentId);

  if (isLoading || !data) {
    return (
      <div className="grid place-items-center py-20">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Davomat" value={`${data.attendancePct}%`} icon={<CalendarCheck className="h-5 w-5" />} tone="accent" />
        <StatCard label="Keldi" value={data.counts.present} icon={<CheckCircle2 className="h-5 w-5" />} tone="sky" />
        <StatCard label="Kelmadi" value={data.counts.absent} icon={<XCircle className="h-5 w-5" />} tone="rose" />
        <StatCard label="Kechikdi" value={data.counts.late} icon={<Clock className="h-5 w-5" />} tone="amber" />
        <StatCard label="Sababli" value={data.counts.excused} icon={<FileText className="h-5 w-5" />} tone="violet" />
      </div>

      <Card className="overflow-hidden p-0">
        <h3 className="border-b border-line px-5 py-4 font-display text-base font-semibold text-ink">
          So‘nggi davomat yozuvlari
        </h3>
        {data.recent.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-muted">Davomat yozuvlari topilmadi</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-parchment-deep/40">
                  <th className="label px-4 py-3 text-left">Sana</th>
                  <th className="label px-4 py-3 text-left">Fan</th>
                  <th className="label px-4 py-3 text-right">Holat</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((r, i) => (
                  <tr key={i} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 tnum text-ink-soft">{r.date ? formatDate(r.date) : "—"}</td>
                    <td className="px-4 py-3 text-ink">{r.subject || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {r.status && (
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS[r.status].cls}`}>
                          {STATUS[r.status].label}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
