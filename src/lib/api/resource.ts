import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiRequest } from "./client";
import type { Page } from "./types";

/** Generic record — feature list pages render whatever fields the API returns. */
export type ResourceRecord = Record<string, unknown> & { id: string };

export interface NormalizedList {
  rows: ResourceRecord[];
  meta?: { page: number; limit: number; total: number; pageCount: number };
}

/** Accepts either a plain array or a `{ items, meta }` page and returns rows + meta. */
function normalizeList(data: unknown): NormalizedList {
  if (Array.isArray(data)) return { rows: data as ResourceRecord[] };
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.items)) {
      return {
        rows: obj.items as ResourceRecord[],
        meta: obj.meta as NormalizedList["meta"],
      };
    }
  }
  return { rows: [] };
}

/**
 * Shape-agnostic list hook used by the Ta'lim feature pages. Works whether the
 * backend returns a bare array or the shared `{ items, meta }` page envelope.
 */
export function useList(
  key: string,
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
  enabled = true,
) {
  const result = useQuery({
    queryKey: [key, query],
    queryFn: () => apiRequest<unknown>(path, { query }),
    placeholderData: keepPreviousData,
    enabled,
  });
  return { ...result, ...normalizeList(result.data) };
}

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Fetches a paginated collection from any backend list endpoint that returns the
 * shared `{ items, meta }` page shape. Used by the lighter feature pages.
 */
export function useResourceList(
  key: string,
  path: string,
  params: ListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: [key, params],
    queryFn: () =>
      apiRequest<Page<ResourceRecord>>(path, { query: { ...params } }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/**
 * For endpoints that return a plain array (not the `{ items, meta }` page
 * shape) — e.g. academic years, finance contracts, attendance-by-date.
 */
export function useResourceArray(
  key: string,
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
  enabled = true,
) {
  return useQuery({
    queryKey: [key, query],
    queryFn: () => apiRequest<ResourceRecord[]>(path, { query }),
    placeholderData: keepPreviousData,
    enabled,
  });
}
