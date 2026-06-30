import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface WorkScheduleDay {
  weekday: Weekday;
  startTime: string | null;
  endTime: string | null;
  lunchStart: string | null;
  lunchEnd: string | null;
}

export interface WorkSchedule {
  id: string;
  name: string;
  description: string | null;
  isStandard: boolean;
  days: WorkScheduleDay[];
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface WorkScheduleListResult {
  items: WorkSchedule[];
  meta: PageMeta;
}

export interface WorkScheduleListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface WorkScheduleDayInput {
  weekday: Weekday;
  startTime?: string;
  endTime?: string;
  lunchStart?: string;
  lunchEnd?: string;
}

export interface WorkScheduleInput {
  name: string;
  description?: string;
  isStandard?: boolean;
  days?: WorkScheduleDayInput[];
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
  list(params: WorkScheduleListParams): Promise<WorkScheduleListResult> {
    return apiRequest<WorkScheduleListResult>("/hr/work-schedules", { query: cleanParams(params) });
  },
  create(input: WorkScheduleInput): Promise<WorkSchedule> {
    return apiRequest<WorkSchedule>("/hr/work-schedules", { method: "POST", body: input });
  },
  update(id: string, input: Partial<WorkScheduleInput>): Promise<WorkSchedule> {
    return apiRequest<WorkSchedule>(`/hr/work-schedules/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/hr/work-schedules/${id}`, { method: "DELETE" });
  },
};

const KEY = ["hr", "work-schedules"] as const;

export function useScheduleList(params: WorkScheduleListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: WorkScheduleInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<WorkScheduleInput> }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: "Dushanba",
  tuesday: "Seshanba",
  wednesday: "Chorshanba",
  thursday: "Payshanba",
  friday: "Juma",
  saturday: "Shanba",
  sunday: "Yakshanba",
};

export const WEEKDAY_ORDER: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const PAGE_SIZES = [10, 20, 50, 100] as const;
