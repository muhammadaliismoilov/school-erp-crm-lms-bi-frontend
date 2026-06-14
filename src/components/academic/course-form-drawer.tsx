"use client";

import { useEffect, useState } from "react";
import { BookMarked } from "lucide-react";
import {
  useCreateCourse,
  useUpdateCourse,
  type Course,
  type CourseInput,
} from "@/lib/api/courses";
import { useQuarters } from "@/lib/api/academic";
import { useSubjectList } from "@/lib/api/subjects";
import { useRooms } from "@/lib/api/rooms";
import { useUsers } from "@/lib/api/users";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

interface Props {
  open: boolean;
  course: Course | null;
  onClose: () => void;
}

export function CourseFormDrawer({ open, course, onClose }: Props) {
  const { t } = useI18n();
  const create = useCreateCourse();
  const update = useUpdateCourse();
  const isEdit = Boolean(course);
  const pending = create.isPending || update.isPending;

  const quarters = useQuarters();
  const subjects = useSubjectList();
  const rooms = useRooms();
  const teachers = useUsers({ role: "TEACHER", limit: 100 });

  const [quarterId, setQuarterId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuarterId(course ? course.quarter.id : "");
    setStartDate(course ? course.startDate : "");
    setEndDate(course ? course.endDate : "");
    setName(course ? course.name : "");
    setRoomId(course ? course.room.id : "");
    setDescription(course ? (course.description ?? "") : "");
    setSubjectId(course ? course.subject.id : "");
    setTeacherId(course ? course.teacher.id : "");
    setError(null);
  }, [open, course]);

  const quarterOptions = (quarters.data ?? []).map((q) => ({
    value: q.id,
    label: q.name?.uz ?? `${q.quarterNumber}-chorak`,
  }));
  const subjectOptions = (subjects.data?.items ?? []).map((s) => ({ value: s.id, label: s.name }));
  const roomOptions = (rooms.data?.items ?? []).map((r) => ({
    value: r.id,
    label: r.floorLabel ? `${r.floorLabel} ${r.roomNumber}` : r.roomNumber,
  }));
  const teacherOptions = (teachers.data?.items ?? []).map((u) => ({ value: u.id, label: u.fullName }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!quarterId) return setError(t("courses.err.quarter"));
    if (!startDate) return setError(t("courses.err.startDate"));
    if (!endDate) return setError(t("courses.err.endDate"));
    if (!name.trim()) return setError(t("courses.err.name"));
    if (!roomId) return setError(t("courses.err.room"));
    if (!subjectId) return setError(t("courses.err.subject"));
    if (!teacherId) return setError(t("courses.err.teacher"));

    const input: CourseInput = {
      name: name.trim(),
      quarterId,
      startDate,
      endDate,
      roomId,
      subjectId,
      teacherId,
      ...(description.trim() ? { description: description.trim() } : {}),
    };

    try {
      if (isEdit && course) {
        await update.mutateAsync({ id: course.id, input });
      } else {
        await create.mutateAsync(input);
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.detailedMessage("uz", FIELD_LABELS) : t("common.error"));
    }
  }

  const FIELD_LABELS = {
    name: t("courses.f.name"),
    quarterId: t("courses.f.quarter"),
    startDate: t("courses.f.startDate"),
    endDate: t("courses.f.endDate"),
    roomId: t("courses.f.room"),
    subjectId: t("courses.f.subject"),
    teacherId: t("courses.f.teacher"),
    description: t("courses.f.description"),
  };

  const title = isEdit ? t("courses.edit.title") : t("courses.new.title");
  const subtitle = isEdit ? t("courses.edit.subtitle") : t("courses.new.subtitle");
  const submitLabel = isEdit ? t("courses.edit.submit") : t("courses.new.submit");

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={<BookMarked className="h-5 w-5" />}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="course-form" loading={pending}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id="course-form" onSubmit={handleSubmit} className="space-y-5">
        <Field label={t("courses.f.quarter")} htmlFor="course-quarter">
          <Select
            id="course-quarter"
            value={quarterId}
            onChange={(e) => setQuarterId(e.target.value)}
            options={quarterOptions}
            placeholder={t("courses.f.quarterPlaceholder")}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t("courses.f.startDate")} htmlFor="course-start">
            <DatePicker id="course-start" value={startDate} onChange={setStartDate} />
          </Field>
          <Field label={t("courses.f.endDate")} htmlFor="course-end">
            <DatePicker id="course-end" value={endDate} onChange={setEndDate} min={startDate || undefined} />
          </Field>
        </div>

        <Field label={t("courses.f.name")} htmlFor="course-name">
          <Input
            id="course-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("courses.f.namePlaceholder")}
            maxLength={160}
          />
        </Field>

        <Field label={t("courses.f.room")} htmlFor="course-room">
          <Select
            id="course-room"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            options={roomOptions}
            placeholder={t("courses.f.roomPlaceholder")}
          />
        </Field>

        <Field label={t("courses.f.description")} htmlFor="course-desc">
          <textarea
            id="course-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("courses.f.descriptionPlaceholder")}
            rows={2}
            maxLength={500}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-amber focus-visible:focus-ring"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t("courses.f.subject")} htmlFor="course-subject">
            <Select
              id="course-subject"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              options={subjectOptions}
              placeholder={t("courses.f.subjectPlaceholder")}
            />
          </Field>
          <Field label={t("courses.f.teacher")} htmlFor="course-teacher">
            <Select
              id="course-teacher"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              options={teacherOptions}
              placeholder={t("courses.f.teacherPlaceholder")}
            />
          </Field>
        </div>

        {error && (
          <p className="whitespace-pre-line rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">
            {error}
          </p>
        )}
      </form>
    </Drawer>
  );
}
