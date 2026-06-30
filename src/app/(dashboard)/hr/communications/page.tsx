"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MessagesSquare,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  INTERACTION_STATUS_LABELS,
  INTERACTION_STATUS_TONE,
  INTERACTION_TYPE_LABELS,
  PAGE_SIZES,
  useCreateInteraction,
  useDeleteInteraction,
  useInteractionList,
  useUpdateInteraction,
  type Interaction,
  type InteractionInput,
  type InteractionStatus,
  type InteractionType,
} from "@/lib/api/hr-interactions";
import { useCandidateList } from "@/lib/api/hr-candidates";
import { Badge, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Drawer } from "@/components/ui/drawer";
import { PageHeader } from "@/components/ui/page-header";

const TYPE_OPTIONS = (Object.keys(INTERACTION_TYPE_LABELS) as InteractionType[]).map((t) => ({
  value: t,
  label: INTERACTION_TYPE_LABELS[t],
}));
const STATUS_OPTIONS = (Object.keys(INTERACTION_STATUS_LABELS) as InteractionStatus[]).map((s) => ({
  value: s,
  label: INTERACTION_STATUS_LABELS[s],
}));

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** ISO → `yyyy-MM-ddThh:mm` (datetime-local uchun). */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CommunicationsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<InteractionType | "">("");
  const [status, setStatus] = useState<InteractionStatus | "">("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Interaction | null>(null);
  const [deleting, setDeleting] = useState<Interaction | null>(null);
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

  const { data, isLoading, isError, refetch } = useInteractionList({
    page,
    limit,
    search,
    type: type || undefined,
    status: status || undefined,
  });
  const deleteInteraction = useDeleteInteraction();

  const rows = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pageCount = meta?.pageCount ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteInteraction.mutateAsync(deleting.id);
      setDeleting(null);
      setToast("Muloqot o'chirildi");
    } catch {
      setToast("O'chirishda xatolik");
    }
  }

  return (
    <div className="stagger">
      <PageHeader
        title="Muloqotlar"
        subtitle="Nomzodlar bilan muloqotlarni kuzatish"
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

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-9"
            placeholder="Muloqotlarni qidirish..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select
          className="h-10 w-40"
          value={type}
          onChange={(e) => {
            setType(e.target.value as InteractionType | "");
            setPage(1);
          }}
          options={[{ value: "", label: "Barchasi" }, ...TYPE_OPTIONS]}
        />
        <Select
          className="h-10 w-44"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as InteractionStatus | "");
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
                <th className="px-4 py-3 font-medium">Turi</th>
                <th className="px-4 py-3 font-medium">Sana</th>
                <th className="px-4 py-3 font-medium">Status</th>
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
                rows.map((it, i) => (
                  <tr key={it.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-ink-muted">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{it.title}</div>
                      {it.candidateName && <div className="text-xs text-ink-muted">{it.candidateName}</div>}
                    </td>
                    <td className="px-4 py-3"><Badge tone="neutral">{INTERACTION_TYPE_LABELS[it.type]}</Badge></td>
                    <td className="px-4 py-3 text-ink-soft">{fmtDateTime(it.scheduledAt)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={INTERACTION_STATUS_TONE[it.status]}>{INTERACTION_STATUS_LABELS[it.status]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className="rounded-md p-1.5 text-ink-muted hover:bg-parchment hover:text-ink"
                          title="Tahrirlash"
                          onClick={() => {
                            setEditing(it);
                            setDrawerOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-md p-1.5 text-rose-500 hover:bg-rose-500/10"
                          title="O'chirish"
                          onClick={() => setDeleting(it)}
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

      <InteractionDrawer
        open={drawerOpen}
        editing={editing}
        onClose={() => setDrawerOpen(false)}
        onSaved={(msg) => {
          setDrawerOpen(false);
          setToast(msg);
        }}
      />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Muloqotni o'chirish">
        <p className="text-sm text-ink-muted">{deleting?.title} o'chiriladi. Davom etilsinmi?</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Bekor qilish</Button>
          <Button variant="danger" loading={deleteInteraction.isPending} onClick={confirmDelete}>O'chirish</Button>
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

function InteractionDrawer({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: Interaction | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const createInteraction = useCreateInteraction();
  const updateInteraction = useUpdateInteraction();
  const { data: candidates } = useCandidateList({ page: 1, limit: 100 });

  const [title, setTitle] = useState("");
  const [type, setType] = useState<InteractionType>("call");
  const [status, setStatus] = useState<InteractionStatus>("planned");
  const [candidateId, setCandidateId] = useState("");
  const [location, setLocation] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [purpose, setPurpose] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState("");
  const [summary, setSummary] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.title);
      setType(editing.type);
      setStatus(editing.status);
      setCandidateId(editing.candidateId ?? "");
      setLocation(editing.location ?? "");
      setScheduledAt(toLocalInput(editing.scheduledAt));
      setEndAt(toLocalInput(editing.endAt));
      setPurpose(editing.purpose ?? "");
      setDescription(editing.description ?? "");
      setResult(editing.result ?? "");
      setSummary(editing.summary ?? "");
      setNextSteps(editing.nextSteps ?? "");
    } else {
      setTitle("");
      setType("call");
      setStatus("planned");
      setCandidateId("");
      setLocation("");
      setScheduledAt("");
      setEndAt("");
      setPurpose("");
      setDescription("");
      setResult("");
      setSummary("");
      setNextSteps("");
    }
    setError(null);
  }, [open, editing]);

  const candidateOptions = useMemo(
    () => [{ value: "", label: "Nomzodni tanlang..." }, ...(candidates?.items ?? []).map((c) => ({ value: c.id, label: c.fullName }))],
    [candidates],
  );

  async function submit() {
    if (!title.trim()) {
      setError("Sarlavhani kiriting");
      return;
    }
    const payload: InteractionInput = {
      title: title.trim(),
      type,
      status,
      candidateId: candidateId || undefined,
      location: location.trim() || undefined,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      endAt: endAt ? new Date(endAt).toISOString() : undefined,
      purpose: purpose.trim() || undefined,
      description: description.trim() || undefined,
      result: result.trim() || undefined,
      summary: summary.trim() || undefined,
      nextSteps: nextSteps.trim() || undefined,
    };
    try {
      if (editing) {
        await updateInteraction.mutateAsync({ id: editing.id, input: payload });
        onSaved("Muloqot yangilandi");
      } else {
        await createInteraction.mutateAsync(payload);
        onSaved("Muloqot yaratildi");
      }
    } catch {
      setError("Saqlashda xatolik yuz berdi");
    }
  }

  const pending = createInteraction.isPending || updateInteraction.isPending;
  const dtClass =
    "h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink transition-colors focus:border-amber focus-visible:focus-ring";
  const taClass =
    "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-amber focus-visible:focus-ring";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "Muloqotni yangilash" : "Muloqot yaratish"}
      subtitle="Yangi muloqot ma'lumotlarini kiriting"
      icon={<MessagesSquare className="h-5 w-5" />}
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
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sarlavhani kiriting" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Turi" required>
            <Select value={type} onChange={(e) => setType(e.target.value as InteractionType)} options={TYPE_OPTIONS} />
          </Field>
          <Field label="Status" required>
            <Select value={status} onChange={(e) => setStatus(e.target.value as InteractionStatus)} options={STATUS_OPTIONS} />
          </Field>
        </div>
        <Field label="Nomzod">
          <Select value={candidateId} onChange={(e) => setCandidateId(e.target.value)} options={candidateOptions} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Joylashuv">
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Joylashuvni kiriting" />
          </Field>
          <Field label="Boshlanish vaqti">
            <input type="datetime-local" className={dtClass} value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </Field>
        </div>
        <Field label="Tugash vaqti">
          <input type="datetime-local" className={dtClass} value={endAt} onChange={(e) => setEndAt(e.target.value)} />
        </Field>
        <Field label="Maqsad">
          <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Maqsadni kiriting" />
        </Field>
        <Field label="Tavsif">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Tavsifni kiriting..." className={taClass} />
        </Field>
        <Field label="Natija">
          <textarea value={result} onChange={(e) => setResult(e.target.value)} rows={2} placeholder="Yakuniy natija qanday bo'ldi?" className={taClass} />
        </Field>
        <Field label="Xulosa">
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} placeholder="Yakuniy xulosa va sharhlar" className={taClass} />
        </Field>
        <Field label="Keyingi qadamlar">
          <textarea value={nextSteps} onChange={(e) => setNextSteps(e.target.value)} rows={2} placeholder="Bajarilishi kerak bo'lgan ishlar" className={taClass} />
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
