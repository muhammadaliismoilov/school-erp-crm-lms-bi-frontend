import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export type PerformanceReviewStatus = "draft" | "completed";

export interface PerformanceReview {
  id: string;
  staffMemberId: string;
  staffName: string | null;
  reviewerId: string | null;
  reviewerName: string | null;
  periodStart: string;
  periodEnd: string;
  overallRating: number | null;
  strengths: string | null;
  improvements: string | null;
  goals: string | null;
  notes: string | null;
  status: PerformanceReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface PerformanceReviewListResult {
  items: PerformanceReview[];
  meta: PageMeta;
}

export interface PerformanceReviewListParams {
  page?: number;
  limit?: number;
  search?: string;
  staffMemberId?: string;
  status?: PerformanceReviewStatus;
}

export interface PerformanceReviewInput {
  staffMemberId: string;
  reviewerId?: string;
  periodStart: string;
  periodEnd: string;
  overallRating?: number;
  strengths?: string;
  improvements?: string;
  goals?: string;
  notes?: string;
  status?: PerformanceReviewStatus;
}

function cleanParams<T extends object>(params: T): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      out[key] = value as string | number;
    }
  }
  return out;
}

const api = {
  list(params: PerformanceReviewListParams): Promise<PerformanceReviewListResult> {
    return apiRequest<PerformanceReviewListResult>("/hr/performance-reviews", { query: cleanParams(params) });
  },
  create(input: PerformanceReviewInput): Promise<PerformanceReview> {
    return apiRequest<PerformanceReview>("/hr/performance-reviews", { method: "POST", body: input });
  },
  update(id: string, input: Partial<PerformanceReviewInput>): Promise<PerformanceReview> {
    return apiRequest<PerformanceReview>(`/hr/performance-reviews/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/hr/performance-reviews/${id}`, { method: "DELETE" });
  },
};

const KEY = ["hr", "performance-reviews"] as const;

export function usePerformanceReviewList(params: PerformanceReviewListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
}

export function useCreatePerformanceReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PerformanceReviewInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdatePerformanceReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PerformanceReviewInput> }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeletePerformanceReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export const PERF_STATUS_LABELS: Record<PerformanceReviewStatus, string> = {
  draft: "Qoralama",
  completed: "Yakunlangan",
};

export const PERF_STATUS_TONE: Record<PerformanceReviewStatus, "neutral" | "positive"> = {
  draft: "neutral",
  completed: "positive",
};

export const PAGE_SIZES = [10, 20, 50, 100] as const;
