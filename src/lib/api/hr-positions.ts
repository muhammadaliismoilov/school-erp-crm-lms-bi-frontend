import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export type PositionStatus = "active" | "inactive";

export interface Position {
  id: string;
  title: string;
  code: string;
  description: string | null;
  baseSalary: number;
  departmentId: string | null;
  departmentName: string | null;
  schoolId: string | null;
  schoolName: string | null;
  filialId: string | null;
  filialLabel: string | null;
  ownerLabel: string | null;
  status: PositionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface PositionListResult {
  items: Position[];
  meta: PageMeta;
}

export interface PositionListParams {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  filialId?: string;
  status?: PositionStatus;
}

export interface PositionInput {
  title: string;
  description?: string;
  baseSalary?: number;
  departmentId?: string;
  schoolId?: string;
  filialId?: string;
  status?: PositionStatus;
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
  list(params: PositionListParams): Promise<PositionListResult> {
    return apiRequest<PositionListResult>("/hr/positions", { query: cleanParams(params) });
  },
  create(input: PositionInput): Promise<Position> {
    return apiRequest<Position>("/hr/positions", { method: "POST", body: input });
  },
  update(id: string, input: Partial<PositionInput>): Promise<Position> {
    return apiRequest<Position>(`/hr/positions/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/hr/positions/${id}`, { method: "DELETE" });
  },
};

const KEY = ["hr", "positions"] as const;

export function usePositionList(params: PositionListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
}

export function useCreatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PositionInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PositionInput> }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeletePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export const POSITION_STATUS_LABELS: Record<PositionStatus, string> = {
  active: "Faol",
  inactive: "Faol emas",
};

export const POSITION_STATUS_TONE: Record<PositionStatus, "positive" | "negative"> = {
  active: "positive",
  inactive: "negative",
};

export const PAGE_SIZES = [10, 20, 50, 100] as const;
