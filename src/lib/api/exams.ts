import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

/** Backend ko'p tilli matni; `loc()` util shu shaklni tushunadi. */
export type LocalizedText = { uz?: string; ru?: string; en?: string };

export type ExamKind = "class" | "course";
export type ExamType = "test" | "control_work" | "dictation";
export type ExamStatus = "draft" | "scheduled" | "finished";

export interface Exam {
  id: string;
  title: string;
  examKind: ExamKind;
  examType: ExamType;
  classId: string | null;
  className: string | null;
  subjectId: string | null;
  subjectName: LocalizedText | string | null;
  teacherId: string | null;
  teacherName: string | null;
  courseId: string | null;
  courseName: string | null;
  quarterId: string | null;
  quarterName: LocalizedText | string | null;
  quarterNumber: number | null;
  examDate: string;
  availableFrom: string | null;
  availableUntil: string | null;
  maxScore: number;
  status: ExamStatus;
  resultCount: number;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
}

export interface ExamStats {
  total: number;
  draft: number;
  scheduled: number;
  finished: number;
  withResults: number;
}

export interface ExamListResult {
  items: Exam[];
  stats: ExamStats;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ExamFilters {
  kind: ExamKind;
  search?: string;
  quarterNumber?: number;
  classId?: string;
  subjectId?: string;
  teacherId?: string;
  courseId?: string;
  examType?: ExamType;
  status?: ExamStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface ClassExamInput {
  classId: string;
  subjectId: string;
  teacherId: string;
  quarterId: string;
  examType: ExamType;
  examDate: string;
  availableFrom?: string;
  availableUntil?: string;
  maxScore?: number;
  title?: string;
}

export interface CourseExamInput {
  courseId: string;
  quarterId: string;
  examType: ExamType;
  examDate: string;
  availableFrom?: string;
  availableUntil?: string;
  maxScore?: number;
  title?: string;
}

export interface ExamOptions {
  subjects: { id: string; name: LocalizedText | string; color?: string }[];
  classes: { id: string; name: string; gradeLevel: number; section: string }[];
  courses: { id: string; name: string; subjectName: LocalizedText | string | null; teacherName: string | null }[];
  quarters: { id: string; name: LocalizedText | string; quarterNumber: number }[];
  teachers: { id: string; fullName: string }[];
}

export interface ExamTeacher {
  id: string;
  fullName: string;
}

/**
 * Sof funksiya: sahifa filtr holatini API so'roviga aylantiradi (bo'sh
 * qiymatlar tashlanadi). Deterministik — unit-test uchun qulay.
 */
export function buildExamQuery(filters: ExamFilters): Record<string, string | number> {
  const query: Record<string, string | number> = { kind: filters.kind };
  if (filters.search && filters.search.trim()) query.search = filters.search.trim();
  if (filters.quarterNumber) query.quarterNumber = filters.quarterNumber;
  if (filters.classId) query.classId = filters.classId;
  if (filters.subjectId) query.subjectId = filters.subjectId;
  if (filters.teacherId) query.teacherId = filters.teacherId;
  if (filters.courseId) query.courseId = filters.courseId;
  if (filters.examType) query.examType = filters.examType;
  if (filters.status) query.status = filters.status;
  if (filters.dateFrom) query.dateFrom = filters.dateFrom;
  if (filters.dateTo) query.dateTo = filters.dateTo;
  query.page = filters.page && filters.page > 0 ? filters.page : 1;
  if (filters.limit) query.limit = filters.limit;
  return query;
}

/**
 * ISO sana (`yyyy-mm-dd`) + vaqt (`HH:mm`) ni ISO datetime stringga birlashtiradi.
 * Ikkalasi ham bo'lmasa `undefined` qaytaradi (maydon yuborilmaydi).
 */
export function combineDateTime(date: string, time: string): string | undefined {
  if (!date) return undefined;
  const t = time && /^\d{2}:\d{2}$/.test(time) ? time : "00:00";
  const dt = new Date(`${date}T${t}:00`);
  return Number.isNaN(dt.getTime()) ? undefined : dt.toISOString();
}

/** ISO datetime ni `{ date: yyyy-mm-dd, time: HH:mm }` ga ajratadi (tahrirlash uchun). */
export function splitDateTime(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return { date: "", time: "" };
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`,
    time: `${pad(dt.getHours())}:${pad(dt.getMinutes())}`,
  };
}

const apiCalls = {
  list(filters: ExamFilters): Promise<ExamListResult> {
    return apiRequest<ExamListResult>("/lms/exams", { query: buildExamQuery(filters) });
  },
  options(): Promise<ExamOptions> {
    return apiRequest<ExamOptions>("/lms/exams/options");
  },
  teachers(query: { classId?: string; subjectId?: string }): Promise<{ items: ExamTeacher[] }> {
    return apiRequest<{ items: ExamTeacher[] }>("/lms/exams/teachers", { query });
  },
  createClass(input: ClassExamInput): Promise<Exam> {
    return apiRequest<Exam>("/lms/exams/class", { method: "POST", body: input });
  },
  createCourse(input: CourseExamInput): Promise<Exam> {
    return apiRequest<Exam>("/lms/exams/course", { method: "POST", body: input });
  },
  update(id: string, input: Partial<ClassExamInput & CourseExamInput>): Promise<Exam> {
    return apiRequest<Exam>(`/lms/exams/${id}`, { method: "PATCH", body: input });
  },
  publish(id: string): Promise<Exam> {
    return apiRequest<Exam>(`/lms/exams/${id}/publish`, { method: "POST" });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/lms/exams/${id}`, { method: "DELETE" });
  },
};

const KEY = ["lms-exams"] as const;

export function useExamList(filters: ExamFilters) {
  return useQuery({
    queryKey: [...KEY, filters],
    queryFn: () => apiCalls.list(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useExamOptions(enabled = true) {
  return useQuery({
    queryKey: [...KEY, "options"],
    queryFn: () => apiCalls.options(),
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useExamTeachers(classId?: string, subjectId?: string) {
  return useQuery({
    queryKey: [...KEY, "teachers", classId, subjectId],
    queryFn: () => apiCalls.teachers({ classId, subjectId }),
    enabled: Boolean(classId && subjectId),
    placeholderData: keepPreviousData,
  });
}

export function useCreateClassExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ClassExamInput) => apiCalls.createClass(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCreateCourseExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CourseExamInput) => apiCalls.createCourse(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ClassExamInput & CourseExamInput> }) =>
      apiCalls.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function usePublishExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiCalls.publish(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiCalls.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
