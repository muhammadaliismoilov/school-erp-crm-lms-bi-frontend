"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { useStudents, type Student } from "@/lib/api/students";
import { useAuthStore } from "@/lib/auth/store";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { formatDate } from "@/lib/utils";

const statusTone: Record<string, "positive" | "neutral" | "caution" | "negative"> = {
  active: "positive",
  inactive: "neutral",
  archived: "caution",
  transferred: "negative",
};

export default function StudentsPage() {
  const { t } = useI18n();
  const can = useAuthStore((s) => s.can);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch } = useStudents({
    page,
    limit: 20,
    search: search || undefined,
  });

  const columns: Column<Student>[] = [
    {
      key: "name",
      header: t("students.firstName"),
      render: (s) => (
        <span className="font-medium text-ink">
          {s.firstName} {s.lastName}
        </span>
      ),
    },
    { key: "studentCode", header: "Kod", className: "font-mono text-ink-soft tnum" },
    {
      key: "birthDate",
      header: "Tug‘ilgan",
      render: (s) => formatDate(s.birthDate),
    },
    {
      key: "status",
      header: "Holat",
      render: (s) => (
        <Badge tone={statusTone[s.status ?? "active"] ?? "neutral"}>
          {s.status ?? "active"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="stagger">
      <PageHeader
        title={t("students.title")}
        subtitle="Barcha filiallar bo‘yicha o‘quvchilar"
        action={
          can("students.manage") && (
            <Link href="/students/new">
              <Button>
                <Plus className="h-4 w-4" />
                {t("students.new")}
              </Button>
            </Link>
          )
        }
      />

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
        rowKey={(s) => s.id}
      />
    </div>
  );
}
