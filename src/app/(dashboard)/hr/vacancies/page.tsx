"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Megaphone,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  PAGE_SIZES,
  VACANCY_STATUS_LABELS,
  VACANCY_STATUS_TONE,
  useCreateVacancy,
  useDeleteVacancy,
  useUpdateVacancy,
  useVacancyList,
  type Vacancy,
  type VacancyInput,
  type VacancyStatus,
} from "@/lib/api/hr-vacancies";
import { useDepartments, usePositions, useStaff } from "@/lib/api/hr";
import { Badge, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { NumberInput } from "@/components/ui/number-input";
import { Select } from "@/components/ui/select";
import { Drawer } from "@/components/ui/drawer";
import { PageHeader } from "@/components/ui/page-header";

const STATUS_OPTIONS: { value: VacancyStatus; label: string }[] = [
  { value: "open", label: "Ochiq" },
  { value: "closed", label: "Yopiq" },
  { value: "draft", label: "Qoralama" },
  { value: "pending", label: "Kutishda" },
];

function fmtSalary(min: number | null, max: number | null): string {
  const f = (n: number) => n.toLocaleString("ru-RU");
  if (min != null && max != null) return `${f(min)} - ${f(max)}`;
  if (min != null) return `${f(min)} dan`;
  if (max != null) return `${f(max)} gacha`;
  return "—";
}

export default function VacanciesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<VacancyStatus | "">("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Vacancy | null>(null);
  const [deleting, setDeleting] = useState<Vacancy | null>(null);
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

  const { data, isLoading, isError, refetch } = useVacancyList({
    page,
    limit,
    search,
    status: status || undefined,
  });
  const deleteVacancy = useDeleteVacancy();

  const rows = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pageCount = meta?.pageCount ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteVacancy.mutateAsync(deleting.id);
      setDeleting(null);
      setToast("Vakansiya o'chirildi");
    } catch {
      setToast("O'chirishda xatolik");
    }
  }

  return (
    <div className="stagger">
      <PageHeader
        title="Vakansiyalar"
        subtitle="Ochiq ish o'rinlarini boshqarish"
        action={
          <Button
            variant="accent"
            onClick={() => {
              setEditing(null);
              setDrawerOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Vakansiya qo'shish
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-9"
            placeholder="Vakansiyalarni qidirish..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select
          className="h-10 w-44"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as VacancyStatus | "");
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
                <th className="px-4 py-3 font-medium">Vakansiyalar</th>
                <th className="px-4 py-3 font-medium">Bo'lim</th>
                <th className="px-4 py-3 font-medium">Maosh</th>
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
                rows.map((v, i) => (
                  <tr key={v.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-ink-muted">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{v.title}</div>
                      {v.positionTitle && <div className="text-xs text-ink-muted">{v.positionTitle}</div>}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{v.departmentName ?? "—"}</td>
                    <td className="px-4 py-3 tnum text-ink-soft">{fmtSalary(v.minSalary, v.maxSalary)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={VACANCY_STATUS_TONE[v.status]}>{VACANCY_STATUS_LABELS[v.status]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className="rounded-md p-1.5 text-ink-muted hover:bg-parchment hover:text-ink"
                          title="Tahrirlash"
                          onClick={() => {
                            setEditing(v);
                            setDrawerOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-md p-1.5 text-rose-500 hover:bg-rose-500/10"
                          title="O'chirish"
                          onClick={() => setDeleting(v)}
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

      <VacancyDrawer
        open={drawerOpen}
        editing={editing}
        onClose={() => setDrawerOpen(false)}
        onSaved={(msg) => {
          setDrawerOpen(false);
          setToast(msg);
        }}
      />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Vakansiyani o'chirish">
        <p className="text-sm text-ink-muted">{deleting?.title} o'chiriladi. Davom etilsinmi?</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Bekor qilish</Button>
          <Button variant="danger" loading={deleteVacancy.isPending} onClick={confirmDelete}>O'chirish</Button>
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

function VacancyDrawer({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: Vacancy | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const createVacancy = useCreateVacancy();
  const updateVacancy = useUpdateVacancy();
  const { data: departments } = useDepartments();
  const { data: positions } = usePositions();
  const { data: staffList } = useStaff({ page: 1, limit: 100 });

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<VacancyStatus>("open");
  const [departmentId, setDepartmentId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [recruiterId, setRecruiterId] = useState("");
  const [minSalary, setMinSalary] = useState<number | null>(null);
  const [maxSalary, setMaxSalary] = useState<number | null>(null);
  const [responsibilities, setResponsibilities] = useState("");
  const [requirements, setRequirements] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.title);
      setStatus(editing.status);
      setDepartmentId(editing.departmentId ?? "");
      setPositionId(editing.positionId ?? "");
      setRecruiterId(editing.recruiterId ?? "");
      setMinSalary(editing.minSalary);
      setMaxSalary(editing.maxSalary);
      setResponsibilities(editing.responsibilities ?? "");
      setRequirements(editing.requirements ?? "");
    } else {
      setTitle("");
      setStatus("open");
      setDepartmentId("");
      setPositionId("");
      setRecruiterId("");
      setMinSalary(null);
      setMaxSalary(null);
      setResponsibilities("");
      setRequirements("");
    }
    setError(null);
  }, [open, editing]);

  const deptOptions = useMemo(
    () => [{ value: "", label: "Tanlang..." }, ...(departments ?? []).map((d) => ({ value: d.id, label: d.name }))],
    [departments],
  );
  const posOptions = useMemo(
    () => [{ value: "", label: "Tanlang..." }, ...(positions ?? []).map((p) => ({ value: p.id, label: p.title }))],
    [positions],
  );
  const recruiterOptions = useMemo(
    () => [
      { value: "", label: "Tanlang..." },
      ...(staffList?.items ?? []).map((s) => ({ value: s.id, label: `${s.lastName} ${s.firstName}` })),
    ],
    [staffList],
  );

  async function submit() {
    if (!title.trim()) {
      setError("Vakansiya sarlavhasini kiriting");
      return;
    }
    if (minSalary != null && maxSalary != null && maxSalary < minSalary) {
      setError("Maksimal maosh minimaldan kichik bo'lishi mumkin emas");
      return;
    }
    const payload: VacancyInput = {
      title: title.trim(),
      status,
      departmentId: departmentId || undefined,
      positionId: positionId || undefined,
      recruiterId: recruiterId || undefined,
      minSalary: minSalary ?? undefined,
      maxSalary: maxSalary ?? undefined,
      responsibilities: responsibilities.trim() || undefined,
      requirements: requirements.trim() || undefined,
    };
    try {
      if (editing) {
        await updateVacancy.mutateAsync({ id: editing.id, input: payload });
        onSaved("Vakansiya yangilandi");
      } else {
        await createVacancy.mutateAsync(payload);
        onSaved("Vakansiya yaratildi");
      }
    } catch {
      setError("Saqlashda xatolik yuz berdi");
    }
  }

  const pending = createVacancy.isPending || updateVacancy.isPending;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "Vakansiyani yangilash" : "Vakansiya yaratish"}
      icon={<Megaphone className="h-5 w-5" />}
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
        <Field label="Vakansiyalar" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Vakansiya sarlavhasini kiriting" />
        </Field>
        <Field label="Status" required>
          <Select value={status} onChange={(e) => setStatus(e.target.value as VacancyStatus)} options={STATUS_OPTIONS} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Bo'lim">
            <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} options={deptOptions} />
          </Field>
          <Field label="Lavozim">
            <Select value={positionId} onChange={(e) => setPositionId(e.target.value)} options={posOptions} />
          </Field>
          <Field label="Rekrut">
            <Select value={recruiterId} onChange={(e) => setRecruiterId(e.target.value)} options={recruiterOptions} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Min maosh">
            <NumberInput value={minSalary} onChange={setMinSalary} placeholder="Maoshni kiriting" />
          </Field>
          <Field label="Maks maosh">
            <NumberInput value={maxSalary} onChange={setMaxSalary} placeholder="Maoshni kiriting" />
          </Field>
        </div>
        <Field label="Ish o'rinlarini boshqarish">
          <textarea
            value={responsibilities}
            onChange={(e) => setResponsibilities(e.target.value)}
            rows={3}
            placeholder="Tavsifni kiriting..."
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-amber focus-visible:focus-ring"
          />
        </Field>
        <Field label="Talablar">
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            rows={3}
            placeholder="Talablarni kiriting..."
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
