import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export type SalaryStatus = "pending" | "approved";

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

// ─── O'qituvchilar uchun dars stavkalari ──────────────────────────────────

export interface TeacherRateRow {
  teacherId: string;
  fullName: string;
  phone: string | null;
  employmentType: string | null;
  level: string | null;
  ratePerLesson: number;
}

export interface TeacherRateListResult {
  items: TeacherRateRow[];
  meta: PageMeta;
  academicYearId: string | null;
}

export interface TeacherRateListParams {
  page?: number;
  limit?: number;
  search?: string;
  academicYearId?: string;
}

// ─── Oylik maoshlar ───────────────────────────────────────────────────────

export interface SalaryRow {
  id: string | null;
  teacherId: string;
  fullName: string;
  completedLessons: number;
  ratePerLesson: number;
  computedAmount: number;
  finalAmount: number;
  status: SalaryStatus;
  adjustmentReason: string | null;
  approvedAt: string | null;
  transactionId: string | null;
}

export interface SalaryListResult {
  items: SalaryRow[];
  meta: PageMeta;
  period: string;
  academicYearId: string | null;
}

export interface SalaryListParams {
  period: string;
  page?: number;
  limit?: number;
  search?: string;
  academicYearId?: string;
}

export interface AdjustSalaryInput {
  adjustedLessons?: number;
  adjustedAmount?: number;
  adjustmentReason: string;
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
  listRates(params: TeacherRateListParams): Promise<TeacherRateListResult> {
    return apiRequest<TeacherRateListResult>("/finance/teacher-rates", {
      query: cleanParams(params),
    });
  },
  upsertRate(
    teacherId: string,
    input: { ratePerLesson: number; academicYearId?: string },
  ): Promise<TeacherRateRow> {
    return apiRequest<TeacherRateRow>(`/finance/teacher-rates/${teacherId}`, {
      method: "PUT",
      body: input,
    });
  },
  listSalaries(params: SalaryListParams): Promise<SalaryListResult> {
    return apiRequest<SalaryListResult>("/finance/salaries", {
      query: cleanParams(params),
    });
  },
  recalculate(input: { period: string; academicYearId?: string }): Promise<{ updated: number }> {
    return apiRequest<{ updated: number }>("/finance/salaries/recalculate", {
      method: "POST",
      body: input,
    });
  },
  adjust(id: string, input: AdjustSalaryInput): Promise<SalaryRow> {
    return apiRequest<SalaryRow>(`/finance/salaries/${id}/adjust`, {
      method: "PATCH",
      body: input,
    });
  },
  approve(id: string): Promise<SalaryRow> {
    return apiRequest<SalaryRow>(`/finance/salaries/${id}/approve`, {
      method: "POST",
    });
  },
};

const RATES_KEY = ["teacher-rates"] as const;
const SALARIES_KEY = ["teacher-salaries"] as const;

export function useTeacherRates(params: TeacherRateListParams) {
  return useQuery({
    queryKey: [...RATES_KEY, "list", params],
    queryFn: () => api.listRates(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useUpsertTeacherRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      teacherId,
      ratePerLesson,
      academicYearId,
    }: {
      teacherId: string;
      ratePerLesson: number;
      academicYearId?: string;
    }) => api.upsertRate(teacherId, { ratePerLesson, academicYearId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RATES_KEY });
      qc.invalidateQueries({ queryKey: SALARIES_KEY });
    },
  });
}

export function useSalaries(params: SalaryListParams) {
  return useQuery({
    queryKey: [...SALARIES_KEY, "list", params],
    queryFn: () => api.listSalaries(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useRecalculateSalaries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { period: string; academicYearId?: string }) => api.recalculate(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: SALARIES_KEY }),
  });
}

export function useAdjustSalary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdjustSalaryInput }) => api.adjust(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: SALARIES_KEY }),
  });
}

export function useApproveSalary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: SALARIES_KEY }),
  });
}

export const SALARY_STATUS_LABELS: Record<SalaryStatus, string> = {
  pending: "Kutilmoqda",
  approved: "Tasdiqlangan",
};

export const PAGE_SIZES = [10, 20, 50, 100] as const;

const MONTHS_UZ = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
] as const;

/** `YYYY-MM` davrini "May 2026" ko'rinishida formatlaydi. */
export function formatPeriod(period: string): string {
  const [y, m] = period.split("-");
  const idx = Number(m) - 1;
  if (idx < 0 || idx > 11) return period;
  return `${MONTHS_UZ[idx]} ${y}`;
}

/** Joriy oyni `YYYY-MM` ko'rinishida qaytaradi. */
export function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Tanlangichi uchun oxirgi `count` oy davrlari (eng yangi birinchi). */
export function recentPeriods(count = 18): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < count; i += 1) {
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out.push({ value, label: formatPeriod(value) });
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}
