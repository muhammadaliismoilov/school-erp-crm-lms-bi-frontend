"use client";

import { ChevronLeft, ChevronRight, Inbox, TriangleAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { Spinner } from "./card";
import { Button } from "./button";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: "left" | "right";
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  page: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
  rowKey: (row: T) => string;
}

export function DataTable<T>({
  columns,
  rows,
  loading,
  error,
  onRetry,
  page,
  pageCount,
  total,
  onPageChange,
  rowKey,
}: DataTableProps<T>) {
  const { t } = useI18n();

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-parchment-deep/40">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "label px-4 py-3",
                    col.align === "right" ? "text-right" : "text-left",
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={columns.length} className="py-16">
                  <div className="grid place-items-center">
                    <Spinner className="h-6 w-6" />
                  </div>
                </td>
              </tr>
            )}

            {!loading && !!error && (
              <tr>
                <td colSpan={columns.length} className="py-16">
                  <div className="flex flex-col items-center gap-3 text-ink-muted">
                    <TriangleAlert className="h-7 w-7 text-negative" />
                    <p className="text-sm">{t("common.error")}</p>
                    {onRetry && (
                      <Button size="sm" variant="secondary" onClick={onRetry}>
                        {t("common.retry")}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {!loading && !error && rows?.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-16">
                  <div className="flex flex-col items-center gap-2 text-ink-muted">
                    <Inbox className="h-7 w-7" />
                    <p className="text-sm">{t("common.empty")}</p>
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              rows?.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="border-b border-line/70 transition-colors last:border-0 hover:bg-parchment/60"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3",
                        col.align === "right" ? "text-right" : "text-left",
                        col.className ?? "text-ink-soft",
                      )}
                    >
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-ink-muted">
        <span className="tnum">
          {t("common.total")}: {total}
        </span>
        <div className="flex items-center gap-2">
          <span className="tnum">
            {t("common.page")} {page} {t("common.of")} {Math.max(pageCount, 1)}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
