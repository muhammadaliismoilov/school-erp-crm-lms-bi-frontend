"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useList, type ResourceRecord } from "@/lib/api/resource";
import { useI18n } from "@/lib/i18n/provider";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";

interface TablePageProps {
  title: string;
  subtitle?: string;
  /** React-query cache key. */
  queryKey: string;
  /** Backend path, e.g. "/lms/lessons". */
  path: string;
  columns: Column<ResourceRecord>[];
  /** Show a client-side search box that filters by the given fields. */
  searchFields?: string[];
  /** Send `search`/`page`/`limit` to the server (paginated endpoints). */
  serverPaginated?: boolean;
  /** Static query params merged into every request. */
  query?: Record<string, string | number | boolean | undefined>;
  /** Client-side filter applied to rows before render. */
  filter?: (row: ResourceRecord) => boolean;
  action?: React.ReactNode;
  pageSize?: number;
}

export function AcademicTablePage({
  title,
  subtitle,
  queryKey,
  path,
  columns,
  searchFields,
  serverPaginated,
  query,
  filter,
  action,
  pageSize = 15,
}: TablePageProps) {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const effectiveQuery = serverPaginated
    ? { ...query, page, limit: pageSize, search: search || undefined }
    : query;

  const { rows, meta, isLoading, isError, refetch } = useList(
    queryKey,
    path,
    effectiveQuery,
  );

  // Client-side filter + search for non-paginated endpoints.
  const processed = useMemo(() => {
    let out = filter ? rows.filter(filter) : rows;
    if (!serverPaginated && search && searchFields?.length) {
      const q = search.toLowerCase();
      out = out.filter((r) =>
        searchFields.some((f) =>
          String(r[f] ?? "").toLowerCase().includes(q),
        ),
      );
    }
    return out;
  }, [rows, filter, search, searchFields, serverPaginated]);

  const total = serverPaginated ? meta?.total ?? processed.length : processed.length;
  const pageCount = serverPaginated
    ? meta?.pageCount ?? 1
    : Math.max(1, Math.ceil(processed.length / pageSize));
  const pageRows = serverPaginated
    ? processed
    : processed.slice((page - 1) * pageSize, page * pageSize);

  const showSearch = serverPaginated || Boolean(searchFields?.length);

  return (
    <div className="stagger">
      <PageHeader title={title} subtitle={subtitle} action={action} />

      {showSearch && (
        <div className="relative mb-4 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
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
      )}

      <DataTable
        columns={columns}
        rows={pageRows}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        page={page}
        pageCount={pageCount}
        total={total}
        onPageChange={setPage}
        rowKey={(r) => r.id}
      />
    </div>
  );
}
