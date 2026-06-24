import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export const GRADE_REQUEST_KINDS = ["assessment", "course", "quarter"] as const;
export type GradeRequestKind = (typeof GRADE_REQUEST_KINDS)[number];

export const GRADE_REQUEST_STATUSES = ["pending", "approved", "rejected"] as const;
export type GradeRequestStatus = (typeof GRADE_REQUEST_STATUSES)[number];

export interface GradeRequest {
  id: string;
  kind: GradeRequestKind;
  studentId: string;
  studentName: string | null;
  subjectId: string | null;
  subjectName: string | null;
  quarterId: string | null;
  targetEntityId: string | null;
  currentGrade: number | null;
  requestedGrade: number;
  reason: string;
  status: GradeRequestStatus;
  requestedById: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  applied: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export interface GradeRequestStats {
  totalCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export interface GradeRequestPageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface GradeRequestListResult {
  items: GradeRequest[];
  meta: GradeRequestPageMeta;
  stats: GradeRequestStats;
}

export interface GradeRequestListParams {
  page?: number;
  limit?: number;
  search?: string;
  kind?: GradeRequestKind;
  status?: GradeRequestStatus;
}

export interface GradeRequestInput {
  kind: GradeRequestKind;
  studentId: string;
  subjectId?: string;
  quarterId?: string;
  targetEntityId?: string;
  currentGrade?: number;
  requestedGrade: number;
  reason: string;
}

export interface GradeRequestUpdateInput {
  subjectId?: string;
  quarterId?: string;
  currentGrade?: number;
  requestedGrade?: number;
  reason?: string;
}

export interface GradeRequestReviewInput {
  status: Extract<GradeRequestStatus, "approved" | "rejected">;
  reviewNote?: string;
}

const api = {
  list(params: GradeRequestListParams): Promise<GradeRequestListResult> {
    return apiRequest<GradeRequestListResult>("/grade-requests", { query: { ...params } });
  },
  create(input: GradeRequestInput): Promise<GradeRequest> {
    return apiRequest<GradeRequest>("/grade-requests", { method: "POST", body: input });
  },
  update(id: string, input: GradeRequestUpdateInput): Promise<GradeRequest> {
    return apiRequest<GradeRequest>(`/grade-requests/${id}`, { method: "PATCH", body: input });
  },
  review(id: string, input: GradeRequestReviewInput): Promise<GradeRequest> {
    return apiRequest<GradeRequest>(`/grade-requests/${id}/review`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/grade-requests/${id}`, { method: "DELETE" });
  },
};

const KEY = ["grade-requests"] as const;

export function useGradeRequests(params: GradeRequestListParams) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useCreateGradeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GradeRequestInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateGradeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: GradeRequestUpdateInput }) =>
      api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useReviewGradeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: GradeRequestReviewInput }) =>
      api.review(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteGradeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export const GRADE_REQUEST_KIND_LABELS: Record<GradeRequestKind, string> = {
  assessment: "Baholash",
  course: "Kurs bahosi",
  quarter: "Choraklik baho",
};

export const GRADE_REQUEST_STATUS_LABELS: Record<GradeRequestStatus, string> = {
  pending: "Kutilmoqda",
  approved: "Tasdiqlangan",
  rejected: "Rad etilgan",
};
