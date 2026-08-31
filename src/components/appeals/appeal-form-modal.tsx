"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Lightbulb } from "lucide-react";
import {
  TARGET_ROLES,
  useCreateAppeal,
  type AppealType,
  type TargetRole,
} from "@/lib/api/appeals";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { isCompleteUzPhone, PhoneInput } from "@/components/ui/phone-input";
import { Select, type SelectOption } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSchoolOptions } from "@/lib/api/hr-branches";
import { useAuthStore } from "@/lib/auth/store";
import { isGlobalAccount } from "@/lib/tenant/school-scope";
import { getActiveSchool } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface AppealFormModalProps {
  open: boolean;
  onClose: () => void;
}

const emptyForm = {
  isAnonymous: false,
  fullName: "",
  phone: "+998",
  schoolId: "",
  type: "suggestion" as AppealType,
  targetRole: "" as TargetRole | "",
  description: "",
};

export function AppealFormModal({ open, onClose }: AppealFormModalProps) {
  const { t, locale } = useI18n();
  const create = useCreateAppeal();
  const user = useAuthStore((s) => s.user);
  // Bosh ofis hisobi "Barcha maktablar" holatida turishi mumkin — u holda
  // so'rovda maktab umuman bo'lmaydi va backend 400 qaytaradi. Shuning uchun
  // maktab shu formaning O'ZIDA tanlanadi.
  const isGlobal = isGlobalAccount(user);
  const { data: schoolOptions } = useSchoolOptions();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // Tanlagichda allaqachon maktab tanlangan bo'lsa, uni oldindan qo'yamiz —
      // CEO ko'pincha shu maktab kontekstida ishlaydi.
      setForm({ ...emptyForm, schoolId: (isGlobal && getActiveSchool()) || "" });
      setError(null);
    }
  }, [open, isGlobal]);

  const set = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const roleOptions: SelectOption[] = useMemo(
    () => TARGET_ROLES.map((r) => ({ value: r, label: t(`appeals.role.${r}`) })),
    [t],
  );
  const schoolSelectOptions: SelectOption[] = useMemo(
    () => (schoolOptions ?? []).map((s) => ({ value: s.id, label: s.label })),
    [schoolOptions],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (isGlobal && !form.schoolId) return setError(t("appeals.err.schoolRequired"));
    if (!form.isAnonymous) {
      if (!form.fullName.trim()) return setError(t("appeals.err.nameRequired"));
      if (!isCompleteUzPhone(form.phone.trim())) return setError(t("appeals.err.phoneInvalid"));
    }
    if (!form.targetRole) return setError(t("appeals.err.roleRequired"));
    if (form.description.trim().length < 5) return setError(t("appeals.err.descriptionRequired"));

    try {
      await create.mutateAsync({
        ...(isGlobal && form.schoolId ? { schoolId: form.schoolId } : {}),
        // Anonim bo'lsa ism/telefon UMUMAN yuborilmaydi — backend ularni
        // saqlamaydi, va bo'sh satr yuborish validatsiyani chalg'itardi.
        ...(form.isAnonymous
          ? { isAnonymous: true }
          : { fullName: form.fullName.trim(), phone: form.phone.trim() }),
        type: form.type,
        targetRole: form.targetRole as TargetRole,
        description: form.description.trim(),
        source: "manual",
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.localized(locale) : t("common.error"));
    }
  }

  const typeCards: { value: AppealType; icon: React.ReactNode; tone: string }[] = [
    { value: "suggestion", icon: <Lightbulb className="h-5 w-5" />, tone: "positive" },
    { value: "complaint", icon: <AlertTriangle className="h-5 w-5" />, tone: "negative" },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("appeals.new")}
      subtitle={t("appeals.subtitle")}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={create.isPending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="appeal-form" loading={create.isPending}>
            {t("appeals.create")}
          </Button>
        </>
      }
    >
      <form id="appeal-form" onSubmit={handleSubmit} className="space-y-7">
        {/* 1. Murojaat qiluvchi */}
        <section className="space-y-4">
          <h4 className="label">1. {t("appeals.section.applicant")}</h4>

          {isGlobal && (
            <Field label={`${t("appeals.f.school")} *`} htmlFor="a-school">
              <Select
                id="a-school"
                value={form.schoolId}
                onChange={(e) => set("schoolId", e.target.value)}
                options={schoolSelectOptions}
                placeholder={t("appeals.f.school")}
              />
            </Field>
          )}
          {isGlobal && (
            <p className="-mt-2 text-xs text-ink-muted">{t("appeals.f.schoolHint")}</p>
          )}

          <div className="flex items-start gap-3 rounded-lg border border-line bg-surface p-3">
            <Switch
              checked={form.isAnonymous}
              onCheckedChange={(checked) => set("isAnonymous", checked)}
              aria-label={t("appeals.f.anonymous")}
            />
            <div>
              <p className="text-sm font-medium text-ink">{t("appeals.f.anonymous")}</p>
              <p className="text-xs text-ink-muted">{t("appeals.f.anonymousHint")}</p>
            </div>
          </div>

          {!form.isAnonymous && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`${t("appeals.f.fullName")} *`} htmlFor="a-name">
                <Input
                  id="a-name"
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  placeholder={t("appeals.f.fullNamePlaceholder")}
                  maxLength={150}
                  required
                />
              </Field>
              <Field label={`${t("appeals.f.phone")} *`} htmlFor="a-phone">
                <PhoneInput
                  id="a-phone"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  required
                />
              </Field>
            </div>
          )}
        </section>

        {/* 2. Tur va maqsad */}
        <section className="space-y-4">
          <h4 className="label">2. {t("appeals.section.purpose")}</h4>
          <div>
            <p className="label mb-1.5">{t("appeals.f.type")} *</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {typeCards.map((card) => {
                const active = form.type === card.value;
                return (
                  <button
                    key={card.value}
                    type="button"
                    onClick={() => set("type", card.value)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                      active
                        ? "border-accent bg-accent/8"
                        : "border-line bg-surface hover:border-ink-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-lg",
                        card.tone === "positive"
                          ? "bg-positive/12 text-positive"
                          : "bg-negative/12 text-negative",
                      )}
                    >
                      {card.icon}
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-ink">
                        {t(`appeals.type.${card.value}`)}
                      </span>
                      <span className="block text-xs text-ink-muted">
                        {t(`appeals.typeHint.${card.value}`)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <Field label={`${t("appeals.f.targetRole")} *`} htmlFor="a-role">
            <Select
              id="a-role"
              value={form.targetRole}
              onChange={(e) => set("targetRole", e.target.value as TargetRole)}
              options={roleOptions}
              placeholder={t("appeals.f.targetRolePlaceholder")}
            />
          </Field>
        </section>

        {/* 3. Mazmun */}
        <section className="space-y-4">
          <h4 className="label">3. {t("appeals.section.content")}</h4>
          <Field label={`${t("appeals.f.description")} *`} htmlFor="a-desc">
            <textarea
              id="a-desc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder={t("appeals.f.descriptionPlaceholder")}
              maxLength={5000}
              rows={5}
              required
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-amber focus-visible:focus-ring"
            />
          </Field>
          <p className="text-xs text-ink-muted">{t("appeals.descriptionHint")}</p>
        </section>

        {error && (
          <p className="rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{error}</p>
        )}
      </form>
    </Modal>
  );
}
