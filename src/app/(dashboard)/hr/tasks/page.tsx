"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ListTodo,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  PAGE_SIZES,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_TONE,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_STATUS_TONE,
  useCreateTask,
  useDeleteTask,
  useProjectOptions,
  useTasks,
  useUpdateTask,
  type Task,
  type TaskInput,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/api/hr-tasks";
import { useStaff } from "@/lib/api/hr";
import { formatDateDMY } from "@/lib/format";
import { Badge, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Drawer } from "@/components/ui/drawer";
import { PageHeader } from "@/components/ui/page-header";
import {
  RowActions,
  useAnyRowAction,
  type RowAction,
} from "@/components/ui/row-actions";
import { Can } from "@/components/auth/can";

const STATUS_FILTER = [
  { value: "", label: "Barchasi" },
  ...TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] })),
];
const PRIORITY_FILTER = [
  { value: "", label: "Barchasi" },
  ...TASK_PRIORITIES.map((p) => ({ value: p, label: TASK_PRIORITY_LABELS[p] })),
];

export default function TasksPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | TaskStatus>("");
  const [priority, setPriority] = useState<"" | TaskPriority>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
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

  const { data, isLoading, isError, refetch } = useTasks({
    page,
    limit,
    search,
    status: status || undefined,
    priority: priority || undefined,
  });
  const deleteTask = useDeleteTask();

  const rows = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pageCount = meta?.pageCount ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteTask.mutateAsync(deleting.id);
      setDeleting(null);
      setToast("Vazifa o‘chirildi");
    } catch {
      setToast("O‘chirishda xatolik");
    }
  }

  const rowActions: RowAction<Task>[] = [
    {
      key: "update",
      label: "Tahrirlash",
      icon: Pencil,
      permission: "hr-tasks.update",
      onSelect: (t) => {
        setEditing(t);
        setDrawerOpen(true);
      },
    },
    {
      key: "delete",
      label: "O‘chirish",
      icon: Trash2,
      tone: "danger",
      permission: "hr-tasks.delete",
      onSelect: (t) => setDeleting(t),
    },
  ];
  const showActions = useAnyRowAction(rowActions);
  const colCount = showActions ? 6 : 5;

  return (
    <div className="stagger">
      <PageHeader
        title="Vazifalar"
        subtitle="HR vazifalar va loyihalarni boshqarish"
        action={
          <Can permission="hr-tasks.create">
            <Button
              variant="accent"
              onClick={() => {
                setEditing(null);
                setDrawerOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Vazifa qo‘shish
            </Button>
          </Can>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-9"
            placeholder="Vazifalarni qidirish..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select
          options={STATUS_FILTER}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as "" | TaskStatus);
            setPage(1);
          }}
        />
        <Select
          options={PRIORITY_FILTER}
          value={priority}
          onChange={(e) => {
            setPriority(e.target.value as "" | TaskPriority);
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
                <th className="px-4 py-3 font-medium">Vazifalar</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Prioritet</th>
                <th className="px-4 py-3 font-medium">Tugash sanasi</th>
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
                    <span className="text-negative">Ma‘lumotni yuklashda xatolik</span>
                    <Button variant="secondary" size="sm" onClick={() => refetch()}>Qayta urinish</Button>
                  </div>
                </StateRow>
              ) : rows.length === 0 ? (
                <StateRow colSpan={colCount}><span className="text-ink-muted">Ma‘lumot yo‘q</span></StateRow>
              ) : (
                rows.map((t, i) => (
                  <tr key={t.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-ink-muted">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <ListTodo className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
                        <div>
                          <div className="font-medium text-ink">{t.title}</div>
                          {t.description && (
                            <div className="max-w-xs truncate text-xs text-ink-muted">{t.description}</div>
                          )}
                          {t.assigneeName && (
                            <div className="text-xs text-ink-muted">Ijrochi: {t.assigneeName}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={TASK_STATUS_TONE[t.status]}>{TASK_STATUS_LABELS[t.status]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={TASK_PRIORITY_TONE[t.priority]}>{TASK_PRIORITY_LABELS[t.priority]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{t.endDate ? formatDateDMY(t.endDate) : "—"}</td>
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

      <TaskDrawer
        open={drawerOpen}
        editing={editing}
        onClose={() => setDrawerOpen(false)}
        onSaved={(msg) => {
          setDrawerOpen(false);
          setToast(msg);
        }}
      />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Vazifani o‘chirish">
        <p className="text-sm text-ink-muted">{deleting?.title} vazifasi o‘chiriladi. Davom etilsinmi?</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Bekor qilish</Button>
          <Button variant="danger" loading={deleteTask.isPending} onClick={confirmDelete}>O‘chirish</Button>
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

function TaskDrawer({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: Task | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { data: projects } = useProjectOptions();
  const { data: staffData } = useStaff({ page: 1, limit: 100 });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [status, setStatus] = useState<TaskStatus>("pending");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.title);
      setDescription(editing.description ?? "");
      setProjectId(editing.projectId ?? "");
      setAssigneeId(editing.assigneeId ?? "");
      setStatus(editing.status);
      setPriority(editing.priority);
      setStartDate(editing.startDate ?? "");
      setEndDate(editing.endDate ?? "");
    } else {
      setTitle("");
      setDescription("");
      setProjectId("");
      setAssigneeId("");
      setStatus("pending");
      setPriority("medium");
      setStartDate("");
      setEndDate("");
    }
    setError(null);
  }, [open, editing]);

  const projectOptions = useMemo(
    () => [{ value: "", label: "Loyihani tanlang" }, ...(projects ?? []).map((p) => ({ value: p.id, label: p.name }))],
    [projects],
  );
  const staffOptions = useMemo(
    () => [
      { value: "", label: "Ijrochini tanlang" },
      ...(staffData?.items ?? []).map((s) => ({ value: s.id, label: `${s.lastName} ${s.firstName}` })),
    ],
    [staffData],
  );

  async function submit() {
    if (!title.trim()) {
      setError("Vazifa sarlavhasini kiriting");
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      setError("Tugash sanasi boshlanishdan oldin bo‘lishi mumkin emas");
      return;
    }
    const payload: TaskInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      projectId: projectId || undefined,
      assigneeId: assigneeId || undefined,
      status,
      priority,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
    try {
      if (editing) {
        await updateTask.mutateAsync({ id: editing.id, input: payload });
        onSaved("Vazifa yangilandi");
      } else {
        await createTask.mutateAsync(payload);
        onSaved("Vazifa yaratildi");
      }
    } catch {
      setError("Saqlashda xatolik yuz berdi");
    }
  }

  const pending = createTask.isPending || updateTask.isPending;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "Vazifani yangilash" : "Vazifa yaratish"}
      icon={<ListTodo className="h-5 w-5" />}
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
        <Field label="Vazifalar" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Vazifa sarlavhasini kiriting" />
        </Field>
        <Field label="Tavsif">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Vazifa tavsifini kiriting"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-amber focus-visible:focus-ring"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Loyiha">
            <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} options={projectOptions} />
          </Field>
          <Field label="Ijrochi">
            <Select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} options={staffOptions} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              options={TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] }))}
            />
          </Field>
          <Field label="Prioritet">
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              options={TASK_PRIORITIES.map((p) => ({ value: p, label: TASK_PRIORITY_LABELS[p] }))}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Boshlanish sanasi">
            <DatePicker value={startDate} onChange={setStartDate} />
          </Field>
          <Field label="Tugash sanasi">
            <DatePicker value={endDate} onChange={setEndDate} />
          </Field>
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
