"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import {
  combineDateTime,
  splitDateTime,
  useCreateClassExam,
  useExamOptions,
  useExamTeachers,
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
import { loc } from "@/lib/utils";

interface Props {
  open: boolean;
  exam: Exam | null;
  onClose: () => void;
}

export function ClassExamFormDrawer({ open, exam, onClose }: Props) {
  const { t } = useI18n();
  const create = useCreateClassExam();
  const update = useUpdateExam();
  const isEdit = Boolean(exam);
  const pending = create.isPending || update.isPending;

  const options = useExamOptions(open);

  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [quarterId, setQuarterId] = useState("");
  const [examType, setExamType] = useState<ExamType>("test");
  const [examDate, setExamDate] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [fromTime, setFromTime] = useState("");
  const [toDate, setToDate] = useState("");
  const [toTime, setToTime] = useState("");
  const [error, setError] = useState<string | null>(null);

  const teachers = useExamTeachers(classId || undefined, subjectId || undefined);

  useEffect(() => {
    if (!open) return;
    setClassId(exam?.classId ?? "");
    setSubjectId(exam?.subjectId ?? "");
    setTeacherId(exam?.teacherId ?? "");
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

  const classOptions = (options.data?.classes ?? []).map((c) => ({ value: c.id, label: c.name }));
  const subjectOptions = (options.data?.subjects ?? []).map((s) => ({ value: s.id, label: loc(s.name) }));
  const quarterOptions = (options.data?.quarters ?? []).map((q) => ({ value: q.id, label: loc(q.name) }));
  const teacherOptions = (teachers.data?.items ?? []).map((u) => ({ value: u.id, label: u.fullName }));
  const typeOptions: { value: ExamType; label: string }[] = [
    { value: "test", label: t("exam.type.test") },
    { value: "control_work", label: t("exam.type.control_work") },
    { value: "dictation", label: t("exam.type.dictation") },
  ];

  const FIELD_LABELS = useMemo(
    () => ({
      classId: t("exam.f.class"),
      subjectId: t("exam.f.subject"),
      teacherId: t("exam.f.teacher"),
      quarterId: t("exam.f.quarter"),
      examType: t("exam.f.type"),
      examDate: t("exam.form.examDate"),
      availableFrom: t("exam.col.from"),
      availableUntil: t("exam.col.to"),
    }),
    [t],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!classId) return setError(t("exam.err.class"));
    if (!subjectId) return setError(t("exam.err.subject"));
    if (!teacherId) return setError(t("exam.err.teacher"));
    if (!quarterId) return setError(t("exam.err.quarter"));
    if (!examDate) return setError(t("exam.err.date"));

    const availableFrom = combineDateTime(fromDate, fromTime);
    const availableUntil = combineDateTime(toDate, toTime);

    const input = {
      classId,
      subjectId,
      teacherId,
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
      title={isEdit ? t("exam.class.edit.title") : t("exam.class.new.title")}
      subtitle={isEdit ? t("exam.class.edit.subtitle") : t("exam.class.new.subtitle")}
      icon={<ClipboardList className="h-5 w-5" />}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="class-exam-form" loading={pending}>
            {isEdit ? t("exam.form.save") : t("exam.form.submit")}
          </Button>
        </>
      }
    >
      <form id="class-exam-form" onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t("exam.sec.classInfo")}</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("exam.f.class")} htmlFor="ce-class">
              <Select id="ce-class" value={classId} onChange={(e) => setClassId(e.target.value)} options={classOptions} placeholder={t("exam.f.classPh")} />
            </Field>
            <Field label={t("exam.f.subject")} htmlFor="ce-subject">
              <Select id="ce-subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} options={subjectOptions} placeholder={t("exam.f.subjectPh")} />
            </Field>
            <Field label={t("exam.f.teacher")} htmlFor="ce-teacher">
              <Select
                id="ce-teacher"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                options={teacherOptions}
                placeholder={t("exam.f.teacherPh")}
                disabled={!classId || !subjectId}
              />
            </Field>
            <Field label={t("exam.f.quarter")} htmlFor="ce-quarter">
              <Select id="ce-quarter" value={quarterId} onChange={(e) => setQuarterId(e.target.value)} options={quarterOptions} placeholder={t("exam.f.quarterPh")} />
            </Field>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t("exam.sec.type")}</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("exam.f.type")} htmlFor="ce-type">
              <Select id="ce-type" value={examType} onChange={(e) => setExamType(e.target.value as ExamType)} options={typeOptions} />
            </Field>
            <Field label={t("exam.form.examDate")} htmlFor="ce-date">
              <DatePicker id="ce-date" value={examDate} onChange={setExamDate} />
            </Field>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t("exam.sec.window")}</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("exam.form.fromDate")} htmlFor="ce-from-date">
              <DatePicker id="ce-from-date" value={fromDate} onChange={setFromDate} />
            </Field>
            <Field label={t("exam.form.fromTime")}>
              <TimeInput value={fromTime} onChange={setFromTime} idPrefix="ce-from" />
            </Field>
            <Field label={t("exam.form.toDate")} htmlFor="ce-to-date">
              <DatePicker id="ce-to-date" value={toDate} onChange={setToDate} min={fromDate || undefined} />
            </Field>
            <Field label={t("exam.form.toTime")}>
              <TimeInput value={toTime} onChange={setToTime} idPrefix="ce-to" />
            </Field>
          </div>
        </section>

        {error && <p className="whitespace-pre-line rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{error}</p>}
      </form>
    </Drawer>
  );
}
