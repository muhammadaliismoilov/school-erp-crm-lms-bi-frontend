"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, List, Phone, Plus, Search, Trash2, Users } from "lucide-react";
import {
  LEAD_STATUSES,
  useDeleteLead,
  useLeadSources,
  useLeads,
  useMoveLead,
  type Lead,
  type LeadStatus,
} from "@/lib/api/crm";
import { ApiError } from "@/lib/api/types";
import { useAuthStore } from "@/lib/auth/store";
import { useI18n } from "@/lib/i18n/provider";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { LeadKanban } from "@/components/crm/lead-kanban";
import { LeadFormDrawer } from "@/components/crm/lead-form-drawer";
import { LeadDetailDrawer } from "@/components/crm/lead-detail-drawer";
import { formatMoney } from "@/lib/utils";

const STATUS_TONE: Record<LeadStatus, "accent" | "neutral" | "caution" | "positive" | "negative"> = {
  new: "accent",
  contacted: "neutral",
  interested: "caution",
  trial_lesson: "caution",
  contract: "positive",
  rejected: "negative",
};

function StatCard({ icon, label, value, tone = "accent" }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "accent" | "positive" | "warning" | "info";
}) {
  const tones = {
    accent: "bg-accent/12 text-accent",
    positive: "bg-positive/12 text-positive",
    warning: "bg-amber/12 text-amber-600",
    info: "bg-navy/10 text-navy",
  };
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={`grid h-11 w-11 place-items-center rounded-xl ${tones[tone]}`}>{icon}</div>
      <div>
        <p className="text-sm text-ink-muted">{label}</p>
        <p className="font-display text-2xl font-semibold text-ink tnum">{value}</p>
      </div>
    </Card>
  );
}

export default function LeadsPage() {
  const { t } = useI18n();
  const can = useAuthStore((s) => s.can);
  const canManage = can("crm.manage");

  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "">("");
  const [sourceId, setSourceId] = useState("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Lead | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      status: statusFilter || undefined,
      sourceId: sourceId || undefined,
      page,
      // Kanban groups all fetched leads; table paginates. The backend caps the
      // page size at 100, so the kanban uses the max allowed limit.
      limit: view === "kanban" ? 100 : 20,
    }),
    [search, statusFilter, sourceId, page, view],
  );

  const { data, isLoading, isError, refetch } = useLeads(filters);
  const sources = useLeadSources();
  const move = useMoveLead();
  const remove = useDeleteLead();

  const stats = data?.stats;
  const rows = data?.items ?? [];

  const sourceOptions = [
    { value: "", label: t("crm.lead.allSources") },
    ...(sources.data ?? []).map((s) => ({ value: s.id, label: s.name })),
  ];
  const statusFilterOptions = [
    { value: "", label: t("crm.lead.allStatuses") },
    ...LEAD_STATUSES.map((s) => ({ value: s, label: t(`crm.status.${s}`) })),
  ];

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (lead: Lead) => {
    setDetailId(null);
    setEditing(lead);
    setFormOpen(true);
  };

  async function confirmDelete() {
    if (!deleting) return;
    setActionError(null);
    try {
      await remove.mutateAsync(deleting.id);
      setDeleting(null);
      setDetailId(null);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.localized("uz") : t("common.error"));
    }
  }

  const columns: Column<Lead>[] = [
    { key: "index", header: "№", render: (l) => <span className="text-ink-muted tnum">{rows.indexOf(l) + 1}</span> },
    {
      key: "name",
      header: t("crm.col.name"),
      render: (l) => <span className="font-medium text-ink">{l.fullName}</span>,
    },
    {
      key: "phone",
      header: t("crm.col.phone"),
      render: (l) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-ink-soft tnum">
          <Phone className="h-3.5 w-3.5 text-ink-muted" />
          {l.phone}
        </span>
      ),
    },
    { key: "source", header: t("crm.col.source"), render: (l) => <span className="text-sm text-ink-soft">{l.source?.name || "—"}</span> },
    {
      key: "status",
      header: t("crm.col.status"),
      render: (l) => <Badge tone={STATUS_TONE[l.status]}>{t(`crm.status.${l.status}`)}</Badge>,
    },
    { key: "manager", header: t("crm.col.manager"), render: (l) => <span className="text-sm text-ink-soft">{l.assignedTo?.fullName || "—"}</span> },
    {
      key: "actions",
      header: t("crm.col.actions"),
      align: "right" as const,
      render: (l) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => setDetailId(l.id)} aria-label={t("crm.lead.detailTitle")}>
            <List className="h-4 w-4" />
          </Button>
          {canManage && (
            <Button variant="ghost" size="sm" className="text-negative" onClick={() => setDeleting(l)} aria-label={t("common.delete")}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="stagger">
      <PageHeader
        title={t("crm.leads.title")}
        subtitle={t("crm.leads.subtitle")}
        action={
          canManage && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t("crm.lead.new")}
            </Button>
          )
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5" />} label={t("crm.stats.total")} value={formatMoney(stats?.total ?? 0)} />
        <StatCard icon={<Users className="h-5 w-5" />} tone="info" label={t("crm.status.new")} value={formatMoney(stats?.new ?? 0)} />
        <StatCard icon={<Users className="h-5 w-5" />} tone="warning" label={t("crm.status.trial_lesson")} value={formatMoney(stats?.trial_lesson ?? 0)} />
        <StatCard icon={<Users className="h-5 w-5" />} tone="positive" label={t("crm.status.contract")} value={formatMoney(stats?.contract ?? 0)} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-line bg-surface p-1">
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium ${view === "kanban" ? "bg-accent text-accent-fg" : "text-ink-soft"}`}
          >
            <LayoutGrid className="h-4 w-4" /> {t("crm.view.kanban")}
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium ${view === "table" ? "bg-accent text-accent-fg" : "text-ink-soft"}`}
          >
            <List className="h-4 w-4" /> {t("crm.view.table")}
          </button>
        </div>

        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t("crm.leads.searchPlaceholder")} className="pl-9" />
        </div>
        <div className="w-44">
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as LeadStatus | ""); setPage(1); }} options={statusFilterOptions} />
        </div>
        <div className="w-44">
          <Select value={sourceId} onChange={(e) => { setSourceId(e.target.value); setPage(1); }} options={sourceOptions} />
        </div>
      </div>

      {actionError && <p className="mb-3 rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{actionError}</p>}

      {view === "kanban" ? (
        <LeadKanban
          leads={rows}
          stats={stats}
          canManage={canManage}
          onOpen={(l) => setDetailId(l.id)}
          onMove={(id, status) => move.mutate({ id, status })}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={isLoading ? undefined : rows}
          loading={isLoading}
          error={isError}
          onRetry={refetch}
          page={data?.meta.page ?? 1}
          pageCount={data?.meta.pageCount ?? 1}
          total={data?.meta.total ?? 0}
          onPageChange={setPage}
          rowKey={(l) => l.id}
        />
      )}

      <LeadFormDrawer open={formOpen} lead={editing} onClose={() => setFormOpen(false)} />
      <LeadDetailDrawer
        open={Boolean(detailId)}
        leadId={detailId}
        onClose={() => setDetailId(null)}
        onEdit={openEdit}
        onDelete={(l) => setDeleting(l)}
      />

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        size="md"
        title={t("crm.lead.deleteTitle")}
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
          {t("crm.lead.deleteConfirm")} <span className="font-medium text-ink">{deleting?.fullName}</span>?
        </p>
      </Modal>
    </div>
  );
}
