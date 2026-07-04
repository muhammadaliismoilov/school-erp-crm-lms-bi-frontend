"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCcw,
  Settings,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import {
  PAYROLL_NEXT_ACTIONS,
  PAYROLL_STATUS_LABELS,
  PAYROLL_STATUS_TONE,
  useGeneratePayroll,
  usePayrollRuns,
  usePayrollTransition,
  useRecalculatePayroll,
  type PayrollRun,
  type PayrollStatus,
} from "@/lib/api/hr-payroll-runs";
import { formatMoney } from "@/lib/utils";
import { Badge, Card, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { PayslipDrawer, periodLabel } from "@/components/hr/payslip-drawer";

/** Joriy oy YYYY-MM. */
function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftPeriod(period: string, delta: number): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Barcha holatlar" },
  ...(Object.keys(PAYROLL_STATUS_LABELS) as PayrollStatus[]).map((s) => ({
    value: s,
    label: PAYROLL_STATUS_LABELS[s],
  })),
];

export default function PayrollPage() {
  const [period, setPeriod] = useState(currentPeriod());
  const [status, setStatus] = useState<"" | PayrollStatus>("");
  const [selected, setSelected] = useState<PayrollRun | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const { data: runs, isLoading } = usePayrollRuns({ period, status: status || undefined });
  const generate = useGeneratePayroll();
  const recalc = useRecalculatePayroll();
  const transition = usePayrollTransition();

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const rows = useMemo(() => runs ?? [], [runs]);
  const totals = useMemo(
    () => ({
      net: rows.reduce((s, r) => s + r.netAmount, 0),
      bonus: rows.reduce((s, r) => s + r.bonus, 0),
      deduction: rows.reduce((s, r) => s + r.deduction, 0),
    }),
    [rows],
  );

  async function handleGenerate() {
    try {
      const res = await generate.mutateAsync(period);
      setWarnings(res.warnings);
      setToast(
        `${res.calculated} ta oylik hisoblandi` +
          (res.skippedNonDraft > 0 ? `, ${res.skippedNonDraft} ta o'tkazib yuborildi (tasdiqlangan)` : ""),
      );
    } catch {
      setToast("Hisoblashda xatolik yuz berdi");
    }
  }

  async function handleAction(run: PayrollRun, action: Parameters<typeof transition.mutateAsync>[0]["action"]) {
    try {
      await transition.mutateAsync({ id: run.id, action });
      setToast("Holat yangilandi");
    } catch {
      setToast("Amalni bajarishda xatolik");
    }
  }

  async function handleRecalc(run: PayrollRun) {
    try {
      await recalc.mutateAsync(run.id);
      setToast("Qayta hisoblandi");
    } catch {
      setToast("Qayta hisoblashda xatolik");
    }
  }

  /** Joriy ko'rinishdagi qatorlarni CSV qilib yuklab olish (buxgalteriya uchun). */
  function exportCsv() {
    const header = ["Xodim", "Lavozim", "Davr", "Baza", "Bonus", "Ushlab qolish", "Netto", "Holat"];
    const lines = rows.map((r) =>
      [
        r.staffName ?? "",
        r.positionTitle ?? "",
        r.period,
        r.baseAmount,
        r.bonus,
        r.deduction,
        r.netAmount,
        PAYROLL_STATUS_LABELS[r.status],
      ]
        .map((v) => `"${String(v).replaceAll('"', '""')}"`)
        .join(";"),
    );
    // BOM — Excel'da kirillcha/lotincha belgilarni to'g'ri ochish uchun.
    const blob = new Blob(["﻿" + [header.join(";"), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `oylik-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="stagger">
      <PageHeader
        title="Oylik hisobi"
        subtitle="Davr bo'yicha ish haqi hisoblash va tasdiqlash"
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={exportCsv} disabled={rows.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Link href="/hr/payroll/settings">
              <Button variant="secondary">
                <Settings className="mr-2 h-4 w-4" />
                Sozlamalar
              </Button>
            </Link>
            <Button variant="accent" loading={generate.isPending} onClick={handleGenerate}>
              <Calculator className="mr-2 h-4 w-4" />
              Hisoblash
            </Button>
          </div>
        }
      />

      {/* Davr selektori + filtr */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-line bg-surface px-1 py-1">
          <button
            className="rounded-md p-1.5 text-ink-muted hover:bg-parchment hover:text-ink"
            onClick={() => setPeriod((p) => shiftPeriod(p, -1))}
            aria-label="Oldingi oy"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-32 px-2 text-center text-sm font-medium text-ink">{periodLabel(period)}</span>
          <button
            className="rounded-md p-1.5 text-ink-muted hover:bg-parchment hover:text-ink"
            onClick={() => setPeriod((p) => shiftPeriod(p, 1))}
            aria-label="Keyingi oy"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <Select
          className="h-10 w-44"
          value={status}
          onChange={(e) => setStatus(e.target.value as "" | PayrollStatus)}
          options={STATUS_FILTER_OPTIONS}
        />
      </div>

      {/* Yig'ma kartalar */}
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard icon={<Banknote className="h-5 w-5" />} label="Jami fond (netto)" value={formatMoney(totals.net)} tone="accent" />
        <SummaryCard icon={<Users className="h-5 w-5" />} label="Xodimlar" value={String(rows.length)} tone="accent" />
        <SummaryCard icon={<TrendingUp className="h-5 w-5" />} label="Bonuslar" value={formatMoney(totals.bonus)} tone="positive" />
        <SummaryCard icon={<TrendingDown className="h-5 w-5" />} label="Ushlab qolish" value={formatMoney(totals.deduction)} tone="caution" />
      </div>

      {/* Hisoblash ogohlantirishlari */}
      {warnings.length > 0 && (
        <div className="mb-5 rounded-xl border border-orange-500/30 bg-orange-500/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              Ogohlantirishlar ({warnings.length})
            </div>
            <button className="text-ink-muted hover:text-ink" onClick={() => setWarnings([])} aria-label="Yopish">
              <X className="h-4 w-4" />
            </button>
          </div>
          <ul className="list-inside list-disc space-y-1 text-sm text-ink-soft">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Jadval */}
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-medium">№</th>
                <th className="px-4 py-3 font-medium">Xodim</th>
                <th className="px-4 py-3 font-medium">Lavozim</th>
                <th className="px-4 py-3 text-right font-medium">Baza</th>
                <th className="px-4 py-3 text-right font-medium">Bonus</th>
                <th className="px-4 py-3 text-right font-medium">Ushlab</th>
                <th className="px-4 py-3 text-right font-medium">Netto</th>
                <th className="px-4 py-3 font-medium">Holat</th>
                <th className="px-4 py-3 text-right font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center"><Spinner className="mx-auto h-5 w-5" /></td></tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-ink-muted">
                    Bu davr uchun oylik hisoblanmagan — «Hisoblash» tugmasini bosing
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr
                    key={r.id}
                    className="cursor-pointer border-b border-line/60 last:border-0 hover:bg-parchment/40"
                    onClick={() => setSelected(r)}
                  >
                    <td className="px-4 py-3 text-ink-muted">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-ink">{r.staffName ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">{r.positionTitle ?? "—"}</td>
                    <td className="tnum px-4 py-3 text-right text-ink-soft">{formatMoney(r.baseAmount)}</td>
                    <td className="tnum px-4 py-3 text-right text-emerald-600">
                      {r.bonus > 0 ? `+${formatMoney(r.bonus)}` : "—"}
                    </td>
                    <td className="tnum px-4 py-3 text-right text-rose-500">
                      {r.deduction > 0 ? `−${formatMoney(r.deduction)}` : "—"}
                    </td>
                    <td className="tnum px-4 py-3 text-right font-semibold text-ink">{formatMoney(r.netAmount)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={PAYROLL_STATUS_TONE[r.status]}>{PAYROLL_STATUS_LABELS[r.status]}</Badge>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {r.status === "draft" && (
                          <button
                            className="rounded-md p-1.5 text-ink-muted hover:bg-parchment hover:text-ink"
                            title="Qayta hisoblash"
                            onClick={() => handleRecalc(r)}
                          >
                            <RefreshCcw className="h-4 w-4" />
                          </button>
                        )}
                        {PAYROLL_NEXT_ACTIONS[r.status].map((a) => (
                          <Button
                            key={a.action}
                            variant="secondary"
                            size="sm"
                            loading={transition.isPending}
                            onClick={() => handleAction(r, a.action)}
                          >
                            {a.label}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslip drawer */}
      <PayslipDrawer run={selected} onClose={() => setSelected(null)} />

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink shadow-lg">
          <span className="mr-2 text-positive">✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "accent" | "positive" | "caution";
}) {
  const tones: Record<string, string> = {
    accent: "bg-amber/15 text-amber",
    positive: "bg-emerald-500/15 text-emerald-600",
    caution: "bg-orange-500/15 text-orange-600",
  };
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>{icon}</span>
      <div className="min-w-0">
        <div className="text-xs text-ink-muted">{label}</div>
        <div className="tnum truncate text-xl font-semibold text-ink">{value}</div>
      </div>
    </Card>
  );
}

