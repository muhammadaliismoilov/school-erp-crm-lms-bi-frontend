"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Select, type SelectOption } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/provider";
import { ApiError } from "@/lib/api/types";
import { useSubstituteTeacher, type LessonCell } from "@/lib/api/schedule";

interface Props {
  open: boolean;
  onClose: () => void;
  quarterId: string;
  classId: string;
  weekday: number;
  periodId: string;
  cell: LessonCell;
  teachers: SelectOption[];
  onDone: (count: number) => void;
}

export function SubstituteModal({
  open,
  onClose,
  quarterId,
  classId,
  weekday,
  periodId,
  cell,
  teachers,
  onDone,
}: Props) {
  const { t } = useI18n();
  const substitute = useSubstituteTeacher();
  const [teacherId, setTeacherId] = useState("");
  const [count, setCount] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTeacherId("");
      setCount(1);
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    setError(null);
    if (!teacherId) return setError(t("sched.err.substitute"));
    try {
      const res = await substitute.mutateAsync({
        quarterId,
        classId,
        subjectId: cell.subjectId,
        lessonPeriodId: periodId,
        weekday,
        substituteTeacherId: teacherId,
        count,
      });
      onDone(res.substituted);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.error"));
    }
  };

  const countOptions: SelectOption[] = Array.from({ length: 5 }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1} ${t("sched.wz.unit.lesson")}`,
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("sched.sub.title")}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={substitute.isPending}>
            {t("sched.common.cancel")}
          </Button>
          <Button variant="accent" onClick={submit} loading={substitute.isPending}>
            {t("sched.sub.submit")}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">
            {t("sched.sub.current")}
          </label>
          <div className="rounded-lg border border-line bg-parchment px-3 py-2 text-sm text-ink">
            {cell.teacherName ?? "—"}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">
            {t("sched.sub.substitute")}
          </label>
          <Select
            options={teachers}
            placeholder={t("sched.selectTeacher")}
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">
            {t("sched.sub.count")}
          </label>
          <Select
            options={countOptions}
            value={String(count)}
            onChange={(e) => setCount(Number(e.target.value))}
          />
          <p className="mt-1 text-xs text-ink-muted">{t("sched.sub.hint")}</p>
        </div>
        {error && <p className="text-sm text-negative">{error}</p>}
      </div>
    </Modal>
  );
}
