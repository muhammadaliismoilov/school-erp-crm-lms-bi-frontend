import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiRequest } from "./client";

// Oylik hisoblash dvigateli (/hr/payroll-runs) — davr generatsiyasi, payslip
// qatorlari va holat mashinasi.

export type PayrollStatus = "draft" | "pending_approval" | "approved" | "paid" | "locked";

export type PayrollItemType =
  | "base_salary"
  | "lesson_pay"
  | "class_leader"
  | "kpi_bonus"
  | "manual_bonus"
  | "penalty"
  | "absence_deduction"
  | "retro_adjustment";

export interface PayrollRunItem {
  type: PayrollItemType;
  quantity: number | null;
  rate: number | null;
  amount: number;
  note: string | null;
}

export interface PayrollRun {
  id: string;
  staffMemberId: string;
  staffName: string | null;
  positionTitle: string | null;
  period: string;
  status: PayrollStatus;
  baseAmount: number;
  bonus: number;
  deduction: number;
  netAmount: number;
  items: PayrollRunItem[];
}

export interface GenerateRunSummary {
  period: string;
  totalStaff: number;
  calculated: number;
  skippedNonDraft: number;
  warnings: string[];
}

export type PayrollTransition = "submit" | "reject" | "approve" | "mark-paid" | "lock";

export interface PayrollRunParams {
  period?: string;
  staffMemberId?: string;
  status?: PayrollStatus;
}

function cleanParams<T extends object>(params: T): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") out[key] = String(value);
  }
  return out;
}

const api = {
  list(params: PayrollRunParams): Promise<PayrollRun[]> {
    return apiRequest<PayrollRun[]>("/hr/payroll-runs", { query: cleanParams(params) });
  },
  get(id: string): Promise<PayrollRun> {
    return apiRequest<PayrollRun>(`/hr/payroll-runs/${id}`);
  },
  generate(period: string): Promise<GenerateRunSummary> {
    return apiRequest<GenerateRunSummary>("/hr/payroll-runs/generate", { method: "POST", body: { period } });
  },
  recalculate(id: string): Promise<PayrollRun> {
    return apiRequest<PayrollRun>(`/hr/payroll-runs/${id}/recalculate`, { method: "POST" });
  },
  transition(id: string, action: PayrollTransition): Promise<PayrollRun> {
    return apiRequest<PayrollRun>(`/hr/payroll-runs/${id}/${action}`, { method: "POST" });
  },
  mine(): Promise<PayrollRun[]> {
    return apiRequest<PayrollRun[]>("/hr/payroll-runs/my");
  },
};

const KEY = ["hr", "payroll-runs"] as const;

export function usePayrollRuns(params: PayrollRunParams) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

/** Xodimning O'Z payslip'lari — maxsus ruxsat kerak emas (faqat tasdiqlangan+ holatlar). */
export function useMyPayslips() {
  return useQuery({
    queryKey: [...KEY, "my"],
    queryFn: () => api.mine(),
    staleTime: 30_000,
  });
}

export function useGeneratePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (period: string) => api.generate(period),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRecalculatePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.recalculate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function usePayrollTransition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: PayrollTransition }) => api.transition(id, action),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export const PAYROLL_STATUS_LABELS: Record<PayrollStatus, string> = {
  draft: "Qoralama",
  pending_approval: "Tasdiq kutilmoqda",
  approved: "Tasdiqlandi",
  paid: "To'landi",
  locked: "Yopildi",
};

export const PAYROLL_STATUS_TONE: Record<PayrollStatus, "neutral" | "caution" | "accent" | "positive"> = {
  draft: "neutral",
  pending_approval: "caution",
  approved: "accent",
  paid: "positive",
  locked: "positive",
};

export const PAYROLL_ITEM_TYPE_LABELS: Record<PayrollItemType, string> = {
  base_salary: "Oklad",
  lesson_pay: "Dars haqi",
  class_leader: "Sinf rahbarligi",
  kpi_bonus: "KPI bonusi",
  manual_bonus: "Bonus",
  penalty: "Jarima",
  absence_deduction: "Davomat ushlab qolinishi",
  retro_adjustment: "Retro tuzatish",
};

/** Keyingi mumkin bo'lgan amal(lar) — holat mashinasiga mos. */
export const PAYROLL_NEXT_ACTIONS: Record<PayrollStatus, { action: PayrollTransition; label: string }[]> = {
  draft: [{ action: "submit", label: "Tasdiqqa yuborish" }],
  pending_approval: [
    { action: "approve", label: "Tasdiqlash" },
    { action: "reject", label: "Qoralamaga qaytarish" },
  ],
  approved: [{ action: "mark-paid", label: "To'landi deb belgilash" }],
  paid: [{ action: "lock", label: "Yopish" }],
  locked: [],
};
