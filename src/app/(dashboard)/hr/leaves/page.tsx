"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_TONE,
  LEAVE_TYPE_LABELS,
  LEAVE_TYPES,
  PAGE_SIZES,
  useCreateLeave,
  useDeleteLeave,
  useLeaves,
  useReviewLeave,
  useUpdateLeave,
  type Leave,
  type LeaveInput,
  type LeaveStatus,
  type LeaveType,
} from "@/lib/api/hr-leaves";
import { useStaff } from "@/lib/api/hr";
import { formatDateDMY } from "@/lib/format";
import { Badge, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { NumberInput } from "@/components/ui/number-input";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Drawer } from "@/components/ui/drawer";
import { PageHeader } from "@/components/ui/page-header";

const STATUS_OPTIONS = [
  { value: "", label: "Barchasi" },
  { value: "requested", label: "Kutilmoqda" },
  { value: "approved", label: "Tasdiqlangan" },
  { value: "rejected", label: "Rad etilgan" },
  { value: "cancelled", label: "Bekor qilingan" },
];

export default function LeavesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | LeaveStatus>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Leave | null>(null);
  const [deleting, setDeleting] = useState<Leave | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  const { data, isLoading, isError, refetch } = useLeaves({
    page,
    limit,
    search,
    status: status || undefined,
  });
  const reviewLeave = useReviewLeave();
  const deleteLeave = useDeleteLeave();

  const rows = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pageCount = meta?.pageCount ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  async function review(leave: Leave, next: "approved" | "rejected") {
    try {
      await reviewLeave.mutateAsync({ id: leave.id, status: next });
      setToast(next === "approved" ? "Ta‘til tasdiqlandi" : "Ta‘til rad etildi");
    } catch {
      setToast("Amalni bajarishda xatolik");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteLeave.mutateAsync(deleting.id);
      setDeleting(null);
      setToast("Ta‘til o‘chirildi");
    } catch {
      setToast("O‘chirishda xatolik");
    }
  }

  return (
    <div className="stagger">
      <PageHeader
        title="Ta‘tillar"
        subtitle="Xodimlar ta‘tillarini boshqarish"
        action={
          <Button
            variant="accent"
            onClick={() => {
              setEditing(null);
              setDrawerOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Yaratish
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-9"
            placeholder="Ta‘tillarni qidirish..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as "" | LeaveStatus);
            setPage(1);
          }}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-medium">№</th>
                <th className="px-4 py-3 font-medium">Xodim</th>
                <th className="px-4 py-3 font-medium">Turi</th>
                <th className="px-4 py-3 font-medium">Boshlanish sanasi</th>
                <th className="px-4 py-3 font-medium">Tugash sanasi</th>
                <th className="px-4 py-3 text-right font-medium">Kunlar</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <StateRow colSpan={8}><Spinner className="mx-auto h-5 w-5" /></StateRow>
              ) : isError ? (
                <StateRow colSpan={8}>
                  <div className="flex flex-col items-center gap-2 text-ink-muted">
                    <span className="text-negative">Ma‘lumotni yuklashda xatolik</span>
                    <Button variant="secondary" size="sm" onClick={() => refetch()}>Qayta urinish</Button>
                  </div>
                </StateRow>
              ) : rows.length === 0 ? (
                <StateRow colSpan={8}><span className="text-ink-muted">Ma‘lumot yo‘q</span></StateRow>
              ) : (
                rows.map((l, i) => (
                  <tr key={l.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-ink-muted">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3 font-medium text-ink">{l.staffName ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">{LEAVE_TYPE_LABELS[l.type]}</td>
                    <td className="px-4 py-3 text-ink-soft">{formatDateDMY(l.startDate)}</td>
                    <td className="px-4 py-3 text-ink-soft">{formatDateDMY(l.endDate)}</td>
                    <td className="tnum px-4 py-3 text-right text-ink">{l.days}</td>
                    <td className="px-4 py-3">
                      <Badge tone={LEAVE_STATUS_TONE[l.status]}>{LEAVE_STATUS_LABELS[l.status]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {l.status === "requested" && (
                          <>
                            <button
                              className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-500/10"
                              title="Tasdiqlash"
                              onClick={() => review(l, "approved")}
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              className="rounded-md p-1.5 text-rose-500 hover:bg-rose-500/10"
                              title="Rad etish"
                              onClick={() => review(l, "rejected")}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          className="rounded-md p-1.5 text-ink-muted hover:bg-parchment hover:text-ink"
                          title="Tahrirlash"
                          onClick={() => {
                            setEditing(l);
                            setDrawerOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-md p-1.5 text-rose-500 hover:bg-rose-500/10"
                          title="O‘chirish"
                          onClick={() => setDeleting(l)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-ink-muted">
            <span>Ko‘rsatilmoqda</span>
            <span className="tnum text-ink">{from} - {to}</span>
            <span>dan</span>
            <span className="tnum text-ink">{total}</span>
            <span>natija</span>
          </div>
          <div className="flex items-center gap-2">
            <Select
              className="h-8 w-20 py-0"
              options={PAGE_SIZES.map((n) => ({ value: String(n), label: String(n) }))}
              value={String(limit)}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            />
            <div className="flex items-center gap-1">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(1)}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="tnum px-2 text-ink-muted">{page} / {pageCount}</span>
              <Button variant="secondary" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= pageCount} onClick={() => setPage(pageCount)}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <LeaveDrawer
        open={drawerOpen}
        editing={editing}
        onClose={() => setDrawerOpen(false)}
        onSaved={(msg) => {
          setDrawerOpen(false);
          setToast(msg);
        }}
      />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Ta‘tilni o‘chirish">
        <p className="text-sm text-ink-muted">{deleting?.staffName} ta‘tili o‘chiriladi. Davom etilsinmi?</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Bekor qilish</Button>
          <Button variant="danger" loading={deleteLeave.isPending} onClick={confirmDelete}>O‘chirish</Button>
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink shadow-lg">
          <span className="mr-2 text-positive">✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}

function StateRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">{children}</td>
    </tr>
  );
}

function LeaveDrawer({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: Leave | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const createLeave = useCreateLeave();
  const updateLeave = useUpdateLeave();
  const { data: staffData } = useStaff({ page: 1, limit: 100 });

  const [staffMemberId, setStaffMemberId] = useState("");
  const [type, setType] = useState<LeaveType>("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setStaffMemberId(editing.staffMemberId);
      setType(editing.type);
      setStartDate(editing.startDate);
      setEndDate(editing.endDate);
      setDays(editing.days);
      setReason(editing.reason ?? "");
    } else {
      setStaffMemberId("");
      setType("annual");
      setStartDate("");
      setEndDate("");
      setDays(null);
      setReason("");
    }
    setError(null);
  }, [open, editing]);

  // Sanalar o'zgarsa kunlarni avtomatik hisoblaymiz (qo'lda o'zgartirish mumkin).
  useEffect(() => {
    if (startDate && endDate && endDate >= startDate) {
      const s = new Date(`${startDate}T00:00:00Z`).getTime();
      const e = new Date(`${endDate}T00:00:00Z`).getTime();
      setDays(Math.max(1, Math.round((e - s) / 86_400_000) + 1));
    }
  }, [startDate, endDate]);

  const staffOptions = useMemo(
    () => [
      { value: "", label: "Xodimni tanlang" },
      ...(staffData?.items ?? []).map((s) => ({
        value: s.id,
        label: `${s.lastName} ${s.firstName}`,
      })),
    ],
    [staffData],
  );

  const typeOptions = [
    { value: "", label: "Ta‘til turini tanlang" },
    ...LEAVE_TYPES.map((t) => ({ value: t, label: LEAVE_TYPE_LABELS[t] })),
  ];

  async function submit() {
    if (!staffMemberId) {
      setError("Xodimni tanlang");
      return;
    }
    if (!startDate || !endDate) {
      setError("Sanalarni kiriting");
      return;
    }
    if (endDate < startDate) {
      setError("Tugash sanasi boshlanishdan oldin bo‘lishi mumkin emas");
      return;
    }
    const payload: LeaveInput = {
      staffMemberId,
      type,
      startDate,
      endDate,
      days: days ?? 0,
      reason: reason.trim() || undefined,
    };
    try {
      if (editing) {
        await updateLeave.mutateAsync({ id: editing.id, input: payload });
        onSaved("Ta‘til yangilandi");
      } else {
        await createLeave.mutateAsync(payload);
        onSaved("Ta‘til yaratildi");
      }
    } catch {
      setError("Saqlashda xatolik yuz berdi");
    }
  }

  const pending = createLeave.isPending || updateLeave.isPending;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "Ta‘tilni yangilash" : "Ta‘til yaratish"}
      subtitle="Xodim uchun yangi ta‘til so‘rovini yaratish"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Bekor qilish</Button>
          <Button variant="accent" loading={pending} onClick={submit}>
            {editing ? "Yangilash" : "Yaratish"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Xodim" required>
          <Select value={staffMemberId} onChange={(e) => setStaffMemberId(e.target.value)} options={staffOptions} />
        </Field>
        <Field label="Turi" required>
          <Select value={type} onChange={(e) => setType(e.target.value as LeaveType)} options={typeOptions} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Boshlanish sanasi" required>
            <DatePicker value={startDate} onChange={setStartDate} />
          </Field>
          <Field label="Tugash sanasi" required>
            <DatePicker value={endDate} onChange={setEndDate} />
          </Field>
        </div>
        <Field label="Kunlar" required>
          <NumberInput value={days} onChange={setDays} placeholder="0" />
        </Field>
        <Field label="Sabab">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Ta‘til sababini kiriting"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-amber focus-visible:focus-ring"
          />
        </Field>

        {error && <div className="text-sm text-negative">{error}</div>}
      </div>
    </Drawer>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">
        {label} {required && <span className="text-negative">*</span>}
      </label>
      {children}
    </div>
  );
}
