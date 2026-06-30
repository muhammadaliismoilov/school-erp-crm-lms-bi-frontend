"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
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
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
  useCreateSchedule,
  useDeleteSchedule,
  useScheduleList,
  useUpdateSchedule,
  type Weekday,
  type WorkSchedule,
  type WorkScheduleDayInput,
  type WorkScheduleInput,
} from "@/lib/api/hr-schedules";
import { Badge, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Drawer } from "@/components/ui/drawer";
import { PageHeader } from "@/components/ui/page-header";

const WEEKDAY_OPTIONS = WEEKDAY_ORDER.map((w) => ({ value: w, label: WEEKDAY_LABELS[w] }));

export default function SchedulesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<WorkSchedule | null>(null);
  const [deleting, setDeleting] = useState<WorkSchedule | null>(null);
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

  const { data, isLoading, isError, refetch } = useScheduleList({ page, limit, search });
  const deleteSchedule = useDeleteSchedule();

  const rows = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pageCount = meta?.pageCount ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteSchedule.mutateAsync(deleting.id);
      setDeleting(null);
      setToast("Jadval o'chirildi");
    } catch {
      setToast("O'chirishda xatolik");
    }
  }

  return (
    <div className="stagger">
      <PageHeader
        title="Jadvallar"
        subtitle="Ish jadvallari shablonlari"
        action={
          <Button
            variant="accent"
            onClick={() => {
              setEditing(null);
              setDrawerOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Jadval qo'shish
          </Button>
        }
      />

      <div className="mb-4 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-9"
            placeholder="Jadvallarni qidirish..."
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
                <th className="px-4 py-3 font-medium">Nomi</th>
                <th className="px-4 py-3 font-medium">Kunlar</th>
                <th className="px-4 py-3 font-medium">Holat</th>
                <th className="px-4 py-3 text-right font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <StateRow colSpan={5}><Spinner className="mx-auto h-5 w-5" /></StateRow>
              ) : isError ? (
                <StateRow colSpan={5}>
                  <div className="flex flex-col items-center gap-2 text-ink-muted">
                    <span className="text-negative">Ma'lumotni yuklashda xatolik</span>
                    <Button variant="secondary" size="sm" onClick={() => refetch()}>Qayta urinish</Button>
                  </div>
                </StateRow>
              ) : rows.length === 0 ? (
                <StateRow colSpan={5}><span className="text-ink-muted">Ma'lumot yo'q</span></StateRow>
              ) : (
                rows.map((s, i) => (
                  <tr key={s.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-ink-muted">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-medium text-ink">
                        <CalendarDays className="h-4 w-4 text-ink-muted" />
                        {s.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 tnum text-ink-soft">{s.days.length}</td>
                    <td className="px-4 py-3">
                      {s.isStandard ? <Badge tone="positive">Standart</Badge> : <Badge tone="neutral">Maxsus</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className="rounded-md p-1.5 text-ink-muted hover:bg-parchment hover:text-ink"
                          title="Tahrirlash"
                          onClick={() => {
                            setEditing(s);
                            setDrawerOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-md p-1.5 text-rose-500 hover:bg-rose-500/10"
                          title="O'chirish"
                          onClick={() => setDeleting(s)}
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

      <ScheduleDrawer
        open={drawerOpen}
        editing={editing}
        onClose={() => setDrawerOpen(false)}
        onSaved={(msg) => {
          setDrawerOpen(false);
          setToast(msg);
        }}
      />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Jadvalni o'chirish">
        <p className="text-sm text-ink-muted">{deleting?.name} o'chiriladi. Davom etilsinmi?</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Bekor qilish</Button>
          <Button variant="danger" loading={deleteSchedule.isPending} onClick={confirmDelete}>O'chirish</Button>
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

type DayState = {
  weekday: Weekday;
  startTime: string;
  endTime: string;
  lunchStart: string;
  lunchEnd: string;
};

function emptyDay(weekday: Weekday): DayState {
  return { weekday, startTime: "09:00", endTime: "18:00", lunchStart: "13:00", lunchEnd: "14:00" };
}

function ScheduleDrawer({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: WorkSchedule | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isStandard, setIsStandard] = useState(false);
  const [days, setDays] = useState<DayState[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setDescription(editing.description ?? "");
      setIsStandard(editing.isStandard);
      setDays(
        editing.days.map((d) => ({
          weekday: d.weekday,
          startTime: d.startTime ?? "",
          endTime: d.endTime ?? "",
          lunchStart: d.lunchStart ?? "",
          lunchEnd: d.lunchEnd ?? "",
        })),
      );
    } else {
      setName("");
      setDescription("");
      setIsStandard(false);
      setDays([emptyDay("monday")]);
    }
    setError(null);
  }, [open, editing]);

  function addDay() {
    const used = new Set(days.map((d) => d.weekday));
    const next = WEEKDAY_ORDER.find((w) => !used.has(w)) ?? "monday";
    setDays((d) => [...d, emptyDay(next)]);
  }

  function updateDay(index: number, patch: Partial<DayState>) {
    setDays((d) => d.map((day, i) => (i === index ? { ...day, ...patch } : day)));
  }

  function removeDay(index: number) {
    setDays((d) => d.filter((_, i) => i !== index));
  }

  async function submit() {
    if (!name.trim()) {
      setError("Jadval nomini kiriting");
      return;
    }
    const payload: WorkScheduleInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      isStandard,
      days: days.map<WorkScheduleDayInput>((d) => ({
        weekday: d.weekday,
        startTime: d.startTime || undefined,
        endTime: d.endTime || undefined,
        lunchStart: d.lunchStart || undefined,
        lunchEnd: d.lunchEnd || undefined,
      })),
    };
    try {
      if (editing) {
        await updateSchedule.mutateAsync({ id: editing.id, input: payload });
        onSaved("Jadval yangilandi");
      } else {
        await createSchedule.mutateAsync(payload);
        onSaved("Jadval yaratildi");
      }
    } catch {
      setError("Saqlashda xatolik yuz berdi");
    }
  }

  const pending = createSchedule.isPending || updateSchedule.isPending;
  const timeClass =
    "h-9 w-full rounded-lg border border-line bg-surface px-2 text-sm text-ink transition-colors focus:border-amber focus-visible:focus-ring";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "Jadvalni yangilash" : "Jadval yaratish"}
      icon={<CalendarDays className="h-5 w-5" />}
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
        <Field label="Nomi" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jadval nomi" />
        </Field>
        <Field label="Tavsif">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Tavsif"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-amber focus-visible:focus-ring"
          />
        </Field>
        <label className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2.5">
          <span>
            <span className="block text-sm font-medium text-ink">Standart jadval hisoblanadimi?</span>
            <span className="block text-xs text-ink-muted">Standart ish jadvali sifatida belgilash</span>
          </span>
          <Switch checked={isStandard} onCheckedChange={setIsStandard} aria-label="Standart jadval" />
        </label>

        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-semibold text-ink">Ish kunlari</span>
          <Button variant="secondary" size="sm" onClick={addDay}>
            <Plus className="mr-1 h-4 w-4" /> Kun qo'shish
          </Button>
        </div>

        <div className="space-y-3">
          {days.map((day, i) => (
            <div key={i} className="rounded-xl border border-line bg-parchment/30 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Kun {i + 1}</span>
                <button className="text-rose-500 hover:underline" onClick={() => removeDay(i)}>O'chirish</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="col-span-2 block">
                  <span className="mb-1 block text-xs text-ink-muted">Hafta kuni</span>
                  <Select
                    value={day.weekday}
                    onChange={(e) => updateDay(i, { weekday: e.target.value as Weekday })}
                    options={WEEKDAY_OPTIONS}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-ink-muted">Boshlanish</span>
                  <input type="time" className={timeClass} value={day.startTime} onChange={(e) => updateDay(i, { startTime: e.target.value })} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-ink-muted">Tugash</span>
                  <input type="time" className={timeClass} value={day.endTime} onChange={(e) => updateDay(i, { endTime: e.target.value })} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-ink-muted">Tushlik boshlanishi</span>
                  <input type="time" className={timeClass} value={day.lunchStart} onChange={(e) => updateDay(i, { lunchStart: e.target.value })} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-ink-muted">Tushlik tugashi</span>
                  <input type="time" className={timeClass} value={day.lunchEnd} onChange={(e) => updateDay(i, { lunchEnd: e.target.value })} />
                </label>
              </div>
            </div>
          ))}
          {days.length === 0 && <p className="text-sm text-ink-muted">Hali kun qo'shilmagan.</p>}
        </div>

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
