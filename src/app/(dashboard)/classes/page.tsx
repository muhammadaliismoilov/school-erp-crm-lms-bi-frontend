"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DoorClosed,
  Eye,
  GraduationCap,
  Languages,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useClassList, useDeleteClass, type SchoolClass } from "@/lib/api/classes";
import { ApiError } from "@/lib/api/types";
import { useAuthStore } from "@/lib/auth/store";
import { useI18n } from "@/lib/i18n/provider";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { ClassFormModal } from "@/components/academic/class-form-modal";
import { ClassSmsModal } from "@/components/academic/class-sms-modal";
import { formatMoney } from "@/lib/utils";

const LANGUAGE_LABEL: Record<string, string> = { uz: "UZ", ru: "RU", en: "EN" };

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

export default function ClassesPage() {
  const { t } = useI18n();
  const router = useRouter();
  const can = useAuthStore((s) => s.can);
  const canManage = can("academic.manage");

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [deleting, setDeleting] = useState<SchoolClass | null>(null);
  const [smsTarget, setSmsTarget] = useState<SchoolClass | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useClassList();
  const remove = useDeleteClass();

  const stats = data?.stats;
  const items = useMemo(() => data?.items ?? [], [data]);

  const rows = useMemo(() => {
    const q = search.trim().toUpperCase();
    return q ? items.filter((c) => c.name.toUpperCase().includes(q)) : items;
  }, [items, search]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (schoolClass: SchoolClass) => {
    setEditing(schoolClass);
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

  const languagesValue = stats
    ? `${stats.languages.uz}/${stats.languages.ru}/${stats.languages.en}`
    : "0/0/0";

  const columns: Column<SchoolClass>[] = [
    {
      key: "index",
      header: "№",
      render: (c) => <span className="text-ink-muted tnum">{rows.indexOf(c) + 1}</span>,
    },
    {
      key: "name",
      header: t("classes.col.name"),
      render: (c) => (
        <Badge tone="accent">
          <GraduationCap className="mr-1 h-3.5 w-3.5" />
          {c.name}
        </Badge>
      ),
    },
    {
      key: "language",
      header: t("classes.col.language"),
      render: (c) => (
        <span className="text-sm font-medium text-ink-soft">
          {LANGUAGE_LABEL[c.language] ?? String(c.language).toUpperCase()}
        </span>
      ),
    },
    {
      key: "curator",
      header: t("classes.col.curator"),
      render: (c) => <span className="text-sm text-ink-soft">{c.curator.fullName || "—"}</span>,
    },
    {
      key: "room",
      header: t("classes.col.room"),
      render: (c) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
          <DoorClosed className="h-3.5 w-3.5 text-ink-muted" />
          {c.room.label || "—"}
        </span>
      ),
    },
    {
      key: "students",
      header: t("classes.col.students"),
      render: (c) => <span className="text-sm text-ink-soft tnum">{c.stats.studentCount}</span>,
    },
    {
      key: "actions",
      header: t("classes.col.actions"),
      align: "right" as const,
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/classes/${c.id}`)}
            aria-label={t("classes.detail.subtitle")}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {canManage && (
            <>
              <Button variant="ghost" size="sm" onClick={() => openEdit(c)} aria-label={t("common.edit")}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSmsTarget(c)}
                aria-label={t("classes.detail.sendSms")}
                className="text-amber-600"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleting(c)}
                aria-label={t("common.delete")}
                className="text-negative"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="stagger">
      <PageHeader
        title={t("classes.title")}
        subtitle={t("classes.listSubtitle")}
        action={
          canManage && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t("classes.new.button")}
            </Button>
          )
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<GraduationCap className="h-5 w-5" />}
          label={t("classes.stats.total")}
          value={formatMoney(stats?.totalClasses ?? 0)}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          tone="positive"
          label={t("classes.stats.students")}
          value={formatMoney(stats?.totalStudents ?? 0)}
        />
        <StatCard
          icon={<Languages className="h-5 w-5" />}
          tone="warning"
          label={t("classes.stats.languages")}
          value={languagesValue}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("classes.searchPlaceholder")}
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
        rowKey={(c) => c.id}
      />

      <ClassFormModal open={modalOpen} schoolClass={editing} onClose={() => setModalOpen(false)} />

      <ClassSmsModal
        open={Boolean(smsTarget)}
        classId={smsTarget?.id ?? null}
        studentCount={smsTarget?.stats.studentCount ?? 0}
        onClose={() => setSmsTarget(null)}
      />

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        size="md"
        title={t("classes.delete.title")}
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
          {t("classes.delete.confirm")} <span className="font-medium text-ink">{deleting?.name}</span>?
        </p>
      </Modal>
    </div>
  );
}
