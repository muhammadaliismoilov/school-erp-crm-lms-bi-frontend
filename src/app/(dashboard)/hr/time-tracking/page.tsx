"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Send,
  Settings2,
  Trash2,
} from "lucide-react";
import {
  MONTH_LABELS,
  PAGE_SIZES,
  TIMESHEET_STATUS_LABELS,
  TIMESHEET_STATUS_TONE,
  useApproveTimesheet,
  useCreateTimesheet,
  useDeleteTimesheet,
  useSubmitTimesheet,
  useTimesheetList,
  useUpdateTimesheet,
  type Timesheet,
  type TimesheetInput,
  type TimesheetLineInput,
  type TimesheetStatus,
} from "@/lib/api/hr-timesheets";
import { useDepartments, useStaff } from "@/lib/api/hr";
import { Badge, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { NumberInput } from "@/components/ui/number-input";
import { Select } from "@/components/ui/select";
import { Drawer } from "@/components/ui/drawer";
import { PageHeader } from "@/components/ui/page-header";
import {
  RowActions,
  useAnyRowAction,
  type RowAction,
} from "@/components/ui/row-actions";
import { Can } from "@/components/auth/can";

const YEARS = Array.from({ length: 7 }, (_, i) => 2024 + i);
const MONTH_OPTIONS = MONTH_LABELS.map((m, i) => ({ value: String(i + 1), label: m }));
const STATUS_OPTIONS = (Object.keys(TIMESHEET_STATUS_LABELS) as TimesheetStatus[]).map((s) => ({
  value: s,
  label: TIMESHEET_STATUS_LABELS[s],
}));

export default function TimeTrackingPage() {
  const [status, setStatus] = useState<TimesheetStatus | "">("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Timesheet | null>(null);
  const [deleting, setDeleting] = useState<Timesheet | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const submitTs = useSubmitTimesheet();
  const approveTs = useApproveTimesheet();
  const deleteTs = useDeleteTimesheet();

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  const { data, isLoading, isError, refetch } = useTimesheetList({ page, limit, status: status || undefined });

  const rows = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pageCount = meta?.pageCount ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteTs.mutateAsync(deleting.id);
      setDeleting(null);
      setToast("Taqvim o'chirildi");
    } catch {
      setToast("O'chirishda xatolik");
    }
  }

  async function submit(t: Timesheet) {
    try {
      await submitTs.mutateAsync(t.id);
      setToast("Taqvim yuborildi");
    } catch {
      setToast("Xatolik yuz berdi");
    }
  }

  async function approve(t: Timesheet) {
    try {
      await approveTs.mutateAsync(t.id);
      setToast("Taqvim tasdiqlandi");
    } catch {
      setToast("Avval taqvimni yuborish kerak");
    }
  }

  const rowActions: RowAction<Timesheet>[] = [
    {
      key: "lines",
      label: "Xodimlar",
      icon: Settings2,
      permission: "hr-timesheets.update",
      onSelect: (t) => setEditing(t),
    },
    {
      key: "submit",
      label: "Yuborish",
      icon: Send,
      permission: "hr-timesheets.update",
      hidden: (t) => t.status !== "draft",
      onSelect: (t) => submit(t),
    },
    {
      key: "approve",
      label: "Tasdiqlash",
      icon: Check,
      tone: "positive",
      permission: "hr-timesheets.update",
      hidden: (t) => t.status !== "submitted",
      onSelect: (t) => approve(t),
    },
    {
      key: "delete",
      label: "O'chirish",
      icon: Trash2,
      tone: "danger",
      permission: "hr-timesheets.delete",
      onSelect: (t) => setDeleting(t),
    },
  ];
  const showActions = useAnyRowAction(rowActions);
  const colCount = showActions ? 6 : 5;

  return (
    <div className="stagger">
      <PageHeader
        title="Taqvimlar"
        subtitle="Xodimlar taqvimlarini boshqarish"
        action={
          <Can permission="hr-timesheets.create">
            <Button variant="accent" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Taqvim qo'shish
            </Button>
          </Can>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select
          className="h-10 w-48"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as TimesheetStatus | "");
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
                <th className="px-4 py-3 font-medium">Yil</th>
                <th className="px-4 py-3 font-medium">Oy</th>
                <th className="px-4 py-3 font-medium">Bo'lim</th>
                <th className="px-4 py-3 font-medium">Holat</th>
                {showActions && (
                  <th className="px-4 py-3 text-right font-medium">Amallar</th>
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <StateRow colSpan={colCount}><Spinner className="mx-auto h-5 w-5" /></StateRow>
              ) : isError ? (
                <StateRow colSpan={colCount}>
                  <div className="flex flex-col items-center gap-2 text-ink-muted">
                    <span className="text-negative">Ma'lumotni yuklashda xatolik</span>
                    <Button variant="secondary" size="sm" onClick={() => refetch()}>Qayta urinish</Button>
                  </div>
                </StateRow>
              ) : rows.length === 0 ? (
                <StateRow colSpan={colCount}><span className="text-ink-muted">Ma'lumot yo'q</span></StateRow>
              ) : (
                rows.map((t, i) => (
                  <tr key={t.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-ink-muted">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3 tnum text-ink">{t.year}</td>
                    <td className="px-4 py-3 text-ink">{MONTH_LABELS[t.month - 1] ?? t.month}</td>
                    <td className="px-4 py-3 text-ink-soft">{t.departmentName ?? "—"}</td>
                    <td className="px-4 py-3"><Badge tone={TIMESHEET_STATUS_TONE[t.status]}>{TIMESHEET_STATUS_LABELS[t.status]}</Badge></td>
                    {showActions && (
                      <td className="px-4 py-3">
                        <RowActions row={t} actions={rowActions} />
                      </td>
                    )}
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

      <CreateTimesheetDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={(msg) => {
          setCreateOpen(false);
          setToast(msg);
        }}
      />

      <LinesDrawer
        timesheet={editing}
        onClose={() => setEditing(null)}
        onSaved={(msg) => {
          setEditing(null);
          setToast(msg);
        }}
      />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Taqvimni o'chirish">
        <p className="text-sm text-ink-muted">
          {deleting?.year} / {deleting ? MONTH_LABELS[deleting.month - 1] : ""} taqvimi o'chiriladi. Davom etilsinmi?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Bekor qilish</Button>
          <Button variant="danger" loading={deleteTs.isPending} onClick={confirmDelete}>O'chirish</Button>
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

function CreateTimesheetDrawer({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const createTimesheet = useCreateTimesheet();
  const { data: departments } = useDepartments();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [departmentId, setDepartmentId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
    setDepartmentId("");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const deptOptions = useMemo(
    () => [{ value: "", label: "Bo'limni tanlang" }, ...(departments ?? []).map((d) => ({ value: d.id, label: d.name }))],
    [departments],
  );

  async function submit() {
    const payload: TimesheetInput = { year, month, departmentId: departmentId || undefined };
    try {
      await createTimesheet.mutateAsync(payload);
      onSaved("Taqvim yaratildi");
    } catch {
      setError("Bu bo'lim uchun shu oy taqvimi allaqachon mavjud yoki xatolik");
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Taqvim yaratish"
      icon={<CalendarRange className="h-5 w-5" />}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Bekor qilish</Button>
          <Button variant="accent" loading={createTimesheet.isPending} onClick={submit}>Yaratish</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Yil" required>
            <Select
              value={String(year)}
              onChange={(e) => setYear(Number(e.target.value))}
              options={YEARS.map((y) => ({ value: String(y), label: String(y) }))}
            />
          </Field>
          <Field label="Oy" required>
            <Select value={String(month)} onChange={(e) => setMonth(Number(e.target.value))} options={MONTH_OPTIONS} />
          </Field>
        </div>
        <Field label="Bo'lim">
          <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} options={deptOptions} />
        </Field>
        {error && <div className="text-sm text-negative">{error}</div>}
      </div>
    </Drawer>
  );
}

type LineState = { staffMemberId: string; workedDays: number | null; workedHours: number | null };

function LinesDrawer({
  timesheet,
  onClose,
  onSaved,
}: {
  timesheet: Timesheet | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const updateTimesheet = useUpdateTimesheet();
  const { data: staffList } = useStaff({ page: 1, limit: 100 });
  const [lines, setLines] = useState<LineState[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!timesheet) return;
    setLines(timesheet.lines.map((l) => ({ staffMemberId: l.staffMemberId, workedDays: l.workedDays, workedHours: l.workedHours })));
    setError(null);
  }, [timesheet]);

  const staffOptions = useMemo(
    () => [{ value: "", label: "Xodimni tanlang" }, ...(staffList?.items ?? []).map((s) => ({ value: s.id, label: `${s.lastName} ${s.firstName}` }))],
    [staffList],
  );

  function addLine() {
    setLines((l) => [...l, { staffMemberId: "", workedDays: 0, workedHours: 0 }]);
  }
  function updateLine(i: number, patch: Partial<LineState>) {
    setLines((l) => l.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function removeLine(i: number) {
    setLines((l) => l.filter((_, idx) => idx !== i));
  }

  async function save() {
    if (!timesheet) return;
    const valid = lines.filter((l) => l.staffMemberId);
    const payloadLines: TimesheetLineInput[] = valid.map((l) => ({
      staffMemberId: l.staffMemberId,
      workedDays: l.workedDays ?? 0,
      workedHours: l.workedHours ?? 0,
    }));
    try {
      await updateTimesheet.mutateAsync({ id: timesheet.id, input: { lines: payloadLines } });
      onSaved("Taqvim yangilandi");
    } catch {
      setError("Saqlashda xatolik yuz berdi");
    }
  }

  return (
    <Drawer
      open={!!timesheet}
      onClose={onClose}
      title="Xodimlar taqvimi"
      subtitle={timesheet ? `${timesheet.year} / ${MONTH_LABELS[timesheet.month - 1]}` : undefined}
      icon={<Settings2 className="h-5 w-5" />}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Yopish</Button>
          <Button variant="accent" loading={updateTimesheet.isPending} onClick={save}>Saqlash</Button>
        </div>
      }
    >
      {timesheet && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">Xodimlar</span>
            <Button variant="secondary" size="sm" onClick={addLine}>
              <Plus className="mr-1 h-4 w-4" /> Qator qo'shish
            </Button>
          </div>
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-12 items-end gap-2 rounded-lg border border-line bg-parchment/30 p-2">
              <label className="col-span-6 block">
                <span className="mb-1 block text-xs text-ink-muted">Xodim</span>
                <Select value={line.staffMemberId} onChange={(e) => updateLine(i, { staffMemberId: e.target.value })} options={staffOptions} />
              </label>
              <label className="col-span-2 block">
                <span className="mb-1 block text-xs text-ink-muted">Kun</span>
                <NumberInput value={line.workedDays} onChange={(v) => updateLine(i, { workedDays: v })} placeholder="0" decimal />
              </label>
              <label className="col-span-3 block">
                <span className="mb-1 block text-xs text-ink-muted">Soat</span>
                <NumberInput value={line.workedHours} onChange={(v) => updateLine(i, { workedHours: v })} placeholder="0" decimal />
              </label>
              <button className="col-span-1 mb-1 grid h-9 place-items-center rounded-md text-rose-500 hover:bg-rose-500/10" onClick={() => removeLine(i)}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {lines.length === 0 && <p className="text-sm text-ink-muted">Hali xodim qo'shilmagan.</p>}
          {error && <div className="text-sm text-negative">{error}</div>}
        </div>
      )}
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
