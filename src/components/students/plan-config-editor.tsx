"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Save } from "lucide-react";
import {
  PLAN_LABELS,
  PLAN_ORDER,
  PlanCode,
  PlanRate,
  usePlanConfig,
  useUpdatePlanConfig,
} from "@/lib/api/payment-plans";
import { useAuthStore } from "@/lib/auth/store";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Spinner } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { ApiError } from "@/lib/api/types";

/** Chegirmani so'mga keltiradi (etalon yillik baza = referenceMonthlyFee × akademik oylar). */
function resolve(base: number, rate: PlanRate): number {
  const v = Number(rate.discountValue) || 0;
  return rate.discountType === "percent" ? (base * v) / 100 : v;
}

/** Invariant: chegirma yearly_1x > split_2 > split_3 > monthly (qat'iy kamayish). */
function checkInvariant(referenceMonthlyFee: number, months: number, rates: PlanRate[]): string | null {
  const base = (Number(referenceMonthlyFee) || 0) * (months || 10);
  const byCode = new Map(rates.map((r) => [r.planCode, r]));
  const resolved = PLAN_ORDER.map((c) => ({ c, som: resolve(base, byCode.get(c)!) }));
  for (let i = 1; i < resolved.length; i += 1) {
    if (resolved[i].som >= resolved[i - 1].som) {
      return `${PLAN_LABELS[resolved[i].c]} chegirmasi ${PLAN_LABELS[resolved[i - 1].c]}dan kichik bo‘lishi shart.`;
    }
  }
  return null;
}

/**
 * To'lov rejasi chegirma sozlamalari — maktab darajasida 4 reja foizi/so'mi.
 * Invariant jonli tekshiriladi; saqlash faqat finance.manage huquqi bilan.
 */
export function PlanConfigEditor() {
  const { data, isLoading } = usePlanConfig();
  const update = useUpdatePlanConfig();
  const can = useAuthStore((s) => s.can);
  const canManage = can("finance.manage");

  const [referenceMonthlyFee, setRef] = useState(0);
  const [fallbackMonths, setFallback] = useState(10);
  const [rates, setRates] = useState<PlanRate[]>([]);
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setRef(data.referenceMonthlyFee);
      setFallback(data.fallbackMonths);
      setRates(PLAN_ORDER.map((c) => data.rates.find((r) => r.planCode === c) ?? { planCode: c, discountType: "percent", discountValue: 0 }));
    }
  }, [data]);

  const months = data?.academic.months ?? fallbackMonths;
  const base = (Number(referenceMonthlyFee) || 0) * months;
  const invariantError = useMemo(() => checkInvariant(referenceMonthlyFee, months, rates), [referenceMonthlyFee, months, rates]);

  function setRate(code: PlanCode, patch: Partial<PlanRate>) {
    setRates((prev) => prev.map((r) => (r.planCode === code ? { ...r, ...patch } : r)));
    setSaved(false);
  }

  async function handleSave() {
    setServerError(null);
    try {
      await update.mutateAsync({ referenceMonthlyFee, fallbackMonths, rates });
      setSaved(true);
    } catch (error) {
      setServerError(error instanceof ApiError ? error.localized("uz") : "Saqlashda xatolik");
    }
  }

  if (isLoading || !data) return <Spinner />;

  return (
    <div className="max-w-3xl space-y-5">
      <p className="text-sm text-ink-muted">
        Bir martada yoki kamroq bo‘lib to‘lagan o‘quvchiga beriladigan chegirma. Yillik 1 martalik chegirma eng katta,
        oyma-oy eng kichik (etalon: <span className="font-semibold text-ink">{formatMoney(referenceMonthlyFee)}</span>/oy ×{" "}
        {data.academic.months} oy = <span className="font-semibold text-ink tnum">{formatMoney(base)}</span>).
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Etalon oylik tarif (so‘m)">
          <NumberInput value={referenceMonthlyFee} onChange={(v) => { setRef(v ?? 0); setSaved(false); }} placeholder="1 000 000" />
        </Field>
        <Field label="Fallback oylar (akademik yil yo‘q bo‘lsa)">
          <NumberInput value={fallbackMonths} onChange={(v) => { setFallback(v ?? 10); setSaved(false); }} placeholder="10" />
        </Field>
      </div>

      <div className="overflow-hidden rounded-xl border border-line">
        <div className="grid grid-cols-[1.4fr_1fr_1.2fr_1fr] gap-2 border-b border-line bg-surface px-4 py-2 text-xs font-semibold uppercase text-ink-muted">
          <span>Reja</span>
          <span>Tur</span>
          <span>Qiymat</span>
          <span className="text-right">Chegirma (≈)</span>
        </div>
        {rates.map((rate) => (
          <div key={rate.planCode} className="grid grid-cols-[1.4fr_1fr_1.2fr_1fr] items-center gap-2 border-b border-line px-4 py-3 last:border-0">
            <span className="text-sm font-medium text-ink">{PLAN_LABELS[rate.planCode]}</span>
            <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-line text-xs">
              {(["percent", "amount"] as const).map((tp) => (
                <button
                  key={tp}
                  type="button"
                  disabled={!canManage}
                  onClick={() => setRate(rate.planCode, { discountType: tp })}
                  className={`py-1.5 font-medium transition-colors ${
                    rate.discountType === tp ? "bg-accent text-accent-fg" : "bg-surface text-ink-muted hover:text-ink"
                  }`}
                >
                  {tp === "percent" ? "%" : "so‘m"}
                </button>
              ))}
            </div>
            <NumberInput value={rate.discountValue} onChange={(v) => setRate(rate.planCode, { discountValue: v ?? 0 })} placeholder="0" disabled={!canManage} />
            <span className="text-right text-sm font-semibold text-emerald-600 tnum">{formatMoney(resolve(base, rate))}</span>
          </div>
        ))}
      </div>

      {invariantError ? (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {invariantError}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          <Check className="h-4 w-4 shrink-0" />
          Chegirma tartibi to‘g‘ri — 1 martalik eng foydali.
        </div>
      )}

      {serverError && <p className="text-sm text-rose-600">{serverError}</p>}

      {canManage && (
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={!!invariantError || update.isPending}>
            <Save className="mr-1.5 h-4 w-4" />
            {update.isPending ? "Saqlanmoqda…" : "Saqlash"}
          </Button>
          {saved && <span className="text-sm text-emerald-600">Saqlandi ✓</span>}
        </div>
      )}
    </div>
  );
}
