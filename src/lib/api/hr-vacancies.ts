import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export type VacancyStatus = "open" | "closed" | "draft" | "pending";

export interface Vacancy {
  id: string;
  title: string;
  status: VacancyStatus;
  departmentId: string | null;
  departmentName: string | null;
  positionId: string | null;
  positionTitle: string | null;
  recruiterId: string | null;
  recruiterName: string | null;
  minSalary: number | null;
  maxSalary: number | null;
  responsibilities: string | null;
  requirements: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface VacancyListResult {
  items: Vacancy[];
  meta: PageMeta;
}

export interface VacancyListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: VacancyStatus;
  departmentId?: string;
}

export interface VacancyInput {
  title: string;
  status?: VacancyStatus;
  departmentId?: string;
  positionId?: string;
  recruiterId?: string;
  minSalary?: number;
  maxSalary?: number;
  responsibilities?: string;
  requirements?: string;
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
  list(params: VacancyListParams): Promise<VacancyListResult> {
    return apiRequest<VacancyListResult>("/hr/vacancies", { query: cleanParams(params) });
  },
  create(input: VacancyInput): Promise<Vacancy> {
    return apiRequest<Vacancy>("/hr/vacancies", { method: "POST", body: input });
  },
  update(id: string, input: Partial<VacancyInput>): Promise<Vacancy> {
    return apiRequest<Vacancy>(`/hr/vacancies/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/hr/vacancies/${id}`, { method: "DELETE" });
  },
};

const KEY = ["hr", "vacancies"] as const;

export function useVacancyList(params: VacancyListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
}

export function useCreateVacancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: VacancyInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateVacancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<VacancyInput> }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteVacancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export const VACANCY_STATUS_LABELS: Record<VacancyStatus, string> = {
  open: "Ochiq",
  closed: "Yopiq",
  draft: "Qoralama",
  pending: "Kutishda",
};

export const VACANCY_STATUS_TONE: Record<VacancyStatus, "positive" | "negative" | "neutral" | "caution"> = {
  open: "positive",
  closed: "negative",
  draft: "neutral",
  pending: "caution",
};

export const PAGE_SIZES = [10, 20, 50, 100] as const;
