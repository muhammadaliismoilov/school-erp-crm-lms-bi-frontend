"use client";

import { useResourceArray, type ResourceRecord } from "@/lib/api/resource";
import { useI18n } from "@/lib/i18n/provider";
import { Badge } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { formatDate, formatMoney } from "@/lib/utils";

const tone: Record<string, "positive" | "neutral" | "caution" | "negative"> = {
  active: "positive",
  paid: "positive",
  draft: "neutral",
  pending: "caution",
  overdue: "negative",
  cancelled: "negative",
};

export default function FinancePage() {
  const { t } = useI18n();
  const { data, isLoading, isError, refetch } = useResourceArray(
    "contracts",
    "/finance/contracts",
  );

  const columns: Column<ResourceRecord>[] = [
    {
      key: "id",
      header: "Shartnoma",
      render: (r) => (
        <span className="font-mono text-xs text-ink-soft">
          {String(r.id).slice(0, 8)}
        </span>
      ),
    },
    { key: "issueDate", header: "Sana", render: (r) => formatDate(r.issueDate as string) },
    {
      key: "totalAmount",
      header: "Summa",
      align: "right",
      className: "tnum font-medium text-ink",
      render: (r) => formatMoney(r.totalAmount as number),
    },
    {
      key: "status",
      header: "Holat",
      render: (r) => (
        <Badge tone={tone[String(r.status ?? "draft")] ?? "neutral"}>
          {String(r.status ?? "draft")}
        </Badge>
      ),
    },
  ];

  return (
    <div className="stagger">
      <PageHeader title={t("nav.finance")} subtitle="Shartnomalar" />
      <DataTable
        columns={columns}
        rows={data}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        page={1}
        pageCount={1}
        total={data?.length ?? 0}
        onPageChange={() => undefined}
        rowKey={(r) => r.id}
      />
    </div>
  );
}
