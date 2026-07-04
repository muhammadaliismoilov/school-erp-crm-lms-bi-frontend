"use client";

import { useState } from "react";
import { Banknote, ReceiptText } from "lucide-react";
import {
  PAYROLL_STATUS_LABELS,
  PAYROLL_STATUS_TONE,
  useMyPayslips,
  type PayrollRun,
} from "@/lib/api/hr-payroll-runs";
import { formatMoney } from "@/lib/utils";
import { Badge, Card, Spinner } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { PayslipDrawer, periodLabel } from "@/components/hr/payslip-drawer";

/**
 * Xodimning o'z oyliklari (self-service payslip). Faqat tasdiqlangan/to'langan
 * oyliklar ko'rinadi — qoralamalar hisob-kitob tugagunicha yashirin.
 */
export default function MyPayslipsPage() {
  const { data: runs, isLoading } = useMyPayslips();
  const [selected, setSelected] = useState<PayrollRun | null>(null);
  const rows = runs ?? [];

  return (
    <div className="stagger">
      <PageHeader
        title="Mening oyliklarim"
        subtitle="Har bir oylik komponentma-komponent — qatorni bosib payslip'ni oching"
      />

      {isLoading ? (
        <div className="grid place-items-center py-24">
          <Spinner className="h-7 w-7" />
        </div>
      ) : rows.length === 0 ? (
        <Card className="grid place-items-center gap-2 py-20 text-center">
          <ReceiptText className="h-10 w-10 text-ink-muted/50" />
          <p className="font-medium text-ink">Hozircha tasdiqlangan oyliklar yo'q</p>
          <p className="text-sm text-ink-muted">Oylik tasdiqlangach shu yerda ko'rinadi</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <button key={r.id} type="button" className="text-left" onClick={() => setSelected(r)}>
              <Card className="h-full p-4 transition-colors hover:border-amber">
                <div className="flex items-start justify-between gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber/15 text-amber">
                    <Banknote className="h-5 w-5" />
                  </span>
                  <Badge tone={PAYROLL_STATUS_TONE[r.status]}>{PAYROLL_STATUS_LABELS[r.status]}</Badge>
                </div>
                <div className="mt-3 text-sm text-ink-muted">{periodLabel(r.period)}</div>
                <div className="tnum text-xl font-semibold text-ink">{formatMoney(r.netAmount)}</div>
                <div className="mt-1 flex gap-3 text-xs text-ink-muted">
                  {r.bonus > 0 && <span className="text-emerald-600">+{formatMoney(r.bonus)} bonus</span>}
                  {r.deduction > 0 && <span className="text-rose-500">−{formatMoney(r.deduction)}</span>}
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}

      <PayslipDrawer run={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
