import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export type HrPaymentStatus = "pending" | "processing" | "paid" | "failed" | "cancelled";

export interface HrPayment {
  id: string;
  staffMemberId: string;
  staffName: string | null;
  amount: number;
  paymentDate: string | null;
  status: HrPaymentStatus;
  timesheetId: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface HrPaymentListResult {
  items: HrPayment[];
  meta: PageMeta;
}

export interface HrPaymentListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: HrPaymentStatus;
  staffMemberId?: string;
}

export interface HrPaymentInput {
  staffMemberId: string;
  amount: number;
  paymentDate?: string;
  status?: HrPaymentStatus;
  timesheetId?: string;
  note?: string;
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
  list(params: HrPaymentListParams): Promise<HrPaymentListResult> {
    return apiRequest<HrPaymentListResult>("/hr/payments", { query: cleanParams(params) });
  },
  create(input: HrPaymentInput): Promise<HrPayment> {
    return apiRequest<HrPayment>("/hr/payments", { method: "POST", body: input });
  },
  update(id: string, input: Partial<HrPaymentInput>): Promise<HrPayment> {
    return apiRequest<HrPayment>(`/hr/payments/${id}`, { method: "PATCH", body: input });
  },
  updateStatus(id: string, status: HrPaymentStatus): Promise<HrPayment> {
    return apiRequest<HrPayment>(`/hr/payments/${id}/status`, { method: "PATCH", body: { status } });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/hr/payments/${id}`, { method: "DELETE" });
  },
};

const KEY = ["hr", "payments"] as const;

export function usePaymentList(params: HrPaymentListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: HrPaymentInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<HrPaymentInput> }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdatePaymentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: HrPaymentStatus }) => api.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export const PAYMENT_STATUS_LABELS: Record<HrPaymentStatus, string> = {
  pending: "Kutilmoqda",
  processing: "Jarayonda",
  paid: "To'langan",
  failed: "Muvaffaqiyatsiz",
  cancelled: "Bekor qilingan",
};

export const PAYMENT_STATUS_TONE: Record<HrPaymentStatus, "neutral" | "caution" | "positive" | "negative"> = {
  pending: "neutral",
  processing: "caution",
  paid: "positive",
  failed: "negative",
  cancelled: "negative",
};

export const PAGE_SIZES = [10, 20, 50, 100] as const;
