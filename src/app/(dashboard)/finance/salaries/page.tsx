"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  currentPeriod,
  PAGE_SIZES,
  recentPeriods,
  SALARY_STATUS_LABELS,
  useAdjustSalary,
  useApproveSalary,
  useRecalculateSalaries,
  useSalaries,
  useTeacherRates,
  useUpsertTeacherRate,
  type SalaryRow,
} from "@/lib/api/teacher-salaries";
import { formatMoney } from "@/lib/utils";
import { Badge, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { NumberInput } from "@/components/ui/number-input";
import { Select } from "@/components/ui/select";
import { Can } from "@/components/auth/can";
import { useCan } from "@/lib/auth/use-can";

type Tab = "rates" | "payroll";

export default function SalariesPage() {
  const [tab, setTab] = useState<Tab>("rates");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <div className="stagger">
      <div className="mb-5 flex items-center gap-1 rounded-xl border border-line bg-surface/60 p-1">
        <TabButton active={tab === "rates"} onClick={() => setTab("rates")}>
          Dars stavkalari
        </TabButton>
        <TabButton active={tab === "payroll"} onClick={() => setTab("payroll")}>
          Oylik hisob-kitob
        </TabButton>
      </div>

      {tab === "rates" ? (
        <RatesView onToast={setToast} />
      ) : (
        <PayrollView onToast={setToast} />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink shadow-lg">
          <span className="mr-2 text-positive">✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-lg px-4 py-2 text-sm font-medium transition-colors " +
        (active
          ? "bg-accent text-accent-fg shadow-sm"
          : "text-ink-muted hover:text-ink")
      }
    >
      {children}
    </button>
  );
}

// ─── Dars stavkalari ───────────────────────────────────────────────────────

function RatesView({ onToast }: { onToast: (msg: string) => void }) {
  const canEditRates = useCan()("finance-teacher-rates.update");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const { data, isLoading, isError, refetch } = useTeacherRates({ page, limit, search });
  const upsert = useUpsertTeacherRate();

  const rows = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pageCount = meta?.pageCount ?? 1;

  async function saveRate(teacherId: string, ratePerLesson: number) {
    try {
      await upsert.mutateAsync({ teacherId, ratePerLesson });
      onToast("Dars stavkasi saqlandi");
    } catch {
      onToast("Stavkani saqlashda xatolik");
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">
            O‘qituvchilar uchun dars stavkalari
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Har bir o‘qituvchi uchun dars boshiga stavkani sozlang.
          </p>
        </div>
      </div>

      <div className="mb-4 max-w-xs">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-9"
            placeholder="Ism bo‘yicha qidirish..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">To‘liq ism</th>
                <th className="px-4 py-3 font-medium">Telefon</th>
                <th className="px-4 py-3 font-medium">Ish turi</th>
                <th className="px-4 py-3 font-medium">Daraja</th>
                <th className="px-4 py-3 text-right font-medium">Dars uchun stavka</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <StateRow colSpan={6}>
                  <Spinner className="mx-auto h-5 w-5" />
                </StateRow>
              ) : isError ? (
                <StateRow colSpan={6}>
                  <ErrorState onRetry={refetch} />
                </StateRow>
              ) : rows.length === 0 ? (
                <StateRow colSpan={6}>
                  <span className="text-ink-muted">O‘qituvchilar topilmadi</span>
                </StateRow>
              ) : (
                rows.map((r, i) => (
                  <tr key={r.teacherId} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-ink-muted">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3 font-medium text-ink">{r.fullName}</td>
                    <td className="px-4 py-3 text-ink-soft">{r.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">{r.employmentType ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">{r.level ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <RateCell
                          initial={r.ratePerLesson}
                          disabled={upsert.isPending || !canEditRates}
                          onCommit={(value) => saveRate(r.teacherId, value)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && rows.length > 0 && (
          <Pagination
            page={page}
            pageCount={pageCount}
            limit={limit}
            total={total}
            onLimit={(n) => {
              setLimit(n);
              setPage(1);
            }}
            onPage={setPage}
          />
        )}
      </div>
    </div>
  );
}

/** Inline tahrirlanadigan stavka katakchasi — blur yoki Enter'da saqlaydi. */
function RateCell({
  initial,
  disabled,
  onCommit,
}: {
  initial: number;
  disabled?: boolean;
  onCommit: (value: number) => void;
}) {
  const [value, setValue] = useState<number | null>(initial);

  useEffect(() => {
    setValue(initial);
  }, [initial]);

  function commit() {
    const next = value ?? 0;
    if (next !== initial) onCommit(next);
  }

  return (
    <div
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
    >
      <NumberInput
        className="w-44 text-right"
        value={value}
        disabled={disabled}
        onChange={setValue}
      />
    </div>
  );
}

// ─── Oylik hisob-kitob ─────────────────────────────────────────────────────

function PayrollView({ onToast }: { onToast: (msg: string) => void }) {
  // Tuzatish ham, tasdiqlash ham oylikni yangilaydi.
  const showActions = useCan()("finance-salaries.update");
  const colCount = showActions ? 8 : 7;
  const periods = useMemo(() => recentPeriods(18), []);
  const [period, setPeriod] = useState(currentPeriod());
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [editing, setEditing] = useState<SalaryRow | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const { data, isLoading, isError, refetch, isFetching } = useSalaries({
    period,
    page,
    limit,
    search,
  });
  const recalc = useRecalculateSalaries();
  const approve = useApproveSalary();

  const rows = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pageCount = meta?.pageCount ?? 1;

  async function onRecalculate() {
    try {
      const res = await recalc.mutateAsync({ period });
      onToast(`Qayta hisoblandi (${res.updated} ta o‘qituvchi)`);
    } catch {
      onToast("Qayta hisoblashda xatolik");
    }
  }

  async function onApprove(row: SalaryRow) {
    if (!row.id) return;
    try {
      await approve.mutateAsync(row.id);
      onToast("O‘qituvchi maoshi muvaffaqiyatli tasdiqlandi");
    } catch {
      onToast("Tasdiqlashda xatolik");
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">
            Oylik maoshni hisoblash va tasdiqlash
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Tanlangan oy uchun yakunlangan darslarni qayta hisoblang, qo‘lda tuzatish kiriting va
            maoshlarni to‘lovga tasdiqlang.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">Oy</label>
            <Select
              className="w-40"
              options={periods}
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Can permission="finance-salaries.update">
            <Button variant="accent" onClick={onRecalculate} loading={recalc.isPending}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Qayta hisoblash
            </Button>
          </Can>
        </div>
      </div>

      <div className="mb-4 max-w-xs">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-9"
            placeholder="Ism bo‘yicha qidirish..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-medium">To‘liq ism</th>
                <th className="px-4 py-3 text-right font-medium">Yakunlangan darslar</th>
                <th className="px-4 py-3 text-right font-medium">Dars uchun stavka</th>
                <th className="px-4 py-3 text-right font-medium">Hisoblangan summa</th>
                <th className="px-4 py-3 text-right font-medium">Yakuniy summa</th>
                <th className="px-4 py-3 font-medium">Holat</th>
                <th className="px-4 py-3 font-medium">Izoh</th>
                {showActions && (
                  <th className="px-4 py-3 text-right font-medium">Amallar</th>
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <StateRow colSpan={colCount}>
                  <Spinner className="mx-auto h-5 w-5" />
                </StateRow>
              ) : isError ? (
                <StateRow colSpan={colCount}>
                  <ErrorState onRetry={refetch} />
                </StateRow>
              ) : rows.length === 0 ? (
                <StateRow colSpan={colCount}>
                  <span className="text-ink-muted">O‘qituvchilar topilmadi</span>
                </StateRow>
              ) : (
                rows.map((r) => {
                  const approved = r.status === "approved";
                  return (
                    <tr key={r.teacherId} className="border-b border-line/60 last:border-0">
                      <td className="px-4 py-3 font-medium text-ink">{r.fullName}</td>
                      <td className="tnum px-4 py-3 text-right text-ink">{r.completedLessons}</td>
                      <td className="tnum px-4 py-3 text-right text-ink-soft">
                        {formatMoney(r.ratePerLesson)}
                      </td>
                      <td className="tnum px-4 py-3 text-right text-ink-soft">
                        {formatMoney(r.computedAmount)}
                      </td>
                      <td className="tnum px-4 py-3 text-right font-semibold text-ink">
                        {formatMoney(r.finalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={approved ? "positive" : "caution"}>
                          {SALARY_STATUS_LABELS[r.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-muted">
                        <div>{r.adjustmentReason ?? "Izoh yo‘q"}</div>
                        {r.approvedAt && (
                          <div className="mt-0.5">
                            Tasdiqlangan vaqt: {new Date(r.approvedAt).toLocaleString("uz")}
                          </div>
                        )}
                      </td>
                      {showActions && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={approved || !r.id}
                              onClick={() => setEditing(r)}
                            >
                              <Pencil className="mr-1.5 h-3.5 w-3.5" />
                              Tuzatish
                            </Button>
                            <Button
                              variant="accent"
                              size="sm"
                              disabled={approved || !r.id}
                              loading={approve.isPending && approve.variables === r.id}
                              onClick={() => onApprove(r)}
                            >
                              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                              Tasdiqlash
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && rows.length > 0 && (
          <Pagination
            page={page}
            pageCount={pageCount}
            limit={limit}
            total={total}
            onLimit={(n) => {
              setLimit(n);
              setPage(1);
            }}
            onPage={setPage}
          />
        )}
      </div>

      <AdjustModal
        row={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          onToast("Maosh tuzatildi");
        }}
      />

      {isFetching && !isLoading && (
        <div className="pointer-events-none fixed right-6 top-20 z-40 flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-ink-muted shadow">
          <Spinner className="h-3.5 w-3.5" /> Yangilanmoqda…
        </div>
      )}
    </div>
  );
}

// ─── Tuzatish modali ───────────────────────────────────────────────────────

function AdjustModal({
  row,
  onClose,
  onSaved,
}: {
  row: SalaryRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const adjust = useAdjustSalary();
  const [lessons, setLessons] = useState<number | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (row) {
      setLessons(row.completedLessons);
      setAmount(row.finalAmount);
      setReason(row.adjustmentReason ?? "");
      setError(null);
    }
  }, [row]);

  async function submit() {
    if (!row?.id) return;
    if (reason.trim().length === 0) {
      setError("Tuzatish sababini yozing");
      return;
    }
    try {
      await adjust.mutateAsync({
        id: row.id,
        input: {
          adjustedLessons: lessons ?? undefined,
          adjustedAmount: amount ?? undefined,
          adjustmentReason: reason.trim(),
        },
      });
      onSaved();
    } catch {
      setError("Saqlashda xatolik yuz berdi");
    }
  }

  return (
    <Modal
      open={!!row}
      onClose={onClose}
      title="O‘qituvchi maoshini tuzatish"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button variant="accent" onClick={submit} loading={adjust.isPending}>
            Qo‘llash
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <div className="text-xs font-medium text-ink-muted">O‘qituvchi</div>
          <div className="mt-0.5 text-ink-soft">{row?.fullName}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Tuzatilgan dars soni
            </label>
            <NumberInput value={lessons} onChange={setLessons} placeholder="0" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Tuzatilgan summa</label>
            <NumberInput value={amount} onChange={setAmount} placeholder="0" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Tuzatish sababi</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Nima uchun qiymatlar o‘zgarganini yozing"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-amber focus-visible:focus-ring"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-negative">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Umumiy yordamchilar ───────────────────────────────────────────────────

function StateRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center">
        {children}
      </td>
    </tr>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 text-ink-muted">
      <Calculator className="h-6 w-6 text-negative" />
      <span>Ma‘lumotni yuklashda xatolik</span>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Qayta urinish
      </Button>
    </div>
  );
}

function Pagination({
  page,
  pageCount,
  limit,
  total,
  onLimit,
  onPage,
}: {
  page: number;
  pageCount: number;
  limit: number;
  total: number;
  onLimit: (n: number) => void;
  onPage: React.Dispatch<React.SetStateAction<number>>;
}) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm">
      <div className="flex items-center gap-2 text-ink-muted">
        <span>Ko‘rinish:</span>
        <Select
          className="h-8 w-20 py-0"
          options={PAGE_SIZES.map((n) => ({ value: String(n), label: String(n) }))}
          value={String(limit)}
          onChange={(e) => onLimit(Number(e.target.value))}
        />
        <span className="ml-2">
          <span className="tnum text-ink">
            {from} – {to}
          </span>{" "}
          / <span className="tnum">{total}</span>
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(() => 1)}>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPage((p) => Math.max(1, p - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="tnum px-2 text-ink-muted">
          {page} / {pageCount}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onPage((p) => Math.min(pageCount, p + 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onPage(() => pageCount)}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
