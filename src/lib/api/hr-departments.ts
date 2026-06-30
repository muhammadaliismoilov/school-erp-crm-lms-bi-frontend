import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export type DepartmentStatus = "active" | "inactive";

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  schoolId: string | null;
  schoolName: string | null;
  filialId: string | null;
  filialLabel: string | null;
  ownerLabel: string | null;
  parentId: string | null;
  parentName: string | null;
  telegramChatId: string | null;
  status: DepartmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface DepartmentListResult {
  items: Department[];
  meta: PageMeta;
}

export interface DepartmentListParams {
  page?: number;
  limit?: number;
  search?: string;
  filialId?: string;
  status?: DepartmentStatus;
}

export interface DepartmentInput {
  name: string;
  description?: string;
  schoolId?: string;
  filialId?: string;
  parentId?: string;
  telegramChatId?: string;
  status?: DepartmentStatus;
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
  list(params: DepartmentListParams): Promise<DepartmentListResult> {
    return apiRequest<DepartmentListResult>("/hr/departments", { query: cleanParams(params) });
  },
  create(input: DepartmentInput): Promise<Department> {
    return apiRequest<Department>("/hr/departments", { method: "POST", body: input });
  },
  update(id: string, input: Partial<DepartmentInput>): Promise<Department> {
    return apiRequest<Department>(`/hr/departments/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/hr/departments/${id}`, { method: "DELETE" });
  },
};

const KEY = ["hr", "departments"] as const;

export function useDepartmentList(params: DepartmentListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DepartmentInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<DepartmentInput> }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export const DEPARTMENT_STATUS_LABELS: Record<DepartmentStatus, string> = {
  active: "Faol",
  inactive: "Faol emas",
};

export const DEPARTMENT_STATUS_TONE: Record<DepartmentStatus, "positive" | "negative"> = {
  active: "positive",
  inactive: "negative",
};

export const PAGE_SIZES = [10, 20, 50, 100] as const;
