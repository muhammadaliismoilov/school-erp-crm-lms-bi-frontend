"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, DoorOpen, LogOut } from "lucide-react";
import Link from "next/link";
import { STATUS_LABEL, STATUS_TONE } from "@/components/attendance/status-picker";
import { Badge, Spinner } from "@/components/ui/card";
import { DateInput } from "@/components/ui/date-input";
import { PageHeader } from "@/components/ui/page-header";
import { useStudentHistory, type HistoryDay } from "@/lib/api/attendance-history";

const WEEKDAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function formatDay(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return `${date} · ${WEEKDAYS[d.getDay()]}`;
}

export default function StudentHistoryPage() {
  const params = useParams<{ studentId: string }>();
  const searchParams = useSearchParams();
  const studentId = params.studentId;
  const name = searchParams.get("name");

  const [from, setFrom] = useState(isoDaysAgo(30));
  const [to, setTo] = useState(isoDaysAgo(0));

  const history = useStudentHistory(studentId, from, to);

  return (
    <div>
      <PageHeader
        title="Davomat tarixi"
        subtitle={name ?? studentId}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <DateInput value={from} onChange={setFrom} className="w-40" max={to} />
            <span className="text-ink-muted">–</span>
            <DateInput value={to} onChange={setTo} className="w-40" min={from} />
          </div>
        }
      />

      <Link
        href="/attendance"
        className="mb-4 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Kunlik davomatga qaytish
      </Link>

      {history.isLoading ? (
        <div className="card flex justify-center py-20">
          <Spinner />
        </div>
      ) : history.isError ? (
        <div className="card py-16 text-center text-sm text-ink-muted">
          Yuklanmadi.{" "}
          <button className="text-accent underline" onClick={() => history.refetch()}>
            Qayta urinish
          </button>
        </div>
      ) : history.data && history.data.length > 0 ? (
        <div className="space-y-3">
          {history.data.map((day) => (
            <DayCard key={day.date} day={day} />
          ))}
        </div>
      ) : (
        <div className="card px-5 py-14 text-center text-sm text-ink-muted">
          Tanlangan oraliqda davomat qaydi yo‘q.
        </div>
      )}
    </div>
  );
}

function DayCard({ day }: { day: HistoryDay }) {
  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="font-display font-semibold text-ink">{formatDay(day.date)}</div>
        <div className="flex items-center gap-3 text-sm">
          {day.checkInTime && (
            <span className="inline-flex items-center gap-1 tabular-nums text-ink-soft">
              <DoorOpen className="h-3.5 w-3.5 text-positive" />
              {day.checkInTime.slice(0, 5)}
            </span>
          )}
          {day.checkOutTime && (
            <span className="inline-flex items-center gap-1 tabular-nums text-ink-soft">
              <LogOut className="h-3.5 w-3.5 text-caution" />
              {day.checkOutTime.slice(0, 5)}
            </span>
          )}
          {day.dailyStatus && <Badge tone={STATUS_TONE[day.dailyStatus]}>{STATUS_LABEL[day.dailyStatus]}</Badge>}
        </div>
      </div>

      {day.sessions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {day.sessions.map((s, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm"
            >
              <span className="tabular-nums text-xs text-ink-muted">{s.startTime.slice(0, 5)}</span>
              <span className="font-medium text-ink">{s.subjectName}</span>
              {s.sessionType === "course" && <Badge tone="accent">Kurs</Badge>}
              <Badge tone={STATUS_TONE[s.status]}>
                {STATUS_LABEL[s.status]}
                {s.status === "late" && s.minutesLate ? ` ${s.minutesLate}′` : ""}
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 text-xs text-ink-muted">Dars davomati qayd etilmagan.</div>
      )}
    </div>
  );
}
