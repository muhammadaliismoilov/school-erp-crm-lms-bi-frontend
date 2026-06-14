"use client";

import { useEffect, useState } from "react";
import {
  buildSmsInput,
  useMessageTemplates,
  useSendClassSms,
} from "@/lib/api/classes";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { TimeInput } from "@/components/ui/time-input";

interface Props {
  open: boolean;
  classId: string | null;
  studentCount: number;
  onClose: () => void;
  onSuccess?: (scheduled: boolean) => void;
}

export function ClassSmsModal({ open, classId, studentCount, onClose, onSuccess }: Props) {
  const { t } = useI18n();
  const send = useSendClassSms();
  const templates = useMessageTemplates();

  const [templateId, setTemplateId] = useState("");
  const [body, setBody] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTemplateId("");
    setBody("");
    setDate("");
    setTime("");
    setError(null);
  }, [open]);

  // SMS templates are filtered to the SMS channel for this picker.
  const templateOptions = (templates.data ?? [])
    .filter((tpl) => tpl.channel === "sms")
    .map((tpl) => ({ value: tpl.id, label: tpl.name }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!classId) return;
    setError(null);

    const input = buildSmsInput({ templateId, body, date, time });
    if (!input) return setError(t("classes.err.smsBody"));

    try {
      const result = await send.mutateAsync({ id: classId, input });
      onSuccess?.(result.status === "scheduled");
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
      title={t("classes.sms.title")}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={send.isPending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="class-sms-form" loading={send.isPending}>
            {t("classes.sms.submit")}
          </Button>
        </>
      }
    >
      <form id="class-sms-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-lg bg-parchment/50 px-3 py-2 text-sm text-ink-soft">
          {t("classes.sms.selected")}:{" "}
          <span className="font-semibold text-ink tnum">
            {studentCount}/{studentCount}
          </span>
        </div>

        <Field label={t("classes.sms.template")} htmlFor="sms-template">
          <Select
            id="sms-template"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            options={templateOptions}
            placeholder={t("classes.sms.templatePlaceholder")}
          />
        </Field>

        <Field label={t("classes.sms.body")} htmlFor="sms-body">
          <textarea
            id="sms-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("classes.sms.bodyPlaceholder")}
            rows={3}
            maxLength={1000}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-amber focus-visible:focus-ring"
          />
        </Field>

        <Field label={t("classes.sms.date")} htmlFor="sms-date" error={undefined}>
          <DatePicker id="sms-date" value={date} onChange={setDate} />
          <p className="text-xs text-ink-muted">{t("classes.sms.dateHint")}</p>
        </Field>

        <div>
          <label className="label mb-1.5 block">{t("classes.sms.time")}</label>
          <TimeInput value={time} onChange={setTime} idPrefix="sms-time" />
          <p className="mt-1 text-xs text-ink-muted">{t("classes.sms.timeHint")}</p>
        </div>

        {error && (
          <p className="rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{error}</p>
        )}

        <p className="rounded-lg bg-amber/10 px-3 py-2 text-sm text-amber-600">
          {t("classes.sms.warning")}
        </p>
      </form>
    </Modal>
  );
}
