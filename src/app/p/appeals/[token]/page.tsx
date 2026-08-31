"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import {
  TARGET_ROLES,
  submitPublicAppeal,
  validatePublicAppealToken,
  type AppealType,
  type TargetRole,
} from "@/lib/api/appeals";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { isCompleteUzPhone, PhoneInput } from "@/components/ui/phone-input";
import { Select, type SelectOption } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const emptyForm = {
  isAnonymous: false,
  fullName: "",
  phone: "+998",
  type: "suggestion" as AppealType,
  targetRole: "" as TargetRole | "",
  description: "",
  website: "", // honeypot
};

export default function PublicAppealPage({ params }: { params: { token: string } }) {
  const { token } = params;
  const { t, locale } = useI18n();

  const validation = useQuery({
    queryKey: ["public-appeal", token],
    queryFn: () => validatePublicAppealToken(token),
    retry: false,
  });

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const roleOptions: SelectOption[] = useMemo(
    () => TARGET_ROLES.map((r) => ({ value: r, label: t(`appeals.role.${r}`) })),
    [t],
  );

  const typeCards: { value: AppealType; icon: React.ReactNode; tone: "positive" | "negative" }[] = [
    { value: "suggestion", icon: <Lightbulb className="h-5 w-5" />, tone: "positive" },
    { value: "complaint", icon: <AlertTriangle className="h-5 w-5" />, tone: "negative" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.isAnonymous) {
      if (!form.fullName.trim()) return setError(t("appeals.err.nameRequired"));
      if (!isCompleteUzPhone(form.phone.trim())) return setError(t("appeals.err.phoneInvalid"));
    }
    if (!form.targetRole) return setError(t("appeals.err.roleRequired"));
    if (form.description.trim().length < 5) return setError(t("appeals.err.descriptionRequired"));

    setSubmitting(true);
    try {
      await submitPublicAppeal(token, {
        // Anonim bo'lsa ism/telefon UMUMAN yuborilmaydi — ular hech qayerda
        // saqlanmasligi kerak, "bo'sh satr yuborish" esa buni kafolatlamaydi.
        ...(form.isAnonymous
          ? { isAnonymous: true }
          : { fullName: form.fullName.trim(), phone: form.phone.trim() }),
        type: form.type,
        targetRole: form.targetRole as TargetRole,
        description: form.description.trim(),
        website: form.website,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.localized(locale) : t("common.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
      {validation.isError ? (
        <Shell title={t("appeals.public.title")}>
          <p className="rounded-lg bg-negative/10 px-3 py-4 text-center text-sm text-negative">
            {t("appeals.public.invalid")}
          </p>
        </Shell>
      ) : done ? (
        <Shell title={t("appeals.public.title")}>
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-positive" />
            <p className="font-display text-xl font-semibold text-ink">{t("appeals.public.success")}</p>
            <p className="text-sm text-ink-muted">{t("appeals.public.successMsg")}</p>
            <Button
              variant="secondary"
              onClick={() => {
                setForm(emptyForm);
                setDone(false);
              }}
            >
              {t("appeals.public.another")}
            </Button>
          </div>
        </Shell>
      ) : (
        <Shell
          title={validation.data?.schoolName ?? t("appeals.public.title")}
          subtitle={t("appeals.public.subtitle")}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
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
                <Field label={`${t("appeals.f.fullName")} *`} htmlFor="p-name">
                  <Input
                    id="p-name"
                    value={form.fullName}
                    onChange={(e) => set("fullName", e.target.value)}
                    placeholder={t("appeals.f.fullNamePlaceholder")}
                    maxLength={150}
                  />
                </Field>
                <Field label={`${t("appeals.f.phone")} *`} htmlFor="p-phone">
                  <PhoneInput
                    id="p-phone"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </Field>
              </div>
            )}

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
                        active ? "border-accent bg-accent/8" : "border-line bg-surface hover:border-ink-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-9 w-9 place-items-center rounded-lg",
                          card.tone === "positive" ? "bg-positive/12 text-positive" : "bg-negative/12 text-negative",
                        )}
                      >
                        {card.icon}
                      </span>
                      <span className="block text-sm font-medium text-ink">
                        {t(`appeals.type.${card.value}`)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label={`${t("appeals.f.targetRole")} *`} htmlFor="p-role">
              <Select
                id="p-role"
                value={form.targetRole}
                onChange={(e) => set("targetRole", e.target.value as TargetRole)}
                options={roleOptions}
                placeholder={t("appeals.f.targetRolePlaceholder")}
              />
            </Field>

            <Field label={`${t("appeals.f.description")} *`} htmlFor="p-desc">
              <textarea
                id="p-desc"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder={t("appeals.f.descriptionPlaceholder")}
                maxLength={5000}
                rows={5}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-amber focus-visible:focus-ring"
              />
            </Field>

            {/* Honeypot: hidden from humans, bots fill it and get silently dropped. */}
            <input
              type="text"
              name="website"
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
            />

            {error && <p className="rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{error}</p>}

            <Button type="submit" className="w-full" loading={submitting} disabled={validation.isLoading}>
              {t("appeals.public.submit")}
            </Button>
          </form>
        </Shell>
      )}
    </main>
  );
}

function Shell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-8">
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
