import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export type CoinTxType = "earn" | "spend" | "adjust";

export interface GradebookLesson {
  id: string;
  lessonDate: string;
  topic?: string | null;
  status: string;
}

export interface GradebookStudent {
  id: string;
  fullName: string;
  studentCode: string;
  average?: number | null;
  quarterGrade?: number | null;
  quarterBall?: number | null;
  quarterComment?: string | null;
  attendancePct?: number | null;
}

export interface GradebookCell {
  lessonId: string;
  studentId: string;
  grade?: number | null;
  ball?: number | null;
  attendance?: AttendanceStatus | null;
  homeworkDone: boolean;
  comment?: string | null;
}

export interface GradebookStats {
  studentCount: number;
  lessonCount: number;
  averageGrade?: number | null;
  excellentCount: number;
  attendancePct: number;
}

export interface Gradebook {
  lessons: GradebookLesson[];
  students: GradebookStudent[];
  cells: GradebookCell[];
  stats: GradebookStats;
}

export interface GradebookFilter {
  classId?: string;
  subjectId?: string;
  quarterId?: string;
}

export interface UpsertGradeInput {
  lessonId: string;
  studentId: string;
  grade?: number | null;
  ball?: number | null;
  attendance?: AttendanceStatus | null;
  homeworkDone?: boolean;
  comment?: string;
}

export interface QuarterGradeInput {
  studentId: string;
  subjectId: string;
  quarterId: string;
  grade?: number | null;
  ball?: number | null;
  comment?: string;
}

export interface AwardCoinInput {
  studentId: string;
  type: CoinTxType;
  amount: number;
  reason: string;
  lessonId?: string;
}

export interface CoinPreset {
  id: string;
  name: string;
  amount: number;
  icon?: string | null;
  color?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface StudentSubjectProgress {
  subjectId: string;
  name: unknown;
  average: number | null;
  attendancePct: number;
}

export interface StudentProgress {
  studentId: string;
  fullName: string;
  gpa: number | null;
  currentGpa: number | null;
  progress: number;
  bestSubject: StudentSubjectProgress | null;
  worstSubject: StudentSubjectProgress | null;
  subjects: StudentSubjectProgress[];
}

const ready = (f: GradebookFilter): f is Required<GradebookFilter> =>
  Boolean(f.classId && f.subjectId && f.quarterId);

export function useGradebook(filter: GradebookFilter) {
  return useQuery({
    queryKey: ["gradebook", filter],
    enabled: ready(filter),
    queryFn: () =>
      apiRequest<Gradebook>("/lms/gradebook", {
        query: { classId: filter.classId, subjectId: filter.subjectId, quarterId: filter.quarterId },
      }),
  });
}

function useGradebookInvalidation(filter: GradebookFilter) {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["gradebook", filter] });
}

export function useUpsertGrade(filter: GradebookFilter) {
  const invalidate = useGradebookInvalidation(filter);
  return useMutation({
    mutationFn: (input: UpsertGradeInput) =>
      apiRequest("/lms/gradebook/grade", { method: "PUT", body: input }),
    onSuccess: invalidate,
  });
}

export function useSetQuarterGrade(filter: GradebookFilter) {
  const invalidate = useGradebookInvalidation(filter);
  return useMutation({
    mutationFn: (input: QuarterGradeInput) =>
      apiRequest("/lms/gradebook/quarter-grade", { method: "PUT", body: input }),
    onSuccess: invalidate,
  });
}

export function useGenerateLessons(filter: GradebookFilter) {
  const invalidate = useGradebookInvalidation(filter);
  return useMutation({
    mutationFn: (input: { classId: string; subjectId: string; quarterId: string }) =>
      apiRequest<{ created: number }>("/lms/gradebook/generate-lessons", { method: "POST", body: input }),
    onSuccess: invalidate,
  });
}

export function useAwardCoin() {
  return useMutation({
    mutationFn: (input: AwardCoinInput) =>
      apiRequest("/lms/gradebook/coins", { method: "POST", body: input }),
  });
}

export function useCoinPresets() {
  return useQuery({
    queryKey: ["gradebook", "coin-presets"],
    queryFn: () => apiRequest<CoinPreset[]>("/lms/gradebook/coin-presets"),
    staleTime: 60_000,
  });
}

export function useStudentProgress(studentId: string | null, quarterId?: string) {
  return useQuery({
    queryKey: ["gradebook", "student", studentId, quarterId],
    enabled: Boolean(studentId),
    queryFn: () =>
      apiRequest<StudentProgress>(`/lms/gradebook/student/${studentId}`, { query: { quarterId } }),
  });
}

/** Davomat → rang klassi (grid nuqtalari uchun). */
export function attendanceTone(a: AttendanceStatus | null | undefined): string {
  switch (a) {
    case "present":
      return "bg-positive";
    case "late":
      return "bg-amber";
    case "absent":
      return "bg-negative";
    case "excused":
      return "bg-ink-muted";
    default:
      return "bg-line";
  }
}
