"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Search, TrendingDown, TrendingUp, Users, Wallet } from "lucide-react";
import {
  useStudentBalances,
  type BalanceStatus,
  type StudentBalanceRow,
} from "@/lib/api/student-balances";
import { useClassList } from "@/lib/api/classes";
import { PLAN_LABELS } from "@/lib/api/payment-plans";
import { formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/card";
import { StatCard } from "@/components/students/stat-card";

const PAGE_SIZES = [10, 20, 50, 100];

const STATUS_FILTERS: { value: "" | BalanceStatus; label: string }[] = [
  { value: "", label: "Barchasi" },
  { value: "debtor", label: "Qarzdorlar" },
  { value: "advance", label: "Avans (ortiqcha)" },
  { value: "settled", label: "Tenglar" },
];

/** Balansni rangli ko'rsatadi: qarz qizil, avans yashil, teng kulrang. */
function BalanceCell({ row }: { row: StudentBalanceRow }) {
  if (row.status === "debtor") {
    return <span className="font-semibold text-rose-600 tnum">−{formatMoney(Math.abs(row.balance))}</span>;
  }
  if (row.status === "advance") {
    return <span className="font-semibold text-emerald-600 tnum">+{formatMoney(row.balance)}</span>;
  }
  return <span className="text-ink-muted tnum">0</span>;
}

function StatusChip({ status }: { status: BalanceStatus }) {
  const map = {
    debtor: { label: "Qarzdor", cls: "bg-rose-500/10 text-rose-600" },
    advance: { label: "Avans", cls: "bg-emerald-500/10 text-emerald-600" },
    settled: { label: "Teng", cls: "bg-ink-muted/10 text-ink-muted" },
  } as const;
  const m = map[status];
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${m.cls}`}>{m.label}</span>;
}

export function StudentBalancesView() {
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState<"" | BalanceStatus>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data: classesData } = useClassList();
  const { data, isLoading, isError, refetch } = useStudentBalances({
    search: search || undefined,
    classId: classId || undefined,
    status: status || undefined,
    sort: "-balance",
    page,
    limit,
  });

  const rows = data?.items ?? [];
  const meta = data?.meta;
  const stats = data?.stats;
  const total = meta?.total ?? 0;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const classOptions = useMemo(
    () => [
      { value: "", label: "Barcha sinflar" },
      ...(classesData?.items ?? []).map((c) => ({ value: c.id, label: c.name })),
    ],
    [classesData],
  );

  function resetPage() {
    setPage(1);
  }

  function exportCsv() {
    const headers = ["O‘quvchi", "Sinf", "Reja", "Oylik tarif", "Kutilgan", "To‘langan", "Balans", "Holat"];
    const lines = rows.map((r) =>
      [
        r.studentName,
        r.className ?? "",
        r.plan ? PLAN_LABELS[r.plan] : "Oyma-oy",
        String(r.monthlyFee),
        String(r.expected),
        String(r.paid),
        String(r.balance),
        r.status,
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qarzdorlik-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Statistika */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Jami qarz"
          value={stats ? formatMoney(stats.totalDebt) : "—"}
          icon={<TrendingDown className="h-5 w-5" />}
          tone="rose"
        />
        <StatCard
          label="Jami avans"
          value={stats ? formatMoney(stats.totalAdvance) : "—"}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="accent"
        />
        <StatCard
          label="Qarzdorlar"
          value={stats ? String(stats.debtorCount) : "—"}
          icon={<Users className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          label="Avansda"
          value={stats ? String(stats.advanceCount) : "—"}
          icon={<Wallet className="h-5 w-5" />}
          tone="violet"
        />
      </div>

      {/* Filtrlar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            placeholder="O‘quvchi ismi yoki kodi"
            className="pl-9"
          />
        </div>
        <Select
          options={classOptions}
          value={classId}
          onChange={(e) => {
            setClassId(e.target.value);
            resetPage();
          }}
          className="min-w-[160px]"
        />
        <Select
          options={STATUS_FILTERS}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as "" | BalanceStatus);
            resetPage();
          }}
          className="min-w-[160px]"
        />
        <Button variant="secondary" size="sm" disabled={rows.length === 0} onClick={exportCsv}>
          <Download className="h-4 w-4" /> Eksport
        </Button>
      </div>

      {/* Jadval */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-parchment-deep/30">
                <th className="label px-4 py-3 text-left">O‘quvchi</th>
                <th className="label px-4 py-3 text-left">Sinf</th>
                <th className="label px-4 py-3 text-left">Reja</th>
                <th className="label px-4 py-3 text-right">Oylik tarif</th>
                <th className="label px-4 py-3 text-right">Kutilgan</th>
                <th className="label px-4 py-3 text-right">To‘langan</th>
                <th className="label px-4 py-3 text-right">Balans</th>
                <th className="label px-4 py-3 text-left">Holat</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <Spinner />
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-ink-muted">
                    Xatolik yuz berdi.{" "}
                    <button className="text-accent underline" onClick={() => refetch()}>
                      Qayta urinish
                    </button>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-ink-muted">
                    Ma‘lumot yo‘q
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.studentId} className="border-b border-line/60 last:border-0 hover:bg-parchment-deep/20">
                    <td className="px-4 py-3 font-medium">{r.studentName}</td>
                    <td className="px-4 py-3 text-ink-muted">{r.className ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-muted">{r.plan ? PLAN_LABELS[r.plan] : "Oyma-oy"}</td>
                    <td className="px-4 py-3 text-right tnum">{formatMoney(r.monthlyFee)}</td>
                    <td className="px-4 py-3 text-right tnum">{formatMoney(r.expected)}</td>
                    <td className="px-4 py-3 text-right tnum">{formatMoney(r.paid)}</td>
                    <td className="px-4 py-3 text-right">
                      <BalanceCell row={r} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip status={r.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm">
            <span className="text-ink-muted">
              Ko‘rsatilmoqda {from} - {to} dan {total} natija
            </span>
            <div className="flex items-center gap-3">
              <Select
                options={PAGE_SIZES.map((s) => ({ value: String(s), label: String(s) }))}
                value={String(limit)}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  resetPage();
                }}
                className="w-[72px]"
              />
              <div className="flex items-center gap-1">
                <button
                  className="rounded-md p-1.5 text-ink-muted hover:bg-parchment-deep disabled:opacity-40"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="tnum px-2">
                  {page} / {meta?.pageCount ?? 1}
                </span>
                <button
                  className="rounded-md p-1.5 text-ink-muted hover:bg-parchment-deep disabled:opacity-40"
                  disabled={page >= (meta?.pageCount ?? 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
