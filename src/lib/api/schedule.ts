import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

// Mirrors the backend Dars jadvali endpoints (ScheduleController, /lms/lessons/*).

export interface ScheduleClassRef {
  id: string;
  name: string;
  gradeLevel: number;
  section: string;
  curatorName: string | null;
}

export interface ScheduleClasses {
  primary: ScheduleClassRef[];
  high: ScheduleClassRef[];
}

export interface SchedulePeriod {
  id: string;
  code: string;
  startTime: string;
  endTime: string;
  order: number;
}

export interface SubjectLegend {
  id: string;
  name: unknown;
  color: string;
}

export interface LessonCell {
  id: string;
  subjectId: string;
  subjectName: unknown;
  subjectColor: string | null;
  teacherId?: string | null;
  teacherName?: string | null;
  classId?: string;
  className?: string | null;
  roomId?: string | null;
  roomName?: string | null;
  courseId?: string | null;
  courseName?: string | null;
  isSubstituted: boolean;
}

export interface ScheduleGrid {
  quarterId: string;
  classId?: string;
  teacherId?: string;
  days: number[];
  periods: SchedulePeriod[];
  cells: Record<string, LessonCell>;
  subjects: SubjectLegend[];
}

/** Chorak ko'rinishi katagi — sanasi bilan, siqilmagan. */
export interface QuarterCell extends LessonCell {
  lessonDate: string;
  weekday: number;
}

export interface QuarterWeek {
  weekNumber: number;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  cells: Record<string, QuarterCell>;
}

export interface QuarterView {
  quarterId: string;
  classId: string | null;
  teacherId: string | null;
  startDate: string;
  endDate: string;
  days: number[];
  periods: SchedulePeriod[];
  weeks: QuarterWeek[];
  subjects: SubjectLegend[];
}

export interface ScheduleConflict {
  type: "teacher" | "room" | "class";
  weekday: number;
  lessonPeriodId: string;
  periodCode: string;
  entityName: string | null;
  classes?: string[];
  subjects?: unknown[];
}

export interface ScheduleConflictsResult {
  quarterId: string;
  total: number;
  conflicts: ScheduleConflict[];
}

export interface ScheduleHistoryItem {
  id: string;
  action: string;
  actorName: string | null;
  createdAt: string;
  details: Record<string, unknown> | null;
}

export type GenerateMode = "add" | "refresh";

export interface GenerateDistributionItem {
  classId: string;
  subjectId: string;
  teacherId?: string;
  roomId?: string;
  courseId?: string;
  hoursPerWeek: number;
}

export interface GeneratePayload {
  quarterId: string;
  mode: GenerateMode;
  days: number[];
  maxPerDay: number;
  maxPerSubjectPerDay: number;
  distribution: GenerateDistributionItem[];
}

export interface PreviewDistributionItem {
  classId: string;
  className: string | null;
  subjectId: string;
  subjectName: unknown;
  teacherId: string | null;
  teacherName: string | null;
  hoursPerWeek: number;
  status: "add" | "update";
}

export interface PreviewResult {
  days: number;
  maxPerDay: number;
  toCreate: number;
  toUpdate: number;
  distribution: PreviewDistributionItem[];
  valid: boolean;
  message: string | null;
}

export interface CreateCellPayload {
  quarterId: string;
  classId: string;
  lessonPeriodId: string;
  weekday: number;
  subjectId?: string;
  teacherId?: string;
  roomId?: string;
  courseId?: string;
  fromToday?: boolean;
}

export type EditScope = "single" | "future" | "all";

export interface UpdateCellPayload {
  subjectId?: string;
  teacherId?: string;
  roomId?: string;
  courseId?: string;
  /** Darsni boshqa sinfga ko'chirish. */
  classId?: string;
  /** Qamrov: single=shu kun, future=bugun+kelgusi, all=butun chorak. */
  scope?: EditScope;
}

export interface CellAvailability {
  lessonDate: string;
  lessonPeriodId: string;
  busyTeacherIds: string[];
  busyRoomIds: string[];
  busyClassIds: string[];
}

/** Jadval konflikti (409 SCHEDULE_CONFLICT javobidagi details). */
export interface ScheduleConflictDetail {
  type: "teacher" | "room" | "class";
  date: string;
  entityName: string | null;
  className: string | null;
}

export interface SubstitutePayload {
  quarterId: string;
  classId: string;
  subjectId: string;
  lessonPeriodId: string;
  weekday: number;
  substituteTeacherId: string;
  count: number;
}

export const cellKey = (weekday: number, periodId: string) => `${weekday}:${periodId}`;

/** Kun filtri bo'yicha ko'rinadigan kunlar ro'yxati. */
export function visibleDays(days: number[], filter: "all" | number): number[] {
  return filter === "all" ? days : days.filter((d) => d === filter);
}

const HISTORY_ACTIONS: Record<string, string> = {
  "lesson_schedule.cell_created": "sched.hist.created",
  "lesson_schedule.cell_updated": "sched.hist.updated",
  "lesson_schedule.cell_deleted": "sched.hist.deleted",
  "lesson_schedule.generated": "sched.hist.generated",
  "lesson_schedule.substituted": "sched.hist.substituted",
};

/** Audit amal kodini i18n kalitga moslaydi. */
export function historyActionKey(action: string): string {
  return HISTORY_ACTIONS[action] ?? "sched.hist.generic";
}

const GRID_KEY = ["schedule", "grid"] as const;

export interface ScheduleTeacher {
  id: string;
  fullName: string;
}

export function useScheduleTeachers() {
  return useQuery({
    queryKey: ["schedule", "teachers"],
    queryFn: () => apiRequest<{ items: ScheduleTeacher[] }>("/lms/lessons/teachers"),
    staleTime: 60_000,
  });
}

export function useScheduleClasses(quarterId?: string) {
  return useQuery({
    queryKey: ["schedule", "classes", quarterId],
    queryFn: () => apiRequest<ScheduleClasses>("/lms/lessons/classes", { query: { quarterId } }),
    enabled: Boolean(quarterId),
    staleTime: 60_000,
  });
}

export function useScheduleGrid(quarterId?: string, classId?: string) {
  return useQuery({
    queryKey: [...GRID_KEY, "class", quarterId, classId],
    queryFn: () =>
      apiRequest<ScheduleGrid>("/lms/lessons/grid", { query: { quarterId, classId } }),
    enabled: Boolean(quarterId && classId),
    placeholderData: keepPreviousData,
  });
}

export function useTeacherGrid(quarterId?: string, teacherId?: string) {
  return useQuery({
    queryKey: [...GRID_KEY, "teacher", quarterId, teacherId],
    queryFn: () =>
      apiRequest<ScheduleGrid>("/lms/lessons/grid/by-teacher", { query: { quarterId, teacherId } }),
    enabled: Boolean(quarterId && teacherId),
    placeholderData: keepPreviousData,
  });
}

export function useQuarterView(
  quarterId?: string,
  opts?: { classId?: string; teacherId?: string },
) {
  const classId = opts?.classId;
  const teacherId = opts?.teacherId;
  return useQuery({
    queryKey: [...GRID_KEY, "quarter", quarterId, classId, teacherId],
    queryFn: () =>
      apiRequest<QuarterView>("/lms/lessons/quarter-view", {
        query: { quarterId, classId, teacherId },
      }),
    enabled: Boolean(quarterId && (classId || teacherId)),
    placeholderData: keepPreviousData,
  });
}

export function useCellAvailability(
  quarterId?: string,
  lessonDate?: string,
  lessonPeriodId?: string,
  excludeId?: string,
) {
  return useQuery({
    queryKey: ["schedule", "availability", quarterId, lessonDate, lessonPeriodId, excludeId],
    queryFn: () =>
      apiRequest<CellAvailability>("/lms/lessons/availability", {
        query: { quarterId, lessonDate, lessonPeriodId, excludeId },
      }),
    enabled: Boolean(quarterId && lessonDate && lessonPeriodId),
    staleTime: 10_000,
  });
}

export function useScheduleConflicts(quarterId?: string, enabled = true) {
  return useQuery({
    queryKey: ["schedule", "conflicts", quarterId],
    queryFn: () =>
      apiRequest<ScheduleConflictsResult>("/lms/lessons/conflicts", { query: { quarterId } }),
    enabled: Boolean(quarterId) && enabled,
  });
}

export function useScheduleHistory(quarterId?: string, classId?: string, enabled = true) {
  return useQuery({
    queryKey: ["schedule", "history", quarterId, classId],
    queryFn: () =>
      apiRequest<{ items: ScheduleHistoryItem[] }>("/lms/lessons/history", {
        query: { quarterId, classId },
      }),
    enabled: Boolean(quarterId) && enabled,
  });
}

export function previewSchedule(payload: GeneratePayload): Promise<PreviewResult> {
  return apiRequest<PreviewResult>("/lms/lessons/generate/preview", {
    method: "POST",
    body: payload,
  });
}

function useGridInvalidation() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: GRID_KEY });
    qc.invalidateQueries({ queryKey: ["schedule", "conflicts"] });
    qc.invalidateQueries({ queryKey: ["schedule", "history"] });
  };
}

export function useCreateCell() {
  const invalidate = useGridInvalidation();
  return useMutation({
    mutationFn: (body: CreateCellPayload) =>
      apiRequest<{ created: number }>("/lms/lessons", { method: "POST", body }),
    onSuccess: invalidate,
  });
}

export function useUpdateCell() {
  const invalidate = useGridInvalidation();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateCellPayload }) =>
      apiRequest<{ updated: number }>(`/lms/lessons/${id}`, { method: "PATCH", body }),
    onSuccess: invalidate,
  });
}

export function useDeleteCell() {
  const invalidate = useGridInvalidation();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ deleted: number }>(`/lms/lessons/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

export function useSubstituteTeacher() {
  const invalidate = useGridInvalidation();
  return useMutation({
    mutationFn: (body: SubstitutePayload) =>
      apiRequest<{ substituted: number }>("/lms/lessons/substitute", { method: "POST", body }),
    onSuccess: invalidate,
  });
}

export function useGenerateSchedule() {
  const invalidate = useGridInvalidation();
  return useMutation({
    mutationFn: (body: GeneratePayload) =>
      apiRequest<{ created: number; updated: number; skipped: number }>("/lms/lessons/generate", {
        method: "POST",
        body,
      }),
    onSuccess: invalidate,
  });
}
