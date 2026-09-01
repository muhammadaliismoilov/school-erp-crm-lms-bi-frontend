"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { useDbHealthDetail, useDbHealthLevel } from "@/lib/db-health/use-db-health";
import type { DbHealthLevel } from "@/lib/db-health/store";
import { cn } from "@/lib/utils";

/**
 * Rang VA belgi birga.
 *
 * Qizil/yashil — rang ko'rlikning eng keng tarqalgan turi uchun eng yomon
 * juftlik. Shu sabab holat rangdan tashqari halqa qalinligi va `aria-label`
 * dagi SO'Z bilan ham ajratiladi.
 */
const TONE: Record<DbHealthLevel, { dot: string; ring: string }> = {
  ok: { dot: "bg-positive", ring: "ring-positive/30" },
  busy: { dot: "bg-caution", ring: "ring-caution/40" },
  critical: { dot: "bg-negative", ring: "ring-negative/50" },
};

export function DbHealthDot() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const level = useDbHealthLevel();
  const detail = useDbHealthDetail(open);

  // Ruxsati yo'q yoki hali birorta javob kelmagan — chiroq umuman chizilmaydi.
  if (!level) return null;

  const label = `${t("dbHealth.title")}: ${t(`dbHealth.level.${level}`)}`;
  const tone = TONE[level];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={label}
        aria-expanded={open}
        title={label}
        className="grid h-6 w-6 place-items-center rounded-full transition-colors hover:bg-surface-muted focus-visible:focus-ring"
      >
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full ring-4",
            tone.dot,
            tone.ring,
            // Puls faqat IKKI tezlikda: tinch va shoshilinch. Uchta tezlikni
            // odam yonma-yon ko'rmasa ajrata olmaydi — og'irlikni rang ko'taradi.
            // `motion-reduce` — tizimda harakat kamaytirilgan bo'lsa puls
            // butunlay o'chadi, rang qoladi.
            level === "critical"
              ? "animate-[pulse_0.6s_ease-in-out_infinite] motion-reduce:animate-none"
              : "animate-[pulse_2s_ease-in-out_infinite] motion-reduce:animate-none",
          )}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("dbHealth.title")}
          className="absolute bottom-full left-0 z-50 mb-2 w-72 rounded-xl border border-line bg-card p-4 shadow-lg"
        >
          <p className="font-medium text-ink">
            {t("dbHealth.title")}: {t(`dbHealth.level.${level}`)}
          </p>

          {detail.data?.warmingUp && (
            <p className="mt-1 text-xs text-ink-muted">{t("dbHealth.warmingUp")}</p>
          )}

          {detail.data && (
            <dl className="mt-3 space-y-1.5 text-sm">
              <Row label={t("dbHealth.metric.waiting")} value={detail.data.waiting} />
              <Row label={t("dbHealth.metric.slow")} value={detail.data.slowPerMinute} />
              <Row label={t("dbHealth.metric.errors")} value={detail.data.errorsPerMinute} />
            </dl>
          )}

          {detail.data && detail.data.signals.length > 0 && (
            <p className="mt-3 text-xs text-ink-muted">
              {detail.data.signals.map((s) => t(`dbHealth.signal.${s}`)).join(" · ")}
            </p>
          )}

          <p className="mt-3 border-t border-line pt-3 text-xs text-ink-soft">
            {t(`dbHealth.hint.${level}`)}
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-mono text-ink tnum">{value}</dd>
    </div>
  );
}
