"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useClassList,
  useTransferStudents,
  type SchoolClass,
} from "@/lib/api/classes";
import { useAcademicYears } from "@/lib/api/academic-years";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";

interface Props {
  open: boolean;
  source: SchoolClass | null;
  onClose: () => void;
  onSuccess?: (movedCount: number) => void;
}

export function ClassTransferModal({ open, source, onClose, onSuccess }: Props) {
  const { t } = useI18n();
  const transfer = useTransferStudents();
  const years = useAcademicYears();

  const [academicYearId, setAcademicYearId] = useState("");
  const [targetClassId, setTargetClassId] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Target candidates live in the same academic year as the chosen filter.
  const classes = useClassList(academicYearId ? { academicYearId } : undefined);

  useEffect(() => {
    if (!open) return;
    setAcademicYearId(source ? source.academicYear.id : "");
    setTargetClassId("");
    setError(null);
  }, [open, source]);

  const yearOptions = (years.data?.items ?? []).map((y) => ({ value: y.id, label: y.name }));
  const targetOptions = useMemo(
    () =>
      (classes.data?.items ?? [])
        .filter((c) => c.id !== source?.id)
        .map((c) => ({ value: c.id, label: c.name })),
    [classes.data, source],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!source) return;
    setError(null);

    if (!academicYearId) return setError(t("classes.err.year"));
    if (!targetClassId) return setError(t("classes.transfer.targetPlaceholder"));

    try {
      const result = await transfer.mutateAsync({
        id: source.id,
        input: { academicYearId, targetClassId },
      });
      onSuccess?.(result.movedStudentCount);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.localized("uz") : t("common.error"));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={t("classes.transfer.title")}
      subtitle={t("classes.transfer.subtitle")}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={transfer.isPending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="class-transfer-form" loading={transfer.isPending}>
            {t("classes.transfer.submit")}
          </Button>
        </>
      }
    >
      <form id="class-transfer-form" onSubmit={handleSubmit} className="space-y-5">
        <Field label={t("classes.transfer.year")} htmlFor="transfer-year">
          <Select
            id="transfer-year"
            value={academicYearId}
            onChange={(e) => {
              setAcademicYearId(e.target.value);
              setTargetClassId("");
            }}
            options={yearOptions}
            placeholder={t("classes.f.yearPlaceholder")}
          />
        </Field>

        <Field label={t("classes.transfer.target")} htmlFor="transfer-target">
          <Select
            id="transfer-target"
            value={targetClassId}
            onChange={(e) => setTargetClassId(e.target.value)}
            options={targetOptions}
            placeholder={t("classes.transfer.targetPlaceholder")}
            disabled={!academicYearId || classes.isLoading}
          />
        </Field>

        {error && (
          <p className="rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{error}</p>
        )}
      </form>
    </Modal>
  );
}
