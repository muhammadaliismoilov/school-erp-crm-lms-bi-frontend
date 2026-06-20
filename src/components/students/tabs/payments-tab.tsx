"use client";

import { CreditCard, Wallet } from "lucide-react";
import { useStudentPayments } from "@/lib/api/student-profile";
import { Card, Spinner } from "@/components/ui/card";
import { StatCard } from "@/components/students/stat-card";
import { formatDate, formatMoney } from "@/lib/utils";

const METHOD_LABEL: Record<string, string> = {
  cash: "Naqd",
  card: "Karta",
  transfer: "O‘tkazma",
  online: "Onlayn",
};

export function PaymentsTab({ studentId }: { studentId: string }) {
  const { data, isLoading } = useStudentPayments(studentId);

  if (isLoading || !data) {
    return (
      <div className="grid place-items-center py-20">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (data.items.length === 0) {
    return (
      <div className="card grid place-items-center gap-2 py-20 text-center">
        <CreditCard className="h-8 w-8 text-ink-muted/60" />
        <p className="font-medium text-ink">To‘lovlar tarixi mavjud emas</p>
        <p className="text-sm text-ink-muted">Bu o‘quvchi bo‘yicha hali to‘lov amalga oshirilmagan</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="Jami to‘langan" value={formatMoney(data.totalPaid)} icon={<Wallet className="h-5 w-5" />} tone="accent" />
        <StatCard label="To‘lovlar soni" value={data.items.length} icon={<CreditCard className="h-5 w-5" />} tone="sky" />
      </div>

      <Card className="overflow-hidden p-0">
        <h3 className="border-b border-line px-5 py-4 font-display text-base font-semibold text-ink">
          To‘lovlar tarixi
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-parchment-deep/40">
                <th className="label px-4 py-3 text-left">Sana</th>
                <th className="label px-4 py-3 text-left">Usul</th>
                <th className="label px-4 py-3 text-right">Summa</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3 tnum text-ink-soft">{formatDate(p.date)}</td>
                  <td className="px-4 py-3 text-ink">{METHOD_LABEL[p.method] ?? p.method}</td>
                  <td className="px-4 py-3 text-right font-semibold tnum text-ink">{formatMoney(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
