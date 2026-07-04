import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

// Qo'lda bonus/jarima yozuvlari (/hr/payroll-adjustments). Sabab majburiy;
// tegishli oylik tasdiqqa ketgach backend o'zgartirishni taqiqlaydi.

export type PayrollAdjustmentType = "bonus" | "penalty";

export interface PayrollAdjustment {
  id: string;
  staffMemberId: string;
  staffName: string | null;
  period: string;
  type: PayrollAdjustmentType;
  amount: number;
  reason: string;
  createdById: string | null;
  createdAt: string;
}

export interface PayrollAdjustmentInput {
  staffMemberId: string;
  period: string;
  type: PayrollAdjustmentType;
  amount: number;
  reason: string;
}

export interface PayrollAdjustmentParams {
  staffMemberId?: string;
  period?: string;
  type?: PayrollAdjustmentType;
}

function cleanParams<T extends object>(params: T): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") out[key] = String(value);
  }
  return out;
}

const api = {
  list(params: PayrollAdjustmentParams): Promise<PayrollAdjustment[]> {
    return apiRequest<PayrollAdjustment[]>("/hr/payroll-adjustments", { query: cleanParams(params) });
  },
  create(input: PayrollAdjustmentInput): Promise<PayrollAdjustment> {
    return apiRequest<PayrollAdjustment>("/hr/payroll-adjustments", { method: "POST", body: input });
  },
  update(id: string, input: Partial<Pick<PayrollAdjustmentInput, "amount" | "reason">>): Promise<PayrollAdjustment> {
    return apiRequest<PayrollAdjustment>(`/hr/payroll-adjustments/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/hr/payroll-adjustments/${id}`, { method: "DELETE" });
  },
};

const KEY = ["hr", "payroll-adjustments"] as const;

export function usePayrollAdjustments(params: PayrollAdjustmentParams) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: () => api.list(params),
    staleTime: 15_000,
  });
}

export function useCreatePayrollAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PayrollAdjustmentInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeletePayrollAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export const ADJUSTMENT_TYPE_LABELS: Record<PayrollAdjustmentType, string> = {
  bonus: "Bonus",
  penalty: "Jarima",
};
