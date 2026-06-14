"use client";

import { useMemo } from "react";
import { buildWeekSchedule, type SubjectScheduleLesson } from "@/lib/api/subjects";
import { useI18n } from "@/lib/i18n/provider";

interface Props {
  lessons: SubjectScheduleLesson[];
  subjectName: string;
}

const WEEKDAYS = [1, 2, 3, 4, 5, 6] as const;

export function SubjectScheduleGrid({ lessons, subjectName }: Props) {
  const { t } = useI18n();
  const rows = useMemo(() => buildWeekSchedule(lessons), [lessons]);

  if (rows.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-ink-muted">{t("subjects.schedule.empty")}</div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-parchment-deep/40">
            <th className="label px-4 py-3 text-left">{t("subjects.schedule.period")}</th>
            {WEEKDAYS.map((day) => (
              <th key={day} className="label px-4 py-3 text-left">
                {t(`subjects.weekday.${day}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.periodLabel} className="border-b border-line/60 last:border-0">
              <td className="px-4 py-3 align-top">
                <p className="font-medium text-ink">{row.periodLabel}</p>
                {row.startTime && (
                  <p className="text-xs text-ink-muted tnum">
                    {row.startTime}
                    {row.endTime ? `–${row.endTime}` : ""}
                  </p>
                )}
              </td>
              {WEEKDAYS.map((day) => (
                <td key={day} className="px-2 py-2 align-top">
                  <div className="space-y-1.5">
                    {(row.cells[day] ?? []).map((lesson) => (
                      <div
                        key={lesson.id}
                        className="rounded-lg bg-positive/10 px-2.5 py-1.5 text-xs"
                      >
                        <p className="font-medium text-ink">{subjectName}</p>
                        <p className="text-ink-muted">{lesson.class.name}</p>
                      </div>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
