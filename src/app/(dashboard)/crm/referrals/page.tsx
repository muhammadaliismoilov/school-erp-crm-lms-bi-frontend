"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Link2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  useDeleteReferral,
  useReferrals,
  type Referral,
  type ReferralStatus,
} from "@/lib/api/referrals";
import { ApiError } from "@/lib/api/types";
import { useAuthStore } from "@/lib/auth/store";
import { useI18n } from "@/lib/i18n/provider";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { ReferralFormModal } from "@/components/crm/referral-form-modal";
import { isoToDMY } from "@/lib/format";
import { formatMoney } from "@/lib/utils";

function StatCard({ icon, label, value, tone = "accent" }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "accent" | "positive" | "negative" | "info";
}) {
  const tones = {
    accent: "bg-accent/12 text-accent",
    positive: "bg-positive/12 text-positive",
    negative: "bg-negative/12 text-negative",
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

const STATUS_TONE: Record<ReferralStatus, "positive" | "neutral"> = {
  active: "positive",
  expired: "neutral",
};

function CopyLink({ url }: { url: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <span className="hidden max-w-[260px] truncate rounded-md bg-parchment/60 px-2 py-1 text-xs text-ink-soft md:inline-block">
        {url}
      </span>
      <Button variant={copied ? "secondary" : "primary"} size="sm" onClick={copy}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? t("referral.copied") : t("referral.copy")}
      </Button>
    </div>
  );
}

export default function ReferralsPage() {
  const { t } = useI18n();
  const can = useAuthStore((s) => s.can);
  const canManage = can("crm.manage");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Referral | null>(null);
  const [deleting, setDeleting] = useState<Referral | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({ search: search || undefined, page, limit: 20 }),
    [search, page],
  );

  const { data, isLoading, isError, refetch } = useReferrals(filters);
  const remove = useDeleteReferral();

  const stats = data?.stats;
  const rows = data?.items ?? [];

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (r: Referral) => {
    setEditing(r);
    setFormOpen(true);
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

  const columns: Column<Referral>[] = [
    { key: "index", header: "№", render: (r) => <span className="text-ink-muted tnum">{rows.indexOf(r) + 1}</span> },
    {
      key: "name",
      header: t("referral.col.name"),
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.name}</p>
          {r.description && <p className="text-xs text-ink-muted line-clamp-1">{r.description}</p>}
        </div>
      ),
    },
    { key: "source", header: t("referral.col.source"), render: (r) => <span className="text-sm text-ink-soft">{r.source?.name || "—"}</span> },
    { key: "expires", header: t("referral.col.expires"), render: (r) => <span className="text-sm text-ink-soft tnum">{r.expiresAt ? isoToDMY(r.expiresAt) : "—"}</span> },
    {
      key: "status",
      header: t("referral.col.status"),
      render: (r) => <Badge tone={STATUS_TONE[r.status]}>{t(`referral.status.${r.status}`)}</Badge>,
    },
    { key: "leads", header: t("referral.col.leads"), render: (r) => <span className="text-sm text-ink-soft tnum">{r.leadCount}</span> },
    { key: "link", header: t("referral.col.link"), align: "right" as const, render: (r) => <CopyLink url={r.url} /> },
    {
      key: "actions",
      header: "",
      align: "right" as const,
      render: (r) =>
        canManage && (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => openEdit(r)} aria-label={t("common.edit")}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-negative" onClick={() => setDeleting(r)} aria-label={t("common.delete")}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
    },
  ];

  return (
    <div className="stagger">
      <PageHeader
        title={t("referral.title")}
        subtitle={t("referral.subtitle")}
        action={
          canManage && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t("referral.new")}
            </Button>
          )
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Link2 className="h-5 w-5" />} label={t("referral.stats.total")} value={formatMoney(stats?.total ?? 0)} />
        <StatCard icon={<Check className="h-5 w-5" />} tone="positive" label={t("referral.stats.active")} value={formatMoney(stats?.active ?? 0)} />
        <StatCard icon={<Trash2 className="h-5 w-5" />} tone="negative" label={t("referral.stats.expired")} value={formatMoney(stats?.expired ?? 0)} />
        <StatCard icon={<Link2 className="h-5 w-5" />} tone="info" label={t("referral.stats.withSource")} value={formatMoney(stats?.withSource ?? 0)} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t("referral.searchPlaceholder")} className="pl-9" />
        </div>
      </div>

      {actionError && <p className="mb-3 rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{actionError}</p>}

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
        rowKey={(r) => r.id}
      />

      <ReferralFormModal open={formOpen} referral={editing} onClose={() => setFormOpen(false)} />

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        size="md"
        title={t("referral.deleteTitle")}
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
          {t("referral.deleteConfirm")} <span className="font-medium text-ink">{deleting?.name}</span>?
        </p>
      </Modal>
    </div>
  );
}
