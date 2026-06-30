import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export const TASK_STATUSES = ["pending", "in_progress", "review", "done", "cancelled"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface Task {
  id: string;
  title: string;
  description: string | null;
  projectId: string | null;
  projectName: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface TaskListResult {
  items: Task[];
  meta: PageMeta;
}

export interface TaskListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  assigneeId?: string;
}

export interface TaskInput {
  title: string;
  description?: string;
  projectId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  startDate?: string;
  endDate?: string;
}

export interface ProjectOption {
  id: string;
  name: string;
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
  list(params: TaskListParams): Promise<TaskListResult> {
    return apiRequest<TaskListResult>("/hr/tasks", { query: cleanParams(params) });
  },
  create(input: TaskInput): Promise<Task> {
    return apiRequest<Task>("/hr/tasks", { method: "POST", body: input });
  },
  update(id: string, input: Partial<TaskInput>): Promise<Task> {
    return apiRequest<Task>(`/hr/tasks/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/hr/tasks/${id}`, { method: "DELETE" });
  },
  projectOptions(): Promise<ProjectOption[]> {
    return apiRequest<ProjectOption[]>("/hr/projects/options");
  },
};

const KEY = ["hr", "tasks"] as const;

export function useTasks(params: TaskListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
}

export function useProjectOptions() {
  return useQuery({
    queryKey: ["hr", "projects", "options"],
    queryFn: () => api.projectOptions(),
    staleTime: 5 * 60_000,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TaskInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TaskInput> }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Kutilmoqda",
  in_progress: "Jarayonda",
  review: "Ko‘rib chiqilmoqda",
  done: "Bajarildi",
  cancelled: "Bekor qilindi",
};

export const TASK_STATUS_TONE: Record<TaskStatus, "neutral" | "caution" | "accent" | "positive" | "negative"> = {
  pending: "caution",
  in_progress: "accent",
  review: "neutral",
  done: "positive",
  cancelled: "negative",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Past",
  medium: "O‘rta",
  high: "Yuqori",
  urgent: "Tezkor",
};

export const TASK_PRIORITY_TONE: Record<TaskPriority, "neutral" | "caution" | "negative"> = {
  low: "neutral",
  medium: "neutral",
  high: "caution",
  urgent: "negative",
};

export const PAGE_SIZES = [10, 20, 50, 100] as const;
