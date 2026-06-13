"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useResourceList, type ResourceRecord } from "@/lib/api/resource";
import { useI18n } from "@/lib/i18n/provider";
import { Badge } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";

const tone: Record<string, "positive" | "neutral" | "caution" | "negative" | "accent"> = {
  new: "accent",
  contacted: "neutral",
  interested: "caution",
  trial_lesson: "caution",
  contract: "positive",
  rejected: "negative",
};

export default function CrmPage() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch } = useResourceList(
    "leads",
    "/crm",
    { page, limit: 20, search: search || undefined },
  );

  const columns: Column<ResourceRecord>[] = [
    {
      key: "name",
      header: "Lid",
      render: (r) => (
        <span className="font-medium text-ink">
          {String(r.firstName ?? "")} {String(r.lastName ?? "")}
        </span>
      ),
    },
    { key: "phone", header: "Telefon", className: "tnum", render: (r) => String(r.phone ?? "—") },
    {
      key: "status",
      header: "Bosqich",
      render: (r) => (
        <Badge tone={tone[String(r.status ?? "new")] ?? "neutral"}>
          {String(r.status ?? "new").replace("_", " ")}
        </Badge>
      ),
    },
  ];

  return (
    <div className="stagger">
      <PageHeader title={t("nav.crm")} subtitle="Qabul lidlari" />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("common.search")}
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
    </div>
  );
}
