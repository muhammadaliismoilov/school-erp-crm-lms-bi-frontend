import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export type TeacherWorkType = "full" | "hourly";
export type TeacherDegree = "secondary_special" | "bachelor" | "master" | "phd" | "doctor";
export type TeacherEmploymentType = "primary" | "secondary";
export type TeacherStatus = "active" | "on_leave" | "dismissed";
export type TeacherCategory = "oliy" | "first" | "second" | "special";
export type TeacherGender = "male" | "female";

export interface Teacher {
  id: string;
  staffMemberId: string | null;
  firstName: string;
  lastName: string;
  middleName: string | null;
  fullName: string;
  gender: TeacherGender | null;
  birthDate: string | null;
  documentNumber: string | null;
  pinfl: string | null;
  phone: string | null;
  email: string | null;
  workType: TeacherWorkType;
  degree: TeacherDegree | null;
  employmentType: TeacherEmploymentType;
  status: TeacherStatus;
  category: TeacherCategory | null;
  experienceYears: number;
  ratePerLesson: number;
  startDate: string | null;
  endDate: string | null;
  isSubjectTeacher: boolean;
  isAssistantTeacher: boolean;
  isMbr: boolean;
  isExtraLesson: boolean;
  isClassLeader: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface TeacherListResult {
  items: Teacher[];
  meta: PageMeta;
}

export interface TeacherStats {
  total: number;
  active: number;
  fullTime: number;
  hourly: number;
  subjectTeachers: number;
}

export interface TeacherListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: TeacherCategory;
  workType?: TeacherWorkType;
  status?: TeacherStatus;
}

export interface TeacherInput {
  firstName: string;
  lastName: string;
  middleName?: string;
  gender?: TeacherGender;
  birthDate?: string;
  documentNumber?: string;
  pinfl?: string;
  phone?: string;
  email?: string;
  staffMemberId?: string;
  workType?: TeacherWorkType;
  degree?: TeacherDegree;
  employmentType?: TeacherEmploymentType;
  status?: TeacherStatus;
  category?: TeacherCategory;
  experienceYears?: number;
  ratePerLesson?: number;
  startDate?: string;
  endDate?: string;
  isSubjectTeacher?: boolean;
  isAssistantTeacher?: boolean;
  isMbr?: boolean;
  isExtraLesson?: boolean;
  isClassLeader?: boolean;
  note?: string;
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
  list(params: TeacherListParams): Promise<TeacherListResult> {
    return apiRequest<TeacherListResult>("/hr/teachers", { query: cleanParams(params) });
  },
  stats(): Promise<TeacherStats> {
    return apiRequest<TeacherStats>("/hr/teachers/stats");
  },
  create(input: TeacherInput): Promise<Teacher> {
    return apiRequest<Teacher>("/hr/teachers", { method: "POST", body: input });
  },
  update(id: string, input: Partial<TeacherInput>): Promise<Teacher> {
    return apiRequest<Teacher>(`/hr/teachers/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/hr/teachers/${id}`, { method: "DELETE" });
  },
};

const KEY = ["hr", "teachers"] as const;

export function useTeacherList(params: TeacherListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
}

export function useTeacherStats() {
  return useQuery({
    queryKey: [...KEY, "stats"],
    queryFn: () => api.stats(),
    staleTime: 20_000,
  });
}

export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TeacherInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TeacherInput> }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export const WORK_TYPE_LABELS: Record<TeacherWorkType, string> = {
  full: "To'liq",
  hourly: "Soatbay",
};

export const DEGREE_LABELS: Record<TeacherDegree, string> = {
  secondary_special: "O'rta maxsus",
  bachelor: "Bakalavr",
  master: "Magistr",
  phd: "Fan nomzodi (PhD)",
  doctor: "Fan doktori",
};

export const EMPLOYMENT_TYPE_LABELS: Record<TeacherEmploymentType, string> = {
  primary: "Asosiy",
  secondary: "O'rindosh",
};

export const TEACHER_STATUS_LABELS: Record<TeacherStatus, string> = {
  active: "Faol",
  on_leave: "Ta'tilda",
  dismissed: "Bo'shatilgan",
};

export const TEACHER_STATUS_TONE: Record<TeacherStatus, "positive" | "caution" | "negative"> = {
  active: "positive",
  on_leave: "caution",
  dismissed: "negative",
};

export const CATEGORY_LABELS: Record<TeacherCategory, string> = {
  oliy: "Oliy toifali",
  first: "1-toifa",
  second: "2-toifa",
  special: "Maxsus",
};

export const PAGE_SIZES = [10, 20, 50, 100] as const;
