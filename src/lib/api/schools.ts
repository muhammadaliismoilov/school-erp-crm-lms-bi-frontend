import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest, getActiveSchool } from "./client";

/** Mirrors backend enums in src/modules/schools/enums/school.enums.ts. */
export const SCHOOL_TYPES = ["general", "private", "specialized", "international"] as const;
export type SchoolType = (typeof SCHOOL_TYPES)[number];

export const PAYMENT_START_STRATEGIES = ["full_academic_year", "from_enrollment_date"] as const;
export type PaymentStartStrategy = (typeof PAYMENT_START_STRATEGIES)[number];

export const PAYMENT_PERIOD_UNITS = ["year", "month"] as const;
export type PaymentPeriodUnit = (typeof PAYMENT_PERIOD_UNITS)[number];

export const WORK_DAYS = ["five_days", "six_days", "seven_days"] as const;
export type WorkDays = (typeof WORK_DAYS)[number];

export const SCHOOL_STATUSES = ["active", "inactive", "archived"] as const;
export type SchoolStatus = (typeof SCHOOL_STATUSES)[number];

export interface GroupMonthlyPayment {
  groupName: string;
  amount: number;
}

export interface SchoolCapacities {
  total: number;
  elementary: number;
  upper: number;
}

export interface SchoolPayment {
  monthlyPayment: number;
  paymentStartStrategy: PaymentStartStrategy;
  paymentPeriodUnit: PaymentPeriodUnit;
  workDays: WorkDays;
  separateGroupPayments: boolean;
  groupMonthlyPayments: GroupMonthlyPayment[];
}

export interface School {
  id: string;
  name: string;
  legalName?: string | null;
  schoolType: SchoolType;
  country: string;
  region?: string | null;
  district?: string | null;
  address?: string | null;
  websiteUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  capacities: SchoolCapacities;
  payment: SchoolPayment;
  logoUrl?: string | null;
  logoFileId?: string | null;
  status: SchoolStatus;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
}

export interface SchoolStats {
  schoolCount: number;
  totalCapacity: number;
  monthlyPaymentTotal: number;
}

export interface SchoolListResult {
  stats: SchoolStats;
  items: School[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SchoolListParams {
  search?: string;
  schoolType?: SchoolType;
  status?: SchoolStatus;
  page?: number;
  limit?: number;
}

/** Matches CreateSchoolDto / UpdateSchoolDto on the backend. */
export interface SchoolInput {
  name: string;
  legalName?: string;
  country?: string;
  region?: string;
  district?: string;
  address?: string;
  websiteUrl?: string;
  schoolType: SchoolType;
  email?: string;
  phone?: string;
  monthlyPayment?: number;
  paymentStartStrategy?: PaymentStartStrategy;
  paymentPeriodUnit?: PaymentPeriodUnit;
  workDays?: WorkDays;
  separateGroupPayments?: boolean;
  groupMonthlyPayments?: GroupMonthlyPayment[];
  totalCapacity: number;
  elementaryCapacity: number;
  upperCapacity: number;
  logoFileId?: string;
  logoUrl?: string;
}

const schoolsApi = {
  list(params: SchoolListParams): Promise<SchoolListResult> {
    return apiRequest<SchoolListResult>("/schools", { query: { ...params } });
  },
  get(id: string): Promise<School> {
    return apiRequest<School>(`/schools/${id}`);
  },
  create(input: SchoolInput): Promise<School> {
    return apiRequest<School>("/schools", { method: "POST", body: input });
  },
  update(id: string, input: Partial<SchoolInput>): Promise<School> {
    return apiRequest<School>(`/schools/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/schools/${id}`, { method: "DELETE" });
  },
};

const SCHOOLS_KEY = ["schools"] as const;

export function useSchools(params: SchoolListParams) {
  return useQuery({
    queryKey: [...SCHOOLS_KEY, params],
    queryFn: () => schoolsApi.list(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useSchool(id: string | null) {
  return useQuery({
    queryKey: [...SCHOOLS_KEY, "detail", id],
    queryFn: () => schoolsApi.get(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SchoolInput) => schoolsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SCHOOLS_KEY });
      // Alohida kesh nomfazosi (`lib/api/hr-branches.ts`ning
      // `useSchoolOptions`) — foydalanuvchi shakllaridagi "Maktab"
      // tanlagichi shu yerdan o'qiydi. Shu yerda ham invalidatsiya
      // qilinmasa, yangi yaratilgan maktab o'sha tanlagichlarda darhol
      // ko'rinmay qoladi (masalan, "Maktab yaratish" ustasining
      // "direktor qo'shish" bosqichida).
      qc.invalidateQueries({ queryKey: ["hr", "schools", "options"] });
    },
  });
}

export function useUpdateSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<SchoolInput> }) =>
      schoolsApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: SCHOOLS_KEY }),
  });
}

export function useDeleteSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => schoolsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: SCHOOLS_KEY }),
  });
}

/** Maktab darajasida yoqib/o'chirib qo'yiladigan modullar (backend bilan bir xil). */
export type GatedModule = "integrations" | "branches";

export type SchoolModules = Record<GatedModule, boolean>;

const MODULES_KEY = ["schools", "modules"] as const;

/**
 * Aktiv maktabda qaysi modullar yoqilgan.
 *
 * `getActiveSchool()` kalitga kiritilgan: global CEO tanlagichdan maktab
 * almashtirsa, so'rov qaytadan bajariladi. Maktabga bog'langan foydalanuvchi
 * uchun kalit o'zgarmaydi.
 */
export function useEnabledModules() {
  return useQuery({
    queryKey: [...MODULES_KEY, "mine", getActiveSchool()],
    queryFn: () => apiRequest<SchoolModules>("/schools/modules/mine"),
    staleTime: 30_000,
  });
}

export function useSchoolModules(schoolId: string | null) {
  return useQuery({
    queryKey: [...MODULES_KEY, schoolId],
    queryFn: () => apiRequest<SchoolModules>(`/schools/${schoolId}/modules`),
    enabled: Boolean(schoolId),
    staleTime: 30_000,
  });
}

export function useSetSchoolModule(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { module: GatedModule; enabled: boolean }) =>
      apiRequest<SchoolModules>(`/schools/${schoolId}/modules`, {
        method: "PATCH",
        body: input,
      }),
    // Yon paneldagi bo'limlar ham darhol yangilansin.
    onSuccess: () => qc.invalidateQueries({ queryKey: MODULES_KEY }),
  });
}
