"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import {
  useCreateAcademicYear,
  useUpdateAcademicYear,
  type AcademicYear,
} from "@/lib/api/academic-years";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field, Input } from "@/components/ui/input";

interface Props {
  open: boolean;
  /** When set, the drawer edits this year; otherwise it creates a new one. */
  year: AcademicYear | null;
  onClose: () => void;
}

/** Derives the display name "2025-2026" from the two dates. */
function deriveName(startDate: string, endDate: string): string {
  const s = new Date(startDate).getFullYear();
  const e = new Date(endDate).getFullYear();
  if (Number.isNaN(s) || Number.isNaN(e)) return "";
  return `${s}-${e}`;
}

export function AcademicYearFormDrawer({ open, year, onClose }: Props) {
  const { t } = useI18n();
  const create = useCreateAcademicYear();
  const update = useUpdateAcademicYear();
  const isEdit = Boolean(year);
  const pending = create.isPending || update.isPending;

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStartDate(year?.startDate ?? "");
    setEndDate(year?.endDate ?? "");
    setError(null);
  }, [open, year]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!startDate || !endDate) return setError(t("academicYears.err.datesRequired"));
    if (new Date(startDate).getTime() >= new Date(endDate).getTime()) {
      return setError(t("academicYears.err.range"));
    }
    const name = deriveName(startDate, endDate);
    try {
      if (isEdit && year) {
        await update.mutateAsync({ id: year.id, input: { name, startDate, endDate } });
      } else {
        await create.mutateAsync({ name, startDate, endDate });
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
      icon={<CalendarDays className="h-5 w-5" />}
      title={isEdit ? t("academicYears.edit.title") : t("academicYears.new.title")}
      subtitle={isEdit ? t("academicYears.edit.subtitle") : t("academicYears.new.subtitle")}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="ay-form" loading={pending}>
            {isEdit ? t("academicYears.edit.submit") : t("academicYears.new.submit")}
          </Button>
        </>
      }
    >
      <form id="ay-form" onSubmit={handleSubmit} className="space-y-5">
        <p className="label">{isEdit ? t("academicYears.edit.title") : t("academicYears.new.title")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("academicYears.f.startDate")} htmlFor="ay-start">
            <Input id="ay-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label={t("academicYears.f.endDate")} htmlFor="ay-end">
            <Input id="ay-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        </div>
        {startDate && endDate && deriveName(startDate, endDate) && (
          <p className="text-xs text-ink-muted">
            {t("academicYears.f.name")}: <span className="font-medium text-ink">{deriveName(startDate, endDate)}</span>
          </p>
        )}
        {error && <p className="rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{error}</p>}
      </form>
    </Drawer>
  );
}
