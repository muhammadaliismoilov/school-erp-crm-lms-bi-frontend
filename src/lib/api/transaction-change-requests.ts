import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export const CHANGE_REQUEST_STATUSES = ["pending", "approved", "rejected"] as const;
export type ChangeRequestStatus = (typeof CHANGE_REQUEST_STATUSES)[number];

export const CHANGE_REQUEST_TYPES = ["update", "delete"] as const;
export type ChangeRequestType = (typeof CHANGE_REQUEST_TYPES)[number];

export interface ProposedChanges {
  type?: "income" | "expense";
  amount?: number;
  date?: string;
  purposeCategoryId?: string;
  paymentTypeId?: string;
  personId?: string;
  month?: number;
  year?: number;
  note?: string;
}

export interface ChangeRequest {
  id: string;
  transactionId: string | null;
  requestType: ChangeRequestType;
  proposedChanges: ProposedChanges | null;
  txType: string | null;
  txAmount: number | null;
  txDate: string | null;
  txPersonName: string | null;
  reason: string;
  status: ChangeRequestStatus;
  requestedById: string | null;
  requestedByName: string | null;
  reviewedById: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  applied: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeRequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface ChangeRequestListResult {
  items: ChangeRequest[];
  meta: PageMeta;
  stats: ChangeRequestStats;
}

export interface ChangeRequestListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ChangeRequestStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateChangeRequestInput {
  transactionId: string;
  requestType: ChangeRequestType;
  reason: string;
  proposedChanges?: ProposedChanges;
}

export interface ReviewChangeRequestInput {
  status: Extract<ChangeRequestStatus, "approved" | "rejected">;
  reviewNote?: string;
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

const BASE = "/transaction-change-requests";

const api = {
  list(params: ChangeRequestListParams): Promise<ChangeRequestListResult> {
    return apiRequest<ChangeRequestListResult>(BASE, { query: cleanParams(params) });
  },
  create(input: CreateChangeRequestInput): Promise<ChangeRequest> {
    return apiRequest<ChangeRequest>(BASE, { method: "POST", body: input });
  },
  review(id: string, input: ReviewChangeRequestInput): Promise<ChangeRequest> {
    return apiRequest<ChangeRequest>(`${BASE}/${id}/review`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`${BASE}/${id}`, { method: "DELETE" });
  },
};

const KEY = ["transaction-change-requests"] as const;

export function useChangeRequests(params: ChangeRequestListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
}

export function useCreateChangeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateChangeRequestInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useReviewChangeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReviewChangeRequestInput }) =>
      api.review(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useDeleteChangeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export const CHANGE_REQUEST_STATUS_LABELS: Record<ChangeRequestStatus, string> = {
  pending: "Kutilmoqda",
  approved: "Tasdiqlangan",
  rejected: "Rad etilgan",
};

export const CHANGE_REQUEST_TYPE_LABELS: Record<ChangeRequestType, string> = {
  update: "Tahrirlash",
  delete: "O‘chirish",
};

export const CHANGE_REQUEST_STATUS_TONE: Record<
  ChangeRequestStatus,
  "positive" | "caution" | "negative"
> = {
  pending: "caution",
  approved: "positive",
  rejected: "negative",
};

export const PAGE_SIZES = [10, 20, 50, 100] as const;
