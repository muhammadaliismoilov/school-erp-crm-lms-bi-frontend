import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiRequest } from "./client";

export interface ReportSubject {
  id: string;
  name: string;
  color: string;
}

export interface ReportQuarter {
  id: string;
  quarterNumber: number;
}

export interface ReportStudent {
  id: string;
  name: string;
}

export interface ReportPageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

// ---- Tab 1: O'rtacha o'zlashtirish ----

export interface AverageRow {
  student: ReportStudent;
  grades: Record<string, number | null>;
  average: number | null;
}

export interface AverageStats {
  jamiOquvchilar: number;
  ortachaBaho: number | null;
  alochilar: number;
  alochilarPercent: number;
  yaxshi: number;
  yaxshiPercent: number;
  qoniqarsiz: number;
  qoniqarsizPercent: number;
}

export interface AverageReport {
  subjects: ReportSubject[];
  rows: AverageRow[];
  footer: { subjectAverages: Record<string, number | null>; overall: number | null };
  stats: AverageStats;
  meta: ReportPageMeta;
}

// ---- Tab 2: Choraklik ----

export interface QuarterlyRow {
  student: ReportStudent;
  cells: Record<string, Record<string, number | null>>;
  average: number | null;
}

export interface QuarterlyReport {
  subjects: ReportSubject[];
  quarters: ReportQuarter[];
  rows: QuarterlyRow[];
  meta: ReportPageMeta;
}

// ---- Tab 3: Progress imtihon ----

export interface ProgressExamRow {
  student: ReportStudent;
  avgBaho: number | null;
  avgBall: number | null;
}

export interface ProgressExamReport {
  rows: ProgressExamRow[];
  stats: { jamiOquvchilar: number; sinfOrtachaBaho: number | null; sinfOrtachaBall: number | null };
  meta: ReportPageMeta;
}

export interface ReportParams {
  classId?: string;
  subjectId?: string;
  quarterId?: string;
  page?: number;
  limit?: number;
}

const api = {
  average(params: ReportParams): Promise<AverageReport> {
    return apiRequest<AverageReport>("/progress-reports/average", { query: { ...params } });
  },
  quarterly(params: ReportParams): Promise<QuarterlyReport> {
    return apiRequest<QuarterlyReport>("/progress-reports/quarterly", { query: { ...params } });
  },
  progressExams(params: ReportParams): Promise<ProgressExamReport> {
    return apiRequest<ProgressExamReport>("/progress-reports/progress-exams", { query: { ...params } });
  },
};

const KEY = ["progress-reports"] as const;

export function useAverageReport(params: ReportParams, enabled = true) {
  return useQuery({
    queryKey: [...KEY, "average", params],
    queryFn: () => api.average(params),
    placeholderData: keepPreviousData,
    enabled,
    staleTime: 30_000,
  });
}

export function useQuarterlyReport(params: ReportParams, enabled = true) {
  return useQuery({
    queryKey: [...KEY, "quarterly", params],
    queryFn: () => api.quarterly(params),
    placeholderData: keepPreviousData,
    enabled,
    staleTime: 30_000,
  });
}

export function useProgressExamReport(params: ReportParams, enabled = true) {
  return useQuery({
    queryKey: [...KEY, "progress-exams", params],
    queryFn: () => api.progressExams(params),
    placeholderData: keepPreviousData,
    enabled,
    staleTime: 30_000,
  });
}

/** 5 ballik bahoga mos rang sinfi (jadval hujayralari uchun). */
export function gradeColorClass(grade: number | null): string {
  if (grade === null) return "bg-parchment-deep text-ink-muted";
  if (grade >= 4.5) return "bg-positive/15 text-positive";
  if (grade >= 3.5) return "bg-sky-500/15 text-sky-600";
  if (grade >= 3) return "bg-amber/15 text-amber";
  return "bg-negative/15 text-negative";
}
