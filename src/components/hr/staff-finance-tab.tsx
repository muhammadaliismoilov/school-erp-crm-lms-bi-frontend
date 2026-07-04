"use client";

import { useEffect, useState } from "react";
import { Banknote, Plus, Target, Trash2 } from "lucide-react";
import {
  KPI_MODE_LABELS,
  useUpdateStaffKpi,
  type StaffKpiMode,
  type StaffMember,
} from "@/lib/api/hr";
import {
  ADJUSTMENT_TYPE_LABELS,
  useCreatePayrollAdjustment,
  useDeletePayrollAdjustment,
  usePayrollAdjustments,
  type PayrollAdjustmentType,
} from "@/lib/api/hr-payroll-adjustments";
import {
  PAYROLL_STATUS_LABELS,
  PAYROLL_STATUS_TONE,
  usePayrollRuns,
} from "@/lib/api/hr-payroll-runs";
import { formatMoney } from "@/lib/utils";
import { Badge, Card, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { NumberInput } from "@/components/ui/number-input";
import { Select } from "@/components/ui/select";

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Xodim profilining "Moliya" tabi: KPI sozlamasi (foiz/qat'iy — faqat
 * rahbariyat ruxsati bilan), qo'lda bonus/jarima va oxirgi payslip'lar.
 */
export function StaffFinanceTab({ staff }: { staff: StaffMember }) {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <KpiCard staff={staff} onToast={setToast} />
        <AdjustmentsCard staffId={staff.id} onToast={setToast} />
      </div>
      <PayslipsCard staffId={staff.id} />

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink shadow-lg">
          <span className="mr-2 text-positive">✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── KPI sozlamasi ─────────────────────────────────────────────────────────

function KpiCard({ staff, onToast }: { staff: StaffMember; onToast: (m: string) => void }) {
  const updateKpi = useUpdateStaffKpi();
  const [mode, setMode] = useState<"" | StaffKpiMode>(staff.kpiMode ?? "");
  const [value, setValue] = useState<number | null>(Number(staff.kpiValue) || null);

  useEffect(() => {
    setMode(staff.kpiMode ?? "");
    setValue(Number(staff.kpiValue) || null);
  }, [staff.kpiMode, staff.kpiValue]);

  async function save() {
    try {
      await updateKpi.mutateAsync({
        id: staff.id,
        kpiMode: mode === "" ? null : mode,
        kpiValue: mode === "" ? 0 : (value ?? 0),
      });
      onToast(mode === "" ? "KPI o'chirildi" : "KPI saqlandi");
    } catch {
      onToast("Saqlashda xatolik (ruxsatingizni tekshiring)");
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-amber" />
        <h2 className="font-display text-base font-semibold text-ink">KPI bonusi</h2>
      </div>
      <p className="mt-0.5 text-xs text-ink-muted">
        Har xodimga alohida belgilanadi — faqat rahbariyat (HR/direktor) o'zgartiradi
      </p>
      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Turi</label>
          <Select
            value={mode}
            onChange={(e) => setMode(e.target.value as "" | StaffKpiMode)}
            options={[
              { value: "", label: "KPI berilmaydi" },
              { value: "percent", label: KPI_MODE_LABELS.percent },
              { value: "fixed", label: KPI_MODE_LABELS.fixed },
            ]}
          />
        </div>
        {mode !== "" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              {mode === "percent" ? "Foiz (0-100)" : "Summa (so'm)"}
            </label>
            <NumberInput value={value} onChange={setValue} placeholder={mode === "percent" ? "10" : "500 000"} />
          </div>
        )}
        <div className="flex justify-end">
          <Button variant="accent" size="sm" loading={updateKpi.isPending} onClick={save}>
            Saqlash
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ─── Bonus / jarima ────────────────────────────────────────────────────────

function AdjustmentsCard({ staffId, onToast }: { staffId: string; onToast: (m: string) => void }) {
  const { data: items, isLoading } = usePayrollAdjustments({ staffMemberId: staffId });
  const createAdj = useCreatePayrollAdjustment();
  const deleteAdj = useDeletePayrollAdjustment();

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<PayrollAdjustmentType>("bonus");
  const [period, setPeriod] = useState(currentPeriod());
  const [amount, setAmount] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!amount || amount <= 0) {
      setError("Summani kiriting");
      return;
    }
    if (reason.trim().length < 3) {
      setError("Sababni kiriting (majburiy)");
      return;
    }
    try {
      await createAdj.mutateAsync({ staffMemberId: staffId, period, type, amount, reason: reason.trim() });
      setOpen(false);
      setAmount(null);
      setReason("");
      onToast(type === "bonus" ? "Bonus qo'shildi" : "Jarima kiritildi");
    } catch {
      setError("Saqlanmadi — bu davr oyligi allaqachon tasdiqlangan bo'lishi mumkin");
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-semibold text-ink">Bonus / jarima</h2>
          <p className="mt-0.5 text-xs text-ink-muted">Sabab majburiy; tasdiqlangan davrga kiritib bo'lmaydi</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Qo'shish
        </Button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-8"><Spinner className="h-5 w-5" /></div>
      ) : (items ?? []).length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-muted">Yozuvlar yo'q</p>
      ) : (
        <ul className="space-y-1.5">
          {(items ?? []).map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge tone={a.type === "bonus" ? "positive" : "negative"}>
                    {ADJUSTMENT_TYPE_LABELS[a.type]}
                  </Badge>
                  <span className="tnum text-ink-muted">{a.period}</span>
                </div>
                <p className="mt-1 truncate text-xs text-ink-soft">{a.reason}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`tnum font-medium ${a.type === "bonus" ? "text-emerald-600" : "text-rose-500"}`}>
                  {a.type === "bonus" ? "+" : "−"}
                  {formatMoney(a.amount)}
                </span>
                <button
                  className="rounded-md p-1 text-rose-500 hover:bg-rose-500/10"
                  title="O'chirish"
                  onClick={() =>
                    deleteAdj
                      .mutateAsync(a.id)
                      .then(() => onToast("O'chirildi"))
                      .catch(() => onToast("O'chirib bo'lmadi — davr yopilgan"))
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Bonus / jarima qo'shish">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Turi</label>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as PayrollAdjustmentType)}
                options={[
                  { value: "bonus", label: "Bonus (+)" },
                  { value: "penalty", label: "Jarima (−)" },
                ]}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Davr (oy)</label>
              <Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="2026-07" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Summa (so'm)</label>
            <NumberInput value={amount} onChange={setAmount} placeholder="500 000" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Sabab <span className="text-negative">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Masalan: ochiq dars tashkil etgani uchun"
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 focus:border-amber focus-visible:focus-ring"
            />
          </div>
          {error && <p className="text-sm text-negative">{error}</p>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>Bekor qilish</Button>
          <Button variant="accent" loading={createAdj.isPending} onClick={submit}>Saqlash</Button>
        </div>
      </Modal>
    </Card>
  );
}

// ─── Oxirgi payslip'lar ────────────────────────────────────────────────────

function PayslipsCard({ staffId }: { staffId: string }) {
  const { data: runs, isLoading } = usePayrollRuns({ staffMemberId: staffId });

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Banknote className="h-4 w-4 text-amber" />
        <h2 className="font-display text-base font-semibold text-ink">Oyliklar tarixi</h2>
      </div>
      {isLoading ? (
        <div className="grid place-items-center py-8"><Spinner className="h-5 w-5" /></div>
      ) : (runs ?? []).length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-muted">
          Hali oylik hisoblanmagan — «Oylik hisobi» sahifasidan generatsiya qilinadi
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
              <th className="py-2 pr-3 font-medium">Davr</th>
              <th className="py-2 pr-3 text-right font-medium">Baza</th>
              <th className="py-2 pr-3 text-right font-medium">Bonus</th>
              <th className="py-2 pr-3 text-right font-medium">Ushlab</th>
              <th className="py-2 pr-3 text-right font-medium">Netto</th>
              <th className="py-2 font-medium">Holat</th>
            </tr>
          </thead>
          <tbody>
            {(runs ?? []).map((r) => (
              <tr key={r.id} className="border-b border-line/60 last:border-0">
                <td className="tnum py-2.5 pr-3 text-ink">{r.period}</td>
                <td className="tnum py-2.5 pr-3 text-right text-ink-soft">{formatMoney(r.baseAmount)}</td>
                <td className="tnum py-2.5 pr-3 text-right text-emerald-600">
                  {r.bonus > 0 ? `+${formatMoney(r.bonus)}` : "—"}
                </td>
                <td className="tnum py-2.5 pr-3 text-right text-rose-500">
                  {r.deduction > 0 ? `−${formatMoney(r.deduction)}` : "—"}
                </td>
                <td className="tnum py-2.5 pr-3 text-right font-semibold text-ink">{formatMoney(r.netAmount)}</td>
                <td className="py-2.5">
                  <Badge tone={PAYROLL_STATUS_TONE[r.status]}>{PAYROLL_STATUS_LABELS[r.status]}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
