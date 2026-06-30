"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  PAGE_SIZES,
  useBranchOptions,
  useBranchTree,
  useCreateBranch,
  useDeleteBranch,
  useUpdateBranch,
  type BranchInput,
  type BranchNode,
} from "@/lib/api/hr-branches";
import { Badge, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Drawer } from "@/components/ui/drawer";
import { PageHeader } from "@/components/ui/page-header";

export default function BranchesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<BranchNode | null>(null);
  const [deleting, setDeleting] = useState<BranchNode | null>(null);
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

  const { data, isLoading, isError, refetch } = useBranchTree({ page, limit, search });
  const deleteBranch = useDeleteBranch();

  const rows = useMemo(() => data?.items ?? [], [data]);
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pageCount = meta?.pageCount ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteBranch.mutateAsync(deleting.id);
      setDeleting(null);
      setToast("Filial o‘chirildi");
    } catch {
      setToast("O‘chirishda xatolik");
    }
  }

  // Daraxtni ko'rinadigan qatorlarga yoyamiz (expanded holatiga ko'ra).
  const visibleRows = useMemo(() => {
    const out: { node: BranchNode; depth: number; index: number }[] = [];
    let counter = 0;
    const walk = (nodes: BranchNode[], depth: number) => {
      for (const node of nodes) {
        counter += 1;
        out.push({ node, depth, index: counter });
        if (node.children?.length && expanded.has(node.id)) walk(node.children, depth + 1);
      }
    };
    walk(rows, 0);
    return out;
  }, [rows, expanded]);

  return (
    <div className="stagger">
      <PageHeader
        title="Filiallar"
        subtitle="Tashkilot filiallarini boshqarish"
        action={
          <Button
            variant="accent"
            onClick={() => {
              setEditing(null);
              setDrawerOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Filial qo‘shish
          </Button>
        }
      />

      <div className="mb-4 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-9"
            placeholder="Filiallarni qidirish..."
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
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <StateRow colSpan={4}><Spinner className="mx-auto h-5 w-5" /></StateRow>
              ) : isError ? (
                <StateRow colSpan={4}>
                  <div className="flex flex-col items-center gap-2 text-ink-muted">
                    <span className="text-negative">Ma‘lumotni yuklashda xatolik</span>
                    <Button variant="secondary" size="sm" onClick={() => refetch()}>Qayta urinish</Button>
                  </div>
                </StateRow>
              ) : visibleRows.length === 0 ? (
                <StateRow colSpan={4}><span className="text-ink-muted">Ma‘lumot yo‘q</span></StateRow>
              ) : (
                visibleRows.map(({ node, depth, index }) => {
                  const hasChildren = (node.children?.length ?? 0) > 0;
                  return (
                    <tr key={node.id} className="border-b border-line/60 last:border-0">
                      <td className="px-4 py-3 text-ink-muted">{index}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5" style={{ paddingLeft: depth * 20 }}>
                          {hasChildren ? (
                            <button
                              onClick={() => toggle(node.id)}
                              className="rounded p-0.5 text-ink-muted hover:text-ink"
                              title={expanded.has(node.id) ? "Yopish" : "Ochish"}
                            >
                              {expanded.has(node.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRightIcon className="h-4 w-4" />
                              )}
                            </button>
                          ) : (
                            <span className="inline-block w-5" />
                          )}
                          <Building2 className="h-4 w-4 text-ink-muted" />
                          <span className="font-medium text-ink">{node.name}</span>
                          {node.isHeadOffice && (
                            <Badge tone="accent">Bosh ofis</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={node.isActive ? "positive" : "negative"}>
                          {node.isActive ? "Faol" : "Faol emas"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            className="rounded-md p-1.5 text-ink-muted hover:bg-parchment hover:text-ink"
                            title="Tahrirlash"
                            onClick={() => {
                              setEditing(node);
                              setDrawerOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            className="rounded-md p-1.5 text-rose-500 hover:bg-rose-500/10"
                            title="O‘chirish"
                            onClick={() => setDeleting(node)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= pageCount} onClick={() => setPage(pageCount)}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <BranchDrawer
        open={drawerOpen}
        editing={editing}
        onClose={() => setDrawerOpen(false)}
        onSaved={(msg) => {
          setDrawerOpen(false);
          setToast(msg);
        }}
      />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Filialni o‘chirish">
        <p className="text-sm text-ink-muted">{deleting?.name} filiali o‘chiriladi. Davom etilsinmi?</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Bekor qilish</Button>
          <Button variant="danger" loading={deleteBranch.isPending} onClick={confirmDelete}>O‘chirish</Button>
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

function BranchDrawer({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: BranchNode | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const { data: options } = useBranchOptions();

  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [isHeadOffice, setIsHeadOffice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setParentId(editing.parentId ?? "");
      setIsHeadOffice(editing.isHeadOffice);
    } else {
      setName("");
      setParentId("");
      setIsHeadOffice(false);
    }
    setError(null);
  }, [open, editing]);

  const parentOptions = useMemo(
    () => [
      { value: "", label: "Ota filialni tanlang" },
      ...(options ?? []).filter((o) => o.id !== editing?.id).map((o) => ({ value: o.id, label: o.label })),
    ],
    [options, editing],
  );

  async function submit() {
    if (!name.trim()) {
      setError("Filial nomini kiriting");
      return;
    }
    const payload: BranchInput = {
      name: name.trim(),
      parentId: parentId || undefined,
      isHeadOffice,
    };
    try {
      if (editing) {
        await updateBranch.mutateAsync({ id: editing.id, input: payload });
        onSaved("Filial yangilandi");
      } else {
        await createBranch.mutateAsync(payload);
        onSaved("Filial yaratildi");
      }
    } catch {
      setError("Saqlashda xatolik yuz berdi");
    }
  }

  const pending = createBranch.isPending || updateBranch.isPending;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "Filialni yangilash" : "Filial yaratish"}
      icon={<Building2 className="h-5 w-5" />}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Bekor qilish</Button>
          <Button variant="accent" loading={pending} onClick={submit}>
            {editing ? "Yangilash" : "Yaratish"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Nomi <span className="text-negative">*</span>
          </label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Filial nomini kiriting" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Ota filial</label>
          <Select value={parentId} onChange={(e) => setParentId(e.target.value)} options={parentOptions} />
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={isHeadOffice} onCheckedChange={setIsHeadOffice} aria-label="Bosh ofis" />
          <span className="text-sm text-ink">Bosh ofis hisoblanadimi?</span>
        </div>

        {error && <div className="text-sm text-negative">{error}</div>}
      </div>
    </Drawer>
  );
}
