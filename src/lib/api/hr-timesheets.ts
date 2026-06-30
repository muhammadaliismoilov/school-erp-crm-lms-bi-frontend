import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export type TimesheetStatus = "draft" | "submitted" | "approved";

export interface TimesheetLine {
  id: string;
  staffMemberId: string;
  staffName: string | null;
  workedDays: number;
  workedHours: number;
  note: string | null;
}

export interface Timesheet {
  id: string;
  year: number;
  month: number;
  departmentId: string | null;
  departmentName: string | null;
  status: TimesheetStatus;
  submittedAt: string | null;
  approvedAt: string | null;
  note: string | null;
  lines: TimesheetLine[];
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface TimesheetListResult {
  items: Timesheet[];
  meta: PageMeta;
}

export interface TimesheetListParams {
  page?: number;
  limit?: number;
  year?: number;
  month?: number;
  departmentId?: string;
  status?: TimesheetStatus;
}

export interface TimesheetLineInput {
  staffMemberId: string;
  workedDays?: number;
  workedHours?: number;
  note?: string;
}

export interface TimesheetInput {
  year: number;
  month: number;
  departmentId?: string;
  note?: string;
  lines?: TimesheetLineInput[];
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
  list(params: TimesheetListParams): Promise<TimesheetListResult> {
    return apiRequest<TimesheetListResult>("/hr/timesheets", { query: cleanParams(params) });
  },
  create(input: TimesheetInput): Promise<Timesheet> {
    return apiRequest<Timesheet>("/hr/timesheets", { method: "POST", body: input });
  },
  update(id: string, input: Partial<TimesheetInput>): Promise<Timesheet> {
    return apiRequest<Timesheet>(`/hr/timesheets/${id}`, { method: "PATCH", body: input });
  },
  submit(id: string): Promise<Timesheet> {
    return apiRequest<Timesheet>(`/hr/timesheets/${id}/submit`, { method: "PATCH" });
  },
  approve(id: string): Promise<Timesheet> {
    return apiRequest<Timesheet>(`/hr/timesheets/${id}/approve`, { method: "PATCH" });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/hr/timesheets/${id}`, { method: "DELETE" });
  },
};

const KEY = ["hr", "timesheets"] as const;

export function useTimesheetList(params: TimesheetListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
}

export function useCreateTimesheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TimesheetInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateTimesheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TimesheetInput> }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSubmitTimesheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.submit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useApproveTimesheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteTimesheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export const TIMESHEET_STATUS_LABELS: Record<TimesheetStatus, string> = {
  draft: "Qoralama",
  submitted: "Yuborilgan",
  approved: "Tasdiqlangan",
};

export const TIMESHEET_STATUS_TONE: Record<TimesheetStatus, "neutral" | "caution" | "positive"> = {
  draft: "neutral",
  submitted: "caution",
  approved: "positive",
};

export const MONTH_LABELS = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
];

export const PAGE_SIZES = [10, 20, 50, 100] as const;
