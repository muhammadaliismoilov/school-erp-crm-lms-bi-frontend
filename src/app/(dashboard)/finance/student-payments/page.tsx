"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  Banknote,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  Download,
  Eye,
  Pencil,
  Plus,
  Receipt,
  Search,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import {
  exportStudentPayments,
  monthLabel,
  STATUS_LABELS,
  STATUS_TONES,
  useDeleteStudentPayment,
  useStudentPayments,
  type StudentPayment,
  type StudentPaymentListParams,
  type StudentPaymentStatus,
} from "@/lib/api/student-payments";
import { useAuthStore } from "@/lib/auth/store";
import { formatDateDMY } from "@/lib/format";
import { formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Drawer } from "@/components/ui/drawer";
import { Spinner } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/students/stat-card";
import { StudentBalancesView } from "@/components/students/student-balances-view";
import { PlanConfigEditor } from "@/components/students/plan-config-editor";

const PAGE_SIZES = [10, 20, 50, 100];

const MONTH_TABS = [
  "Yan", "Fev", "Mar", "Apr", "May", "Iyun",
  "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek",
] as const;

/** To'lov turi filtr chiplar — rasmdagi 3 ta (code orqali filtrlaydi). */
const PAYMENT_TYPE_CHIPS = [
  { code: "cash", label: "Naqd", icon: Banknote },
  { code: "card", label: "Karta", icon: CreditCard },
  { code: "bank", label: "O‘tkazma", icon: ArrowLeftRight },
] as const;

const CURRENT_YEAR = new Date().getFullYear();

export default function StudentPaymentsPage() {
  const router = useRouter();
  const can = useAuthStore((s) => s.can);
  const currentUser = useAuthStore((s) => s.user);
  const canManage = can("finance.manage");
  const isSuperAdmin = can("*.*");
  // Yozuvni faqat egasi yoki super-admin o'zgartira/o'chira oladi; egasi
  // noma'lum eski yozuvlarda (createdBy=null) — finance.manage yetarli (back-compat).
  const canModify = (createdBy: string | null) =>
    canManage && (createdBy == null || createdBy === currentUser?.id || isSuperAdmin);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState<number | null>(null); // null = Barchasi
  const [paymentTypeCode, setPaymentTypeCode] = useState("");

  const [view, setView] = useState<"payments" | "balances" | "plan-config">("payments");
  const [viewing, setViewing] = useState<StudentPayment | null>(null);
  const [deleting, setDeleting] = useState<StudentPayment | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const filters: StudentPaymentListParams = useMemo(
    () => ({
      search: search || undefined,
      month: month ?? undefined,
      year: CURRENT_YEAR,
      paymentTypeCode: paymentTypeCode || undefined,
    }),
    [search, month, paymentTypeCode],
  );

  const { data, isLoading, isError, refetch } = useStudentPayments({ page, limit, ...filters });
  const deletePayment = useDeleteStudentPayment();

  const rows = data?.items ?? [];
  const stats = data?.stats;
  const total = data?.meta.total ?? 0;
  const pageCount = data?.meta.pageCount ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const hasFilters = search !== "" || month !== null || paymentTypeCode !== "";

  function resetPage() {
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setMonth(null);
    setPaymentTypeCode("");
    setPage(1);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteError(null);
    try {
      await deletePayment.mutateAsync(deleting.id);
      setDeleting(null);
    } catch (e) {
      setDeleteError(
        e instanceof Error ? e.message : "O‘chirishda xatolik yuz berdi. Ruxsatingizni tekshiring.",
      );
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const all = await exportStudentPayments(filters);
      downloadCsv(all);
    } finally {
      setExporting(false);
    }
  }

  const statCards = useMemo(
    () => [
      {
        label: "Oylik reja",
        value: stats ? formatMoney(stats.monthlyPlan) : "—",
        icon: <CalendarRange className="h-5 w-5" />,
        tone: "sky" as const,
      },
      {
        label: "Yig‘ilgan",
        value: stats ? formatMoney(stats.collected) : "—",
        icon: <TrendingUp className="h-5 w-5" />,
        tone: "accent" as const,
      },
      {
        label: "Qoldiq",
        value: stats ? formatMoney(stats.remaining) : "—",
        icon: <Wallet className="h-5 w-5" />,
        tone: (stats && stats.remaining > 0 ? "rose" : "violet") as "rose" | "violet",
      },
      {
        label: "Bugun to‘langan",
        value: stats ? formatMoney(stats.paidToday) : "—",
        icon: <Banknote className="h-5 w-5" />,
        tone: "amber" as const,
      },
    ],
    [stats],
  );

  return (
    <div className="stagger">
      <PageHeader title="To‘lovlar" subtitle="O‘quvchilarning to‘lovlarini boshqarish" />

      {/* Ko'rinish tablari: To'lovlar / Qarzdorlik */}
      <div className="mb-5 inline-flex overflow-hidden rounded-xl border border-line">
        {([
          { key: "payments", label: "To‘lovlar" },
          { key: "balances", label: "Qarzdorlik" },
          { key: "plan-config", label: "Reja chegirmasi" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            className={`px-5 py-2 text-sm font-semibold transition-colors ${
              view === t.key ? "bg-accent text-accent-fg" : "bg-surface text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === "plan-config" ? (
        <PlanConfigEditor />
      ) : view === "balances" ? (
        <StudentBalancesView />
      ) : (
        <>
      {/* Statistika kartalar */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} tone={c.tone} />
        ))}
      </div>

      {/* Qidiruv + qo'shish */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            placeholder="O‘quvchi ismi bo‘yicha qidirish"
            className="pl-9"
          />
        </div>
        <Button variant="secondary" size="sm" disabled={exporting || total === 0} onClick={handleExport}>
          <Download className="h-4 w-4" /> {exporting ? "Tayyorlanmoqda…" : "Excelga eksport"}
        </Button>
        {canManage && (
          <Button size="sm" onClick={() => router.push("/finance/student-payments/create")}>
            <Plus className="h-4 w-4" /> To‘lov qo‘shish
          </Button>
        )}
      </div>

      {/* Oy tablari + to'lov turi chiplar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {MONTH_TABS.map((label, i) => {
          const value = i + 1;
          const active = month === value;
          return (
            <button
              key={label}
              onClick={() => {
                setMonth(active ? null : value);
                resetPage();
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                active ? "bg-accent text-accent-fg" : "bg-surface text-ink-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          );
        })}
        <button
          onClick={() => {
            setMonth(null);
            resetPage();
          }}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            month === null ? "bg-accent text-accent-fg" : "bg-surface text-ink-muted hover:text-ink"
          }`}
        >
          Barchasi
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {PAYMENT_TYPE_CHIPS.map((chip) => {
            const active = paymentTypeCode === chip.code;
            const Icon = chip.icon;
            return (
              <button
                key={chip.code}
                onClick={() => {
                  setPaymentTypeCode(active ? "" : chip.code);
                  resetPage();
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-accent bg-accent/12 text-accent"
                    : "border-line bg-surface text-ink-muted hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4" /> {chip.label}
              </button>
            );
          })}
          {hasFilters && (
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4" /> Tozalash
            </Button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-parchment-deep/40">
                <th className="label px-4 py-3 text-left">№</th>
                <th className="label px-4 py-3 text-left">Sana</th>
                <th className="label px-4 py-3 text-left">O‘quvchi</th>
                <th className="label px-4 py-3 text-left">Sinf</th>
                <th className="label px-4 py-3 text-right">Summa</th>
                <th className="label px-4 py-3 text-left">To‘lov turi</th>
                <th className="label px-4 py-3 text-left">Kvitansiya raqami</th>
                <th className="label px-4 py-3 text-left">Holat</th>
                <th className="label px-4 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <Spinner />
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-ink-muted">
                    Xatolik yuz berdi.{" "}
                    <button className="text-accent underline" onClick={() => refetch()}>
                      Qayta urinish
                    </button>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-ink-muted">
                    Ma‘lumot yo‘q
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={r.id} className="border-b border-line/60 last:border-0 hover:bg-parchment-deep/20">
                    <td className="px-4 py-3 text-ink-muted tnum">{from + i}</td>
                    <td className="px-4 py-3">{formatDateDMY(r.paymentDate)}</td>
                    <td className="px-4 py-3 font-medium text-ink">{r.studentName}</td>
                    <td className="px-4 py-3">{r.className ?? "—"}</td>
                    <td className="px-4 py-3 text-right tnum font-semibold text-ink">{formatMoney(r.amount)}</td>
                    <td className="px-4 py-3">{r.paymentTypeName ?? "—"}</td>
                    <td className="px-4 py-3 tnum text-ink-muted">{r.receiptNumber}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="rounded-md p-1.5 text-ink-muted hover:bg-parchment-deep hover:text-ink"
                          title="Ko‘rish"
                          onClick={() => setViewing(r)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {canModify(r.createdBy) && (
                          <>
                            <button
                              className="rounded-md p-1.5 text-ink-muted hover:bg-parchment-deep hover:text-ink"
                              title="Tahrirlash"
                              onClick={() => router.push(`/finance/student-payments/create?id=${r.id}`)}
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
                Ko‘rsatilmoqda{" "}
                <span className="tnum text-ink">
                  {from} - {to}
                </span>{" "}
                dan <span className="tnum text-ink">{total}</span> natija
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

      {/* Ko‘rish drawer */}
      <Drawer
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="To‘lov tafsilotlari"
        icon={<Receipt className="h-5 w-5" />}
      >
        {viewing && (
          <dl className="space-y-3 text-sm">
            <Detail label="O‘quvchi" value={viewing.studentName} />
            <Detail label="Sinf" value={viewing.className ?? "—"} />
            <Detail label="Sana" value={formatDateDMY(viewing.paymentDate)} />
            <Detail label="Oy" value={monthLabel(viewing.month)} />
            <Detail label="Summa" value={formatMoney(viewing.amount)} />
            {viewing.planAmount != null && <Detail label="Oylik reja" value={formatMoney(viewing.planAmount)} />}
            <Detail label="To‘lov turi" value={viewing.paymentTypeName ?? "—"} />
            <Detail label="Kvitansiya raqami" value={viewing.receiptNumber} />
            <Detail label="Holat" value={<StatusBadge status={viewing.status} />} />
            <Detail label="Izoh" value={viewing.note ?? "—"} />
            <Detail
              label="Kiritdi"
              value={
                viewing.createdByName
                  ? `${viewing.createdByName}${viewing.createdByRole ? ` (${viewing.createdByRole})` : ""} · ${formatDateDMY(viewing.createdAt)}`
                  : "—"
              }
            />
            {viewing.updatedByName && viewing.updatedBy !== viewing.createdBy && (
              <Detail
                label="O‘zgartirdi"
                value={`${viewing.updatedByName}${viewing.updatedByRole ? ` (${viewing.updatedByRole})` : ""} · ${formatDateDMY(viewing.updatedAt)}`}
              />
            )}
          </dl>
        )}
      </Drawer>

      {/* O‘chirish tasdig‘i */}
      <Modal
        open={!!deleting}
        onClose={() => {
          setDeleting(null);
          setDeleteError(null);
        }}
        title="To‘lovni o‘chirish"
      >
        <p className="text-sm text-ink-muted">
          Ushbu to‘lov ({deleting?.studentName}, {deleting && formatMoney(deleting.amount)}) o‘chiriladi. Davom etilsinmi?
        </p>
        {deleteError && <p className="mt-2 text-sm text-rose-600">{deleteError}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>
            Bekor qilish
          </Button>
          <Button variant="danger" disabled={deletePayment.isPending} onClick={confirmDelete}>
            O‘chirish
          </Button>
        </div>
      </Modal>
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: StudentPaymentStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_TONES[status]}`}>
      {STATUS_LABELS[status]}
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

/** To'lovlarni CSV (Excel ochadi) sifatida yuklab beradi. */
function downloadCsv(items: StudentPayment[]) {
  const headers = ["Sana", "O‘quvchi", "Sinf", "Summa", "To‘lov turi", "Kvitansiya raqami", "Holat", "Oy", "Yil"];
  const lines = items.map((r) =>
    [
      r.paymentDate,
      r.studentName,
      r.className ?? "",
      String(r.amount),
      r.paymentTypeName ?? "",
      r.receiptNumber,
      STATUS_LABELS[r.status],
      monthLabel(r.month),
      String(r.year),
    ]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(","),
  );
  const csv = "﻿" + [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tolovlar-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
