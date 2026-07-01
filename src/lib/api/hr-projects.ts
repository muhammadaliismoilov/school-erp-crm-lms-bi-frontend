import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export type ProjectStatus = "active" | "inactive";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface ProjectListResult {
  items: Project[];
  meta: PageMeta;
}

export interface ProjectListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProjectStatus;
}

export interface ProjectInput {
  name: string;
  description?: string | null;
  color?: string | null;
  status?: ProjectStatus;
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
  list(params: ProjectListParams): Promise<ProjectListResult> {
    return apiRequest<ProjectListResult>("/hr/projects", { query: cleanParams(params) });
  },
  create(input: ProjectInput): Promise<Project> {
    return apiRequest<Project>("/hr/projects", { method: "POST", body: input });
  },
  update(id: string, input: Partial<ProjectInput>): Promise<Project> {
    return apiRequest<Project>(`/hr/projects/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/hr/projects/${id}`, { method: "DELETE" });
  },
};

const KEY = ["hr", "projects"] as const;

export function useProjectList(params: ProjectListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProjectInput> }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Faol",
  inactive: "Faol emas",
};

export const PROJECT_STATUS_TONE: Record<ProjectStatus, "positive" | "negative"> = {
  active: "positive",
  inactive: "negative",
};

/** Rang tanlagichda ko'rsatiladigan tayyor palitra. */
export const PROJECT_COLOR_PRESETS = [
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
  "#64748b",
] as const;

export const PAGE_SIZES = [10, 20, 50, 100] as const;
