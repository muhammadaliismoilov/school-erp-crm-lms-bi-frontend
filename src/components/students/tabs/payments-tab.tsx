"use client";

import { CreditCard, Wallet } from "lucide-react";
import { useStudentBalance } from "@/lib/api/student-balances";
import { STATUS_LABELS, STATUS_TONES, useStudentPayments } from "@/lib/api/student-payments";
import { Card, Spinner } from "@/components/ui/card";
import { formatDate, formatMoney } from "@/lib/utils";

export function PaymentsTab({ studentId }: { studentId: string }) {
  const { data: balance, isLoading: balanceLoading } = useStudentBalance(studentId);
  const { data: list, isLoading: listLoading } = useStudentPayments({ studentId, page: 1, limit: 50 });

  if (balanceLoading || listLoading) {
    return (
      <div className="grid place-items-center py-20">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const items = list?.items ?? [];

  return (
    <div className="space-y-5">
      {/* Balans kartasi */}
      {balance && <BalanceCard balance={balance} />}

      {/* To'lov tarixi */}
      <Card className="overflow-hidden p-0">
        <h3 className="border-b border-line px-5 py-4 font-display text-base font-semibold text-ink">
          To‘lovlar tarixi
        </h3>
        {items.length === 0 ? (
          <div className="grid place-items-center gap-2 py-16 text-center">
            <CreditCard className="h-8 w-8 text-ink-muted/60" />
            <p className="text-sm text-ink-muted">Bu o‘quvchi bo‘yicha hali to‘lov yo‘q</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-parchment-deep/40">
                  <th className="label px-4 py-3 text-left">Sana</th>
                  <th className="label px-4 py-3 text-left">Kvitansiya</th>
                  <th className="label px-4 py-3 text-left">To‘lov turi</th>
                  <th className="label px-4 py-3 text-right">Summa</th>
                  <th className="label px-4 py-3 text-left">Holat</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 tnum text-ink-soft">{formatDate(p.paymentDate)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-muted">{p.receiptNumber}</td>
                    <td className="px-4 py-3 text-ink">{p.paymentTypeName ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold tnum text-ink">{formatMoney(p.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONES[p.status]}`}>
                        {STATUS_LABELS[p.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function BalanceCard({ balance }: { balance: NonNullable<ReturnType<typeof useStudentBalance>["data"]> }) {
  const isDebtor = balance.status === "debtor";
  const isAdvance = balance.status === "advance";
  const tone = isDebtor
    ? "border-rose-500/30 bg-rose-500/5"
    : isAdvance
      ? "border-emerald-500/30 bg-emerald-500/5"
      : "border-line bg-surface";
  const balanceText = isDebtor
    ? `−${formatMoney(Math.abs(balance.balance))}`
    : isAdvance
      ? `+${formatMoney(balance.balance)}`
      : formatMoney(0);
  const balanceColor = isDebtor ? "text-rose-600" : isAdvance ? "text-emerald-600" : "text-ink";
  const label = isDebtor ? "Qarzdorlik" : isAdvance ? "Ortiqcha (avans)" : "Balans teng";

  return (
    <div className={`rounded-2xl border p-5 ${tone}`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label flex items-center gap-1.5 text-ink-muted">
            <Wallet className="h-4 w-4" /> {label}
          </p>
          <p className={`mt-1 font-display text-3xl font-bold tnum ${balanceColor}`}>{balanceText}</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
          <Stat label="Oylik tarif" value={formatMoney(balance.monthlyFee)} />
          <Stat label="Chegirmadan keyin" value={formatMoney(balance.effectiveMonthly)} />
          <Stat label={`Kutilgan (${balance.months} oy)`} value={formatMoney(balance.expected)} />
          <Stat label="Jami to‘langan" value={formatMoney(balance.paid)} />
        </dl>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="font-semibold tnum text-ink">{value}</dd>
    </div>
  );
}
