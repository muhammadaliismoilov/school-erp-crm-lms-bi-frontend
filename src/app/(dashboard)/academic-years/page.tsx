"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, CalendarDays, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import {
  useAcademicYears,
  useDeleteAcademicYear,
  useSetCurrentAcademicYear,
  type AcademicYear,
} from "@/lib/api/academic-years";
import { ApiError } from "@/lib/api/types";
import { useAuthStore } from "@/lib/auth/store";
import { useI18n } from "@/lib/i18n/provider";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { AcademicYearFormDrawer } from "@/components/academic/academic-year-form-drawer";
import { cn, formatDate, formatMoney } from "@/lib/utils";

function fmtDate(iso: string): string {
  return formatDate(iso); // dd/mm/yyyy
}

function StatCard({
  icon,
  label,
  value,
  tone = "accent",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "accent" | "positive" | "caution";
}) {
  const tones = {
    accent: "bg-accent/12 text-accent",
    positive: "bg-positive/12 text-positive",
    caution: "bg-caution/14 text-caution",
  };
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={cn("grid h-11 w-11 place-items-center rounded-xl", tones[tone])}>{icon}</div>
      <div>
        <p className="text-sm text-ink-muted">{label}</p>
        <p className="font-display text-2xl font-semibold text-ink tnum">{value}</p>
      </div>
    </Card>
  );
}

export default function AcademicYearsPage() {
  const { t } = useI18n();
  const can = useAuthStore((s) => s.can);
  const canManage = can("academic.manage");

  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicYear | null>(null);
  const [deleting, setDeleting] = useState<AcademicYear | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useAcademicYears();
  const remove = useDeleteAcademicYear();
  const setCurrent = useSetCurrentAcademicYear();

  const stats = data?.stats;
  const rows = useMemo(() => {
    const items = data?.items ?? [];
    const q = search.trim().toLowerCase();
    return q ? items.filter((y) => y.name.toLowerCase().includes(q)) : items;
  }, [data, search]);

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (year: AcademicYear) => {
    setEditing(year);
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

  async function handleSetCurrent(year: AcademicYear) {
    setActionError(null);
    try {
      await setCurrent.mutateAsync(year.id);
    } catch {
      /* surfaced via list refetch */
    }
  }

  const columns: Column<AcademicYear>[] = [
    {
      key: "name",
      header: t("academicYears.col.name"),
      render: (y) => (
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-ink-muted" />
          <span className="font-medium text-ink">{y.name}</span>
        </div>
      ),
    },
    {
      key: "start",
      header: t("academicYears.col.start"),
      className: "tnum",
      render: (y) => <span className="text-ink-soft">{fmtDate(y.startDate)}</span>,
    },
    {
      key: "end",
      header: t("academicYears.col.end"),
      className: "tnum",
      render: (y) => <span className="text-ink-soft">{fmtDate(y.endDate)}</span>,
    },
    {
      key: "status",
      header: t("academicYears.col.status"),
      render: (y) =>
        y.isCurrent ? (
          <Badge tone="positive">{t("academicYears.status.current")}</Badge>
        ) : (
          <Badge tone="neutral">{t("academicYears.status.inactive")}</Badge>
        ),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            align: "right" as const,
            render: (y: AcademicYear) => (
              <div className="flex items-center justify-end gap-1">
                {!y.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetCurrent(y)}
                    aria-label={t("academicYears.action.setCurrent")}
                    title={t("academicYears.action.setCurrent")}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => openEdit(y)} aria-label={t("common.edit")}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleting(y)}
                  aria-label={t("common.delete")}
                  className="text-negative"
                  disabled={y.isCurrent}
                >
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
        title={t("academicYears.title")}
        subtitle={t("academicYears.listSubtitle")}
        action={
          canManage && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t("academicYears.new.button")}
            </Button>
          )
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard icon={<CalendarDays className="h-5 w-5" />} label={t("academicYears.stats.total")} value={formatMoney(stats?.totalCount ?? 0)} />
        <StatCard icon={<CalendarCheck className="h-5 w-5" />} tone="positive" label={t("academicYears.stats.current")} value={stats?.currentYearName ?? "—"} />
        <StatCard icon={<CalendarDays className="h-5 w-5" />} tone="caution" label={t("academicYears.stats.calendarYear")} value={String(stats?.currentCalendarYear ?? new Date().getFullYear())} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("academicYears.searchPlaceholder")}
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
        rowKey={(y) => y.id}
      />

      <AcademicYearFormDrawer open={drawerOpen} year={editing} onClose={() => setDrawerOpen(false)} />

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        size="md"
        title={t("academicYears.delete.title")}
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
          {t("academicYears.delete.confirm")} <span className="font-medium text-ink">{deleting?.name}</span>?
        </p>
      </Modal>
    </div>
  );
}
