"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Search, ShieldCheck, Trash2, Users as UsersIcon } from "lucide-react";
import {
  USER_ROLES,
  useDeleteUser,
  useUsers,
  type User,
  type UserRole,
} from "@/lib/api/users";
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
import { UserFormModal } from "@/components/users/user-form-modal";
import { cn, formatMoney } from "@/lib/utils";

const PAGE_SIZE = 30;

const roleTone: Record<UserRole, "neutral" | "positive" | "accent" | "caution" | "negative"> = {
  ADMIN: "negative",
  SUPERMANAGER: "caution",
  SALES_MANAGER: "accent",
  TEACHER: "positive",
  TUTOR: "positive",
  STUDENT: "neutral",
  PARENT: "accent",
};

/** Deterministic accent palette for initials avatars, keyed off the user id. */
const AVATAR_TONES = [
  "bg-amber/15 text-amber",
  "bg-positive/12 text-positive",
  "bg-accent/15 text-accent",
  "bg-caution/14 text-caution",
  "bg-navy/10 text-navy",
];

function initials(user: User): string {
  const a = user.firstName?.[0] ?? user.login?.[0] ?? "?";
  const b = user.lastName?.[0] ?? "";
  return `${a}${b}`.toUpperCase();
}

function avatarTone(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
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

export default function UsersPage() {
  const { t, locale } = useI18n();
  const can = useAuthStore((s) => s.can);
  const canCreate = can("users.create");
  const canUpdate = can("users.update");
  const canManage = canCreate || canUpdate;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useUsers({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    role: role || undefined,
  });
  const removeUser = useDeleteUser();

  const roleOptions = useMemo(
    () => [
      { value: "", label: t("users.filter.allRoles") },
      ...USER_ROLES.map((r) => ({ value: r, label: t(`users.role.${r}`) })),
    ],
    [t],
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (user: User) => {
    setEditing(user);
    setFormOpen(true);
  };

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteError(null);
    try {
      await removeUser.mutateAsync(deleting.id);
      setDeleting(null);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.localized(locale) : t("common.error"));
    }
  }

  function roleLabel(user: User): string {
    const key = (user.role ?? user.roles[0]?.name ?? "").toUpperCase();
    return (USER_ROLES as readonly string[]).includes(key)
      ? t(`users.role.${key}`)
      : user.roles[0]?.title ?? user.role ?? "—";
  }

  const columns: Column<User>[] = [
    {
      key: "name",
      header: t("users.col.name"),
      render: (u) => (
        <div className="flex items-center gap-3">
          {u.profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={u.profileImageUrl}
              alt={u.fullName}
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold",
                avatarTone(u.id),
              )}
            >
              {initials(u)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{u.fullName}</p>
            <p className="truncate font-mono text-xs text-ink-muted">{u.login}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: t("users.col.role"),
      render: (u) => {
        const key = (u.role ?? u.roles[0]?.name ?? "").toUpperCase() as UserRole;
        return <Badge tone={roleTone[key] ?? "neutral"}>{roleLabel(u)}</Badge>;
      },
    },
    {
      key: "gender",
      header: t("users.col.gender"),
      render: (u) => <span className="text-ink-soft">{t(`users.gender.${u.gender}`)}</span>,
    },
    {
      key: "documentNumber",
      header: t("users.col.documentNumber"),
      className: "font-mono text-ink-soft tnum",
      render: (u) => u.documentNumber ?? "—",
    },
    {
      key: "birthDate",
      header: t("users.col.birthDate"),
      className: "tnum",
      render: (u) =>
        u.birthDate ? (
          <span className="text-ink-soft">
            {new Date(u.birthDate).toLocaleDateString(locale === "en" ? "en-GB" : "ru-RU")}
          </span>
        ) : (
          "—"
        ),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            align: "right" as const,
            render: (u: User) => (
              <div className="flex items-center justify-end gap-1">
                {canUpdate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(u)}
                    aria-label={t("common.edit")}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {canUpdate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleting(u)}
                    aria-label={t("common.delete")}
                    className="text-negative"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  const stats = data?.stats;

  return (
    <div className="stagger">
      <PageHeader
        title={t("users.title")}
        subtitle={t("users.listSubtitle")}
        action={
          canCreate && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t("users.new")}
            </Button>
          )
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<UsersIcon className="h-5 w-5" />}
          label={t("users.stats.users")}
          value={formatMoney(stats?.userCount ?? 0)}
        />
        <StatCard
          icon={<ShieldCheck className="h-5 w-5" />}
          label={t("users.stats.roles")}
          value={formatMoney(stats?.roleCount ?? 0)}
        />
        <StatCard
          icon={<UsersIcon className="h-5 w-5" />}
          label={t("users.stats.page")}
          value={formatMoney(data?.items.length ?? 0)}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("users.searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <div className="w-48">
          <Select
            value={role}
            onChange={(e) => {
              setRole(e.target.value as UserRole | "");
              setPage(1);
            }}
            options={roleOptions}
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
        rowKey={(u) => u.id}
      />

      <UserFormModal open={formOpen} onClose={() => setFormOpen(false)} user={editing} />

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        size="md"
        title={t("users.delete.title")}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleting(null)}
              disabled={removeUser.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={removeUser.isPending}>
              {t("common.delete")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          {t("users.delete.confirm")}{" "}
          <span className="font-medium text-ink">{deleting?.fullName}</span>?
        </p>
        {deleteError && <p className="mt-3 text-sm text-negative">{deleteError}</p>}
      </Modal>
    </div>
  );
}
