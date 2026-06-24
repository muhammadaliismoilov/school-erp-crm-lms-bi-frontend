import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export interface PaymentType {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  isSystem: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTypeStats {
  total: number;
  addedThisMonth: number;
  latestName: string | null;
  latestCreatedAt: string | null;
}

export interface PaymentTypePageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface PaymentTypeListResult {
  items: PaymentType[];
  meta: PaymentTypePageMeta;
  stats: PaymentTypeStats;
}

export interface PaymentTypeListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaymentTypeInput {
  name: string;
  code?: string;
  isActive?: boolean;
  sortOrder?: number;
}

function cleanParams(params: PaymentTypeListParams): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") out[key] = value as string | number;
  }
  return out;
}

const api = {
  list(params: PaymentTypeListParams): Promise<PaymentTypeListResult> {
    return apiRequest<PaymentTypeListResult>("/transactions/payment-types", { query: cleanParams(params) });
  },
  create(input: PaymentTypeInput): Promise<PaymentType> {
    return apiRequest<PaymentType>("/transactions/payment-types", { method: "POST", body: input });
  },
  update(id: string, input: Partial<PaymentTypeInput>): Promise<PaymentType> {
    return apiRequest<PaymentType>(`/transactions/payment-types/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/transactions/payment-types/${id}`, { method: "DELETE" });
  },
};

const KEY = ["payment-types"] as const;
const OPTIONS_KEY = ["transactions", "options"] as const;

export function usePaymentTypes(params: PaymentTypeListParams) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: KEY });
    qc.invalidateQueries({ queryKey: OPTIONS_KEY });
  };
}

export function useCreatePaymentType() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: PaymentTypeInput) => api.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdatePaymentType() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PaymentTypeInput> }) => api.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeletePaymentType() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: invalidate,
  });
}
