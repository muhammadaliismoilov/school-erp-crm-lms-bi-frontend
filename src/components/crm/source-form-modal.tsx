"use client";

import { useEffect, useState } from "react";
import { useCreateSource, useUpdateSource, type Source } from "@/lib/api/crm";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

interface Props {
  open: boolean;
  source: Source | null;
  onClose: () => void;
}

export function SourceFormModal({ open, source, onClose }: Props) {
  const { t } = useI18n();
  const create = useCreateSource();
  const update = useUpdateSource();
  const isEdit = Boolean(source);
  const pending = create.isPending || update.isPending;

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(source?.name ?? "");
    setError(null);
  }, [open, source]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError(t("crm.source.err"));

    try {
      if (isEdit && source) {
        await update.mutateAsync({ id: source.id, input: { name: name.trim() } });
      } else {
        await create.mutateAsync({ name: name.trim() });
      }
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
      title={isEdit ? t("crm.source.edit") : t("crm.source.new")}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="source-form" loading={pending}>
            {isEdit ? t("common.save") : t("crm.source.create")}
          </Button>
        </>
      }
    >
      <form id="source-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label={t("crm.source.name")} htmlFor="source-name">
          <Input
            id="source-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("crm.source.namePlaceholder")}
            maxLength={120}
          />
        </Field>
        {error && <p className="rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{error}</p>}
      </form>
    </Modal>
  );
}
