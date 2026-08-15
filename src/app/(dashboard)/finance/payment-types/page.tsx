"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  CreditCard,
  Layers,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  usePaymentTypes,
  useCreatePaymentType,
  useUpdatePaymentType,
  useDeletePaymentType,
  type PaymentType,
} from "@/lib/api/payment-types";
import { formatDateTimeDMY } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/students/stat-card";
import { useCrudPermissions } from "@/lib/auth/use-can";
import { Can } from "@/components/auth/can";

const PAGE_SIZES = [10, 20, 50, 100];

export default function PaymentTypesPage() {
  // Backend: transactions.controller `payment-types/*` — `transaction-payment-types.*`.
  const { canCreate, canUpdate, canDelete, canMutate } = useCrudPermissions(
    "transaction-payment-types",
  );

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentType | null>(null);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<PaymentType | null>(null);

  const { data, isLoading, isError, refetch } = usePaymentTypes({
    page,
    limit,
    search: search || undefined,
  });
  const createMut = useCreatePaymentType();
  const updateMut = useUpdatePaymentType();
  const deleteMut = useDeletePaymentType();

  const rows = data?.items ?? [];
  const stats = data?.stats;
  const total = data?.meta.total ?? 0;
  const pageCount = data?.meta.pageCount ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const statCards = useMemo(
    () => [
      { label: "Jami to‘lov turlari", value: stats?.total ?? "—", icon: <Layers className="h-5 w-5" />, tone: "accent" as const },
      { label: "Bu oy qo‘shilgan", value: stats?.addedThisMonth ?? "—", icon: <Calendar className="h-5 w-5" />, tone: "sky" as const },
      {
        label: "Oxirgi qo‘shilgan",
        value: stats?.latestName ?? "—",
        icon: <Clock className="h-5 w-5" />,
        tone: "amber" as const,
        hint: stats?.latestCreatedAt ? formatDateTimeDMY(stats.latestCreatedAt) : undefined,
      },
    ],
    [stats],
  );

  function openCreate() {
    setEditing(null);
    setName("");
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(pt: PaymentType) {
    setEditing(pt);
    setName(pt.name);
    setFormError(null);
    setFormOpen(true);
  }

  async function submitForm() {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setFormError("Nomi bo‘sh bo‘lmasligi kerak");
      return;
    }
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, input: { name: trimmed } });
      } else {
        await createMut.mutateAsync({ name: trimmed });
      }
      setFormOpen(false);
    } catch {
      setFormError("Saqlashda xatolik yuz berdi");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    await deleteMut.mutateAsync(deleting.id);
    setDeleting(null);
  }

  const busy = createMut.isPending || updateMut.isPending;
  /** "Amallar" ustuni ruxsatsizda chizilmaydi — bo'sh holat colSpan'i ham qisqaradi. */
  const colCount = canMutate ? 4 : 3;

  return (
    <div className="stagger">
      <PageHeader title="To‘lov turlari" subtitle="To‘lov usullarini boshqarish (Naqd, Karta va h.k.)" />

      {/* Statistika */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} tone={c.tone} hint={c.hint} />
        ))}
      </div>

      {/* Qidiruv + qo‘shish */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="To‘lov turlarini qidirish"
            className="pl-9"
          />
        </div>
        <Can permission="transaction-payment-types.create">
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> To‘lov turi qo‘shish
          </Button>
        </Can>
      </div>

      {/* Jadval */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-parchment-deep/40">
                <th className="label px-4 py-3 text-left">№</th>
                <th className="label px-4 py-3 text-left">Nomi</th>
                <th className="label px-4 py-3 text-left">Yaratilgan vaqt</th>
                {canMutate && <th className="label px-4 py-3 text-right">Amallar</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-16 text-center">
                    <Spinner />
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-16 text-center text-ink-muted">
                    Xatolik yuz berdi.{" "}
                    <button className="text-accent underline" onClick={() => refetch()}>
                      Qayta urinish
                    </button>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-16 text-center text-ink-muted">
                    Ma‘lumot yo‘q
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={r.id} className="border-b border-line/60 last:border-0 hover:bg-parchment-deep/20">
                    <td className="px-4 py-3 text-ink-muted tnum">{from + i}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-md bg-accent/10 text-accent">
                          <CreditCard className="h-4 w-4" />
                        </span>
                        <span className="font-medium text-ink">{r.name}</span>
                        {r.isSystem && (
                          <span className="rounded bg-line/60 px-1.5 py-0.5 text-[11px] text-ink-muted">tizim</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-ink-muted">
                        <Calendar className="h-4 w-4" />
                        {formatDateTimeDMY(r.createdAt)}
                      </span>
                    </td>
                    {canMutate && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {canUpdate && (
                            <button
                              className="rounded-md p-1.5 text-ink-muted hover:bg-parchment-deep hover:text-ink"
                              title="Tahrirlash"
                              onClick={() => openEdit(r)}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              className="rounded-md p-1.5 text-rose-500 hover:bg-rose-500/10 disabled:opacity-40"
                              title={r.isSystem ? "Tizim turini o‘chirib bo‘lmaydi" : "O‘chirish"}
                              disabled={r.isSystem}
                              onClick={() => setDeleting(r)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
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
                Ko‘rsatildi{" "}
                <span className="tnum text-ink">
                  {from} – {to}
                </span>{" "}
                dan <span className="tnum">{total}</span> natija
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

      {/* Yaratish / Tahrirlash modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "To‘lov turini yangilash" : "To‘lov turi yaratish"}
        subtitle={editing ? "To‘lov turi nomini o‘zgartiring" : "Yangi to‘lov turini qo‘shing"}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Bekor qilish
            </Button>
            <Button disabled={busy || !(editing ? canUpdate : canCreate)} onClick={submitForm}>
              {busy ? "Saqlanmoqda…" : editing ? "Yangilash" : "Yaratish"}
            </Button>
          </div>
        }
      >
        <div className="space-y-1.5">
          <label className="label" htmlFor="pt-name">
            Nomi
          </label>
          <Input
            id="pt-name"
            value={name}
            autoFocus
            onChange={(e) => {
              setName(e.target.value);
              setFormError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitForm();
            }}
            placeholder="To‘lov turi nomini kiriting"
          />
          {formError && <p className="text-sm text-rose-600">{formError}</p>}
        </div>
      </Modal>

      {/* O‘chirish tasdig‘i */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="To‘lov turini o‘chirish" size="md">
        <p className="text-sm text-ink-muted">
          “{deleting?.name}” to‘lov turi o‘chiriladi. Davom etilsinmi?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>
            Bekor qilish
          </Button>
          <Button variant="danger" disabled={deleteMut.isPending || !canDelete} onClick={confirmDelete}>
            O‘chirish
          </Button>
        </div>
      </Modal>
    </div>
  );
}
