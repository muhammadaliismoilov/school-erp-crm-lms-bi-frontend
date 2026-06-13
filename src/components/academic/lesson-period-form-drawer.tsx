"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import {
  useCreateLessonPeriod,
  useUpdateLessonPeriod,
  type LessonPeriod,
} from "@/lib/api/lesson-periods";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field, Input } from "@/components/ui/input";
import { TimeInput } from "@/components/ui/time-input";
import { isValidTime, toMinutes } from "@/lib/time";

interface Props {
  open: boolean;
  /** When set, the drawer edits this period; otherwise it creates a new one. */
  lessonPeriod: LessonPeriod | null;
  /** Suggested next lesson number for a new period. */
  nextLessonNumber: number;
  /** Suggested start time for a new period (previous period's end). */
  defaultStartTime: string;
  onClose: () => void;
}

export function LessonPeriodFormDrawer({
  open,
  lessonPeriod,
  nextLessonNumber,
  defaultStartTime,
  onClose,
}: Props) {
  const { t } = useI18n();
  const create = useCreateLessonPeriod();
  const update = useUpdateLessonPeriod();
  const isEdit = Boolean(lessonPeriod);
  const pending = create.isPending || update.isPending;

  const [lessonNumber, setLessonNumber] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (lessonPeriod) {
      setLessonNumber(String(lessonPeriod.lessonNumber));
      setStartTime(lessonPeriod.startTime);
      setEndTime(lessonPeriod.endTime);
    } else {
      setLessonNumber(String(nextLessonNumber));
      setStartTime(defaultStartTime);
      setEndTime("");
    }
    setError(null);
  }, [open, lessonPeriod, nextLessonNumber, defaultStartTime]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      return setError(t("lessonPeriods.err.required"));
    }
    if ((toMinutes(endTime) ?? 0) <= (toMinutes(startTime) ?? 0)) {
      return setError(t("lessonPeriods.err.range"));
    }

    try {
      if (isEdit && lessonPeriod) {
        await update.mutateAsync({ id: lessonPeriod.id, input: { startTime, endTime } });
      } else {
        const num = Number(lessonNumber);
        if (!Number.isInteger(num) || num < 1) {
          return setError(t("lessonPeriods.err.required"));
        }
        await create.mutateAsync({ lessonNumber: num, startTime, endTime });
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.localized("uz") : t("common.error"));
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      icon={<Clock className="h-5 w-5" />}
      title={isEdit ? t("lessonPeriods.edit.title") : t("lessonPeriods.new.title")}
      subtitle={isEdit ? t("lessonPeriods.edit.subtitle") : t("lessonPeriods.new.subtitle")}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="lesson-period-form" loading={pending}>
            {isEdit ? t("lessonPeriods.edit.submit") : t("lessonPeriods.new.submit")}
          </Button>
        </>
      }
    >
      <form id="lesson-period-form" onSubmit={handleSubmit} className="space-y-5">
        {!isEdit && (
          <Field label={t("lessonPeriods.f.number")} htmlFor="lp-number">
            <Input
              id="lp-number"
              type="number"
              min={1}
              max={20}
              value={lessonNumber}
              onChange={(e) => setLessonNumber(e.target.value)}
            />
          </Field>
        )}

        <div>
          <p className="label mb-1.5">{t("lessonPeriods.f.startTime")}</p>
          <TimeInput value={startTime} onChange={setStartTime} idPrefix="lp-start" />
        </div>

        <div>
          <p className="label mb-1.5">{t("lessonPeriods.f.endTime")}</p>
          <TimeInput value={endTime} onChange={setEndTime} idPrefix="lp-end" />
        </div>

        {error && <p className="rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{error}</p>}
      </form>
    </Drawer>
  );
}
