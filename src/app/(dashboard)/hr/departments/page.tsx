"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Network,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  DEPARTMENT_STATUS_LABELS,
  DEPARTMENT_STATUS_TONE,
  PAGE_SIZES,
  useCreateDepartment,
  useDeleteDepartment,
  useDepartmentList,
  useUpdateDepartment,
  type Department,
  type DepartmentInput,
} from "@/lib/api/hr-departments";
import { useBranchOptions, useSchoolOptions } from "@/lib/api/hr-branches";
import { Badge, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Drawer } from "@/components/ui/drawer";
import { PageHeader } from "@/components/ui/page-header";

export default function DepartmentsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState<Department | null>(null);
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

  const { data, isLoading, isError, refetch } = useDepartmentList({ page, limit, search });
  const deleteDepartment = useDeleteDepartment();

  const rows = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pageCount = meta?.pageCount ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }
  function openEdit(d: Department) {
    setEditing(d);
    setDrawerOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteDepartment.mutateAsync(deleting.id);
      setDeleting(null);
      setToast("Bo‘lim o‘chirildi");
    } catch {
      setToast("O‘chirishda xatolik");
    }
  }

  return (
    <div className="stagger">
      <PageHeader
        title="Bo‘limlar"
        subtitle="Tavsif"
        action={
          <Button variant="accent" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Bo‘lim qo‘shish
          </Button>
        }
      />

      <div className="mb-4 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-9"
            placeholder="Bo‘limlarni qidirish..."
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
                <th className="px-4 py-3 font-medium">Filial</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <StateRow colSpan={5}>
                  <Spinner className="mx-auto h-5 w-5" />
                </StateRow>
              ) : isError ? (
                <StateRow colSpan={5}>
                  <div className="flex flex-col items-center gap-2 text-ink-muted">
                    <span className="text-negative">Ma‘lumotni yuklashda xatolik</span>
                    <Button variant="secondary" size="sm" onClick={() => refetch()}>
                      Qayta urinish
                    </Button>
                  </div>
                </StateRow>
              ) : rows.length === 0 ? (
                <StateRow colSpan={5}>
                  <span className="text-ink-muted">Ma‘lumot yo‘q</span>
                </StateRow>
              ) : (
                rows.map((d, i) => (
                  <tr key={d.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-ink-muted">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-medium text-ink">
                        <Network className="h-4 w-4 text-ink-muted" />
                        {d.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{d.ownerLabel ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge tone={DEPARTMENT_STATUS_TONE[d.status]}>
                        {DEPARTMENT_STATUS_LABELS[d.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className="rounded-md p-1.5 text-ink-muted hover:bg-parchment hover:text-ink"
                          title="Tahrirlash"
                          onClick={() => openEdit(d)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-md p-1.5 text-rose-500 hover:bg-rose-500/10"
                          title="O‘chirish"
                          onClick={() => setDeleting(d)}
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

      <DepartmentDrawer
        open={drawerOpen}
        editing={editing}
        onClose={() => setDrawerOpen(false)}
        onSaved={(msg) => {
          setDrawerOpen(false);
          setToast(msg);
        }}
      />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Bo‘limni o‘chirish">
        <p className="text-sm text-ink-muted">
          {deleting?.name} bo‘limi o‘chiriladi. Davom etilsinmi?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Bekor qilish</Button>
          <Button variant="danger" loading={deleteDepartment.isPending} onClick={confirmDelete}>O‘chirish</Button>
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
      <td colSpan={colSpan} className="px-4 py-12 text-center">
        {children}
      </td>
    </tr>
  );
}

function DepartmentDrawer({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: Department | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const { data: branches } = useBranchOptions();
  const { data: schools } = useSchoolOptions();
  const { data: departmentList } = useDepartmentList({ page: 1, limit: 100 });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  // Egasi: "school:<id>" (bosh ofis) yoki "branch:<id>" (filial).
  const [ownerValue, setOwnerValue] = useState("");
  const [parentId, setParentId] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setDescription(editing.description ?? "");
      setOwnerValue(
        editing.filialId ? `branch:${editing.filialId}` : editing.schoolId ? `school:${editing.schoolId}` : "",
      );
      setParentId(editing.parentId ?? "");
      setTelegramChatId(editing.telegramChatId ?? "");
    } else {
      setName("");
      setDescription("");
      setOwnerValue("");
      setParentId("");
      setTelegramChatId("");
    }
    setError(null);
  }, [open, editing]);

  // Birlashgan ro'yxat: avval maktablar (bosh ofis), keyin filiallar.
  const ownerOptions = useMemo(
    () => [
      { value: "", label: "Maktab yoki filialni tanlang" },
      ...(schools ?? []).map((s) => ({ value: `school:${s.id}`, label: `${s.label} (Bosh ofis)` })),
      ...(branches ?? []).map((b) => ({ value: `branch:${b.id}`, label: b.label })),
    ],
    [schools, branches],
  );
  const parentOptions = useMemo(
    () => [
      { value: "", label: "Ota bo‘limni tanlang" },
      ...(departmentList?.items ?? [])
        .filter((d) => d.id !== editing?.id)
        .map((d) => ({ value: d.id, label: d.name })),
    ],
    [departmentList, editing],
  );

  async function submit() {
    if (!name.trim()) {
      setError("Bo‘lim nomini kiriting");
      return;
    }
    if (!ownerValue) {
      setError("Maktab yoki filialni tanlang");
      return;
    }
    const [ownerType, ownerId] = ownerValue.split(":");
    const payload: DepartmentInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      schoolId: ownerType === "school" ? ownerId : undefined,
      filialId: ownerType === "branch" ? ownerId : undefined,
      parentId: parentId || undefined,
      telegramChatId: telegramChatId.trim() || undefined,
    };
    try {
      if (editing) {
        await updateDepartment.mutateAsync({ id: editing.id, input: payload });
        onSaved("Bo‘lim yangilandi");
      } else {
        await createDepartment.mutateAsync(payload);
        onSaved("Bo‘lim yaratildi");
      }
    } catch {
      setError("Saqlashda xatolik yuz berdi");
    }
  }

  const pending = createDepartment.isPending || updateDepartment.isPending;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "Bo‘limni yangilash" : "Bo‘lim yaratish"}
      icon={<Network className="h-5 w-5" />}
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
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bo‘lim nomini kiriting" />
        </Field>
        <Field label="Tavsif">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Tavsifni kiriting..."
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-amber focus-visible:focus-ring"
          />
        </Field>
        <Field label="Maktab / Filial" required>
          <Select value={ownerValue} onChange={(e) => setOwnerValue(e.target.value)} options={ownerOptions} />
          <p className="mt-1 text-xs text-ink-muted">
            Asosiy maktab (bosh ofis) yoki uning filiali — bo‘lim shunga tegishli bo‘ladi.
          </p>
        </Field>
        <Field label="Ota bo‘lim">
          <Select value={parentId} onChange={(e) => setParentId(e.target.value)} options={parentOptions} />
        </Field>
        <Field label="Telegram Chat ID">
          <Input value={telegramChatId} onChange={(e) => setTelegramChatId(e.target.value)} placeholder="Telegram chat ID sini kiriting" />
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
