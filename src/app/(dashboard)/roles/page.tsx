"use client";

import { useEffect, useState } from "react";
import { Globe, KeyRound, Lock, Pencil, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import { useDeleteRole, useRoles, type Role } from "@/lib/api/roles";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { useRowActionsColumn, type RowAction } from "@/components/ui/row-actions";
import { Can } from "@/components/auth/can";
import { requiresGlobalWarning } from "@/lib/roles/global-role";
import { useCan } from "@/lib/auth/use-can";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { RoleFormModal } from "@/components/roles/role-form-modal";
import { cn, formatMoney } from "@/lib/utils";
import { useDebouncedSearch } from "@/lib/hooks/use-debounced-search";

const PAGE_SIZE = 20;

const ROLE_TONES = [
  "bg-amber/15 text-amber",
  "bg-positive/12 text-positive",
  "bg-accent/15 text-accent",
  "bg-caution/14 text-caution",
  "bg-navy/10 text-navy",
];

function roleTone(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return ROLE_TONES[hash % ROLE_TONES.length];
}

/** "students.read" → "Students read" — a readable sample without the full catalog. */
function humanizeCode(code: string): string {
  return code
    .replace(/[.\-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

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

export default function RolesPage() {
  const { t, locale } = useI18n();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const searchQuery = useDebouncedSearch(search);
  // Qidiruv o'zgarsa birinchi sahifaga qaytamiz. Reset DEBOUNCELANGAN qiymatga
  // bog'langan: harf bosilganda qaytarsak, kutish tugashidan oldin eski qidiruv
  // bilan ortiqcha so'rov ketardi (foydalanuvchi 1-sahifada bo'lmasa).
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState<Role | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useRoles({
    page,
    limit: PAGE_SIZE,
    search: searchQuery,
  });
  const removeRole = useDeleteRole();
  const can = useCan();
  // Himoyalangan rol (direktor, CEO): faqat shu ruxsatga ega aktor
  // tahrirlashi/o'chirishi mumkin — qolganlar uchun amallar yashiriladi.
  const canManagePrivileged = can("roles.manage-privileged");

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (role: Role) => {
    setEditing(role);
    setFormOpen(true);
  };

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteError(null);
    try {
      await removeRole.mutateAsync(deleting.id);
      setDeleting(null);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.localized(locale) : t("common.error"));
    }
  }

  const rowActions: RowAction<Role>[] = [
    {
      key: "update",
      label: t("common.edit"),
      icon: Pencil,
      permission: "roles.update",
      hidden: (r) => r.isPrivileged && !canManagePrivileged,
      onSelect: openEdit,
    },
    {
      key: "delete",
      label: t("common.delete"),
      icon: Trash2,
      tone: "danger",
      permission: "roles.delete",
      hidden: (r) => r.isSystem || (r.isPrivileged && !canManagePrivileged),
      onSelect: setDeleting,
    },
  ];
  const actionsColumn = useRowActionsColumn<Role>({
    actions: rowActions,
    header: "",
  });

  const columns: Column<Role>[] = [
    {
      key: "name",
      header: t("roles.col.name"),
      render: (r) => (
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-full",
              roleTone(r.name),
            )}
          >
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate font-medium text-ink">
              {r.displayName}
              {r.isPrivileged && (
                <span title={t("roles.privileged.hint")}>
                  <Lock className="h-3.5 w-3.5 shrink-0 text-ink-muted" aria-label={t("roles.privileged")} />
                </span>
              )}
              {/* Global rol maktab rolidan farq qilib tursin: uni tahrirlash
                  BARCHA maktablarga tegadi. Belgi hammaga ko'rsatiladi —
                  maktab direktoriga tahrirlash tugmasi nega yo'qligini ham
                  shu tushuntiradi. */}
              {r.isGlobal && (
                <span title={t("roles.global.hint")}>
                  <Globe className="h-3.5 w-3.5 shrink-0 text-ink-muted" aria-label={t("roles.global")} />
                </span>
              )}
            </p>
            <p className="truncate text-xs text-ink-muted">{r.title}</p>
          </div>
        </div>
      ),
    },
    {
      key: "permissionCount",
      header: t("roles.col.permissions"),
      render: (r) => <Badge tone="accent">{formatMoney(r.permissionCount)}</Badge>,
    },
    {
      key: "dataScope",
      header: t("roles.col.dataScope"),
      // Toraytirilgan rol ko'zga tashlanib tursin: aks holda "nega bu
      // foydalanuvchi ro'yxatni bo'sh ko'ryapti?" degan savol uzoq tekshiriladi.
      render: (r) =>
        r.dataScope === "own" ? (
          <Badge tone="caution">{t("roles.scope.own")}</Badge>
        ) : (
          <span className="text-xs text-ink-muted">{t("roles.scope.all")}</span>
        ),
    },
    {
      key: "sample",
      header: t("roles.col.sample"),
      render: (r) => {
        const sample = r.permissions.slice(0, 3);
        const rest = r.permissionCount - sample.length;
        if (sample.length === 0) return <span className="text-ink-muted">—</span>;
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {sample.map((p) => (
              <span
                key={p.code}
                className="rounded-md bg-parchment-deep px-2 py-0.5 text-xs text-ink-soft"
              >
                {humanizeCode(p.code)}
              </span>
            ))}
            {rest > 0 && <span className="text-xs text-ink-muted tnum">+{rest}</span>}
          </div>
        );
      },
    },
    ...actionsColumn,
  ];

  const stats = data?.stats;

  return (
    <div className="stagger">
      <PageHeader
        title={t("roles.title")}
        subtitle={t("roles.listSubtitle")}
        action={
          <Can permission="roles.create">
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                {t("roles.new")}
              </Button>
          </Can>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<ShieldCheck className="h-5 w-5" />}
          label={t("roles.stats.roles")}
          value={formatMoney(stats?.roleCount ?? 0)}
        />
        <StatCard
          icon={<KeyRound className="h-5 w-5" />}
          label={t("roles.stats.permissions")}
          value={formatMoney(stats?.permissionCount ?? 0)}
        />
        <StatCard
          icon={<Search className="h-5 w-5" />}
          label={t("roles.stats.found")}
          value={formatMoney(stats?.foundCount ?? 0)}
        />
      </div>

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("roles.searchPlaceholder")}
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
        pageCount={data?.meta.pageCount ?? 1}
        total={data?.meta.total ?? 0}
        onPageChange={setPage}
        rowKey={(r) => r.id}
      />

      <RoleFormModal open={formOpen} onClose={() => setFormOpen(false)} role={editing} />

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        size="md"
        title={t("roles.delete.title")}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleting(null)}
              disabled={removeRole.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={removeRole.isPending}>
              {t("common.delete")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          {t("roles.delete.confirm")}{" "}
          <span className="font-medium text-ink">{deleting?.displayName}</span>?
        </p>
        {requiresGlobalWarning(deleting, "delete") && (
          <div className="mt-3 flex gap-2.5 rounded-lg bg-caution/14 p-3">
            <Globe className="mt-0.5 h-4 w-4 shrink-0 text-caution" aria-hidden />
            <div className="text-sm">
              <p className="font-medium text-ink">{t("roles.global.warnTitle")}</p>
              <p className="mt-0.5 text-ink-soft">{t("roles.global.warnDelete")}</p>
            </div>
          </div>
        )}
        {deleteError && <p className="mt-3 text-sm text-negative">{deleteError}</p>}
      </Modal>
    </div>
  );
}
