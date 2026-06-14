"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useCreateClass,
  useUpdateClass,
  type ClassInput,
  type ClassLanguage,
  type SchoolClass,
} from "@/lib/api/classes";
import { useAcademicYears } from "@/lib/api/academic-years";
import { useRooms } from "@/lib/api/rooms";
import { useUsers } from "@/lib/api/users";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";

interface Props {
  open: boolean;
  schoolClass: SchoolClass | null;
  onClose: () => void;
}

const GRADES = Array.from({ length: 11 }, (_, i) => String(i + 1));

export function ClassFormModal({ open, schoolClass, onClose }: Props) {
  const { t } = useI18n();
  const create = useCreateClass();
  const update = useUpdateClass();
  const isEdit = Boolean(schoolClass);
  const pending = create.isPending || update.isPending;

  const years = useAcademicYears();
  const rooms = useRooms();
  const teachers = useUsers({ role: "TEACHER", limit: 100 });

  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [language, setLanguage] = useState<ClassLanguage | "">("");
  const [roomId, setRoomId] = useState("");
  const [curatorId, setCuratorId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setGrade(schoolClass ? String(schoolClass.gradeLevel) : "");
    setSection(schoolClass ? schoolClass.section : "");
    setLanguage(schoolClass ? (schoolClass.language as ClassLanguage) : "");
    setRoomId(schoolClass ? schoolClass.room.id : "");
    setCuratorId(schoolClass ? schoolClass.curator.id : "");
    setAcademicYearId(schoolClass ? schoolClass.academicYear.id : "");
    setError(null);
  }, [open, schoolClass]);

  const languageOptions = useMemo(
    () => [
      { value: "uz", label: "O‘zbekcha" },
      { value: "ru", label: "Ruscha" },
      { value: "en", label: "Inglizcha" },
    ],
    [],
  );

  const gradeOptions = GRADES.map((g) => ({ value: g, label: g }));
  const roomOptions = (rooms.data?.items ?? []).map((r) => ({ value: r.id, label: r.floorLabel ? `${r.floorLabel} ${r.roomNumber}` : r.roomNumber }));
  const curatorOptions = (teachers.data?.items ?? []).map((u) => ({ value: u.id, label: u.fullName }));
  const yearOptions = (years.data?.items ?? []).map((y) => ({ value: y.id, label: y.name }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const gradeNum = Number(grade);
    if (!Number.isInteger(gradeNum) || gradeNum < 1 || gradeNum > 12) return setError(t("classes.err.grade"));
    if (!section.trim()) return setError(t("classes.err.section"));
    if (!language) return setError(t("classes.err.language"));
    if (!roomId) return setError(t("classes.err.room"));
    if (!curatorId) return setError(t("classes.err.curator"));
    if (!academicYearId) return setError(t("classes.err.year"));

    const input: ClassInput = {
      gradeLevel: gradeNum,
      section: section.trim().toUpperCase(),
      language: language as ClassLanguage,
      roomId,
      curatorId,
      academicYearId,
    };

    try {
      if (isEdit && schoolClass) {
        await update.mutateAsync({ id: schoolClass.id, input });
      } else {
        await create.mutateAsync(input);
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.localized("uz") : t("common.error"));
    }
  }

  const title = isEdit ? t("classes.edit.title") : t("classes.new.title");
  const subtitle = isEdit ? t("classes.edit.subtitle") : t("classes.new.subtitle");
  const submitLabel = isEdit ? t("classes.edit.submit") : t("classes.new.submit");

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={title}
      subtitle={subtitle}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="class-form" loading={pending}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id="class-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("classes.f.grade")} htmlFor="class-grade">
            <Select
              id="class-grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              options={gradeOptions}
              placeholder={t("classes.f.gradePlaceholder")}
            />
          </Field>
          <Field label={t("classes.f.section")} htmlFor="class-section">
            <Input
              id="class-section"
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value.toUpperCase())}
              placeholder="A"
              maxLength={4}
            />
          </Field>
        </div>

        <Field label={t("classes.f.language")} htmlFor="class-language">
          <Select
            id="class-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as ClassLanguage)}
            options={languageOptions}
            placeholder={t("classes.f.languagePlaceholder")}
          />
        </Field>

        <Field label={t("classes.f.room")} htmlFor="class-room">
          <Select
            id="class-room"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            options={roomOptions}
            placeholder={t("classes.f.roomPlaceholder")}
          />
        </Field>

        <Field label={t("classes.f.curator")} htmlFor="class-curator">
          <Select
            id="class-curator"
            value={curatorId}
            onChange={(e) => setCuratorId(e.target.value)}
            options={curatorOptions}
            placeholder={t("classes.f.curatorPlaceholder")}
          />
        </Field>

        <Field label={t("classes.f.year")} htmlFor="class-year">
          <Select
            id="class-year"
            value={academicYearId}
            onChange={(e) => setAcademicYearId(e.target.value)}
            options={yearOptions}
            placeholder={t("classes.f.yearPlaceholder")}
          />
        </Field>

        {error && (
          <p className="rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{error}</p>
        )}
      </form>
    </Modal>
  );
}
