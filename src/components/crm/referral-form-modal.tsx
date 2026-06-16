"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import {
  REFERRAL_TEMPLATES,
  useCreateReferral,
  useUpdateReferral,
  type Referral,
  type ReferralInput,
  type ReferralTemplate,
} from "@/lib/api/referrals";
import { useLeadSources } from "@/lib/api/crm";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";

interface Props {
  open: boolean;
  referral: Referral | null;
  onClose: () => void;
}

const THEME_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#a855f7", "#6b7280"];

const textareaCls =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-amber focus-visible:focus-ring";

/** Tiny visual mock per template, evoking its landing layout. */
function TemplateGlyph({ template }: { template: ReferralTemplate }) {
  const bar = "rounded bg-ink/15";
  if (template === "centered")
    return (
      <div className="flex h-10 flex-col items-center justify-center gap-1">
        <div className={`h-1.5 w-8 ${bar}`} />
        <div className={`h-3 w-12 rounded bg-accent/40`} />
      </div>
    );
  if (template === "split")
    return (
      <div className="flex h-10 gap-1">
        <div className="w-1/2 rounded bg-accent/30" />
        <div className="flex w-1/2 flex-col justify-center gap-1">
          <div className={`h-1.5 w-full ${bar}`} />
          <div className={`h-1.5 w-2/3 ${bar}`} />
        </div>
      </div>
    );
  if (template === "fullscreen")
    return (
      <div className="flex h-10 items-center justify-center rounded bg-accent/30">
        <div className="h-3 w-10 rounded bg-surface/80" />
      </div>
    );
  return (
    <div className="flex h-10 flex-col gap-1 p-1">
      <div className={`h-2 w-full rounded bg-accent/30`} />
      <div className={`h-1.5 w-2/3 ${bar}`} />
      <div className={`h-1.5 w-1/2 ${bar}`} />
    </div>
  );
}

export function ReferralFormModal({ open, referral, onClose }: Props) {
  const { t } = useI18n();
  const create = useCreateReferral();
  const update = useUpdateReferral();
  const isEdit = Boolean(referral);
  const pending = create.isPending || update.isPending;
  const sources = useLeadSources();

  const [name, setName] = useState("");
  const [expiresDate, setExpiresDate] = useState("");
  const [description, setDescription] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [template, setTemplate] = useState<ReferralTemplate>("classic");
  const [themeColor, setThemeColor] = useState(THEME_COLORS[2]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(referral?.name ?? "");
    setExpiresDate(referral?.expiresAt ? referral.expiresAt.slice(0, 10) : "");
    setDescription(referral?.description ?? "");
    setSourceId(referral?.source?.id ?? "");
    setTemplate(referral?.template ?? "classic");
    setThemeColor(referral?.themeColor ?? THEME_COLORS[2]);
    setError(null);
  }, [open, referral]);

  const sourceOptions = [
    { value: "", label: t("referral.noSource") },
    ...(sources.data ?? []).map((s) => ({ value: s.id, label: s.name })),
  ];

  const FIELD_LABELS = { name: t("referral.name") };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError(t("referral.err.name"));

    const input: ReferralInput = {
      name: name.trim(),
      template,
      themeColor,
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(sourceId ? { sourceId } : {}),
      // End-of-day expiry so the chosen date stays valid through the whole day.
      ...(expiresDate ? { expiresAt: `${expiresDate}T23:59:59` } : {}),
    };

    try {
      if (isEdit && referral) {
        await update.mutateAsync({ id: referral.id, input });
      } else {
        await create.mutateAsync(input);
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.detailedMessage("uz", FIELD_LABELS) : t("common.error"));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? t("referral.edit") : t("referral.create")}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="referral-form" loading={pending}>
            {isEdit ? t("common.save") : t("referral.submit")}
          </Button>
        </>
      }
    >
      <form id="referral-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label={t("referral.name")} htmlFor="ref-name">
          <Input id="ref-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder={t("referral.namePlaceholder")} />
        </Field>

        <Field label={t("referral.expiresAt")} htmlFor="ref-exp">
          <DatePicker id="ref-exp" value={expiresDate} onChange={setExpiresDate} min={new Date().toISOString().slice(0, 10)} placeholder={t("referral.expiresPlaceholder")} />
        </Field>

        <Field label={t("referral.description")} htmlFor="ref-desc">
          <textarea id="ref-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={2000} placeholder={t("referral.descPlaceholder")} className={textareaCls} />
        </Field>

        <Field label={t("referral.source")} htmlFor="ref-src">
          <Select id="ref-src" value={sourceId} onChange={(e) => setSourceId(e.target.value)} options={sourceOptions} placeholder={t("referral.sourcePlaceholder")} />
        </Field>

        {/* Shablon */}
        <div>
          <p className="label mb-1.5 block">{t("referral.template")}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {REFERRAL_TEMPLATES.map((tpl) => (
              <button
                key={tpl}
                type="button"
                onClick={() => setTemplate(tpl)}
                className={`relative rounded-xl border-2 p-2 text-left transition ${template === tpl ? "border-accent" : "border-line hover:border-line/80"}`}
              >
                {template === tpl && (
                  <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-accent text-accent-fg">
                    <Check className="h-3 w-3" />
                  </span>
                )}
                <div className="rounded-lg bg-parchment/60 p-1.5">
                  <TemplateGlyph template={tpl} />
                </div>
                <p className="mt-1.5 text-center text-xs font-medium text-ink-soft">{t(`referral.template.${tpl}`)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Mavzu */}
        <div>
          <p className="label mb-1.5 block">{t("referral.theme")}</p>
          <div className="flex items-center gap-2">
            {THEME_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setThemeColor(c)}
                aria-label={c}
                className={`grid h-8 w-8 place-items-center rounded-full transition ${themeColor === c ? "ring-2 ring-offset-2 ring-offset-surface" : ""}`}
                style={{ backgroundColor: c, boxShadow: themeColor === c ? `0 0 0 2px ${c}` : undefined }}
              >
                {themeColor === c && <Check className="h-4 w-4 text-white" />}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="whitespace-pre-line rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{error}</p>}
      </form>
    </Modal>
  );
}
