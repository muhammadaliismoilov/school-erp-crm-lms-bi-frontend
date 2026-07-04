"use client";

import { Banknote } from "lucide-react";
import {
  PAYROLL_ITEM_TYPE_LABELS,
  PAYROLL_STATUS_LABELS,
  type PayrollRun,
} from "@/lib/api/hr-payroll-runs";
import { formatMoney } from "@/lib/utils";
import { Drawer } from "@/components/ui/drawer";

const MONTH_NAMES = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

/** 'YYYY-MM' → 'Iyul 2026'. */
export function periodLabel(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

/**
 * Payslip — oylikning komponent qatorlari (qty × stavka izohi bilan).
 * Admin sahifasida ham, xodimning o'z profilida ham ishlatiladi.
 */
export function PayslipDrawer({ run, onClose }: { run: PayrollRun | null; onClose: () => void }) {
  return (
    <Drawer
      open={!!run}
      onClose={onClose}
      title={run?.staffName ?? ""}
      subtitle={run ? `${periodLabel(run.period)} — ${PAYROLL_STATUS_LABELS[run.status]}` : ""}
      icon={<Banknote className="h-5 w-5" />}
      footer={
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-muted">Netto</span>
          <span className="tnum text-lg font-semibold text-ink">{run ? formatMoney(run.netAmount) : ""}</span>
        </div>
      }
    >
      {run && (
        <div className="space-y-2">
          {run.items.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">Komponentlar yo'q</p>
          ) : (
            run.items.map((item, i) => (
              <div key={i} className="rounded-lg border border-line bg-surface px-3.5 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-ink">{PAYROLL_ITEM_TYPE_LABELS[item.type]}</span>
                  <span className={`tnum text-sm font-semibold ${item.amount < 0 ? "text-rose-500" : "text-ink"}`}>
                    {item.amount < 0 ? "−" : "+"}
                    {formatMoney(Math.abs(item.amount))}
                  </span>
                </div>
                {(item.note || item.quantity !== null) && (
                  <div className="mt-1 flex items-center justify-between gap-3 text-xs text-ink-muted">
                    <span>{item.note ?? ""}</span>
                    {item.quantity !== null && item.rate !== null && (
                      <span className="tnum shrink-0">
                        {item.quantity} × {formatMoney(item.rate)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </Drawer>
  );
}
