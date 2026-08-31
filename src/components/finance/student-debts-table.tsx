"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
  monthKeyStr,
  monthLabel,
  useDebtsStudents,
  type DebtMonthCell,
  type DebtStatusFilter,
  type MonthKey,
  type StudentDebtRow,
} from "@/lib/api/debts";
import { useClassList } from "@/lib/api/classes";
import { formatMoney } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/card";
import { useDebouncedSearch } from "@/lib/hooks/use-debounced-search";

const PAGE_SIZES = [10, 20, 50, 100];

const STATUS_FILTERS: { value: "" | DebtStatusFilter; label: string }[] = [
  { value: "", label: "Barcha holatlar" },
  { value: "unpaid", label: "To‘lanmagan" },
  { value: "partial", label: "Qisman" },
  { value: "paid", label: "To‘liq to‘langan" },
];

/** Oylik katakcha — to'langan summa, holatga qarab rangli; muddati kelmagan → "—" yoki avans. */
function MonthCell({ cell }: { cell: DebtMonthCell }) {
  if (!cell.due) {
    // Muddati kelmagan oyga to'lov bo'lsa — avans (oldindan to'langan).
    if (cell.paid > 0) {
      return <span className="tnum font-medium text-sky-600" title="Avans (oldindan)">+{formatMoney(cell.paid)}</span>;
    }
    return <span className="text-ink-muted/40">—</span>;
  }
  if (cell.status === "paid") {
    return <span className="tnum font-medium text-emerald-600">{formatMoney(cell.paid)}</span>;
  }
  if (cell.status === "partial") {
    return <span className="tnum font-medium text-amber-600">{formatMoney(cell.paid)}</span>;
  }
  return <span className="tnum font-medium text-rose-600">−{formatMoney(cell.expected)}</span>;
}

/** Real balans holati — qarzdor/avans/teng (bir qaraganda tushunarli). */
function balanceState(real: number): { label: string; chip: string; amount: string } {
  if (real < -1) return { label: "Qarzdor", chip: "bg-rose-500/10 text-rose-600", amount: "text-rose-600" };
  if (real > 1) return { label: "Avans", chip: "bg-emerald-500/10 text-emerald-600", amount: "text-emerald-600" };
  return { label: "Teng", chip: "bg-ink-muted/10 text-ink-muted", amount: "text-ink-muted" };
}

/** UMUMIY QARZ — holat chip + real balans summasi (qarzdor qizil −, avans yashil +). */
function TotalCell({ row }: { row: StudentDebtRow }) {
  const st = balanceState(row.realBalance);
  return (
    <div className="flex flex-col items-end gap-1">
      <span className={`text-base font-bold tnum ${st.amount}`}>
        {row.realBalance === 0 ? "0" : `${row.realBalance > 0 ? "+" : "−"}${formatMoney(Math.abs(row.realBalance))}`}
      </span>
      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.chip}`}>{st.label}</span>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: number;
  /** emerald/rose — doim shu ishora; net — qiymat ishorasiga qarab (manfiy=qarz, musbat=avans). */
  tone: "emerald" | "rose" | "net";
  hint?: string;
}) {
  // "net" — real balans: ishora va rang qiymatga qarab (chalkashlikni oldini oladi).
  const positive = value > 1;
  const negative = value < -1;
  const cls =
    tone === "emerald" || (tone === "net" && positive)
      ? "text-emerald-600"
      : tone === "rose" || (tone === "net" && negative)
        ? "text-rose-600"
        : "text-ink-muted";
  const sign = tone === "emerald" || (tone === "net" && positive) ? "+" : tone === "rose" || (tone === "net" && negative) ? "−" : "";
  // Real balans uchun ma'noni ochib beruvchi izoh.
  const netHint = tone === "net" ? (negative ? "Ota-ona foydasiga (qarz)" : positive ? "Maktab foydasiga (avans)" : "Teng") : hint;
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={`mt-1 font-display text-xl font-semibold tnum ${cls}`}>
        {sign}
        {formatMoney(Math.abs(value))} <span className="text-sm font-normal text-ink-muted">UZS</span>
      </p>
      {netHint && <p className="mt-0.5 text-[11px] text-ink-muted">{netHint}</p>}
    </div>
  );
}

export function StudentDebtsTable() {
  const [search, setSearch] = useState("");
  const searchQuery = useDebouncedSearch(search);
  // Qidiruv o'zgarsa birinchi sahifaga qaytamiz. Reset DEBOUNCELANGAN qiymatga
  // bog'langan: harf bosilganda qaytarsak, kutish tugashidan oldin eski qidiruv
  // bilan ortiqcha so'rov ketardi (foydalanuvchi 1-sahifada bo'lmasa).
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);
  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState<"" | DebtStatusFilter>("");
  const [month, setMonth] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data: classesData } = useClassList();
  const { data, isLoading, isError, refetch } = useDebtsStudents({
    search: searchQuery,
    classId: classId || undefined,
    status: status || undefined,
    month: month || undefined,
    page,
    limit,
  });

  const axis = useMemo(() => data?.axis ?? [], [data?.axis]);
  const rows = data?.items ?? [];
  const meta = data?.meta;
  const summary = data?.summary;
  const total = meta?.total ?? 0;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const classOptions = useMemo(
    () => [
      { value: "", label: "Barcha guruhlar" },
      ...(classesData?.items ?? []).map((c) => ({ value: c.id, label: c.name })),
    ],
    [classesData],
  );

  const monthOptions = useMemo(
    () => [{ value: "", label: "Barcha oylar" }, ...axis.map((m: MonthKey) => ({ value: monthKeyStr(m), label: monthLabel(m, true) }))],
    [axis],
  );

  function resetPage() {
    setPage(1);
  }

  return (
    <div className="card overflow-hidden">
      {/* Sarlavha + sanoq */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">O‘quvchilar qarzlari</h3>
          <p className="text-sm text-ink-muted">Oylik to‘lov matritsasi</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded-full bg-ink-muted/10 px-3 py-1 text-ink-muted">
            Jami o‘quvchilar: <span className="font-semibold text-ink">{summary?.studentCount ?? 0}</span>
          </span>
          <span className="rounded-full bg-rose-500/10 px-3 py-1 text-rose-600">
            Qarzdorlar: <span className="font-semibold">{summary?.debtorCount ?? 0}</span>
          </span>
        </div>
      </div>

      {/* Filtrlar */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism yoki guruh bo‘yicha qidirish..."
            className="pl-9"
          />
        </div>
        <Select options={classOptions} value={classId} onChange={(e) => { setClassId(e.target.value); resetPage(); }} className="min-w-[150px]" />
        <Select options={STATUS_FILTERS} value={status} onChange={(e) => { setStatus(e.target.value as "" | DebtStatusFilter); resetPage(); }} className="min-w-[160px]" />
        <Select options={monthOptions} value={month} onChange={(e) => { setMonth(e.target.value); resetPage(); }} className="min-w-[150px]" />
      </div>

      {/* Balans xulosasi */}
      <div className="grid gap-3 px-5 pb-4 sm:grid-cols-3">
        <SummaryCard label="Maktab ota-ona oldida qarzi" value={summary?.schoolOwesTotal ?? 0} tone="emerald" />
        <SummaryCard label="Ota-ona maktab oldida qarzi" value={summary?.parentOwesTotal ?? 0} tone="rose" />
        <SummaryCard label="Real balans" value={summary?.realBalanceTotal ?? 0} tone="net" />
      </div>

      {/* Matritsa jadval */}
      <div className="overflow-x-auto border-t border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-parchment-deep/30">
              <th className="label px-3 py-3 text-left">#</th>
              <th className="label px-3 py-3 text-left">O‘quvchi ismi</th>
              <th className="label px-3 py-3 text-left">Guruh</th>
              {axis.map((m) => (
                <th key={monthKeyStr(m)} className="label px-3 py-3 text-right whitespace-nowrap">{monthLabel(m)}</th>
              ))}
              <th className="label px-3 py-3 text-right">Umumiy qarz</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={axis.length + 4} className="px-4 py-16 text-center"><Spinner /></td></tr>
            ) : isError ? (
              <tr>
                <td colSpan={axis.length + 4} className="px-4 py-16 text-center text-ink-muted">
                  Xatolik yuz berdi. <button className="text-accent underline" onClick={() => refetch()}>Qayta urinish</button>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={axis.length + 4} className="px-4 py-16 text-center text-ink-muted">Ma‘lumot yo‘q</td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.studentId} className="border-b border-line/60 last:border-0 hover:bg-parchment-deep/20">
                  <td className="px-3 py-3 text-ink-muted tnum">{from + i}</td>
                  <td className="px-3 py-3 font-medium text-ink whitespace-nowrap">{r.studentName}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">{r.className ?? "—"}</span>
                  </td>
                  {r.months.map((c) => (
                    <td key={monthKeyStr(c)} className="px-3 py-3 text-right whitespace-nowrap"><MonthCell cell={c} /></td>
                  ))}
                  <td className="px-3 py-3 text-right"><TotalCell row={r} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm">
          <span className="text-ink-muted">Ko‘rsatilmoqda {from} - {to} dan {total} natija</span>
          <div className="flex items-center gap-3">
            <Select
              options={PAGE_SIZES.map((s) => ({ value: String(s), label: String(s) }))}
              value={String(limit)}
              onChange={(e) => { setLimit(Number(e.target.value)); resetPage(); }}
              className="w-[72px]"
            />
            <div className="flex items-center gap-1">
              <button className="rounded-md p-1.5 text-ink-muted hover:bg-parchment-deep disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="tnum px-2">{page} / {meta?.pageCount ?? 1}</span>
              <button className="rounded-md p-1.5 text-ink-muted hover:bg-parchment-deep disabled:opacity-40" disabled={page >= (meta?.pageCount ?? 1)} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
