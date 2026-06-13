"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Copy,
  Eye,
  Lightbulb,
  Link2,
  MessagesSquare,
  Plus,
  Search,
} from "lucide-react";
import {
  APPEAL_PERIODS,
  APPEAL_SOURCES,
  TARGET_ROLES,
  useAppealPublicLink,
  useAppeals,
  useCreateAppealPublicLink,
  type Appeal,
  type AppealPeriod,
  type AppealSource,
  type AppealStatus,
  type AppealType,
  type TargetRole,
} from "@/lib/api/appeals";
import { useAuthStore } from "@/lib/auth/store";
import { useI18n } from "@/lib/i18n/provider";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { AppealFormModal } from "@/components/appeals/appeal-form-modal";
import { AppealDetailModal } from "@/components/appeals/appeal-detail-modal";
import { cn, formatMoney } from "@/lib/utils";

const PAGE_SIZE = 30;

const STATUS_TONE: Record<AppealStatus, "neutral" | "positive" | "negative" | "caution" | "accent"> = {
  pending: "caution",
  in_progress: "accent",
  resolved: "positive",
  rejected: "negative",
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
  tone?: "accent" | "positive" | "negative" | "caution";
}) {
  const tones = {
    accent: "bg-accent/12 text-accent",
    positive: "bg-positive/12 text-positive",
    negative: "bg-negative/12 text-negative",
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

export default function AppealsPage() {
  const { t, locale } = useI18n();
  const can = useAuthStore((s) => s.can);
  const canManage = can("appeals.manage");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<AppealType | "">("");
  const [role, setRole] = useState<TargetRole | "">("");
  const [source, setSource] = useState<AppealSource | "">("");
  const [period, setPeriod] = useState<AppealPeriod | "">("");
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<Appeal | null>(null);

  const { data, isLoading, isError, refetch } = useAppeals({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    type: type || undefined,
    targetRole: role || undefined,
    source: source || undefined,
    period: period || undefined,
  });

  const publicLink = useAppealPublicLink();
  const createLink = useCreateAppealPublicLink();
  const [copied, setCopied] = useState(false);

  const typeOptions = useMemo(
    () => [
      { value: "", label: t("appeals.filter.allTypes") },
      { value: "suggestion", label: t("appeals.type.suggestion") },
      { value: "complaint", label: t("appeals.type.complaint") },
    ],
    [t],
  );
  const roleOptions = useMemo(
    () => [
      { value: "", label: t("appeals.filter.allRoles") },
      ...TARGET_ROLES.map((r) => ({ value: r, label: t(`appeals.role.${r}`) })),
    ],
    [t],
  );
  const sourceOptions = useMemo(
    () => [
      { value: "", label: t("appeals.filter.allSources") },
      ...APPEAL_SOURCES.map((s) => ({ value: s, label: t(`appeals.source.${s}`) })),
    ],
    [t],
  );
  const periodOptions = useMemo(
    () => [
      { value: "", label: t("appeals.filter.allPeriods") },
      ...APPEAL_PERIODS.map((p) => ({ value: p, label: t(`appeals.period.${p}`) })),
    ],
    [t],
  );

  const resetFilters = () => {
    setSearch("");
    setType("");
    setRole("");
    setSource("");
    setPeriod("");
    setPage(1);
  };
  const hasFilters = Boolean(search || type || role || source || period);

  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  });

  async function handleCreateLink() {
    await createLink.mutateAsync();
  }
  async function copyLink() {
    if (!publicLink.data?.url) return;
    await navigator.clipboard.writeText(publicLink.data.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const columns: Column<Appeal>[] = [
    {
      key: "applicant",
      header: t("appeals.col.applicant"),
      render: (a) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{a.fullName}</p>
          <p className="truncate font-mono text-xs text-ink-muted">{a.phone}</p>
        </div>
      ),
    },
    {
      key: "content",
      header: t("appeals.col.content"),
      render: (a) => <p className="line-clamp-1 max-w-xs text-ink-soft">{a.description}</p>,
    },
    {
      key: "type",
      header: t("appeals.col.type"),
      render: (a) => (
        <Badge tone={a.type === "complaint" ? "negative" : "positive"}>
          {t(`appeals.type.${a.type}`)}
        </Badge>
      ),
    },
    {
      key: "target",
      header: t("appeals.col.target"),
      render: (a) => <span className="text-ink-soft">{t(`appeals.role.${a.targetRole}`)}</span>,
    },
    {
      key: "source",
      header: t("appeals.col.source"),
      render: (a) => <span className="text-xs text-ink-muted">{t(`appeals.source.${a.source}`)}</span>,
    },
    {
      key: "status",
      header: t("appeals.col.status"),
      render: (a) => <Badge tone={STATUS_TONE[a.status]}>{t(`appeals.status.${a.status}`)}</Badge>,
    },
    {
      key: "date",
      header: t("appeals.col.date"),
      className: "tnum",
      render: (a) => <span className="text-ink-soft">{dateFmt.format(new Date(a.createdAt))}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (a) => (
        <Button variant="ghost" size="sm" onClick={() => setDetail(a)} aria-label={t("appeals.action.view")}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const stats = data?.stats;

  return (
    <div className="stagger">
      <PageHeader
        title={t("appeals.title")}
        subtitle={t("appeals.listSubtitle")}
        action={
          canManage && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("appeals.new")}
            </Button>
          )
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<MessagesSquare className="h-5 w-5" />} label={t("appeals.stats.total")} value={formatMoney(stats?.totalCount ?? 0)} />
        <StatCard icon={<Lightbulb className="h-5 w-5" />} tone="positive" label={t("appeals.stats.suggestion")} value={formatMoney(stats?.suggestionCount ?? 0)} />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} tone="negative" label={t("appeals.stats.complaint")} value={formatMoney(stats?.complaintCount ?? 0)} />
        <StatCard icon={<CalendarDays className="h-5 w-5" />} tone="caution" label={t("appeals.stats.month")} value={formatMoney(stats?.monthCount ?? 0)} />
      </div>

      {canManage && (
        <Card className="mb-5 flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/12 text-accent">
              <Link2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-ink">{t("appeals.publicLink.title")}</p>
              <p className="truncate text-sm text-ink-muted">
                {publicLink.data?.url ?? t("appeals.publicLink.none")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {publicLink.data?.url && (
              <Button variant="secondary" onClick={copyLink}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? t("appeals.publicLink.copied") : t("appeals.publicLink.copy")}
              </Button>
            )}
            <Button onClick={handleCreateLink} loading={createLink.isPending}>
              {publicLink.data?.active ? t("appeals.publicLink.regenerate") : t("appeals.publicLink.create")}
            </Button>
          </div>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("appeals.searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <div className="w-40">
          <Select value={type} onChange={(e) => { setType(e.target.value as AppealType | ""); setPage(1); }} options={typeOptions} />
        </div>
        <div className="w-44">
          <Select value={role} onChange={(e) => { setRole(e.target.value as TargetRole | ""); setPage(1); }} options={roleOptions} />
        </div>
        <div className="w-48">
          <Select value={source} onChange={(e) => { setSource(e.target.value as AppealSource | ""); setPage(1); }} options={sourceOptions} />
        </div>
        <div className="w-36">
          <Select value={period} onChange={(e) => { setPeriod(e.target.value as AppealPeriod | ""); setPage(1); }} options={periodOptions} />
        </div>
        {hasFilters && (
          <Button variant="ghost" onClick={resetFilters}>
            {t("appeals.filter.clear")}
          </Button>
        )}
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
        rowKey={(a) => a.id}
      />

      <AppealFormModal open={formOpen} onClose={() => setFormOpen(false)} />
      <AppealDetailModal appeal={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
