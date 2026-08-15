"use client";

import { useMemo, useState } from "react";
import { Clock, Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  useDeleteLessonPeriod,
  useLessonPeriods,
  type LessonPeriod,
} from "@/lib/api/lesson-periods";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { useRowActionsColumn, type RowAction } from "@/components/ui/row-actions";
import { Can } from "@/components/auth/can";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { LessonPeriodFormDrawer } from "@/components/academic/lesson-period-form-drawer";
import { formatMoney } from "@/lib/utils";

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

function TimeBadge({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-parchment/50 px-2 py-1 text-sm text-ink-soft tnum">
      <Clock className="h-3.5 w-3.5 text-ink-muted" />
      {value}
    </span>
  );
}

export default function LessonPeriodsPage() {
  const { t } = useI18n();

  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<LessonPeriod | null>(null);
  const [deleting, setDeleting] = useState<LessonPeriod | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useLessonPeriods();
  const remove = useDeleteLessonPeriod();

  const stats = data?.stats;
  const items = useMemo(() => data?.items ?? [], [data]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? items.filter((p) => p.code.toLowerCase().includes(q)) : items;
  }, [items, search]);

  // Autofill suggestions for a new period.
  const nextLessonNumber = useMemo(
    () => (items.length ? Math.max(...items.map((p) => p.lessonNumber)) + 1 : 1),
    [items],
  );
  const defaultStartTime = useMemo(
    () => (items.length ? items[items.length - 1].endTime : "08:00"),
    [items],
  );

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (period: LessonPeriod) => {
    setEditing(period);
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

  const rowActions: RowAction<LessonPeriod>[] = [
    {
      key: "update",
      label: t("common.edit"),
      icon: Pencil,
      permission: "academic-lesson-periods.update",
      onSelect: openEdit,
    },
    {
      key: "delete",
      label: t("common.delete"),
      icon: Trash2,
      tone: "danger",
      permission: "academic-lesson-periods.delete",
      onSelect: setDeleting,
    },
  ];
  const actionsColumn = useRowActionsColumn<LessonPeriod>({
    actions: rowActions,
    header: t("lessonPeriods.col.actions"),
  });

  const columns: Column<LessonPeriod>[] = [
    {
      key: "index",
      header: "№",
      render: (p) => <span className="text-ink-muted tnum">{rows.indexOf(p) + 1}</span>,
    },
    {
      key: "code",
      header: t("lessonPeriods.col.number"),
      render: (p) => (
        <Badge tone="accent">
          <Clock className="mr-1 h-3.5 w-3.5" />
          {p.code}
        </Badge>
      ),
    },
    {
      key: "start",
      header: t("lessonPeriods.col.start"),
      render: (p) => <TimeBadge value={p.startTime} />,
    },
    {
      key: "end",
      header: t("lessonPeriods.col.end"),
      render: (p) => <TimeBadge value={p.endTime} />,
    },
    ...actionsColumn,
  ];

  return (
    <div className="stagger">
      <PageHeader
        title={t("lessonPeriods.title")}
        subtitle={t("lessonPeriods.listSubtitle")}
        action={
          <Can permission="academic-lesson-periods.create">
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                {t("lessonPeriods.new.button")}
              </Button>
          </Can>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label={t("lessonPeriods.stats.total")}
          value={formatMoney(stats?.total ?? 0)}
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          tone="positive"
          label={t("lessonPeriods.stats.firstStart")}
          value={stats?.firstStartTime ?? "—"}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("lessonPeriods.searchPlaceholder")}
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
        rowKey={(p) => p.id}
      />

      <LessonPeriodFormDrawer
        open={drawerOpen}
        lessonPeriod={editing}
        nextLessonNumber={nextLessonNumber}
        defaultStartTime={defaultStartTime}
        onClose={() => setDrawerOpen(false)}
      />

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        size="md"
        title={t("lessonPeriods.delete.title")}
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
          {t("lessonPeriods.delete.confirm")} <span className="font-medium text-ink">{deleting?.code}</span>?
        </p>
      </Modal>
    </div>
  );
}
