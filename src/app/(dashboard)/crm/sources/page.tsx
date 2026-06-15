"use client";

import { useMemo, useState } from "react";
import { Network, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useDeleteSource, useLeadSources, type Source } from "@/lib/api/crm";
import { ApiError } from "@/lib/api/types";
import { useAuthStore } from "@/lib/auth/store";
import { useI18n } from "@/lib/i18n/provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SourceFormModal } from "@/components/crm/source-form-modal";

export default function SourcesPage() {
  const { t } = useI18n();
  const can = useAuthStore((s) => s.can);
  const canManage = can("crm.manage");

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Source | null>(null);
  const [deleting, setDeleting] = useState<Source | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useLeadSources();
  const remove = useDeleteSource();

  const rows = useMemo(() => {
    const items = data ?? [];
    const q = search.trim().toLowerCase();
    return q ? items.filter((s) => s.name.toLowerCase().includes(q)) : items;
  }, [data, search]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (source: Source) => {
    setEditing(source);
    setModalOpen(true);
  };

  async function confirmDelete() {
    if (!deleting) return;
    setActionError(null);
    try {
      await remove.mutateAsync(deleting.id);
      setDeleting(null);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.localized("uz") : t("common.error"));
    }
  }

  const columns: Column<Source>[] = [
    { key: "index", header: "№", render: (s) => <span className="text-ink-muted tnum">{rows.indexOf(s) + 1}</span> },
    {
      key: "name",
      header: t("crm.source.col.name"),
      render: (s) => (
        <span className="inline-flex items-center gap-2 font-medium text-ink">
          <Network className="h-4 w-4 text-ink-muted" />
          {s.name}
        </span>
      ),
    },
    { key: "leadCount", header: t("crm.source.col.leads"), render: (s) => <span className="text-sm text-ink-soft tnum">{s.leadCount}</span> },
    ...(canManage
      ? [
          {
            key: "actions",
            header: t("crm.col.actions"),
            align: "right" as const,
            render: (s: Source) => (
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(s)} aria-label={t("common.edit")}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-negative" onClick={() => setDeleting(s)} aria-label={t("common.delete")}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="stagger">
      <PageHeader
        title={t("crm.sources.title")}
        subtitle={t("crm.sources.subtitle")}
        action={
          canManage && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t("crm.source.new")}
            </Button>
          )
        }
      />

      <Card className="mb-4 flex items-center gap-3 p-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("crm.sources.searchPlaceholder")} className="pl-9" />
        </div>
      </Card>

      {actionError && <p className="mb-3 rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{actionError}</p>}

      <DataTable
        columns={columns}
        rows={isLoading ? undefined : rows}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        page={1}
        pageCount={1}
        total={rows.length}
        onPageChange={() => {}}
        rowKey={(s) => s.id}
      />

      <SourceFormModal open={modalOpen} source={editing} onClose={() => setModalOpen(false)} />

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        size="md"
        title={t("crm.source.deleteTitle")}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)} disabled={remove.isPending}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={remove.isPending}>
              {t("common.delete")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          {t("crm.source.deleteConfirm")} <span className="font-medium text-ink">{deleting?.name}</span>?
        </p>
      </Modal>
    </div>
  );
}
