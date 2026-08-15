"use client";

import { useMemo, useState } from "react";
import { Blocks, Phone, Search, Settings2, Sparkles } from "lucide-react";
import {
  useIntegrations,
  type Integration,
} from "@/lib/api/integrations";
import { useI18n } from "@/lib/i18n/provider";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { IntegrationConfigModal } from "@/components/integrations/integration-config-modal";
import { cn, formatMoney } from "@/lib/utils";
import { useCrudPermissions } from "@/lib/auth/use-can";

const PAGE_SIZE = 30;

function iconFor(code: string) {
  if (code === "openai") return <Sparkles className="h-5 w-5" />;
  if (code === "onlinepbx") return <Phone className="h-5 w-5" />;
  return <Blocks className="h-5 w-5" />;
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
  tone?: "accent" | "positive";
}) {
  const tones = { accent: "bg-accent/12 text-accent", positive: "bg-positive/12 text-positive" };
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

export default function IntegrationsPage() {
  const { t } = useI18n();
  // "Sozlash" — integratsiyani yangilash (PATCH), ya'ni `integrations.update`.
  const { canUpdate } = useCrudPermissions("integrations");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [configuring, setConfiguring] = useState<Integration | null>(null);

  const { data, isLoading, isError, refetch } = useIntegrations({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  });

  const stats = data?.stats;

  const columns: Column<Integration>[] = useMemo(
    () => [
      {
        key: "name",
        header: t("integrations.col.name"),
        render: (it) => (
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/12 text-accent">
              {iconFor(String(it.code))}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{it.name}</p>
              <p className="truncate font-mono text-xs text-ink-muted">{it.code}</p>
            </div>
          </div>
        ),
      },
      {
        key: "description",
        header: t("integrations.col.description"),
        render: (it) => <span className="text-ink-soft">{it.description ?? "—"}</span>,
      },
      {
        key: "category",
        header: t("integrations.col.category"),
        render: (it) => <Badge tone="accent">{it.category}</Badge>,
      },
      {
        key: "status",
        header: t("integrations.col.status"),
        render: (it) => (
          <Badge tone={it.isEnabled ? "positive" : "neutral"}>
            {it.isEnabled ? t("integrations.status.connected") : t("integrations.status.notConnected")}
          </Badge>
        ),
      },
      // Ruxsat bo'lmasa ustun umuman qo'shilmaydi — bo'sh "Amallar" qolmaydi.
      ...(canUpdate
        ? [
            {
              key: "actions",
              header: "",
              align: "right" as const,
              render: (it: Integration) => (
                <Button variant="secondary" size="sm" onClick={() => setConfiguring(it)}>
                  <Settings2 className="h-4 w-4" />
                  {t("integrations.action.configure")}
                </Button>
              ),
            },
          ]
        : []),
    ],
    [t, canUpdate],
  );

  return (
    <div className="stagger">
      <PageHeader title={t("integrations.title")} subtitle={t("integrations.listSubtitle")} />

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <StatCard icon={<Blocks className="h-5 w-5" />} label={t("integrations.stats.total")} value={formatMoney(stats?.totalCount ?? 0)} />
        <StatCard icon={<Settings2 className="h-5 w-5" />} tone="positive" label={t("integrations.stats.connected")} value={formatMoney(stats?.connectedCount ?? 0)} />
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
            placeholder={t("integrations.searchPlaceholder")}
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
        rowKey={(it) => it.id}
      />

      <IntegrationConfigModal integration={configuring} onClose={() => setConfiguring(null)} />
    </div>
  );
}
