import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export const EMPLOYMENT_STATUSES = ["active", "on_leave", "dismissed"] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

export type Gender = "male" | "female";

/** O'qituvchi malaka toifasi (past→yuqori). */
export const QUALIFICATION_CATEGORIES = ["mutaxassis", "ikkinchi", "birinchi", "oliy"] as const;
export type QualificationCategory = (typeof QUALIFICATION_CATEGORIES)[number];

export const QUALIFICATION_LABELS: Record<QualificationCategory, string> = {
  mutaxassis: "Mutaxassis (toifasiz)",
  ikkinchi: "Ikkinchi toifa",
  birinchi: "Birinchi toifa",
  oliy: "Oliy toifa",
};

/** Toifaga mos rasmiy lavozim nomi (formada taklif uchun). */
export const QUALIFICATION_POSITION: Record<QualificationCategory, string> = {
  mutaxassis: "O‘qituvchi",
  ikkinchi: "Katta o‘qituvchi",
  birinchi: "Yetakchi o‘qituvchi",
  oliy: "Bosh o‘qituvchi",
};

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface Position {
  id: string;
  title: string;
  code: string;
  baseSalary: number;
}

export interface StaffMember {
  id: string;
  employeeCode: string;
  userId: string | null;
  firstName: string;
  firstNameCyrillic: string | null;
  lastName: string;
  lastNameCyrillic: string | null;
  middleName: string | null;
  middleNameCyrillic: string | null;
  gender: Gender | null;
  birthDate: string | null;
  passportSeries: string | null;
  pinfl: string | null;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  departmentId: string | null;
  department: Department | null;
  positionId: string | null;
  position: Position | null;
  hireDate: string;
  status: EmploymentStatus;
  salary: number;
  qualificationCategory: QualificationCategory | null;
  qualificationDate: string | null;
  createdAt: string;
  /** Bog'langan o'qituvchilik yozuvi (faqat ro'yxat so'rovida to'ldiriladi) — 🎓 belgisi uchun. */
  teacher?: { id: string } | null;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface StaffListResult {
  items: StaffMember[];
  meta: PageMeta;
}

export interface StaffListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: EmploymentStatus;
  departmentId?: string;
  positionId?: string;
}

export interface StaffInput {
  firstName: string;
  firstNameCyrillic?: string;
  lastName: string;
  lastNameCyrillic?: string;
  middleName?: string;
  middleNameCyrillic?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  gender?: Gender;
  birthDate?: string;
  passportSeries?: string;
  pinfl?: string;
  departmentId?: string;
  positionId?: string;
  hireDate: string;
  status?: EmploymentStatus;
  salary?: number;
  qualificationCategory?: QualificationCategory | "";
  qualificationDate?: string;
  roleName?: string;
  salaryChangeReason?: string;
}

export interface CreatedStaffResult {
  staff: StaffMember;
  credentials: { username: string; password: string } | null;
}

export interface SalaryHistoryEntry {
  id: string;
  oldSalary: number | null;
  newSalary: number;
  reason: string | null;
  changedByName: string | null;
  createdAt: string;
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
  listStaff(params: StaffListParams): Promise<StaffListResult> {
    return apiRequest<StaffListResult>("/hr/staff", { query: cleanParams(params) });
  },
  createStaff(input: StaffInput): Promise<CreatedStaffResult> {
    return apiRequest<CreatedStaffResult>("/hr/staff", { method: "POST", body: input });
  },
  getStaff(id: string): Promise<StaffMember> {
    return apiRequest<StaffMember>(`/hr/staff/${id}`);
  },
  updateStaff(id: string, input: Partial<StaffInput>): Promise<StaffMember> {
    return apiRequest<StaffMember>(`/hr/staff/${id}`, { method: "PATCH", body: input });
  },
  removeStaff(id: string): Promise<void> {
    return apiRequest<void>(`/hr/staff/${id}`, { method: "DELETE" });
  },
  salaryHistory(id: string): Promise<SalaryHistoryEntry[]> {
    return apiRequest<SalaryHistoryEntry[]>(`/hr/staff/${id}/salary-history`);
  },
  departments(): Promise<Department[]> {
    // /hr/departments endi sahifalangan ({items, meta}) qaytaradi — dropdown
    // uchun yuqori limit bilan so'rab, faqat ro'yxatni qaytaramiz.
    return apiRequest<{ items: Department[] }>("/hr/departments", {
      query: { limit: 100 },
    }).then((r) => r.items ?? []);
  },
  positions(): Promise<Position[]> {
    // /hr/positions endi sahifalangan ({items, meta}) qaytaradi — dropdown uchun
    // yuqori limit bilan so'rab, faqat ro'yxatni qaytaramiz.
    return apiRequest<{ items: Position[] }>("/hr/positions", {
      query: { limit: 100 },
    }).then((r) => r.items ?? []);
  },
};

const STAFF_KEY = ["hr", "staff"] as const;

export function useStaff(params: StaffListParams) {
  return useQuery({
    queryKey: [...STAFF_KEY, "list", params],
    queryFn: () => api.listStaff(params),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
}

export function useStaffMember(id: string | null) {
  return useQuery({
    queryKey: [...STAFF_KEY, "detail", id],
    queryFn: () => api.getStaff(id as string),
    enabled: !!id,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StaffInput) => api.createStaff(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: STAFF_KEY }),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<StaffInput> }) => api.updateStaff(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: STAFF_KEY }),
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.removeStaff(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: STAFF_KEY }),
  });
}

export function useSalaryHistory(id: string | null) {
  return useQuery({
    queryKey: [...STAFF_KEY, "salary-history", id],
    queryFn: () => api.salaryHistory(id as string),
    enabled: !!id,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ["hr", "departments"],
    queryFn: () => api.departments(),
    staleTime: 5 * 60_000,
  });
}

export function usePositions() {
  return useQuery({
    queryKey: ["hr", "positions"],
    queryFn: () => api.positions(),
    staleTime: 5 * 60_000,
  });
}

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  active: "Faol",
  on_leave: "Ta'tilda",
  dismissed: "Faol emas",
};

export const EMPLOYMENT_STATUS_TONE: Record<EmploymentStatus, "positive" | "caution" | "negative"> = {
  active: "positive",
  on_leave: "caution",
  dismissed: "negative",
};

export const GENDER_LABELS: Record<Gender, string> = {
  male: "Erkak",
  female: "Ayol",
};

export const PAGE_SIZES = [10, 20, 50, 100] as const;
