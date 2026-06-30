import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export const LEAVE_STATUSES = ["requested", "approved", "rejected", "cancelled"] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export const LEAVE_TYPES = ["annual", "sick", "unpaid", "maternity", "paternity", "study", "other"] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export interface Leave {
  id: string;
  staffMemberId: string;
  staffName: string | null;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: LeaveStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface LeaveListResult {
  items: Leave[];
  meta: PageMeta;
}

export interface LeaveListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: LeaveStatus;
  type?: LeaveType;
  staffMemberId?: string;
}

export interface LeaveInput {
  staffMemberId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status?: LeaveStatus;
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
  list(params: LeaveListParams): Promise<LeaveListResult> {
    return apiRequest<LeaveListResult>("/hr/leaves", { query: cleanParams(params) });
  },
  create(input: LeaveInput): Promise<Leave> {
    return apiRequest<Leave>("/hr/leaves", { method: "POST", body: input });
  },
  update(id: string, input: Partial<LeaveInput>): Promise<Leave> {
    return apiRequest<Leave>(`/hr/leaves/${id}`, { method: "PATCH", body: input });
  },
  review(id: string, status: Extract<LeaveStatus, "approved" | "rejected" | "cancelled">): Promise<Leave> {
    return apiRequest<Leave>(`/hr/leaves/${id}/review`, { method: "PATCH", body: { status } });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/hr/leaves/${id}`, { method: "DELETE" });
  },
};

const KEY = ["hr", "leaves"] as const;

export function useLeaves(params: LeaveListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
}

export function useCreateLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LeaveInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<LeaveInput> }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useReviewLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" | "cancelled" }) =>
      api.review(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  requested: "Kutilmoqda",
  approved: "Tasdiqlangan",
  rejected: "Rad etilgan",
  cancelled: "Bekor qilingan",
};

export const LEAVE_STATUS_TONE: Record<LeaveStatus, "positive" | "caution" | "negative" | "neutral"> = {
  requested: "caution",
  approved: "positive",
  rejected: "negative",
  cancelled: "neutral",
};

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: "Yillik",
  sick: "Kasal",
  unpaid: "To‘lanmagan",
  maternity: "Onalik",
  paternity: "Otalik",
  study: "O‘qish",
  other: "Boshqa",
};

export const PAGE_SIZES = [10, 20, 50, 100] as const;
