import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";
import type { Page } from "./types";

export type Gender = "male" | "female" | "other";
export type StudentLanguage = "uz" | "ru" | "en";
export type StudentStatus =
  | "applicant"
  | "active"
  | "transferred"
  | "graduated"
  | "withdrawn";

export interface ClassBrief {
  id: string;
  name: string;
  gradeLevel: number;
  section: string;
}

export interface ParentBrief {
  id: string;
  firstName: string;
  lastName?: string | null;
  phone: string;
  email?: string | null;
}

export interface StudentParentLink {
  id: string;
  relation: string;
  isPrimary: boolean;
  parent: ParentBrief;
}

export interface ExtraDocuments {
  tabelGuvohnoma?: boolean;
  passportNusxa?: boolean;
  tibbiyDaftarcha?: boolean;
  rasmlar?: boolean;
  baholarVaraqasi?: boolean;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  studentCode: string;
  birthDate?: string | null;
  gender?: Gender | null;
  preferredLanguage?: StudentLanguage;
  photoUrl?: string | null;
  status?: StudentStatus | null;
  nationalId?: string | null;
  currentClassId?: string | null;
  currentClass?: ClassBrief | null;
  contractNumber?: string | null;
  discountPercent?: number | string;
  monthlyFee?: number | string;
  discountType?: "percent" | "amount";
  discountValue?: number | string;
  billingStartDate?: string | null;
  paymentPlan?: "yearly_1x" | "split_2" | "split_3" | "monthly" | null;
  planDiscountOverrideType?: "percent" | "amount" | null;
  planDiscountOverrideValue?: number | string | null;
  region?: string | null;
  district?: string | null;
  address?: string | null;
  personalPhone?: string | null;
  interests?: string[];
  extraDocuments?: ExtraDocuments;
  parents?: StudentParentLink[];
  withdrawalReason?: string | null;
  deletedAt?: string | null;
  createdAt: string;
}

export interface StudentStats {
  total: number;
  male: number;
  female: number;
  newThisMonth: number;
}

export interface DepartedStats {
  total: number;
  male: number;
  female: number;
}

export interface DepartedListParams {
  page?: number;
  limit?: number;
  search?: string;
  gender?: Gender;
  classId?: string;
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  gender?: Gender;
  classId?: string;
  status?: StudentStatus;
}

export interface StudentInput {
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate?: string;
  gender?: Gender;
  preferredLanguage?: StudentLanguage;
  nationalId?: string;
  photoUrl?: string;
  studentCode?: string;
  currentClassId?: string;
  contractNumber?: string;
  status?: StudentStatus;
  discountPercent?: number;
  monthlyFee?: number;
  discountType?: "percent" | "amount";
  discountValue?: number;
  billingStartDate?: string;
  paymentPlan?: "yearly_1x" | "split_2" | "split_3" | "monthly";
  planDiscountOverrideType?: "percent" | "amount" | null;
  planDiscountOverrideValue?: number | null;
  region?: string;
  district?: string;
  address?: string;
  personalPhone?: string;
  interests?: string[];
  extraDocuments?: ExtraDocuments;
  guardianFullName?: string;
  guardianRelation?: string;
  guardianPhone?: string;
}

/** Backwards-compatible alias used by older callers. */
export type CreateStudentInput = StudentInput;

const studentsApi = {
  list(params: ListParams): Promise<Page<Student>> {
    return apiRequest<Page<Student>>("/students", { query: { ...params } });
  },
  stats(): Promise<StudentStats> {
    return apiRequest<StudentStats>("/students/stats");
  },
  get(id: string): Promise<Student> {
    return apiRequest<Student>(`/students/${id}`);
  },
  create(input: StudentInput): Promise<Student> {
    return apiRequest<Student>("/students", { method: "POST", body: input });
  },
  update(id: string, input: Partial<StudentInput>): Promise<Student> {
    return apiRequest<Student>(`/students/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string, reason?: string): Promise<{ id: string }> {
    return apiRequest<{ id: string }>(`/students/${id}`, {
      method: "DELETE",
      body: reason ? { reason } : undefined,
    });
  },
  departedList(params: DepartedListParams): Promise<Page<Student>> {
    return apiRequest<Page<Student>>("/students/departed", { query: { ...params } });
  },
  departedStats(): Promise<DepartedStats> {
    return apiRequest<DepartedStats>("/students/departed/stats");
  },
  restore(id: string): Promise<{ id: string }> {
    return apiRequest<{ id: string }>(`/students/${id}/restore`, { method: "POST" });
  },
  permanentRemove(id: string): Promise<{ id: string }> {
    return apiRequest<{ id: string }>(`/students/${id}/permanent`, { method: "DELETE" });
  },
};

const LIST_KEY = ["students"] as const;

export function useStudents(params: ListParams) {
  return useQuery({
    queryKey: [...LIST_KEY, params],
    queryFn: () => studentsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useStudentStats() {
  return useQuery({
    queryKey: [...LIST_KEY, "stats"],
    queryFn: () => studentsApi.stats(),
    staleTime: 30_000,
  });
}

export function useStudent(id: string | null) {
  return useQuery({
    queryKey: [...LIST_KEY, "detail", id],
    queryFn: () => studentsApi.get(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StudentInput) => studentsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<StudentInput> }) =>
      studentsApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      studentsApi.remove(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  });
}

// ----------------------------------------------------------------- Ketgan o‘quvchilar

const DEPARTED_KEY = ["students", "departed"] as const;

export function useDepartedStudents(params: DepartedListParams) {
  return useQuery({
    queryKey: [...DEPARTED_KEY, params],
    queryFn: () => studentsApi.departedList(params),
    placeholderData: keepPreviousData,
  });
}

export function useDepartedStats() {
  return useQuery({
    queryKey: [...DEPARTED_KEY, "stats"],
    queryFn: () => studentsApi.departedStats(),
    staleTime: 30_000,
  });
}

export function useRestoreStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentsApi.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  });
}

export function usePermanentRemoveStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentsApi.permanentRemove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: DEPARTED_KEY }),
  });
}

// ----------------------------------------------------------------- Helpers

export function classLabel(cls?: ClassBrief | null): string | null {
  if (!cls) return null;
  return `${cls.gradeLevel}-${cls.section}`;
}

export function primaryParent(student: Student): ParentBrief | null {
  const links = student.parents ?? [];
  const primary = links.find((l) => l.isPrimary) ?? links[0];
  return primary?.parent ?? null;
}

export function fullName(student: Pick<Student, "firstName" | "lastName" | "middleName">): string {
  return [student.lastName, student.firstName, student.middleName]
    .filter(Boolean)
    .join(" ");
}

export function initials(student: Pick<Student, "firstName" | "lastName">): string {
  return `${student.firstName?.[0] ?? ""}${student.lastName?.[0] ?? ""}`.toUpperCase();
}
