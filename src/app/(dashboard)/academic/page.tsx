"use client";

import { useResourceArray, type ResourceRecord } from "@/lib/api/resource";
import { useI18n } from "@/lib/i18n/provider";
import { Badge } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { formatDate } from "@/lib/utils";

export default function AcademicPage() {
  const { t } = useI18n();
  const { data, isLoading, isError, refetch } = useResourceArray(
    "academic-years",
    "/academic/years",
  );

  const columns: Column<ResourceRecord>[] = [
    {
      key: "name",
      header: "O‘quv yili",
      render: (r) => (
        <span className="font-medium text-ink">{String(r.name ?? "—")}</span>
      ),
    },
    { key: "startDate", header: "Boshlanish", render: (r) => formatDate(r.startDate as string) },
    { key: "endDate", header: "Tugash", render: (r) => formatDate(r.endDate as string) },
    {
      key: "isCurrent",
      header: "Holat",
      render: (r) =>
        r.isCurrent ? <Badge tone="positive">Joriy</Badge> : <Badge>Arxiv</Badge>,
    },
  ];

  return (
    <div className="stagger">
      <PageHeader title={t("nav.academic")} subtitle="O‘quv yillari" />
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
