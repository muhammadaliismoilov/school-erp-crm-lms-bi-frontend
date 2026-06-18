"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Select, type SelectOption } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { ApiError } from "@/lib/api/types";
import { useCreateCell, useUpdateCell, type LessonCell } from "@/lib/api/schedule";

interface Props {
  open: boolean;
  onClose: () => void;
  quarterId: string;
  classId: string;
  weekday: number;
  periodId: string;
  periodLabel: string;
  className: string;
  cell?: LessonCell | null;
  subjects: SelectOption[];
  teachers: SelectOption[];
  rooms: SelectOption[];
  courses: SelectOption[];
  onDone: () => void;
}

export function LessonModal({
  open,
  onClose,
  quarterId,
  classId,
  weekday,
  periodId,
  periodLabel,
  className,
  cell,
  subjects,
  teachers,
  rooms,
  courses,
  onDone,
}: Props) {
  const { t } = useI18n();
  const create = useCreateCell();
  const update = useUpdateCell();
  const isEdit = Boolean(cell);
  const pending = create.isPending || update.isPending;

  const [tab, setTab] = useState<"lesson" | "course">("lesson");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [fromToday, setFromToday] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTab(cell?.courseId ? "course" : "lesson");
    setSubjectId(cell?.subjectId ?? "");
    setTeacherId(cell?.teacherId ?? "");
    setRoomId(cell?.roomId ?? "");
    setCourseId(cell?.courseId ?? "");
    setFromToday(true);
  }, [open, cell]);

  const submit = async () => {
    setError(null);
    if (tab === "lesson" && !subjectId) return setError(t("sched.err.subject"));
    if (tab === "course" && !courseId) return setError(t("sched.err.subject"));
    try {
      if (isEdit && cell) {
        await update.mutateAsync({
          id: cell.id,
          body:
            tab === "course"
              ? { courseId }
              : { subjectId, teacherId: teacherId || undefined, roomId: roomId || undefined },
        });
      } else {
        await create.mutateAsync({
          quarterId,
          classId,
          lessonPeriodId: periodId,
          weekday,
          fromToday,
          ...(tab === "course"
            ? { courseId }
            : { subjectId, teacherId: teacherId || undefined, roomId: roomId || undefined }),
        });
      }
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.error"));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t("sched.lm.edit") : t("sched.lm.create")}
      subtitle={`${className} · ${t(`sched.day.${weekday}`)} · ${periodLabel}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            {t("sched.common.cancel")}
          </Button>
          <Button variant="accent" onClick={submit} loading={pending}>
            {isEdit ? t("sched.common.update") : t("sched.common.create")}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {!isEdit && (
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-line p-1">
            {(["lesson", "course"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  tab === key ? "bg-accent text-accent-fg" : "text-ink-soft hover:bg-parchment",
                )}
              >
                {key === "lesson" ? t("sched.lm.tabLesson") : t("sched.lm.tabCourse")}
              </button>
            ))}
          </div>
        )}

        {tab === "course" ? (
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">{t("sched.lm.course")}</label>
            <Select
              options={courses}
              placeholder={t("sched.lm.course")}
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted">{t("sched.lm.subject")}</label>
              <Select
                options={subjects}
                placeholder={t("sched.lm.subject")}
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted">{t("sched.lm.teacher")}</label>
              <Select
                options={teachers}
                placeholder={t("sched.lm.teacher")}
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-ink-muted">{t("sched.lm.room")}</label>
              <Select
                options={rooms}
                placeholder={t("sched.lm.room")}
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              />
            </div>
          </div>
        )}

        {!isEdit && (
          <div className="flex items-start justify-between gap-3 rounded-lg border border-line bg-parchment p-3">
            <div>
              <p className="text-sm font-medium text-ink">{t("sched.lm.fromToday")}</p>
              <p className="text-xs text-ink-muted">{t("sched.lm.fromTodayHint")}</p>
            </div>
            <Switch checked={fromToday} onCheckedChange={setFromToday} aria-label={t("sched.lm.fromToday")} />
          </div>
        )}

        {error && <p className="text-sm text-negative">{error}</p>}
      </div>
    </Modal>
  );
}
