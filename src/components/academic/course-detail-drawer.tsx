"use client";

import { Info, Trash2 } from "lucide-react";
import { useCourse, useRemoveCourseStudent } from "@/lib/api/courses";
import { useAuthStore } from "@/lib/auth/store";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";

interface Props {
  open: boolean;
  courseId: string | null;
  onClose: () => void;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

export function CourseDetailDrawer({ open, courseId, onClose }: Props) {
  const { t } = useI18n();
  const can = useAuthStore((s) => s.can);
  const canManage = can("academic.manage");
  const { data, isLoading } = useCourse(open ? courseId : null);
  const removeStudent = useRemoveCourseStudent();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t("courses.detail.title")}
      icon={<Info className="h-5 w-5" />}
    >
      {isLoading || !data ? (
        <p className="text-sm text-ink-muted">{t("common.loading")}</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-line p-4">
            <InfoRow label={t("courses.f.name")} value={data.name} />
            <InfoRow label={t("courses.f.subject")} value={data.subject.name} />
            <InfoRow label={t("courses.f.teacher")} value={data.teacher.fullName} />
            <InfoRow label={t("courses.f.description")} value={data.description || "—"} />
            <InfoRow
              label={t("courses.detail.lessons")}
              value={`${data.stats.completedLessonCount} / ${data.stats.plannedLessonCount}`}
            />
            <InfoRow label={t("courses.detail.studentCount")} value={data.stats.studentCount} />
            <InfoRow
              label={t("courses.detail.avgGrade")}
              value={data.stats.averageGrade != null ? data.stats.averageGrade.toFixed(1) : "—"}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-ink">
              {t("courses.detail.students")} ({data.students.length})
            </p>
            {data.students.length === 0 ? (
              <p className="rounded-lg bg-parchment/50 px-3 py-6 text-center text-sm text-ink-muted">
                {t("courses.detail.empty")}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {data.students.map((student) => (
                  <li
                    key={student.id}
                    className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm"
                  >
                    <span className="text-ink">
                      {student.fullName}
                      {student.className && (
                        <span className="ml-2 text-xs text-ink-muted">{student.className}</span>
                      )}
                    </span>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-negative"
                        loading={removeStudent.isPending}
                        onClick={() => removeStudent.mutate({ id: data.id, studentId: student.id })}
                        aria-label={t("common.delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
