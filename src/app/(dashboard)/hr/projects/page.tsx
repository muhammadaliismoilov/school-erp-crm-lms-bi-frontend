"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FolderKanban,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  PROJECT_COLOR_PRESETS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TONE,
  PAGE_SIZES,
  useCreateProject,
  useDeleteProject,
  useProjectList,
  useUpdateProject,
  type Project,
  type ProjectInput,
} from "@/lib/api/hr-projects";
import { Badge, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Drawer } from "@/components/ui/drawer";
import { PageHeader } from "@/components/ui/page-header";
import {
  RowActions,
  useAnyRowAction,
  type RowAction,
} from "@/components/ui/row-actions";
import { Can } from "@/components/auth/can";

export default function ProjectsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
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

  const { data, isLoading, isError, refetch } = useProjectList({ page, limit, search });
  const deleteProject = useDeleteProject();

  const rows = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pageCount = meta?.pageCount ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteProject.mutateAsync(deleting.id);
      setDeleting(null);
      setToast("Loyiha o‘chirildi");
    } catch {
      setToast("O‘chirishda xatolik");
    }
  }

  const rowActions: RowAction<Project>[] = [
    {
      key: "update",
      label: "Tahrirlash",
      icon: Pencil,
      permission: "hr-projects.update",
      onSelect: (p) => {
        setEditing(p);
        setDrawerOpen(true);
      },
    },
    {
      key: "delete",
      label: "O‘chirish",
      icon: Trash2,
      tone: "danger",
      permission: "hr-projects.delete",
      onSelect: (p) => setDeleting(p),
    },
  ];
  const showActions = useAnyRowAction(rowActions);
  const colCount = showActions ? 6 : 5;

  return (
    <div className="stagger">
      <PageHeader
        title="Loyihalar"
        subtitle="Tavsif"
        action={
          <Can permission="hr-projects.create">
            <Button
              variant="accent"
              onClick={() => {
                setEditing(null);
                setDrawerOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Loyiha qo‘shish
            </Button>
          </Can>
        }
      />

      <div className="mb-4 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-9"
            placeholder="Loyihalarni qidirish..."
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
                <th className="px-4 py-3 font-medium">Tavsif</th>
                <th className="px-4 py-3 font-medium">Rang</th>
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
                    <span className="text-negative">Ma‘lumotni yuklashda xatolik</span>
                    <Button variant="secondary" size="sm" onClick={() => refetch()}>Qayta urinish</Button>
                  </div>
                </StateRow>
              ) : rows.length === 0 ? (
                <StateRow colSpan={colCount}><span className="text-ink-muted">Ma‘lumot yo‘q</span></StateRow>
              ) : (
                rows.map((p, i) => (
                  <tr key={p.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-ink-muted">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-medium text-ink">
                        <FolderKanban className="h-4 w-4 text-ink-muted" />
                        {p.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{p.description ?? "—"}</td>
                    <td className="px-4 py-3">
                      {p.color ? (
                        <span className="inline-flex items-center gap-2 text-ink-soft">
                          <span
                            className="h-4 w-4 rounded-full border border-line"
                            style={{ background: p.color }}
                          />
                          <span className="tnum text-xs">{p.color}</span>
                        </span>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={PROJECT_STATUS_TONE[p.status]}>{PROJECT_STATUS_LABELS[p.status]}</Badge>
                    </td>
                    {showActions && (
                      <td className="px-4 py-3">
                        <RowActions row={p} actions={rowActions} />
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

      <ProjectDrawer
        open={drawerOpen}
        editing={editing}
        onClose={() => setDrawerOpen(false)}
        onSaved={(msg) => {
          setDrawerOpen(false);
          setToast(msg);
        }}
      />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Loyihani o‘chirish">
        <p className="text-sm text-ink-muted">{deleting?.name} loyihasi o‘chiriladi. Davom etilsinmi?</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Bekor qilish</Button>
          <Button variant="danger" loading={deleteProject.isPending} onClick={confirmDelete}>O‘chirish</Button>
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

function ProjectDrawer({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: Project | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string>(PROJECT_COLOR_PRESETS[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setDescription(editing.description ?? "");
      setColor(editing.color ?? PROJECT_COLOR_PRESETS[0]);
    } else {
      setName("");
      setDescription("");
      setColor(PROJECT_COLOR_PRESETS[0]);
    }
    setError(null);
  }, [open, editing]);

  async function submit() {
    if (!name.trim()) {
      setError("Loyiha nomini kiriting");
      return;
    }
    const payload: ProjectInput = {
      name: name.trim(),
      description: description.trim() || null,
      color: color || null,
    };
    try {
      if (editing) {
        await updateProject.mutateAsync({ id: editing.id, input: payload });
        onSaved("Loyiha yangilandi");
      } else {
        await createProject.mutateAsync(payload);
        onSaved("Loyiha yaratildi");
      }
    } catch {
      setError("Saqlashda xatolik yuz berdi");
    }
  }

  const pending = createProject.isPending || updateProject.isPending;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "Loyihani yangilash" : "Loyiha yaratish"}
      icon={<FolderKanban className="h-5 w-5" />}
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
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Loyiha nomini kiriting" />
        </Field>
        <Field label="Tavsif">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Tavsif kiriting..."
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-amber focus-visible:focus-ring"
          />
        </Field>
        <Field label="Rang">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-lg border border-line bg-surface p-1"
              aria-label="Rang tanlash"
            />
            <Input
              className="w-32"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#f59e0b"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PROJECT_COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => setColor(c)}
                className={`h-6 w-6 rounded-full border transition ${
                  color.toLowerCase() === c.toLowerCase()
                    ? "border-ink ring-2 ring-amber"
                    : "border-line"
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
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
