"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  Inbox,
  Lightbulb,
  Link2,
  MessagesSquare,
  Plus,
  Search,
  ShieldOff,
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
import { useI18n } from "@/lib/i18n/provider";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { AppealFormModal } from "@/components/appeals/appeal-form-modal";
import { AppealDetailPanel } from "@/components/appeals/appeal-detail-panel";
import { SlaBadge } from "@/components/appeals/sla-badge";
import { applicantName, STATUS_TABS } from "@/lib/appeals/sla";
import { cn, formatMoney } from "@/lib/utils";
import { useCan } from "@/lib/auth/use-can";
import { Can } from "@/components/auth/can";
import { useDebouncedSearch } from "@/lib/hooks/use-debounced-search";

const PAGE_SIZE = 30;

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

/**
 * Murojaatlar inbox'i: chapda holat tablari va ro'yxat, o'ngda tanlangan
 * murojaat.
 *
 * NEGA JADVAL EMAS: rahbariyat bu sahifada bitta savolga javob izlaydi —
 * "bugun nima ko'rishim kerak?". Jadval + modal har murojaat uchun ochish va
 * yopishni talab qilardi; inbox'da ro'yxat joyida qoladi va muddat holati
 * har qatorda ko'rinib turadi.
 */
export default function AppealsPage() {
  const { t, locale } = useI18n();
  const can = useCan();
  // Ommaviy havola — alohida resurs (`appeals-public-link`): ko'rish va qayta
  // generatsiya huquqlari murojaatlarning o'zidan mustaqil.
  const canReadPublicLink = can("appeals-public-link.read");

  const [status, setStatus] = useState<AppealStatus | "">("pending");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const searchQuery = useDebouncedSearch(search);
  // Qidiruv o'zgarsa birinchi sahifaga qaytamiz. Reset DEBOUNCELANGAN qiymatga
  // bog'langan: harf bosilganda qaytarsak, kutish tugashidan oldin eski qidiruv
  // bilan ortiqcha so'rov ketardi (foydalanuvchi 1-sahifada bo'lmasa).
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);
  const [type, setType] = useState<AppealType | "">("");
  const [role, setRole] = useState<TargetRole | "">("");
  const [source, setSource] = useState<AppealSource | "">("");
  const [period, setPeriod] = useState<AppealPeriod | "">("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useAppeals({
    page,
    limit: PAGE_SIZE,
    status: status || undefined,
    search: searchQuery,
    type: type || undefined,
    targetRole: role || undefined,
    source: source || undefined,
    period: period || undefined,
  });

  const items = useMemo(() => data?.items ?? [], [data]);
  // Tanlov ro'yxatga ergashadi: filtr yoki tab o'zgarganda oldingi murojaat
  // ro'yxatdan chiqib ketishi mumkin, panel esa eskirgan yozuvni ko'rsatib
  // turardi.
  useEffect(() => {
    if (items.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !items.some((a) => a.id === selectedId)) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);
  const selected = items.find((a) => a.id === selectedId) ?? null;

  const publicLink = useAppealPublicLink();
  const createLink = useCreateAppealPublicLink();
  const [copied, setCopied] = useState(false);
  // Backend maktab tanlanmaganda 400 qaytaradi (`appeals.publicLink.pickSchool`).
  // Xatoni "havola yo'q" deb ko'rsatish o'rniga sababini aytamiz.
  const needsSchoolForLink = publicLink.isError;

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

  async function handleCreateLink() {
    await createLink.mutateAsync();
  }
  async function copyLink() {
    if (!publicLink.data?.url) return;
    await navigator.clipboard.writeText(publicLink.data.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const stats = data?.stats;

  return (
    <div className="stagger">
      <PageHeader
        title={t("appeals.title")}
        subtitle={t("appeals.listSubtitle")}
        action={
          <Can permission="appeals.create">
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("appeals.new")}
            </Button>
          </Can>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<MessagesSquare className="h-5 w-5" />} label={t("appeals.stats.total")} value={formatMoney(stats?.totalCount ?? 0)} />
        <StatCard icon={<Lightbulb className="h-5 w-5" />} tone="positive" label={t("appeals.stats.suggestion")} value={formatMoney(stats?.suggestionCount ?? 0)} />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} tone="negative" label={t("appeals.stats.complaint")} value={formatMoney(stats?.complaintCount ?? 0)} />
        <StatCard icon={<Inbox className="h-5 w-5" />} tone="caution" label={t("appeals.stats.month")} value={formatMoney(stats?.monthCount ?? 0)} />
      </div>

      {canReadPublicLink && (
        <Card className="mb-5 flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/12 text-accent">
              <Link2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-ink">{t("appeals.publicLink.title")}</p>
              {/*
                Havola HAR DOIM bitta maktabga tegishli. Bosh ofis "Barcha
                maktablar" holatida turganda backend 400 qaytaradi — u holda
                "hali yaratilmagan" deb yozish YOLG'ON bo'lardi va "Yaratish"
                tugmasi ham xatoga olib borardi.
              */}
              <p className="truncate text-sm text-ink-muted">
                {needsSchoolForLink
                  ? t("appeals.publicLink.pickSchool")
                  : (publicLink.data?.url ?? t("appeals.publicLink.none"))}
              </p>
            </div>
          </div>
          {!needsSchoolForLink && (
            <div className="flex items-center gap-2">
              {publicLink.data?.url && (
                <Button variant="secondary" onClick={copyLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? t("appeals.publicLink.copied") : t("appeals.publicLink.copy")}
                </Button>
              )}
              <Can permission="appeals-public-link.create">
                <Button onClick={handleCreateLink} loading={createLink.isPending}>
                  {publicLink.data?.active ? t("appeals.publicLink.regenerate") : t("appeals.publicLink.create")}
                </Button>
              </Can>
            </div>
          )}
        </Card>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-line">
        {[...STATUS_TABS, "" as const].map((s) => (
          <button
            key={s || "all"}
            type="button"
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
              status === s
                ? "border-amber font-medium text-ink"
                : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {s ? t(`appeals.tab.${s}`) : t("appeals.tab.all")}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

      <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <Card className="overflow-hidden p-0">
          {isLoading && <p className="p-5 text-sm text-ink-muted">{t("common.loading")}</p>}
          {isError && (
            <div className="p-5">
              <p className="mb-3 text-sm text-negative">{t("common.error")}</p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                {t("common.retry")}
              </Button>
            </div>
          )}
          {!isLoading && !isError && items.length === 0 && (
            <p className="p-5 text-sm text-ink-muted">{t("appeals.inbox.empty")}</p>
          )}
          <ul className="max-h-[36rem] divide-y divide-line overflow-y-auto">
            {items.map((appeal) => (
              <li key={appeal.id}>
                <AppealRow
                  appeal={appeal}
                  selected={appeal.id === selectedId}
                  onSelect={() => setSelectedId(appeal.id)}
                  anonymousLabel={t("appeals.anonymous")}
                  typeLabel={t(`appeals.type.${appeal.type}`)}
                  locale={locale}
                />
              </li>
            ))}
          </ul>
          {(data?.meta.pageCount ?? 1) > 1 && (
            <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-ink-muted">
              <span className="tnum">
                {page} / {data?.meta.pageCount}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  ‹
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= (data?.meta.pageCount ?? 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  ›
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5">
          {selected ? (
            <AppealDetailPanel key={selected.id} appeal={selected} />
          ) : (
            <div className="grid h-full min-h-[16rem] place-items-center text-center">
              <div>
                <Inbox className="mx-auto mb-2 h-8 w-8 text-ink-muted/60" />
                <p className="text-sm text-ink">{t("appeals.inbox.pick")}</p>
                <p className="text-xs text-ink-muted">{t("appeals.inbox.pickHint")}</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      <AppealFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}

function AppealRow({
  appeal,
  selected,
  onSelect,
  anonymousLabel,
  typeLabel,
  locale,
}: {
  appeal: Appeal;
  selected: boolean;
  onSelect: () => void;
  anonymousLabel: string;
  typeLabel: string;
  locale: string;
}) {
  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ru-RU", {
    dateStyle: "short",
  });
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected}
      className={cn(
        "w-full px-4 py-3 text-left transition-colors focus-visible:focus-ring",
        selected ? "bg-accent/8" : "hover:bg-surface-muted",
      )}
    >
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate font-medium text-ink">
          {applicantName(appeal, anonymousLabel)}
        </p>
        {appeal.isAnonymous && <ShieldOff className="h-3 w-3 shrink-0 text-ink-muted" />}
        <span className="shrink-0 text-xs text-ink-muted tnum">
          {dateFmt.format(new Date(appeal.createdAt))}
        </span>
      </div>
      <p className="mt-0.5 line-clamp-1 text-sm text-ink-soft">{appeal.description}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <Badge tone={appeal.type === "complaint" ? "negative" : "positive"}>{typeLabel}</Badge>
        <SlaBadge appeal={appeal} />
      </div>
    </button>
  );
}
