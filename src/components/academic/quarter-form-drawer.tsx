"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useAcademicYears } from "@/lib/api/academic-years";
import { useCreateQuarter, useUpdateQuarter, type Quarter } from "@/lib/api/quarters";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

interface Props {
  open: boolean;
  /** When set, the drawer edits this quarter; otherwise it creates a new one. */
  quarter: Quarter | null;
  /** Pre-selected academic year for new quarters (the page's active year). */
  defaultAcademicYearId: string;
  onClose: () => void;
}

const QUARTER_NUMBERS = [1, 2, 3, 4];

export function QuarterFormDrawer({ open, quarter, defaultAcademicYearId, onClose }: Props) {
  const { t } = useI18n();
  const { data: years } = useAcademicYears();
  const create = useCreateQuarter();
  const update = useUpdateQuarter();
  const isEdit = Boolean(quarter);
  const pending = create.isPending || update.isPending;

  const [academicYearId, setAcademicYearId] = useState("");
  const [quarterNumber, setQuarterNumber] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAcademicYearId(quarter?.academicYearId ?? defaultAcademicYearId ?? "");
    setQuarterNumber(quarter ? String(quarter.quarterNumber) : "");
    setStartDate(quarter?.startDate ?? "");
    setEndDate(quarter?.endDate ?? "");
    setError(null);
  }, [open, quarter, defaultAcademicYearId]);

  const yearOptions = (years?.items ?? []).map((y) => ({ value: y.id, label: y.name }));
  const numberOptions = QUARTER_NUMBERS.map((n) => ({ value: String(n), label: `${n}-chorak` }));

  // Quarter dates must stay inside the selected academic year.
  const selectedYear = (years?.items ?? []).find((y) => y.id === academicYearId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!academicYearId || !quarterNumber || !startDate || !endDate) {
      return setError(t("quarters.err.required"));
    }
    if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
      return setError(t("quarters.err.range"));
    }
    const payload = {
      academicYearId,
      quarterNumber: Number(quarterNumber),
      startDate,
      endDate,
    };
    try {
      if (isEdit && quarter) {
        await update.mutateAsync({ id: quarter.id, input: payload });
      } else {
        await create.mutateAsync(payload);
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
      title={isEdit ? t("quarters.edit.title") : t("quarters.new.title")}
      subtitle={isEdit ? t("quarters.edit.subtitle") : t("quarters.new.subtitle")}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="quarter-form" loading={pending}>
            {isEdit ? t("quarters.edit.submit") : t("quarters.new.submit")}
          </Button>
        </>
      }
    >
      <form id="quarter-form" onSubmit={handleSubmit} className="space-y-5">
        <Field label={t("quarters.f.academicYear")} htmlFor="q-year">
          <Select
            id="q-year"
            value={academicYearId}
            onChange={(e) => setAcademicYearId(e.target.value)}
            options={yearOptions}
            placeholder={t("quarters.f.academicYear")}
          />
        </Field>

        <Field label={t("quarters.f.number")} htmlFor="q-number">
          <Select
            id="q-number"
            value={quarterNumber}
            onChange={(e) => setQuarterNumber(e.target.value)}
            options={numberOptions}
            placeholder={t("quarters.f.numberPlaceholder")}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("quarters.f.startDate")} htmlFor="q-start">
            <DatePicker
              id="q-start"
              value={startDate}
              onChange={setStartDate}
              min={selectedYear?.startDate}
              max={selectedYear?.endDate}
            />
          </Field>
          <Field label={t("quarters.f.endDate")} htmlFor="q-end">
            <DatePicker
              id="q-end"
              value={endDate}
              onChange={setEndDate}
              min={startDate || selectedYear?.startDate}
              max={selectedYear?.endDate}
            />
          </Field>
        </div>

        {error && <p className="rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{error}</p>}
      </form>
    </Drawer>
  );
}
