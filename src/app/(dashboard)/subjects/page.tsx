"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, CheckCircle2, Eye, Pencil, Plus, Search, Trash2, XCircle } from "lucide-react";
import { useDeleteSubject, useSubjectList, type Subject } from "@/lib/api/subjects";
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
import { SubjectFormDrawer } from "@/components/academic/subject-form-drawer";
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
  tone?: "accent" | "positive" | "warning";
}) {
  const tones = {
    accent: "bg-accent/12 text-accent",
    positive: "bg-positive/12 text-positive",
    warning: "bg-amber/12 text-amber-600",
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

export default function SubjectsPage() {
  const { t } = useI18n();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState<Subject | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useSubjectList();
  const remove = useDeleteSubject();

  const stats = data?.stats;
  const items = useMemo(() => data?.items ?? [], [data]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? items.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.russianName.toLowerCase().includes(q) ||
            s.code.toLowerCase().includes(q),
        )
      : items;
  }, [items, search]);

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (subject: Subject) => {
    setEditing(subject);
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

  const rowActions: RowAction<Subject>[] = [
    {
      key: "detail",
      label: t("subjects.detail.subtitle"),
      icon: Eye,
      permission: "academic-subjects.read",
      onSelect: (s) => router.push(`/subjects/${s.id}`),
    },
    {
      key: "update",
      label: t("common.edit"),
      icon: Pencil,
      permission: "academic-subjects.update",
      onSelect: openEdit,
    },
    {
      key: "delete",
      label: t("common.delete"),
      icon: Trash2,
      tone: "danger",
      permission: "academic-subjects.delete",
      onSelect: setDeleting,
    },
  ];
  const actionsColumn = useRowActionsColumn<Subject>({
    actions: rowActions,
    header: t("subjects.col.actions"),
  });

  const columns: Column<Subject>[] = [
    {
      key: "index",
      header: "№",
      render: (s) => <span className="text-ink-muted tnum">{rows.indexOf(s) + 1}</span>,
    },
    {
      key: "name",
      header: t("subjects.col.name"),
      render: (s) => (
        <span className="inline-flex items-center gap-2 font-medium text-ink">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
          {s.name}
        </span>
      ),
    },
    {
      key: "russianName",
      header: t("subjects.col.russianName"),
      render: (s) => <span className="text-sm text-ink-soft">{s.russianName}</span>,
    },
    {
      key: "status",
      header: t("subjects.col.status"),
      render: (s) => (
        <Badge tone={s.isActive ? "positive" : "neutral"}>
          {s.isActive ? t("subjects.status.active") : t("subjects.status.inactive")}
        </Badge>
      ),
    },
    ...actionsColumn,
  ];

  return (
    <div className="stagger">
      <PageHeader
        title={t("subjects.title")}
        subtitle={t("subjects.listSubtitle")}
        action={
          <Can permission="academic-subjects.create">
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                {t("subjects.new.button")}
              </Button>
          </Can>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<BookOpen className="h-5 w-5" />}
          label={t("subjects.stats.total")}
          value={formatMoney(stats?.total ?? 0)}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="positive"
          label={t("subjects.stats.active")}
          value={formatMoney(stats?.active ?? 0)}
        />
        <StatCard
          icon={<XCircle className="h-5 w-5" />}
          tone="warning"
          label={t("subjects.stats.inactive")}
          value={formatMoney(stats?.inactive ?? 0)}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("subjects.searchPlaceholder")}
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
        rowKey={(s) => s.id}
      />

      <SubjectFormDrawer open={drawerOpen} subject={editing} onClose={() => setDrawerOpen(false)} />

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        size="md"
        title={t("subjects.delete.title")}
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
          {t("subjects.delete.confirm")} <span className="font-medium text-ink">{deleting?.name}</span>?
        </p>
      </Modal>
    </div>
  );
}
