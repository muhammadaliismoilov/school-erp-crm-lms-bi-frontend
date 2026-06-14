import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

export type SubjectStatus = "active" | "inactive" | "archived";

export interface Subject {
  id: string;
  name: string;
  russianName: string;
  englishName: string;
  localizedName: { uz: string; ru: string; en: string };
  code: string;
  color: string;
  status: SubjectStatus;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
}

export interface SubjectListStats {
  total: number;
  active: number;
  inactive: number;
}

export interface SubjectListResult {
  items: Subject[];
  stats: SubjectListStats;
}

export interface SubjectInput {
  name: string;
  russianName: string;
  englishName?: string;
  color: string;
  description?: string;
  status?: SubjectStatus;
  isActive?: boolean;
}

export interface SubjectBrief {
  id: string;
  name: string;
}

export interface SubjectTeacherBrief {
  id: string;
  fullName: string;
}

export interface SubjectOverview {
  subject: Subject;
  stats: { classCount: number; teacherCount: number; lessonCount: number; averageMastery: number };
  classes: SubjectBrief[];
  teachers: SubjectTeacherBrief[];
}

export interface SubjectScheduleLesson {
  id: string;
  lessonDate: string;
  weekday: number;
  class: SubjectBrief;
  teacherName?: string | null;
  periodLabel?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  status?: string;
}

export interface ScheduleRow {
  periodLabel: string;
  startTime: string | null;
  endTime: string | null;
  cells: Record<number, SubjectScheduleLesson[]>;
}

/**
 * Group schedule lessons into a weekly grid: one row per lesson period
 * (ordered by start time), each row holding lessons keyed by weekday (1–7).
 * Pure + deterministic so it can be unit-tested without the network.
 */
export function buildWeekSchedule(lessons: SubjectScheduleLesson[]): ScheduleRow[] {
  const rows = new Map<string, ScheduleRow>();

  for (const lesson of lessons) {
    const key = lesson.periodLabel ?? lesson.startTime ?? "—";
    let row = rows.get(key);
    if (!row) {
      row = {
        periodLabel: lesson.periodLabel ?? "—",
        startTime: lesson.startTime ?? null,
        endTime: lesson.endTime ?? null,
        cells: {},
      };
      rows.set(key, row);
    }
    (row.cells[lesson.weekday] ??= []).push(lesson);
  }

  return Array.from(rows.values()).sort((a, b) =>
    (a.startTime ?? "").localeCompare(b.startTime ?? ""),
  );
}

const api = {
  list(query?: { search?: string; status?: SubjectStatus }): Promise<SubjectListResult> {
    return apiRequest<SubjectListResult>("/academic/subjects", { query });
  },
  overview(id: string): Promise<SubjectOverview> {
    return apiRequest<SubjectOverview>(`/academic/subjects/${id}/overview`);
  },
  schedule(id: string, teacherId?: string): Promise<SubjectScheduleLesson[]> {
    return apiRequest<SubjectScheduleLesson[]>(`/academic/subjects/${id}/schedule`, {
      query: { teacherId },
    });
  },
  create(input: SubjectInput): Promise<Subject> {
    return apiRequest<Subject>("/academic/subjects", { method: "POST", body: input });
  },
  update(id: string, input: Partial<SubjectInput>): Promise<Subject> {
    return apiRequest<Subject>(`/academic/subjects/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/academic/subjects/${id}`, { method: "DELETE" });
  },
};

const KEY = ["subjects"] as const;

export function useSubjectList(query?: { search?: string; status?: SubjectStatus }) {
  return useQuery({
    queryKey: [...KEY, query],
    queryFn: () => api.list(query),
    staleTime: 30_000,
  });
}

export function useSubjectOverview(id: string | null) {
  return useQuery({
    queryKey: [...KEY, "overview", id],
    queryFn: () => api.overview(id as string),
    enabled: Boolean(id),
  });
}

export function useSubjectSchedule(id: string | null, teacherId?: string) {
  return useQuery({
    queryKey: [...KEY, "schedule", id, teacherId ?? null],
    queryFn: () => api.schedule(id as string, teacherId),
    enabled: Boolean(id),
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SubjectInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<SubjectInput> }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
