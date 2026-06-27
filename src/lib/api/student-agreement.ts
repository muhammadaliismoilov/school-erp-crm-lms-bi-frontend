import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "./client";
import type { PlanCode } from "./payment-plans";

export type InstallmentState = "paid" | "partial" | "pending";

export interface AgreementInstallment {
  seq: number;
  dueDate: string;
  amount: number;
  paid: number;
  remaining: number;
  status: InstallmentState;
}

export interface StudentAgreement {
  studentId: string;
  studentName: string;
  classId: string | null;
  className: string | null;
  /** null → oyma-oy. */
  plan: PlanCode | null;
  monthlyFee: number;
  effectiveMonthly: number;
  installmentCount: number;
  total: number;
  paid: number;
  remaining: number;
  installments: AgreementInstallment[];
  nextDue: { seq: number; dueDate: string; amount: number; remaining: number } | null;
}

/** Reja kodidan o'zbekcha kelishuv nomi. */
export const AGREEMENT_PLAN_LABEL: Record<string, string> = {
  yearly_1x: "Yillik (1 marta)",
  split_2: "2 ga bo‘lib",
  split_3: "3 ga bo‘lib",
  monthly: "Oyma-oy",
};

export function planLabel(plan: PlanCode | null): string {
  return AGREEMENT_PLAN_LABEL[plan ?? "monthly"];
}

/** O'quvchining to'lov kelishuvi (reja + jadval + keyingi to'lov) — to'lov formasi paneli. */
export function useStudentAgreement(studentId: string | null) {
  return useQuery({
    queryKey: ["student-agreement", studentId],
    queryFn: () => apiRequest<StudentAgreement | null>(`/student-payments/agreement/${studentId}`),
    enabled: !!studentId,
    staleTime: 30_000,
  });
}
