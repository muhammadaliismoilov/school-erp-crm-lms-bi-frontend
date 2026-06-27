"use client";

import { Check, TrendingDown } from "lucide-react";
import {
  PLAN_LABELS,
  PLAN_ORDER,
  PlanCode,
  usePlanPreview,
  type DiscountType,
} from "@/lib/api/payment-plans";
import { formatMoney } from "@/lib/utils";

interface Props {
  monthlyFee: number;
  discountType: DiscountType;
  discountValue: number;
  billingStart?: string;
  /** Tanlangan reja — null bo'lsa hech biri. */
  value?: PlanCode | null;
  /** Karta bosilganda reja tanlanadi (ixtiyoriy — faqat ko'rsatish uchun bo'lsa berilmaydi). */
  onSelect?: (plan: PlanCode) => void;
  /** Gibrid: shu o'quvchiga maxsus reja chegirmasi (faqat shu reja almashtiriladi). */
  overridePlan?: PlanCode;
  overrideType?: DiscountType;
  overrideValue?: number;
}

/**
 * 4 to'lov rejasini yonma-yon ko'rsatadi: har reja jami to'lovi va oyma-oyga
 * nisbatan "yutuq" (tejam, so'm + foiz). Odam 1 martada to'lasa qancha yutishini ko'radi.
 */
export function PlanComparison({
  monthlyFee,
  discountType,
  discountValue,
  billingStart,
  value,
  onSelect,
  overridePlan,
  overrideType,
  overrideValue,
}: Props) {
  const { data, isLoading } = usePlanPreview(
    monthlyFee > 0
      ? { monthlyFee, discountType, discountValue, billingStart, overridePlan, overrideType, overrideValue }
      : null,
  );

  if (monthlyFee <= 0) {
    return <p className="text-sm text-ink-muted">Rejalarni ko‘rish uchun oylik tarif kiriting.</p>;
  }
  if (isLoading || !data) {
    return <div className="h-28 animate-pulse rounded-lg bg-line/40" />;
  }

  const byCode = new Map(data.plans.map((p) => [p.planCode, p]));
  const interactive = Boolean(onSelect);

  return (
    <div className="space-y-2">
      {!data.academic.resolved && (
        <p className="text-xs text-amber-600">
          Joriy akademik yil sozlanmagan — {data.academic.months} oylik taxminiy oyna ishlatildi.
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {PLAN_ORDER.map((code) => {
          const plan = byCode.get(code);
          if (!plan) return null;
          const selected = value === code;
          const hasSaving = plan.savingsVsMonthly > 0;
          return (
            <button
              key={code}
              type="button"
              disabled={!interactive}
              onClick={() => onSelect?.(code)}
              className={`relative flex flex-col gap-1 rounded-xl border p-3 text-left transition-colors ${
                selected
                  ? "border-accent bg-accent/5 ring-1 ring-accent"
                  : "border-line bg-surface hover:border-accent/50"
              } ${interactive ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">{PLAN_LABELS[code]}</span>
                {selected && <Check className="h-4 w-4 text-accent" />}
                {!selected && plan.isCheapest && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                    Eng foydali
                  </span>
                )}
              </div>
              <span className="text-[11px] uppercase tracking-wide text-ink-muted">Jami to‘lov</span>
              <span className="text-lg font-bold text-ink tnum leading-tight">{formatMoney(plan.total)}</span>
              <span className="text-xs text-ink-muted">
                {plan.installments} ta to‘lov · {formatMoney(Math.round(plan.total / Math.max(plan.installments, 1)))}/to‘lov
              </span>
              {hasSaving ? (
                <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                  <TrendingDown className="h-3.5 w-3.5 shrink-0" />
                  {formatMoney(plan.savingsVsMonthly)} ({Math.round(plan.savingsPercent)}%) yutasiz
                </span>
              ) : (
                <span className="mt-1 text-xs text-ink-muted">Chegirmasiz (etalon)</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
