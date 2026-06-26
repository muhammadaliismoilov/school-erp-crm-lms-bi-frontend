import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiRequest } from "./client";

export type BalanceStatus = "debtor" | "advance" | "settled";

export interface StudentBalanceRow {
  studentId: string;
  studentName: string;
  classId: string | null;
  className: string | null;
  monthlyFee: number;
  effectiveMonthly: number;
  months: number;
  expected: number;
  paid: number;
  /** paid − expected: manfiy = qarz, musbat = avans. */
  balance: number;
  status: BalanceStatus;
}

export interface StudentBalancesResult {
  items: StudentBalanceRow[];
  meta: { page: number; limit: number; total: number; pageCount: number };
  stats: {
    totalDebt: number;
    totalAdvance: number;
    debtorCount: number;
    advanceCount: number;
  };
}

export interface StudentBalanceParams {
  search?: string;
  classId?: string;
  status?: BalanceStatus;
  sort?: "balance" | "-balance";
  page?: number;
  limit?: number;
}

function cleanParams(params: StudentBalanceParams): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") out[k] = v as string | number;
  }
  return out;
}

const KEY = ["student-balances"] as const;

export function useStudentBalances(params: StudentBalanceParams) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => apiRequest<StudentBalancesResult>("/student-payments/balances", { query: cleanParams(params) }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

/** Bitta o'quvchi balansi — detal sahifa "To'lovlar" tabi uchun. */
export function useStudentBalance(studentId: string | null) {
  return useQuery({
    queryKey: [...KEY, "one", studentId],
    queryFn: () => apiRequest<StudentBalanceRow | null>(`/student-payments/balances/${studentId}`),
    enabled: !!studentId,
    staleTime: 30_000,
  });
}
