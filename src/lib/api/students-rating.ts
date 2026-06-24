import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiRequest } from "./client";

export const RATING_TRENDS = ["rising", "stable", "falling"] as const;
export type RatingTrend = (typeof RATING_TRENDS)[number];

export interface RatingRow {
  studentId: string;
  studentName: string;
  initials: string | null;
  classId: string | null;
  classLabel: string | null;
  umumiyBall: number;
  ortachaBall: number;
  davomat: number;
  trend: RatingTrend;
}

export interface RatingStats {
  jamiOquvchi: number;
  ortachaUmumiyBall: number;
  osishTrendi: number;
}

export interface RatingPageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface RatingListResult {
  items: RatingRow[];
  meta: RatingPageMeta;
  stats: RatingStats;
}

export interface RatingListParams {
  page?: number;
  limit?: number;
  search?: string;
  academicYearId?: string;
  gradeLevel?: number;
  classId?: string;
}

export interface RatingLeader {
  rank: number;
  studentId: string;
  studentName: string;
  initials: string | null;
  classLabel: string | null;
  umumiyBall: number;
  trend: RatingTrend;
}

export interface RatingLeadersResult {
  podium: RatingLeader[];
  leaders: RatingLeader[];
}

export interface RatingClassAverage {
  classId: string;
  classLabel: string;
  avgUmumiyBall: number;
  studentCount: number;
}

export interface RatingSubjectAverage {
  subjectId: string;
  subjectName: string;
  avgBall: number;
  gradeCount: number;
}

export interface RatingSeriesPoint {
  key: string;
  label: string;
  value: number;
}

export interface RatingQuarterGrade {
  quarterNumber: number;
  subjectName: string;
  grade: number | null;
}

export interface RatingStudentDetail {
  studentId: string;
  studentName: string;
  initials: string | null;
  classLabel: string | null;
  rank: number;
  level: string;
  umumiyBall: number;
  ortachaBall: number;
  davomat: number;
  trend: RatingTrend;
  darsBaholariOylik: RatingSeriesPoint[];
  choraklikBaholar: RatingQuarterGrade[];
  progressTest: RatingSeriesPoint[];
}

export interface RatingScopeParams {
  limit?: 10 | 20;
  academicYearId?: string;
  gradeLevel?: number;
  classId?: string;
}

const api = {
  list(params: RatingListParams): Promise<RatingListResult> {
    return apiRequest<RatingListResult>("/students-rating", { query: { ...params } });
  },
  leaders(params: RatingScopeParams): Promise<RatingLeadersResult> {
    return apiRequest<RatingLeadersResult>("/students-rating/leaders", { query: { ...params } });
  },
  classes(params: Omit<RatingScopeParams, "classId" | "limit">): Promise<RatingClassAverage[]> {
    return apiRequest<RatingClassAverage[]>("/students-rating/classes", { query: { ...params } });
  },
  subjects(params: Omit<RatingScopeParams, "limit">): Promise<RatingSubjectAverage[]> {
    return apiRequest<RatingSubjectAverage[]>("/students-rating/subjects", { query: { ...params } });
  },
  detail(studentId: string): Promise<RatingStudentDetail> {
    return apiRequest<RatingStudentDetail>(`/students-rating/${studentId}`);
  },
};

const KEY = ["students-rating"] as const;

export function useRatingList(params: RatingListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useRatingLeaders(params: RatingScopeParams) {
  return useQuery({
    queryKey: [...KEY, "leaders", params],
    queryFn: () => api.leaders(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useRatingClasses(params: Omit<RatingScopeParams, "classId" | "limit">) {
  return useQuery({
    queryKey: [...KEY, "classes", params],
    queryFn: () => api.classes(params),
    staleTime: 30_000,
  });
}

export function useRatingSubjects(params: Omit<RatingScopeParams, "limit">) {
  return useQuery({
    queryKey: [...KEY, "subjects", params],
    queryFn: () => api.subjects(params),
    staleTime: 30_000,
  });
}

export function useRatingStudent(studentId: string | null) {
  return useQuery({
    queryKey: [...KEY, "detail", studentId],
    queryFn: () => api.detail(studentId as string),
    enabled: Boolean(studentId),
  });
}

export const RATING_TREND_LABELS: Record<RatingTrend, string> = {
  rising: "O‘smoqda",
  stable: "Barqaror",
  falling: "Pasaymoqda",
};

export const RATING_TREND_TONES: Record<RatingTrend, "positive" | "neutral" | "negative"> = {
  rising: "positive",
  stable: "neutral",
  falling: "negative",
};
