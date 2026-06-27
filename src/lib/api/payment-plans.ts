import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

export type PlanCode = "yearly_1x" | "split_2" | "split_3" | "monthly";
export type DiscountType = "percent" | "amount";

export interface PlanRate {
  planCode: PlanCode;
  discountType: DiscountType;
  discountValue: number;
}

export interface AcademicWindow {
  start: string;
  end: string;
  months: number;
  resolved: boolean;
}

export interface PlanConfig {
  id: string;
  referenceMonthlyFee: number;
  fallbackMonths: number;
  rates: PlanRate[];
  academic: AcademicWindow;
}

export interface Installment {
  seq: number;
  dueDate: string;
  amount: number;
}

export interface PlanComparisonRow {
  planCode: PlanCode;
  installments: number;
  total: number;
  discount: number;
  /** Oyma-oyga nisbatan tejam (so'm). */
  savingsVsMonthly: number;
  /** Tejam yillik umumiy summaning necha foizi (0–100). */
  savingsPercent: number;
  isCheapest: boolean;
  clamped: boolean;
  schedule: Installment[];
}

export interface PlanPreview {
  academic: AcademicWindow;
  plans: PlanComparisonRow[];
}

/** Reja kodlari tartibi va o'zbekcha nomlari (UI uchun yagona manba). */
export const PLAN_LABELS: Record<PlanCode, string> = {
  yearly_1x: "Yillik (1 marta)",
  split_2: "2 ga bo'lib",
  split_3: "3 ga bo'lib",
  monthly: "Oyma-oy",
};

export const PLAN_ORDER: PlanCode[] = ["yearly_1x", "split_2", "split_3", "monthly"];

const KEY = ["payment-plans"] as const;

export function usePlanConfig() {
  return useQuery({
    queryKey: [...KEY, "config"],
    queryFn: () => apiRequest<PlanConfig>("/student-payments/plan-config"),
    staleTime: 60_000,
  });
}

export interface UpdatePlanConfigInput {
  referenceMonthlyFee: number;
  fallbackMonths: number;
  rates: PlanRate[];
}

export function useUpdatePlanConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePlanConfigInput) =>
      apiRequest<PlanConfig>("/student-payments/plan-config", { method: "PUT", body: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export interface PlanPreviewParams {
  monthlyFee: number;
  discountType?: DiscountType;
  discountValue?: number;
  billingStart?: string;
  /** Gibrid: shu o'quvchiga maxsus reja chegirmasi (qolgan rejalar global'dan). */
  overridePlan?: PlanCode;
  overrideType?: DiscountType;
  overrideValue?: number;
}

/** Tarif/chegirma bo'yicha 4 rejani solishtirish (forma ichida jonli). */
export function usePlanPreview(params: PlanPreviewParams | null) {
  return useQuery({
    queryKey: [...KEY, "preview", params],
    queryFn: () => {
      const query: Record<string, string | number> = { monthlyFee: params!.monthlyFee };
      if (params!.discountType) query.discountType = params!.discountType;
      if (params!.discountValue != null) query.discountValue = params!.discountValue;
      if (params!.billingStart) query.billingStart = params!.billingStart;
      if (params!.overridePlan && params!.overrideType && params!.overrideValue != null) {
        query.overridePlan = params!.overridePlan;
        query.overrideType = params!.overrideType;
        query.overrideValue = params!.overrideValue;
      }
      return apiRequest<PlanPreview>("/student-payments/plan-preview", { query });
    },
    enabled: !!params && params.monthlyFee > 0,
    staleTime: 15_000,
  });
}

/** Bitta o'quvchi uchun rejalar solishtiruvi (override hisobga olinadi). */
export function useStudentPlanComparison(studentId: string | null) {
  return useQuery({
    queryKey: [...KEY, "comparison", studentId],
    queryFn: () => apiRequest<PlanPreview | null>(`/student-payments/plan-comparison/${studentId}`),
    enabled: !!studentId,
    staleTime: 30_000,
  });
}
