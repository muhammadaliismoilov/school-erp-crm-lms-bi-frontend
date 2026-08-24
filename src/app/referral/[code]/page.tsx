"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Send } from "lucide-react";
import {
  submitPublicReferralLead,
  validatePublicReferral,
  type PublicReferralInfo,
} from "@/lib/api/referrals";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Field, Input } from "@/components/ui/input";
import { isCompleteUzPhone, PhoneInput } from "@/components/ui/phone-input";

const DEFAULT_THEME = "#22c55e";

const emptyForm = { firstName: "", lastName: "", phone: "+998", website: "" };

export default function PublicReferralPage({ params }: { params: { code: string } }) {
  const { code } = params;
  const { t, locale } = useI18n();

  const validation = useQuery({
    queryKey: ["public-referral", code],
    queryFn: () => validatePublicReferral(code),
    retry: false,
  });

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const info = validation.data;
  const theme = info?.themeColor || DEFAULT_THEME;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.firstName.trim()) return setError(t("referralPublic.err.firstName"));
    if (!isCompleteUzPhone(form.phone.trim())) return setError(t("referralPublic.err.phone"));

    setSubmitting(true);
    try {
      await submitPublicReferralLead(code, {
        firstName: form.firstName.trim(),
        ...(form.lastName.trim() ? { lastName: form.lastName.trim() } : {}),
        phone: form.phone.trim(),
        website: form.website,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.localized(locale) : t("common.error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (validation.isError) {
    return (
      <Centered>
        <div className="rounded-2xl border border-line bg-card p-8 text-center shadow-sm">
          <p className="rounded-lg bg-negative/10 px-3 py-4 text-sm text-negative">{t("referralPublic.invalid")}</p>
        </div>
      </Centered>
    );
  }

  const body = done ? (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <CheckCircle2 className="h-12 w-12" style={{ color: theme }} />
      <p className="font-display text-xl font-semibold text-ink">{t("referralPublic.success")}</p>
      <p className="text-sm text-ink-muted">{t("referralPublic.successMsg")}</p>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={`${t("referralPublic.firstName")} *`} htmlFor="r-first">
          <Input id="r-first" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} maxLength={80} />
        </Field>
        <Field label={t("referralPublic.lastName")} htmlFor="r-last">
          <Input id="r-last" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} maxLength={80} />
        </Field>
      </div>
      <Field label={`${t("referralPublic.phone")} *`} htmlFor="r-phone">
        <PhoneInput id="r-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
      </Field>

      {/* Honeypot: hidden from humans; bots fill it and get silently dropped. */}
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

      <button
        type="submit"
        disabled={submitting || validation.isLoading}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: theme }}
      >
        <Send className="h-4 w-4" />
        {submitting ? t("common.loading") : t("referralPublic.submit")}
      </button>
    </form>
  );

  const heading = (
    <div className="mb-6 text-center">
      <h1 className="font-display text-2xl font-semibold text-ink">{info?.name ?? t("referralPublic.title")}</h1>
      {info?.description && <p className="mt-2 text-sm text-ink-muted">{info.description}</p>}
      {info?.sourceName && (
        <span className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: `${theme}1f`, color: theme }}>
          {info.sourceName}
        </span>
      )}
    </div>
  );

  return <ReferralShell template={info?.template} theme={theme} heading={heading} body={body} />;
}

/** Layout switches by template; the chosen theme color drives the accents. */
function ReferralShell({
  template,
  theme,
  heading,
  body,
}: {
  template?: PublicReferralInfo["template"];
  theme: string;
  heading: React.ReactNode;
  body: React.ReactNode;
}) {
  const card = (
    <div className="w-full max-w-xl rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-8">
      {heading}
      {body}
    </div>
  );

  if (template === "split") {
    return (
      <main className="flex min-h-screen flex-col md:flex-row">
        <div className="hidden flex-1 items-center justify-center p-10 md:flex" style={{ backgroundColor: theme }}>
          <div className="max-w-sm text-white/95">
            <div className="mb-4 h-12 w-12 rounded-2xl bg-white/20" />
            <p className="font-display text-3xl font-semibold leading-tight">Durbin</p>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center p-4 sm:p-8">{card}</div>
      </main>
    );
  }

  if (template === "fullscreen") {
    return (
      <main className="flex min-h-screen items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${theme}26, transparent)` }}>
        {card}
      </main>
    );
  }

  // classic + centered share a centered column.
  return <Centered>{card}</Centered>;
}

function Centered({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-10">{children}</main>;
}
