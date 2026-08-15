"use client";

import { useState } from "react";
import { Building2, CreditCard, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import {
  useDeleteSchool,
  useSchools,
  type School,
} from "@/lib/api/schools";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SchoolFormModal } from "@/components/schools/school-form-modal";
import { formatMoney } from "@/lib/utils";
import { Can } from "@/components/auth/can";
import { useRowActionsColumn, type RowAction } from "@/components/ui/row-actions";

const typeTone: Record<string, "neutral" | "positive" | "accent" | "caution"> = {
  general: "neutral",
  private: "accent",
  specialized: "positive",
  international: "caution",
};

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/12 text-accent">
        {icon}
      </div>
      <div>
        <p className="text-sm text-ink-muted">{label}</p>
        <p className="font-display text-2xl font-semibold text-ink tnum">{value}</p>
      </div>
    </Card>
  );
}

export default function SchoolsPage() {
  const { t, locale } = useI18n();
  // ATAYLAB qo'pol: maktablar — super-admin infratuzilmasi, `schools.controller`
  // butunlay `SETTINGS_MANAGE` da (granular rollout'dan tashqarida qoldirilgan).

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<School | null>(null);
  const [deleting, setDeleting] = useState<School | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useSchools({
    page,
    limit: 20,
    search: search || undefined,
  });
  const removeSchool = useDeleteSchool();

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (school: School) => {
    setEditing(school);
    setFormOpen(true);
  };

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteError(null);
    try {
      await removeSchool.mutateAsync(deleting.id);
      setDeleting(null);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.localized(locale) : t("common.error"));
    }
  }

  const rowActions: RowAction<School>[] = [
    {
      key: "update",
      label: t("common.edit"),
      icon: Pencil,
      permission: "settings-school.update",
      onSelect: openEdit,
    },
    {
      key: "delete",
      label: t("common.delete"),
      icon: Trash2,
      tone: "danger",
      permission: "settings-school.delete",
      onSelect: setDeleting,
    },
  ];
  const actionsColumn = useRowActionsColumn<School>({ actions: rowActions, header: "" });

  const columns: Column<School>[] = [
    {
      key: "name",
      header: t("schools.col.name"),
      render: (s) => (
        <div>
          <span className="font-medium text-ink">{s.name}</span>
          {s.legalName && <p className="text-xs text-ink-muted">{s.legalName}</p>}
        </div>
      ),
    },
    {
      key: "type",
      header: t("schools.col.type"),
      render: (s) => (
        <Badge tone={typeTone[s.schoolType] ?? "neutral"}>{t(`schools.type.${s.schoolType}`)}</Badge>
      ),
    },
    {
      key: "address",
      header: t("schools.col.address"),
      render: (s) => <span className="text-ink-soft">{s.address ?? "—"}</span>,
    },
    {
      key: "phone",
      header: t("schools.col.phone"),
      className: "font-mono text-ink-soft tnum",
      render: (s) => s.phone ?? "—",
    },
    {
      key: "capacity",
      header: t("schools.col.capacity"),
      align: "right",
      className: "tnum",
      render: (s) => formatMoney(s.capacities.total),
    },
    ...actionsColumn,
  ];

  const stats = data?.stats;

  return (
    <div className="stagger">
      <PageHeader
        title={t("schools.title")}
        subtitle={t("schools.listSubtitle")}
        action={
          <Can permission="settings-school.create">
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t("schools.new")}
            </Button>
          </Can>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Building2 className="h-5 w-5" />}
          label={t("schools.stats.count")}
          value={formatMoney(stats?.schoolCount ?? 0)}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label={t("schools.stats.capacity")}
          value={formatMoney(stats?.totalCapacity ?? 0)}
        />
        <StatCard
          icon={<CreditCard className="h-5 w-5" />}
          label={t("schools.stats.payment")}
          value={formatMoney(stats?.monthlyPaymentTotal ?? 0)}
        />
      </div>

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("common.search")}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={data?.items}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        page={page}
        pageCount={data?.totalPages ?? 1}
        total={data?.total ?? 0}
        onPageChange={setPage}
        rowKey={(s) => s.id}
      />

      <SchoolFormModal open={formOpen} onClose={() => setFormOpen(false)} school={editing} />

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        size="md"
        title={t("schools.delete.title")}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleting(null)}
              disabled={removeSchool.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={removeSchool.isPending}>
              {t("common.delete")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          {t("schools.delete.confirm")}{" "}
          <span className="font-medium text-ink">{deleting?.name}</span>?
        </p>
        {deleteError && <p className="mt-3 text-sm text-negative">{deleteError}</p>}
      </Modal>
    </div>
  );
}
