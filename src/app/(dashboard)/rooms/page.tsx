"use client";

import { useMemo, useState } from "react";
import { Building2, DoorClosed, Layers, Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  useDeleteRoom,
  useRooms,
  type Room,
} from "@/lib/api/rooms";
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
import { RoomFormModal } from "@/components/settings/room-form-modal";
import { formatDate, formatMoney } from "@/lib/utils";

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

export default function RoomsPage() {
  const { t } = useI18n();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState<Room | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useRooms();
  const remove = useDeleteRoom();

  const stats = data?.stats;
  const items = useMemo(() => data?.items ?? [], [data]);

  const rows = useMemo(() => {
    const q = search.trim().toUpperCase();
    return q
      ? items.filter(
          (r) =>
            r.roomNumber.toUpperCase().includes(q) ||
            r.floorLabel.toUpperCase().includes(q),
        )
      : items;
  }, [items, search]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (room: Room) => {
    setEditing(room);
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

  const rowActions: RowAction<Room>[] = [
    {
      key: "update",
      label: t("common.edit"),
      icon: Pencil,
      permission: "settings-rooms.update",
      onSelect: openEdit,
    },
    {
      key: "delete",
      label: t("common.delete"),
      icon: Trash2,
      tone: "danger",
      permission: "settings-rooms.delete",
      onSelect: setDeleting,
    },
  ];
  const actionsColumn = useRowActionsColumn<Room>({
    actions: rowActions,
    header: t("rooms.col.actions"),
  });

  const columns: Column<Room>[] = [
    {
      key: "index",
      header: "№",
      render: (r) => <span className="text-ink-muted tnum">{rows.indexOf(r) + 1}</span>,
    },
    {
      key: "roomNumber",
      header: t("rooms.col.roomNumber"),
      render: (r) => (
        <Badge tone="accent">
          <DoorClosed className="mr-1 h-3.5 w-3.5" />
          {r.roomNumber}
        </Badge>
      ),
    },
    {
      key: "floor",
      header: t("rooms.col.floor"),
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-parchment/50 px-2 py-1 text-sm text-ink-soft">
          <Layers className="h-3.5 w-3.5 text-ink-muted" />
          {r.floorLabel}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: t("rooms.col.createdAt"),
      render: (r) => (
        <span className="text-sm text-ink-soft tnum">
          {r.createdAt ? formatDate(r.createdAt) : "—"}
        </span>
      ),
    },
    ...actionsColumn,
  ];

  return (
    <div className="stagger">
      <PageHeader
        title={t("rooms.title")}
        subtitle={t("rooms.listSubtitle")}
        action={
          <Can permission="settings-rooms.create">
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                {t("rooms.new.button")}
              </Button>
          </Can>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Building2 className="h-5 w-5" />}
          label={t("rooms.stats.total")}
          value={formatMoney(stats?.total ?? 0)}
        />
        <StatCard
          icon={<Layers className="h-5 w-5" />}
          tone="positive"
          label={t("rooms.stats.totalFloors")}
          value={formatMoney(stats?.totalFloors ?? 0)}
        />
        <StatCard
          icon={<DoorClosed className="h-5 w-5" />}
          tone="warning"
          label={t("rooms.stats.addedToday")}
          value={formatMoney(stats?.addedToday ?? 0)}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("rooms.searchPlaceholder")}
            className="pl-9"
          />
        </div>
      </div>

      {actionError && (
        <p className="mb-3 rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">
          {actionError}
        </p>
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
        rowKey={(r) => r.id}
      />

      <RoomFormModal
        open={modalOpen}
        room={editing}
        onClose={() => setModalOpen(false)}
      />

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        size="md"
        title={t("rooms.delete.title")}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleting(null)}
              disabled={remove.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={remove.isPending}>
              {t("common.delete")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          {t("rooms.delete.confirm")}{" "}
          <span className="font-medium text-ink">{deleting?.roomNumber}</span>?
        </p>
      </Modal>
    </div>
  );
}
