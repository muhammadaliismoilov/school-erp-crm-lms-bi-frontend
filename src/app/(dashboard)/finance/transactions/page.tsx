"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Eye,
  Pencil,
  Plus,
  Scale,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  exportTransactions,
  monthLabel,
  MONTH_LABELS,
  TRANSACTION_TYPE_LABELS,
  useDeleteTransaction,
  useTransactionOptions,
  useTransactions,
  useTransactionStatistics,
  type Transaction,
  type TransactionListParams,
  type TransactionType,
} from "@/lib/api/transactions";
import { useUsers } from "@/lib/api/users";
import { useAuthStore } from "@/lib/auth/store";
import { formatDateDMY } from "@/lib/format";
import { formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Drawer } from "@/components/ui/drawer";
import { Spinner } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/students/stat-card";

const PAGE_SIZES = [10, 20, 50, 100];

const TYPE_OPTIONS = [
  { value: "", label: "Barcha turlar" },
  { value: "income", label: "Kirim" },
  { value: "expense", label: "Chiqim" },
];

const MONTH_OPTIONS = [
  { value: "", label: "Barcha oylar" },
  ...MONTH_LABELS.map((m, i) => ({ value: String(i + 1), label: m })),
];

const CHART_COLORS = ["#0ea5e9", "#22c55e", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6", "#ec4899", "#64748b"];

type Tab = "list" | "stats";

export default function TransactionsPage() {
  const router = useRouter();
  const can = useAuthStore((s) => s.can);
  const canManage = can("finance.manage");

  const [tab, setTab] = useState<Tab>("list");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"" | TransactionType>("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentTypeId, setPaymentTypeId] = useState("");
  const [personId, setPersonId] = useState("");
  const [month, setMonth] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [viewing, setViewing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [exporting, setExporting] = useState(false);

  const filters: TransactionListParams = useMemo(
    () => ({
      search: search || undefined,
      type: type || undefined,
      purposeCategoryId: categoryId || undefined,
      paymentTypeId: paymentTypeId || undefined,
      personId: personId || undefined,
      month: month ? Number(month) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [search, type, categoryId, paymentTypeId, personId, month, dateFrom, dateTo],
  );

  const { data, isLoading, isError, refetch } = useTransactions({ page, limit, ...filters });
  const { data: stats } = useTransactionStatistics(filters, tab === "stats");
  const { data: options } = useTransactionOptions();
  const { data: usersData } = useUsers({ page: 1, limit: 100 });
  const deleteTx = useDeleteTransaction();

  const rows = data?.items ?? [];
  const summary = data?.stats;
  const total = data?.meta.total ?? 0;
  const pageCount = data?.meta.pageCount ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "Barcha maqsadlar" },
      ...(options?.categories ?? []).map((c) => ({ value: c.id, label: c.name })),
    ],
    [options],
  );
  const paymentTypeOptions = useMemo(
    () => [
      { value: "", label: "Barcha to‘lov turlari" },
      ...(options?.paymentTypes ?? []).map((p) => ({ value: p.id, label: p.name })),
    ],
    [options],
  );
  const personOptions = useMemo(
    () => [
      { value: "", label: "Barcha shaxslar" },
      ...(usersData?.items ?? []).map((u) => ({
        value: u.id,
        label: `${u.lastName} ${u.firstName}`.trim(),
      })),
    ],
    [usersData],
  );

  const hasFilters =
    search !== "" || type !== "" || categoryId !== "" || paymentTypeId !== "" ||
    personId !== "" || month !== "" || dateFrom !== "" || dateTo !== "";

  function resetPage() {
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setType("");
    setCategoryId("");
    setPaymentTypeId("");
    setPersonId("");
    setMonth("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  async function confirmDelete() {
    if (!deleting) return;
    await deleteTx.mutateAsync(deleting.id);
    setDeleting(null);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const all = await exportTransactions(filters);
      downloadCsv(all);
    } finally {
      setExporting(false);
    }
  }

  const statCards = useMemo(
    () => [
      {
        label: "Balans",
        value: summary ? formatMoney(summary.balance) : "—",
        icon: <Scale className="h-5 w-5" />,
        tone: (summary && summary.balance < 0 ? "rose" : "accent") as "rose" | "accent",
      },
      { label: "Jami kirim", value: summary ? formatMoney(summary.totalIncome) : "—", icon: <ArrowDownLeft className="h-5 w-5" />, tone: "sky" as const },
      { label: "Jami chiqim", value: summary ? formatMoney(summary.totalExpense) : "—", icon: <ArrowUpRight className="h-5 w-5" />, tone: "amber" as const },
      { label: "Tranzaksiyalar", value: summary?.count ?? "—", icon: <Wallet className="h-5 w-5" />, tone: "violet" as const },
    ],
    [summary],
  );

  return (
    <div className="stagger">
      <PageHeader
        title="Tranzaksiyalar"
        subtitle="Kirim va chiqim tranzaksiyalarini boshqarish"
      />

      {/* Tablar */}
      <div className="mb-4 inline-flex rounded-lg border border-line bg-surface p-0.5">
        {(
          [
            { value: "list", label: "Tranzaksiyalar" },
            { value: "stats", label: "Statistika" },
          ] as { value: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.value ? "bg-accent text-accent-fg" : "text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Statistika kartalar */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} tone={c.tone} />
        ))}
      </div>

      {/* Filtrlar */}
      <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            placeholder="Izoh yoki shaxs bo‘yicha qidirish"
            className="pl-9"
          />
        </div>
        <DatePicker
          value={dateFrom}
          onChange={(iso) => {
            setDateFrom(iso);
            resetPage();
          }}
          placeholder="Boshlanish sanasi"
        />
        <DatePicker
          value={dateTo}
          onChange={(iso) => {
            setDateTo(iso);
            resetPage();
          }}
          placeholder="Tugash sanasi"
        />
        <Select
          options={TYPE_OPTIONS}
          value={type}
          onChange={(e) => {
            setType(e.target.value as "" | TransactionType);
            resetPage();
          }}
        />
        <Select
          options={categoryOptions}
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            resetPage();
          }}
        />
        <Select
          options={paymentTypeOptions}
          value={paymentTypeId}
          onChange={(e) => {
            setPaymentTypeId(e.target.value);
            resetPage();
          }}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select
            options={personOptions}
            value={personId}
            onChange={(e) => {
              setPersonId(e.target.value);
              resetPage();
            }}
          />
          <Select
            options={MONTH_OPTIONS}
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              resetPage();
            }}
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        {hasFilters && (
          <Button variant="secondary" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4" /> Tozalash
          </Button>
        )}
        <span className="text-sm text-ink-muted">
          <span className="tnum text-ink">{total}</span> ta tranzaksiya
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" size="sm" disabled={exporting || total === 0} onClick={handleExport}>
            <Download className="h-4 w-4" /> {exporting ? "Tayyorlanmoqda…" : "Excelga eksport"}
          </Button>
          {canManage && (
            <Button size="sm" onClick={() => router.push("/finance/transactions/create")}>
              <Plus className="h-4 w-4" /> Tranzaksiya qo‘shish
            </Button>
          )}
        </div>
      </div>

      {tab === "stats" ? (
        <StatisticsPanel stats={stats} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-parchment-deep/40">
                  <th className="label px-4 py-3 text-left">№</th>
                  <th className="label px-4 py-3 text-left">Sana</th>
                  <th className="label px-4 py-3 text-left">To‘lov maqsadi</th>
                  <th className="label px-4 py-3 text-left">Shaxs</th>
                  <th className="label px-4 py-3 text-right">Miqdor</th>
                  <th className="label px-4 py-3 text-left">To‘lov turi</th>
                  <th className="label px-4 py-3 text-left">Oy</th>
                  <th className="label px-4 py-3 text-right">Amallar</th>
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
                  rows.map((r, i) => (
                    <tr key={r.id} className="border-b border-line/60 last:border-0 hover:bg-parchment-deep/20">
                      <td className="px-4 py-3 text-ink-muted tnum">{from + i}</td>
                      <td className="px-4 py-3">{formatDateDMY(r.date)}</td>
                      <td className="px-4 py-3">{r.purposeCategoryName ?? "—"}</td>
                      <td className="px-4 py-3">
                        {r.personName ?? "—"}
                        {r.personRole && <span className="ml-1 text-xs text-ink-muted/70">({r.personRole})</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <AmountCell type={r.type} amount={r.amount} />
                      </td>
                      <td className="px-4 py-3">{r.paymentTypeName ?? "—"}</td>
                      <td className="px-4 py-3">{monthLabel(r.month)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="rounded-md p-1.5 text-ink-muted hover:bg-parchment-deep hover:text-ink"
                            title="Ko‘rish"
                            onClick={() => setViewing(r)}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canManage && (
                            <>
                              <button
                                className="rounded-md p-1.5 text-ink-muted hover:bg-parchment-deep hover:text-ink"
                                title="Tahrirlash"
                                onClick={() => router.push(`/finance/transactions/create?id=${r.id}`)}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                className="rounded-md p-1.5 text-rose-500 hover:bg-rose-500/10"
                                title="O‘chirish"
                                onClick={() => setDeleting(r)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && rows.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm">
              <div className="flex items-center gap-2 text-ink-muted">
                <span>Ko‘rinish:</span>
                <Select
                  className="h-8 w-20 py-0"
                  options={PAGE_SIZES.map((n) => ({ value: String(n), label: String(n) }))}
                  value={String(limit)}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                />
                <span className="ml-2">
                  <span className="tnum text-ink">
                    {from} – {to}
                  </span>{" "}
                  / <span className="tnum">{total}</span>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(1)}>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="tnum px-2 text-ink-muted">
                  {page} / {pageCount}
                </span>
                <Button variant="secondary" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="sm" disabled={page >= pageCount} onClick={() => setPage(pageCount)}>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ko‘rish drawer */}
      <Drawer
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Tranzaksiya tafsilotlari"
        icon={<Wallet className="h-5 w-5" />}
      >
        {viewing && (
          <dl className="space-y-3 text-sm">
            <Detail label="Turi" value={<AmountCell type={viewing.type} amount={viewing.amount} withLabel />} />
            <Detail label="Sana" value={formatDateDMY(viewing.date)} />
            <Detail label="To‘lov maqsadi" value={viewing.purposeCategoryName ?? "—"} />
            <Detail label="To‘lov turi" value={viewing.paymentTypeName ?? "—"} />
            <Detail label="Shaxs" value={viewing.personName ?? "—"} />
            <Detail label="Lavozim" value={viewing.personRole ?? "—"} />
            <Detail label="Oy" value={monthLabel(viewing.month)} />
            <Detail label="Yil" value={viewing.year ?? "—"} />
            {viewing.discountPercent != null && <Detail label="Chegirma" value={`${viewing.discountPercent}%`} />}
            {viewing.price != null && <Detail label="Asl narx" value={formatMoney(viewing.price)} />}
            <Detail label="Izoh" value={viewing.note ?? "—"} />
          </dl>
        )}
      </Drawer>

      {/* O‘chirish tasdig‘i */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Tranzaksiyani o‘chirish"
      >
        <p className="text-sm text-ink-muted">
          Ushbu tranzaksiya ({deleting && formatMoney(deleting.amount)}) o‘chiriladi. Davom etilsinmi?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>
            Bekor qilish
          </Button>
          <Button variant="danger" disabled={deleteTx.isPending} onClick={confirmDelete}>
            O‘chirish
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function AmountCell({ type, amount, withLabel }: { type: TransactionType; amount: number; withLabel?: boolean }) {
  const income = type === "income";
  return (
    <span className={`tnum font-semibold ${income ? "text-emerald-600" : "text-rose-600"}`}>
      {income ? "+" : "−"}
      {formatMoney(amount)}
      {withLabel && <span className="ml-2 text-xs font-normal text-ink-muted">{TRANSACTION_TYPE_LABELS[type]}</span>}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/60 pb-2">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}

function StatisticsPanel({ stats }: { stats: ReturnType<typeof useTransactionStatistics>["data"] }) {
  if (!stats) {
    return (
      <div className="card grid place-items-center py-20">
        <Spinner />
      </div>
    );
  }
  const monthly = stats.monthly.map((m) => ({ ...m, name: MONTH_LABELS[m.month - 1] ?? String(m.month) }));
  const category = stats.byCategory.slice(0, 8);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card p-4">
        <h3 className="mb-3 font-display text-sm font-semibold text-ink">Oylik kirim/chiqim</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatMoney(v)} width={70} />
            <Tooltip formatter={(value) => formatMoney(Number(value))} />
            <Legend />
            <Bar dataKey="income" name="Kirim" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Chiqim" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-4">
        <h3 className="mb-3 font-display text-sm font-semibold text-ink">Kategoriya bo‘yicha taqsimot</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={category} dataKey="amount" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
              {category.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatMoney(Number(value))} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-4 lg:col-span-2">
        <h3 className="mb-3 font-display text-sm font-semibold text-ink">To‘lov turi bo‘yicha</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={stats.byPaymentType} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => formatMoney(v)} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
            <Tooltip formatter={(value) => formatMoney(Number(value))} />
            <Bar dataKey="amount" name="Summa" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Tranzaksiyalarni CSV (Excel ochadi) sifatida yuklab beradi. */
function downloadCsv(items: Transaction[]) {
  const headers = ["Sana", "Turi", "Maqsad", "Shaxs", "Lavozim", "Miqdor", "To‘lov turi", "Oy", "Yil", "Izoh"];
  const lines = items.map((r) =>
    [
      r.date,
      TRANSACTION_TYPE_LABELS[r.type],
      r.purposeCategoryName ?? "",
      r.personName ?? "",
      r.personRole ?? "",
      String(r.amount),
      r.paymentTypeName ?? "",
      monthLabel(r.month),
      r.year ?? "",
      (r.note ?? "").replace(/"/g, '""'),
    ]
      .map((c) => `"${String(c)}"`)
      .join(","),
  );
  const csv = "﻿" + [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tranzaksiyalar-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
