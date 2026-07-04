import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";
import type { QualificationCategory } from "./hr";

// Payroll konfiguratsiyasi (/hr/payroll-config): toifa stavkalari (tarixli)
// va oylik siyosati (sinf-rahbarlik stavkasi, maks sinflar).

export interface PayRateCard {
  id: string;
  category: QualificationCategory;
  ratePerLesson: number;
  effectiveFrom: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayRateCardInput {
  category: QualificationCategory;
  ratePerLesson: number;
  effectiveFrom: string;
  note?: string;
}

export interface PayrollSettings {
  classLeaderRate: number;
  maxClassLeaderships: number;
}

const api = {
  rateCards(category?: QualificationCategory): Promise<PayRateCard[]> {
    return apiRequest<PayRateCard[]>("/hr/payroll-config/rate-cards", {
      query: category ? { category } : undefined,
    });
  },
  createRateCard(input: PayRateCardInput): Promise<PayRateCard> {
    return apiRequest<PayRateCard>("/hr/payroll-config/rate-cards", { method: "POST", body: input });
  },
  updateRateCard(id: string, input: Partial<PayRateCardInput>): Promise<PayRateCard> {
    return apiRequest<PayRateCard>(`/hr/payroll-config/rate-cards/${id}`, { method: "PATCH", body: input });
  },
  removeRateCard(id: string): Promise<void> {
    return apiRequest<void>(`/hr/payroll-config/rate-cards/${id}`, { method: "DELETE" });
  },
  settings(): Promise<PayrollSettings> {
    return apiRequest<PayrollSettings>("/hr/payroll-config/settings");
  },
  updateSettings(input: Partial<PayrollSettings>): Promise<PayrollSettings> {
    return apiRequest<PayrollSettings>("/hr/payroll-config/settings", { method: "PUT", body: input });
  },
};

const KEY = ["hr", "payroll-config"] as const;

export function useRateCards(category?: QualificationCategory) {
  return useQuery({
    queryKey: [...KEY, "rate-cards", category ?? "all"],
    queryFn: () => api.rateCards(category),
    staleTime: 30_000,
  });
}

export function useCreateRateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PayRateCardInput) => api.createRateCard(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateRateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PayRateCardInput> }) => api.updateRateCard(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteRateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.removeRateCard(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function usePayrollSettings() {
  return useQuery({
    queryKey: [...KEY, "settings"],
    queryFn: () => api.settings(),
    staleTime: 30_000,
  });
}

export function useUpdatePayrollSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<PayrollSettings>) => api.updateSettings(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
