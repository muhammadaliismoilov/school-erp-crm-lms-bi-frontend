"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  PAGE_SIZES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONE,
  useCreatePayment,
  useDeletePayment,
  usePaymentList,
  useUpdatePayment,
  type HrPayment,
  type HrPaymentInput,
  type HrPaymentStatus,
} from "@/lib/api/hr-payments";
import { useStaff } from "@/lib/api/hr";
import { Badge, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { NumberInput } from "@/components/ui/number-input";
import { Select } from "@/components/ui/select";
import { DateInput } from "@/components/ui/date-input";
import { Drawer } from "@/components/ui/drawer";
import { PageHeader } from "@/components/ui/page-header";

const STATUS_OPTIONS = (Object.keys(PAYMENT_STATUS_LABELS) as HrPaymentStatus[]).map((s) => ({
  value: s,
  label: PAYMENT_STATUS_LABELS[s],
}));

export default function PaymentsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<HrPaymentStatus | "">("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<HrPayment | null>(null);
  const [deleting, setDeleting] = useState<HrPayment | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const deletePayment = useDeletePayment();

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

  const { data, isLoading, isError, refetch } = usePaymentList({
    page,
    limit,
    search,
    status: status || undefined,
  });

  const rows = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pageCount = meta?.pageCount ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deletePayment.mutateAsync(deleting.id);
      setDeleting(null);
      setToast("To'lov o'chirildi");
    } catch {
      setToast("O'chirishda xatolik");
    }
  }

  return (
    <div className="stagger">
      <PageHeader
        title="To'lovlar"
        subtitle="Xodimlar to'lovlarini boshqarish"
        action={
          <Button
            variant="accent"
            onClick={() => {
              setEditing(null);
              setDrawerOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            To'lov qo'shish
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-9"
            placeholder="To'lovlarni qidirish..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select
          className="h-10 w-48"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as HrPaymentStatus | "");
            setPage(1);
          }}
          options={[{ value: "", label: "Barcha" }, ...STATUS_OPTIONS]}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-medium">№</th>
                <th className="px-4 py-3 font-medium">Xodim</th>
                <th className="px-4 py-3 font-medium">Summa</th>
                <th className="px-4 py-3 font-medium">Sana</th>
                <th className="px-4 py-3 font-medium">Holat</th>
                <th className="px-4 py-3 text-right font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <StateRow colSpan={6}><Spinner className="mx-auto h-5 w-5" /></StateRow>
              ) : isError ? (
                <StateRow colSpan={6}>
                  <div className="flex flex-col items-center gap-2 text-ink-muted">
                    <span className="text-negative">Ma'lumotni yuklashda xatolik</span>
                    <Button variant="secondary" size="sm" onClick={() => refetch()}>Qayta urinish</Button>
                  </div>
                </StateRow>
              ) : rows.length === 0 ? (
                <StateRow colSpan={6}><span className="text-ink-muted">Ma'lumotlar yo'q</span></StateRow>
              ) : (
                rows.map((p, i) => (
                  <tr key={p.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-ink-muted">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3 font-medium text-ink">{p.staffName ?? "—"}</td>
                    <td className="px-4 py-3 tnum text-ink">{p.amount.toLocaleString("ru-RU")}</td>
                    <td className="px-4 py-3 text-ink-soft">{p.paymentDate ?? "—"}</td>
                    <td className="px-4 py-3"><Badge tone={PAYMENT_STATUS_TONE[p.status]}>{PAYMENT_STATUS_LABELS[p.status]}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className="rounded-md p-1.5 text-ink-muted hover:bg-parchment hover:text-ink"
                          title="Tahrirlash"
                          onClick={() => {
                            setEditing(p);
                            setDrawerOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-md p-1.5 text-rose-500 hover:bg-rose-500/10"
                          title="O'chirish"
                          onClick={() => setDeleting(p)}
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
            <span>Ko'rsatilmoqda</span>
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

      <PaymentDrawer
        open={drawerOpen}
        editing={editing}
        onClose={() => setDrawerOpen(false)}
        onSaved={(msg) => {
          setDrawerOpen(false);
          setToast(msg);
        }}
      />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="To'lovni o'chirish">
        <p className="text-sm text-ink-muted">{deleting?.staffName} uchun to'lov o'chiriladi. Davom etilsinmi?</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Bekor qilish</Button>
          <Button variant="danger" loading={deletePayment.isPending} onClick={confirmDelete}>O'chirish</Button>
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

function PaymentDrawer({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: HrPayment | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();
  const { data: staffList } = useStaff({ page: 1, limit: 100 });

  const [staffMemberId, setStaffMemberId] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [paymentDate, setPaymentDate] = useState("");
  const [status, setStatus] = useState<HrPaymentStatus>("pending");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setStaffMemberId(editing.staffMemberId);
      setAmount(editing.amount);
      setPaymentDate(editing.paymentDate ?? "");
      setStatus(editing.status);
      setNote(editing.note ?? "");
    } else {
      setStaffMemberId("");
      setAmount(null);
      setPaymentDate("");
      setStatus("pending");
      setNote("");
    }
    setError(null);
  }, [open, editing]);

  const staffOptions = useMemo(
    () => [{ value: "", label: "Xodimni tanlang" }, ...(staffList?.items ?? []).map((s) => ({ value: s.id, label: `${s.lastName} ${s.firstName}` }))],
    [staffList],
  );

  async function submit() {
    if (!staffMemberId) {
      setError("Xodimni tanlang");
      return;
    }
    if (amount == null || amount < 0) {
      setError("Summani kiriting");
      return;
    }
    const payload: HrPaymentInput = {
      staffMemberId,
      amount,
      paymentDate: paymentDate || undefined,
      status,
      note: note.trim() || undefined,
    };
    try {
      if (editing) {
        await updatePayment.mutateAsync({ id: editing.id, input: payload });
        onSaved("To'lov yangilandi");
      } else {
        await createPayment.mutateAsync(payload);
        onSaved("To'lov yaratildi");
      }
    } catch {
      setError("Saqlashda xatolik yuz berdi");
    }
  }

  const pending = createPayment.isPending || updatePayment.isPending;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "To'lovni yangilash" : "To'lov yaratish"}
      icon={<Banknote className="h-5 w-5" />}
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
        <Field label="Summa" required>
          <NumberInput value={amount} onChange={setAmount} placeholder="0" />
        </Field>
        <Field label="To'lov sanasi">
          <DateInput value={paymentDate} onChange={setPaymentDate} />
        </Field>
        <Field label="Holat">
          <Select value={status} onChange={(e) => setStatus(e.target.value as HrPaymentStatus)} options={STATUS_OPTIONS} />
        </Field>
        <Field label="Izoh">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Izoh"
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
