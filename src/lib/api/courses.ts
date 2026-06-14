import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

export interface CourseBrief {
  id: string;
  name: string;
}

export interface CourseQuarterBrief {
  id: string;
  quarterNumber: number;
  name: string;
  startDate: string;
  endDate: string;
}

export interface CourseRoomBrief {
  id: string;
  roomNumber: string;
  floor: number;
  label: string;
}

export interface CourseSubjectBrief {
  id: string;
  name: string;
  color: string;
}

export interface CourseTeacherBrief {
  id: string;
  fullName: string;
  phone?: string | null;
}

export interface CourseStats {
  plannedLessonCount: number;
  completedLessonCount: number;
  studentCount: number;
  averageGrade?: number | null;
}

export interface Course {
  id: string;
  name: string;
  quarter: CourseQuarterBrief;
  startDate: string;
  endDate: string;
  room: CourseRoomBrief;
  description?: string | null;
  subject: CourseSubjectBrief;
  teacher: CourseTeacherBrief;
  stats: CourseStats;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
}

export interface CourseStudentRow {
  id: string;
  fullName: string;
  studentCode?: string | null;
  gender?: string | null;
  className?: string | null;
}

export interface CourseDetail extends Course {
  students: CourseStudentRow[];
}

export interface CourseListStats {
  totalCourses: number;
  totalStudents: number;
  totalTeachers: number;
  plannedLessons: number;
  completedLessons: number;
}

export interface CourseListResult {
  items: Course[];
  stats: CourseListStats;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CourseFilters {
  search?: string;
  quarterNumber?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CourseInput {
  name: string;
  quarterId: string;
  startDate: string;
  endDate: string;
  roomId: string;
  subjectId: string;
  teacherId: string;
  description?: string;
  plannedLessonCount?: number;
}

/**
 * Turn the page's filter state into the API query, dropping empty values so
 * the request stays clean. Pure + deterministic for unit testing.
 */
export function buildCourseQuery(filters: CourseFilters): Record<string, string | number> {
  const query: Record<string, string | number> = {};
  if (filters.search && filters.search.trim()) query.search = filters.search.trim();
  if (filters.quarterNumber) query.quarterNumber = filters.quarterNumber;
  if (filters.startDate) query.startDate = filters.startDate;
  if (filters.endDate) query.endDate = filters.endDate;
  query.page = filters.page && filters.page > 0 ? filters.page : 1;
  if (filters.limit) query.limit = filters.limit;
  return query;
}

const api = {
  list(filters: CourseFilters): Promise<CourseListResult> {
    return apiRequest<CourseListResult>("/academic/courses", { query: buildCourseQuery(filters) });
  },
  get(id: string): Promise<CourseDetail> {
    return apiRequest<CourseDetail>(`/academic/courses/${id}`);
  },
  create(input: CourseInput): Promise<Course> {
    return apiRequest<Course>("/academic/courses", { method: "POST", body: input });
  },
  update(id: string, input: Partial<CourseInput>): Promise<Course> {
    return apiRequest<Course>(`/academic/courses/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/academic/courses/${id}`, { method: "DELETE" });
  },
  availableStudents(id: string, query: { classId?: string; search?: string }): Promise<CourseStudentRow[]> {
    return apiRequest<CourseStudentRow[]>(`/academic/courses/${id}/available-students`, { query });
  },
  addStudents(id: string, studentIds: string[]): Promise<CourseDetail> {
    return apiRequest<CourseDetail>(`/academic/courses/${id}/students`, {
      method: "POST",
      body: { studentIds },
    });
  },
  removeStudent(id: string, studentId: string): Promise<CourseDetail> {
    return apiRequest<CourseDetail>(`/academic/courses/${id}/students/${studentId}`, {
      method: "DELETE",
    });
  },
};

const KEY = ["courses"] as const;

export function useCourseList(filters: CourseFilters) {
  return useQuery({
    queryKey: [...KEY, filters],
    queryFn: () => api.list(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useCourse(id: string | null) {
  return useQuery({
    queryKey: [...KEY, "detail", id],
    queryFn: () => api.get(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CourseInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CourseInput> }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAvailableCourseStudents(id: string | null, query: { classId?: string; search?: string }) {
  return useQuery({
    queryKey: [...KEY, "available", id, query],
    queryFn: () => api.availableStudents(id as string, query),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  });
}

export function useAddCourseStudents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, studentIds }: { id: string; studentIds: string[] }) => api.addStudents(id, studentIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRemoveCourseStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, studentId }: { id: string; studentId: string }) => api.removeStudent(id, studentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
