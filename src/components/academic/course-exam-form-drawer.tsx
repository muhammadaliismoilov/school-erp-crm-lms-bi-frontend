"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import {
  combineDateTime,
  splitDateTime,
  useCreateCourseExam,
  useExamOptions,
  useUpdateExam,
  type Exam,
  type ExamType,
} from "@/lib/api/exams";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { TimeInput } from "@/components/ui/time-input";

interface Props {
  open: boolean;
  exam: Exam | null;
  onClose: () => void;
}

export function CourseExamFormDrawer({ open, exam, onClose }: Props) {
  const { t } = useI18n();
  const create = useCreateCourseExam();
  const update = useUpdateExam();
  const isEdit = Boolean(exam);
  const pending = create.isPending || update.isPending;

  const options = useExamOptions(open);

  const [courseId, setCourseId] = useState("");
  const [quarterId, setQuarterId] = useState("");
  const [examType, setExamType] = useState<ExamType>("test");
  const [examDate, setExamDate] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [fromTime, setFromTime] = useState("");
  const [toDate, setToDate] = useState("");
  const [toTime, setToTime] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCourseId(exam?.courseId ?? "");
    setQuarterId(exam?.quarterId ?? "");
    setExamType((exam?.examType as ExamType) ?? "test");
    setExamDate(exam?.examDate ?? "");
    const from = splitDateTime(exam?.availableFrom);
    const to = splitDateTime(exam?.availableUntil);
    setFromDate(from.date);
    setFromTime(from.time);
    setToDate(to.date);
    setToTime(to.time);
    setError(null);
  }, [open, exam]);

  const courseOptions = (options.data?.courses ?? []).map((c) => ({ value: c.id, label: c.name }));
  const quarterOptions = (options.data?.quarters ?? []).map((q) => ({
    value: q.id,
    label: typeof q.name === "string" ? q.name : (q.name.uz ?? `${q.quarterNumber}-chorak`),
  }));
  const typeOptions: { value: ExamType; label: string }[] = [
    { value: "test", label: t("exam.type.test") },
    { value: "control_work", label: t("exam.type.control_work") },
    { value: "dictation", label: t("exam.type.dictation") },
  ];

  const FIELD_LABELS = useMemo(
    () => ({
      courseId: t("exam.f.course"),
      quarterId: t("exam.f.quarter"),
      examType: t("exam.f.type"),
      examDate: t("exam.form.examDate"),
    }),
    [t],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!courseId) return setError(t("exam.err.course"));
    if (!quarterId) return setError(t("exam.err.quarter"));
    if (!examDate) return setError(t("exam.err.date"));

    const availableFrom = combineDateTime(fromDate, fromTime);
    const availableUntil = combineDateTime(toDate, toTime);

    const input = {
      courseId,
      quarterId,
      examType,
      examDate,
      ...(availableFrom ? { availableFrom } : {}),
      ...(availableUntil ? { availableUntil } : {}),
    };

    try {
      if (isEdit && exam) await update.mutateAsync({ id: exam.id, input });
      else await create.mutateAsync(input);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.detailedMessage("uz", FIELD_LABELS) : t("common.error"));
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? t("exam.course.edit.title") : t("exam.course.new.title")}
      subtitle={isEdit ? t("exam.course.edit.subtitle") : t("exam.course.new.subtitle")}
      icon={<ClipboardList className="h-5 w-5" />}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="course-exam-form" loading={pending}>
            {isEdit ? t("exam.form.save") : t("exam.form.submit")}
          </Button>
        </>
      }
    >
      <form id="course-exam-form" onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t("exam.sec.courseInfo")}</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("exam.f.course")} htmlFor="cce-course">
              <Select id="cce-course" value={courseId} onChange={(e) => setCourseId(e.target.value)} options={courseOptions} placeholder={t("exam.f.coursePh")} />
            </Field>
            <Field label={t("exam.f.quarter")} htmlFor="cce-quarter">
              <Select id="cce-quarter" value={quarterId} onChange={(e) => setQuarterId(e.target.value)} options={quarterOptions} placeholder={t("exam.f.quarterPh")} />
            </Field>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t("exam.sec.type")}</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("exam.f.type")} htmlFor="cce-type">
              <Select id="cce-type" value={examType} onChange={(e) => setExamType(e.target.value as ExamType)} options={typeOptions} />
            </Field>
            <Field label={t("exam.form.examDate")} htmlFor="cce-date">
              <DatePicker id="cce-date" value={examDate} onChange={setExamDate} />
            </Field>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t("exam.sec.window")}</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("exam.form.fromDate")} htmlFor="cce-from-date">
              <DatePicker id="cce-from-date" value={fromDate} onChange={setFromDate} />
            </Field>
            <Field label={t("exam.form.fromTime")}>
              <TimeInput value={fromTime} onChange={setFromTime} idPrefix="cce-from" />
            </Field>
            <Field label={t("exam.form.toDate")} htmlFor="cce-to-date">
              <DatePicker id="cce-to-date" value={toDate} onChange={setToDate} min={fromDate || undefined} />
            </Field>
            <Field label={t("exam.form.toTime")}>
              <TimeInput value={toTime} onChange={setToTime} idPrefix="cce-to" />
            </Field>
          </div>
        </section>

        {error && <p className="whitespace-pre-line rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{error}</p>}
      </form>
    </Drawer>
  );
}
