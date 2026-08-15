"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CalendarDays, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useAcademicYears } from "@/lib/api/academic-years";
import {
  useDeleteQuarter,
  useQuarters,
  type Quarter,
  type QuarterStatus,
} from "@/lib/api/quarters";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { useRowActionsColumn, type RowAction } from "@/components/ui/row-actions";
import { Can } from "@/components/auth/can";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { QuarterFormDrawer } from "@/components/academic/quarter-form-drawer";
import { formatDate, formatMoney } from "@/lib/utils";

const STATUS_TONE: Record<QuarterStatus, "positive" | "neutral" | "caution"> = {
  current: "positive",
  completed: "neutral",
  planned: "caution",
};

function StatCard({
  icon,
  label,
  value,
  tone = "accent",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "accent" | "positive";
}) {
  const tones = { accent: "bg-accent/12 text-accent", positive: "bg-positive/12 text-positive" };
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

export default function QuartersPage() {
  const { t } = useI18n();

  const { data: years } = useAcademicYears();
  const [yearId, setYearId] = useState("");

  // Default to the current academic year once years load.
  useEffect(() => {
    if (yearId || !years?.items.length) return;
    const current = years.items.find((y) => y.isCurrent) ?? years.items[0];
    setYearId(current.id);
  }, [years, yearId]);

  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Quarter | null>(null);
  const [deleting, setDeleting] = useState<Quarter | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuarters(yearId || undefined);
  const remove = useDeleteQuarter();

  const stats = data?.stats;
  const currentQuarter = useMemo(
    () => data?.items.find((q) => q.status === "current") ?? null,
    [data],
  );

  const rows = useMemo(() => {
    const items = data?.items ?? [];
    const q = search.trim().toLowerCase();
    return q ? items.filter((item) => item.name.toLowerCase().includes(q)) : items;
  }, [data, search]);

  const yearOptions = (years?.items ?? []).map((y) => ({ value: y.id, label: y.name }));

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (quarter: Quarter) => {
    setEditing(quarter);
    setDrawerOpen(true);
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

  const rowActions: RowAction<Quarter>[] = [
    {
      key: "update",
      label: t("common.edit"),
      icon: Pencil,
      permission: "academic-quarters.update",
      onSelect: openEdit,
    },
    {
      key: "delete",
      label: t("common.delete"),
      icon: Trash2,
      tone: "danger",
      permission: "academic-quarters.delete",
      onSelect: setDeleting,
    },
  ];
  const actionsColumn = useRowActionsColumn<Quarter>({
    actions: rowActions,
    header: "",
  });

  const columns: Column<Quarter>[] = [
    {
      key: "number",
      header: t("quarters.col.number"),
      render: (q) => (
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-ink-muted" />
          <span className="font-medium text-ink">{q.name}</span>
        </div>
      ),
    },
    {
      key: "year",
      header: t("quarters.col.year"),
      render: (q) => <span className="text-ink-soft">{q.academicYear?.name ?? "—"}</span>,
    },
    {
      key: "start",
      header: t("quarters.col.start"),
      className: "tnum",
      render: (q) => <span className="text-ink-soft">{formatDate(q.startDate)}</span>,
    },
    {
      key: "end",
      header: t("quarters.col.end"),
      className: "tnum",
      render: (q) => <span className="text-ink-soft">{formatDate(q.endDate)}</span>,
    },
    {
      key: "status",
      header: t("quarters.col.status"),
      render: (q) => <Badge tone={STATUS_TONE[q.status]}>{t(`quarters.status.${q.status}`)}</Badge>,
    },
    ...actionsColumn,
  ];

  return (
    <div className="stagger">
      <PageHeader
        title={t("quarters.title")}
        subtitle={t("quarters.listSubtitle")}
        action={
          <Can permission="academic-quarters.create">
              <Button onClick={openCreate} disabled={!yearId}>
                <Plus className="h-4 w-4" />
                {t("quarters.new.button")}
              </Button>
          </Can>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <StatCard
          icon={<CalendarDays className="h-5 w-5" />}
          label={t("quarters.stats.total")}
          value={formatMoney(stats?.total ?? 0)}
        />
        <StatCard
          icon={<CalendarClock className="h-5 w-5" />}
          tone="positive"
          label={t("quarters.stats.current")}
          value={currentQuarter?.name ?? t("quarters.stats.none")}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select
          value={yearId}
          onChange={(e) => setYearId(e.target.value)}
          options={yearOptions}
          placeholder={t("quarters.yearFilter")}
          className="max-w-[200px]"
        />
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("quarters.searchPlaceholder")}
            className="pl-9"
          />
        </div>
      </div>

      {actionError && (
        <p className="mb-3 rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{actionError}</p>
      )}

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
        rowKey={(q) => q.id}
      />

      <QuarterFormDrawer
        open={drawerOpen}
        quarter={editing}
        defaultAcademicYearId={yearId}
        onClose={() => setDrawerOpen(false)}
      />

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        size="md"
        title={t("quarters.delete.title")}
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
          {t("quarters.delete.confirm")} <span className="font-medium text-ink">{deleting?.name}</span>?
        </p>
      </Modal>
    </div>
  );
}
