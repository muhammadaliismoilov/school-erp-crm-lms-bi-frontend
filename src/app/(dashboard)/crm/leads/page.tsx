"use client";

import { useMemo, useState } from "react";
import { FilterX, LayoutGrid, List, Phone, Plus, Search, Trash2, Users } from "lucide-react";
import {
  LEAD_STATUSES,
  LEAD_TASK_FILTERS,
  useDeleteLead,
  useLeadSources,
  useLeadTags,
  useLeads,
  useMoveLead,
  type Lead,
  type LeadStatus,
  type LeadTaskFilter,
} from "@/lib/api/crm";
import { useUsers } from "@/lib/api/users";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { LeadKanban } from "@/components/crm/lead-kanban";
import { LeadFormDrawer } from "@/components/crm/lead-form-drawer";
import { LeadDetailDrawer } from "@/components/crm/lead-detail-drawer";
import { LeadEnrollDrawer } from "@/components/crm/lead-enroll-drawer";
import { formatMoney } from "@/lib/utils";
import { useCrudPermissions } from "@/lib/auth/use-can";
import { Can } from "@/components/auth/can";

const DATE_PRESETS = ["today", "week", "days10", "month"] as const;
type DatePreset = (typeof DATE_PRESETS)[number];

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Map a preset to an inclusive [from, to] ISO range, ending today. */
function presetRange(preset: DatePreset): { from: string; to: string } {
  const today = new Date();
  const to = isoDay(today);
  const f = new Date(today);
  if (preset === "today") return { from: to, to };
  if (preset === "days10") {
    f.setDate(f.getDate() - 9);
    return { from: isoDay(f), to };
  }
  if (preset === "week") {
    const mondayOffset = (today.getDay() + 6) % 7; // Mon=0 … Sun=6
    f.setDate(f.getDate() - mondayOffset);
    return { from: isoDay(f), to };
  }
  return { from: isoDay(new Date(today.getFullYear(), today.getMonth(), 1)), to }; // month
}

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
  const { canUpdate, canDelete } = useCrudPermissions("crm-leads");


  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "">("");
  const [sourceId, setSourceId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [taskFilter, setTaskFilter] = useState<LeadTaskFilter | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset | "">("");
  const [tagId, setTagId] = useState("");
  const [page, setPage] = useState(1);

  const applyPreset = (p: DatePreset | "") => {
    setDatePreset(p);
    setPage(1);
    if (!p) {
      setDateFrom("");
      setDateTo("");
      return;
    }
    const r = presetRange(p);
    setDateFrom(r.from);
    setDateTo(r.to);
  };

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Lead | null>(null);
  const [enrolling, setEnrolling] = useState<Lead | null>(null);
  const [enrolledCode, setEnrolledCode] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const resetFilters = () => {
    setStatusFilter("");
    setSourceId("");
    setAssignedToId("");
    setTaskFilter("");
    setDateFrom("");
    setDateTo("");
    setDatePreset("");
    setTagId("");
    setSearch("");
    setPage(1);
  };

  const filters = useMemo(
    () => ({
      search: search || undefined,
      status: statusFilter || undefined,
      sourceId: sourceId || undefined,
      assignedToId: assignedToId || undefined,
      taskFilter: taskFilter || undefined,
      // DateInput emits ISO yyyy-mm-dd; widen the upper bound to end-of-day.
      dateFrom: dateFrom || undefined,
      dateTo: dateTo ? `${dateTo}T23:59:59` : undefined,
      tagIds: tagId ? [tagId] : undefined,
      page,
      // Kanban groups all fetched leads; table paginates. The backend caps the
      // page size at 100, so the kanban uses the max allowed limit.
      limit: view === "kanban" ? 100 : 20,
    }),
    [search, statusFilter, sourceId, assignedToId, taskFilter, dateFrom, dateTo, tagId, page, view],
  );

  const { data, isLoading, isError, refetch } = useLeads(filters);
  const sources = useLeadSources();
  const tags = useLeadTags();
  const managers = useUsers({ limit: 100 });
  const move = useMoveLead();
  const remove = useDeleteLead();

  const stats = data?.stats;
  const rows = data?.items ?? [];

  const hasActiveFilters = Boolean(
    statusFilter || sourceId || assignedToId || taskFilter || dateFrom || dateTo || tagId || search,
  );

  const sourceOptions = [
    { value: "", label: t("crm.lead.allSources") },
    ...(sources.data ?? []).map((s) => ({ value: s.id, label: s.name })),
  ];
  const statusFilterOptions = [
    { value: "", label: t("crm.lead.allStatuses") },
    ...LEAD_STATUSES.map((s) => ({ value: s, label: t(`crm.status.${s}`) })),
  ];
  const managerOptions = [
    { value: "", label: t("crm.lead.allManagers") },
    ...(managers.data?.items ?? []).map((u) => ({ value: u.id, label: u.fullName })),
  ];
  const taskFilterOptions = [
    { value: "", label: t("crm.lead.allTasks") },
    ...LEAD_TASK_FILTERS.map((tf) => ({ value: tf, label: t(`crm.taskFilter.${tf}`) })),
  ];
  const tagOptions = [
    { value: "", label: t("crm.lead.allTags") },
    ...(tags.data ?? []).map((tg) => ({ value: tg.id, label: tg.name })),
  ];
  const datePresetOptions = [
    { value: "", label: t("crm.dateRange.all") },
    ...DATE_PRESETS.map((p) => ({ value: p, label: t(`crm.dateRange.${p}`) })),
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
          {canDelete && (
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
          <Can permission="crm-leads.create">
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t("crm.lead.new")}
            </Button>
          </Can>
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
      </div>

      {/* Filtrlar qatori (rasmdagidek) */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="w-40">
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as LeadStatus | ""); setPage(1); }} options={statusFilterOptions} />
        </div>
        <div className="w-44">
          <Select value={assignedToId} onChange={(e) => { setAssignedToId(e.target.value); setPage(1); }} options={managerOptions} />
        </div>
        <div className="w-44">
          <Select value={taskFilter} onChange={(e) => { setTaskFilter(e.target.value as LeadTaskFilter | ""); setPage(1); }} options={taskFilterOptions} />
        </div>
        <div className="w-40">
          <Select value={datePreset} onChange={(e) => applyPreset(e.target.value as DatePreset | "")} options={datePresetOptions} />
        </div>
        <div className="w-36">
          <DatePicker value={dateFrom} onChange={(iso) => { setDateFrom(iso); setDatePreset(""); setPage(1); }} placeholder={t("crm.lead.dateFrom")} max={dateTo || undefined} />
        </div>
        <div className="w-36">
          <DatePicker value={dateTo} onChange={(iso) => { setDateTo(iso); setDatePreset(""); setPage(1); }} placeholder={t("crm.lead.dateTo")} min={dateFrom || undefined} />
        </div>
        <div className="w-40">
          <Select value={sourceId} onChange={(e) => { setSourceId(e.target.value); setPage(1); }} options={sourceOptions} />
        </div>
        <div className="w-40">
          <Select value={tagId} onChange={(e) => { setTagId(e.target.value); setPage(1); }} options={tagOptions} />
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-ink-muted">
            <FilterX className="h-4 w-4" />
            {t("crm.lead.clearFilters")}
          </Button>
        )}
      </div>

      {actionError && <p className="mb-3 rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{actionError}</p>}

      {view === "kanban" ? (
        <LeadKanban
          leads={rows}
          stats={stats}
          canMove={canUpdate}
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
        onEnroll={(l) => { setDetailId(null); setEnrolling(l); }}
      />
      <LeadEnrollDrawer
        open={Boolean(enrolling)}
        lead={enrolling}
        onClose={() => setEnrolling(null)}
        onEnrolled={(code) => setEnrolledCode(code)}
      />

      <Modal
        open={Boolean(enrolledCode)}
        onClose={() => setEnrolledCode(null)}
        size="md"
        title={t("crm.enroll.successTitle")}
        footer={
          <Button onClick={() => setEnrolledCode(null)}>{t("common.ok")}</Button>
        }
      >
        <p className="text-sm text-ink-soft">
          {t("crm.enroll.successBody")} <span className="font-medium text-ink tnum">{enrolledCode}</span>
        </p>
      </Modal>

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
