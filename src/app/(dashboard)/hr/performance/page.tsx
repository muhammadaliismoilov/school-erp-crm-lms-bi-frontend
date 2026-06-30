"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Gauge,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import {
  PAGE_SIZES,
  PERF_STATUS_LABELS,
  PERF_STATUS_TONE,
  useCreatePerformanceReview,
  useDeletePerformanceReview,
  usePerformanceReviewList,
  useUpdatePerformanceReview,
  type PerformanceReview,
  type PerformanceReviewInput,
} from "@/lib/api/hr-performance";
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

export default function PerformancePage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<PerformanceReview | null>(null);
  const [deleting, setDeleting] = useState<PerformanceReview | null>(null);
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

  const { data, isLoading, isError, refetch } = usePerformanceReviewList({ page, limit, search });
  const deleteReview = useDeletePerformanceReview();

  const rows = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pageCount = meta?.pageCount ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteReview.mutateAsync(deleting.id);
      setDeleting(null);
      setToast("Baholash o'chirildi");
    } catch {
      setToast("O'chirishda xatolik");
    }
  }

  return (
    <div className="stagger">
      <PageHeader
        title="Samaradorlik baholash"
        subtitle="Xodimlar samaradorligini baholash"
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

      <div className="mb-4 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-9"
            placeholder="Xodim bo'yicha qidirish..."
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
                <th className="px-4 py-3 font-medium">№</th>
                <th className="px-4 py-3 font-medium">Xodim</th>
                <th className="px-4 py-3 font-medium">Davr</th>
                <th className="px-4 py-3 font-medium">Baho</th>
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
                <StateRow colSpan={6}><span className="text-ink-muted">Ma'lumot yo'q</span></StateRow>
              ) : (
                rows.map((r, i) => (
                  <tr key={r.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-ink-muted">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3 font-medium text-ink">{r.staffName ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">{r.periodStart} — {r.periodEnd}</td>
                    <td className="px-4 py-3">
                      {r.overallRating != null ? (
                        <span className="inline-flex items-center gap-1 font-medium text-ink">
                          <Star className="h-4 w-4 text-amber" />
                          {r.overallRating}/5
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3"><Badge tone={PERF_STATUS_TONE[r.status]}>{PERF_STATUS_LABELS[r.status]}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className="rounded-md p-1.5 text-ink-muted hover:bg-parchment hover:text-ink"
                          title="Tahrirlash"
                          onClick={() => {
                            setEditing(r);
                            setDrawerOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-md p-1.5 text-rose-500 hover:bg-rose-500/10"
                          title="O'chirish"
                          onClick={() => setDeleting(r)}
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

      <ReviewDrawer
        open={drawerOpen}
        editing={editing}
        onClose={() => setDrawerOpen(false)}
        onSaved={(msg) => {
          setDrawerOpen(false);
          setToast(msg);
        }}
      />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Baholashni o'chirish">
        <p className="text-sm text-ink-muted">{deleting?.staffName} uchun baholash o'chiriladi. Davom etilsinmi?</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Bekor qilish</Button>
          <Button variant="danger" loading={deleteReview.isPending} onClick={confirmDelete}>O'chirish</Button>
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

function ReviewDrawer({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: PerformanceReview | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const createReview = useCreatePerformanceReview();
  const updateReview = useUpdatePerformanceReview();
  const { data: staffList } = useStaff({ page: 1, limit: 100 });

  const [staffMemberId, setStaffMemberId] = useState("");
  const [reviewerId, setReviewerId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [overallRating, setOverallRating] = useState<number | null>(null);
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [goals, setGoals] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setStaffMemberId(editing.staffMemberId);
      setReviewerId(editing.reviewerId ?? "");
      setPeriodStart(editing.periodStart);
      setPeriodEnd(editing.periodEnd);
      setOverallRating(editing.overallRating);
      setStrengths(editing.strengths ?? "");
      setImprovements(editing.improvements ?? "");
      setGoals(editing.goals ?? "");
      setNotes(editing.notes ?? "");
    } else {
      setStaffMemberId("");
      setReviewerId("");
      setPeriodStart("");
      setPeriodEnd("");
      setOverallRating(null);
      setStrengths("");
      setImprovements("");
      setGoals("");
      setNotes("");
    }
    setError(null);
  }, [open, editing]);

  const staffOptions = useMemo(
    () => [{ value: "", label: "Xodimni tanlang" }, ...(staffList?.items ?? []).map((s) => ({ value: s.id, label: `${s.lastName} ${s.firstName}` }))],
    [staffList],
  );
  const reviewerOptions = useMemo(
    () => [{ value: "", label: "Baholovchini tanlang" }, ...(staffList?.items ?? []).map((s) => ({ value: s.id, label: `${s.lastName} ${s.firstName}` }))],
    [staffList],
  );

  async function submit() {
    if (!staffMemberId) {
      setError("Xodimni tanlang");
      return;
    }
    if (!periodStart || !periodEnd) {
      setError("Davr sanalarini kiriting");
      return;
    }
    if (periodEnd < periodStart) {
      setError("Tugash sanasi boshlanish sanasidan oldin bo'lishi mumkin emas");
      return;
    }
    if (overallRating != null && (overallRating < 1 || overallRating > 5)) {
      setError("Umumiy baho 1 dan 5 gacha bo'lishi kerak");
      return;
    }
    const payload: PerformanceReviewInput = {
      staffMemberId,
      reviewerId: reviewerId || undefined,
      periodStart,
      periodEnd,
      overallRating: overallRating ?? undefined,
      strengths: strengths.trim() || undefined,
      improvements: improvements.trim() || undefined,
      goals: goals.trim() || undefined,
      notes: notes.trim() || undefined,
    };
    try {
      if (editing) {
        await updateReview.mutateAsync({ id: editing.id, input: payload });
        onSaved("Baholash yangilandi");
      } else {
        await createReview.mutateAsync(payload);
        onSaved("Baholash yaratildi");
      }
    } catch {
      setError("Saqlashda xatolik yuz berdi");
    }
  }

  const pending = createReview.isPending || updateReview.isPending;
  const taClass =
    "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-amber focus-visible:focus-ring";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "Baholashni yangilash" : "Baholash yaratish"}
      icon={<Gauge className="h-5 w-5" />}
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
        <Field label="Baholovchi">
          <Select value={reviewerId} onChange={(e) => setReviewerId(e.target.value)} options={reviewerOptions} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Boshlanish" required>
            <DateInput value={periodStart} onChange={setPeriodStart} />
          </Field>
          <Field label="Tugash" required>
            <DateInput value={periodEnd} onChange={setPeriodEnd} />
          </Field>
        </div>
        <Field label="Umumiy baho (1-5)">
          <NumberInput value={overallRating} onChange={setOverallRating} placeholder="1 - 5" decimal />
        </Field>
        <Field label="Kuchli tomonlar">
          <textarea value={strengths} onChange={(e) => setStrengths(e.target.value)} rows={2} className={taClass} />
        </Field>
        <Field label="Yaxshilanishi kerak">
          <textarea value={improvements} onChange={(e) => setImprovements(e.target.value)} rows={2} className={taClass} />
        </Field>
        <Field label="Keyingi maqsadlar">
          <textarea value={goals} onChange={(e) => setGoals(e.target.value)} rows={2} className={taClass} />
        </Field>
        <Field label="Izohlar">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={taClass} />
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
