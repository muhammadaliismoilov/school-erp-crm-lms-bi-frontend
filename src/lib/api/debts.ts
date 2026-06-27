import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiRequest } from "./client";
import type { PlanCode } from "./payment-plans";

export type DebtCellStatus = "paid" | "partial" | "pending";
export type DebtStatusFilter = "unpaid" | "partial" | "paid";

export interface MonthKey {
  year: number;
  month: number;
}

export interface DebtMonthCell extends MonthKey {
  expected: number;
  paid: number;
  discount: number;
  due: boolean;
  status: DebtCellStatus;
}

export interface StudentDebtRow {
  studentId: string;
  studentName: string;
  classId: string | null;
  className: string | null;
  plan: PlanCode | null;
  months: DebtMonthCell[];
  schoolOwes: number;
  parentOwes: number;
  realBalance: number;
}

export interface DebtsStudentsResult {
  axis: MonthKey[];
  items: StudentDebtRow[];
  meta: { page: number; limit: number; total: number; pageCount: number };
  summary: {
    schoolOwesTotal: number;
    parentOwesTotal: number;
    realBalanceTotal: number;
    studentCount: number;
    debtorCount: number;
  };
}

export interface MonthlyAggregate extends MonthKey {
  expected: number;
  collected: number;
  remaining: number;
  discount: number;
  collectionRate: number;
  fullyPaid: number;
  partiallyPaid: number;
  unpaid: number;
}

export interface DebtsOverviewResult {
  academic: { start: string; end: string; months: number; resolved: boolean };
  kpi: {
    totalOutstanding: number;
    debtorCount: number;
    currentMonthRate: number;
    currentMonthCollected: number;
  };
  chart: { year: number; month: number; expected: number; collected: number; rate: number }[];
  monthly: MonthlyAggregate[];
  total: MonthlyAggregate;
}

export interface DebtsStudentsParams {
  search?: string;
  classId?: string;
  status?: DebtStatusFilter;
  month?: string;
  page?: number;
  limit?: number;
}

/** O'zbekcha qisqa oy nomlari (1–12). */
export const MONTH_SHORT_UZ = [
  "Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek",
] as const;

/** O'zbekcha to'liq oy nomlari (1–12). */
export const MONTH_FULL_UZ = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
] as const;

export function monthLabel(m: MonthKey, full = false): string {
  const names = full ? MONTH_FULL_UZ : MONTH_SHORT_UZ;
  return `${names[m.month - 1]} ${m.year}`;
}

export function monthKeyStr(m: MonthKey): string {
  return `${m.year}-${String(m.month).padStart(2, "0")}`;
}

function cleanParams(params: DebtsStudentsParams): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") out[k] = v as string | number;
  }
  return out;
}

const KEY = ["debts"] as const;

export function useDebtsOverview() {
  return useQuery({
    queryKey: [...KEY, "overview"],
    queryFn: () => apiRequest<DebtsOverviewResult>("/student-payments/debts/overview"),
    staleTime: 60_000,
  });
}

export function useDebtsStudents(params: DebtsStudentsParams) {
  return useQuery({
    queryKey: [...KEY, "students", params],
    queryFn: () => apiRequest<DebtsStudentsResult>("/student-payments/debts/students", { query: cleanParams(params) }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
