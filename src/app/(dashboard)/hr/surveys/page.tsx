"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileQuestion,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import {
  PAGE_SIZES,
  SURVEY_STATUS_LABELS,
  SURVEY_STATUS_TONE,
  SURVEY_TYPE_LABELS,
  useCreateSurvey,
  useDeleteSurvey,
  usePublishSurvey,
  useSurveyList,
  useUpdateSurvey,
  type Survey,
  type SurveyInput,
  type SurveyStatus,
  type SurveyType,
} from "@/lib/api/hr-surveys";
import { Badge, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DateInput } from "@/components/ui/date-input";
import { Drawer } from "@/components/ui/drawer";
import { PageHeader } from "@/components/ui/page-header";
import {
  RowActions,
  useAnyRowAction,
  type RowAction,
} from "@/components/ui/row-actions";
import { Can } from "@/components/auth/can";

const STATUS_OPTIONS = (Object.keys(SURVEY_STATUS_LABELS) as SurveyStatus[]).map((s) => ({
  value: s,
  label: SURVEY_STATUS_LABELS[s],
}));

export default function SurveysPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SurveyStatus | "">("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Survey | null>(null);
  const [deleting, setDeleting] = useState<Survey | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const publishSurvey = usePublishSurvey();
  const deleteSurvey = useDeleteSurvey();

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

  const { data, isLoading, isError, refetch } = useSurveyList({
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
      await deleteSurvey.mutateAsync(deleting.id);
      setDeleting(null);
      setToast("So'rovnoma o'chirildi");
    } catch {
      setToast("O'chirishda xatolik");
    }
  }

  async function publish(s: Survey) {
    try {
      await publishSurvey.mutateAsync(s.id);
      setToast("So'rovnoma nashr qilindi");
    } catch {
      setToast("Nashr qilishda xatolik");
    }
  }

  const rowActions: RowAction<Survey>[] = [
    {
      key: "publish",
      label: "Nashr qilish",
      icon: Send,
      tone: "positive",
      permission: "hr-surveys.update",
      hidden: (s) => s.status !== "draft",
      onSelect: (s) => publish(s),
    },
    {
      key: "update",
      label: "Tahrirlash",
      icon: Pencil,
      permission: "hr-surveys.update",
      onSelect: (s) => {
        setEditing(s);
        setDrawerOpen(true);
      },
    },
    {
      key: "delete",
      label: "O'chirish",
      icon: Trash2,
      tone: "danger",
      permission: "hr-surveys.delete",
      onSelect: (s) => setDeleting(s),
    },
  ];
  const showActions = useAnyRowAction(rowActions);
  const colCount = showActions ? 6 : 5;

  return (
    <div className="stagger">
      <PageHeader
        title="So'rovnomalar"
        subtitle="HR so'rovnomalarini boshqarish"
        action={
          <Can permission="hr-surveys.create">
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
          </Can>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-9"
            placeholder="So'rovnomalarni qidir..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select
          className="h-10 w-44"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as SurveyStatus | "");
            setPage(1);
          }}
          options={[{ value: "", label: "Barchasi" }, ...STATUS_OPTIONS]}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-medium">№</th>
                <th className="px-4 py-3 font-medium">Sarlavha</th>
                <th className="px-4 py-3 font-medium">Tur</th>
                <th className="px-4 py-3 font-medium">Holat</th>
                <th className="px-4 py-3 font-medium">Sanalar</th>
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
                rows.map((s, i) => (
                  <tr key={s.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-ink-muted">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{s.title}</div>
                      {s.description && <div className="text-xs text-ink-muted line-clamp-1">{s.description}</div>}
                    </td>
                    <td className="px-4 py-3"><Badge tone="accent">{SURVEY_TYPE_LABELS[s.type]}</Badge></td>
                    <td className="px-4 py-3"><Badge tone={SURVEY_STATUS_TONE[s.status]}>{SURVEY_STATUS_LABELS[s.status]}</Badge></td>
                    <td className="px-4 py-3 text-ink-soft">
                      {s.startDate || s.endDate ? (
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-ink-muted" />
                          {s.startDate ?? "—"} - {s.endDate ?? "—"}
                        </span>
                      ) : "—"}
                    </td>
                    {showActions && (
                      <td className="px-4 py-3">
                        <RowActions row={s} actions={rowActions} />
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

      <SurveyDrawer
        open={drawerOpen}
        editing={editing}
        onClose={() => setDrawerOpen(false)}
        onSaved={(msg) => {
          setDrawerOpen(false);
          setToast(msg);
        }}
      />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="So'rovnomani o'chirish">
        <p className="text-sm text-ink-muted">{deleting?.title} o'chiriladi. Davom etilsinmi?</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Bekor qilish</Button>
          <Button variant="danger" loading={deleteSurvey.isPending} onClick={confirmDelete}>O'chirish</Button>
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

function SurveyDrawer({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: Survey | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const createSurvey = useCreateSurvey();
  const updateSurvey = useUpdateSurvey();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<SurveyType>("anonymous");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.title);
      setDescription(editing.description ?? "");
      setType(editing.type);
      setStartDate(editing.startDate ?? "");
      setEndDate(editing.endDate ?? "");
      setIsAnonymous(editing.isAnonymous);
    } else {
      setTitle("");
      setDescription("");
      setType("anonymous");
      setStartDate("");
      setEndDate("");
      setIsAnonymous(true);
    }
    setError(null);
  }, [open, editing]);

  async function submit() {
    if (!title.trim()) {
      setError("So'rovnoma sarlavhasini kiriting");
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      setError("Tugash sanasi boshlanish sanasidan oldin bo'lishi mumkin emas");
      return;
    }
    const payload: SurveyInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      isAnonymous,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
    try {
      if (editing) {
        await updateSurvey.mutateAsync({ id: editing.id, input: payload });
        onSaved("So'rovnoma yangilandi");
      } else {
        await createSurvey.mutateAsync(payload);
        onSaved("So'rovnoma yaratildi");
      }
    } catch {
      setError("Saqlashda xatolik yuz berdi");
    }
  }

  const pending = createSurvey.isPending || updateSurvey.isPending;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "So'rovnomani yangilash" : "So'rovnoma yaratish"}
      subtitle="Yangi HR so'rovnomasini yarating"
      icon={<FileQuestion className="h-5 w-5" />}
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
        <Field label="Sarlavha" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="So'rovnoma sarlavhasini kiriting" />
        </Field>
        <Field label="Tavsif">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Tavsif kiriting"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-amber focus-visible:focus-ring"
          />
        </Field>
        <Field label="Tur" required>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as SurveyType)}
            options={[
              { value: "anonymous", label: "Anonim" },
              { value: "public", label: "Ochiq" },
            ]}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Boshlanish sanasi" required>
            <DateInput value={startDate} onChange={setStartDate} />
          </Field>
          <Field label="Tugash sanasi" required>
            <DateInput value={endDate} onChange={setEndDate} />
          </Field>
        </div>
        <label className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2.5">
          <span>
            <span className="block text-sm font-medium text-ink">Anonim so'rovnoma</span>
            <span className="block text-xs text-ink-muted">Respondent shaxsi yashiriladi</span>
          </span>
          <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} aria-label="Anonim so'rovnoma" />
        </label>

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
