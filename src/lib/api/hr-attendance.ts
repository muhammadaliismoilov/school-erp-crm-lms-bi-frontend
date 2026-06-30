import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export const ATTENDANCE_ACTIONS = ["check_in", "check_out"] as const;
export type AttendanceAction = (typeof ATTENDANCE_ACTIONS)[number];

export const ATTENDANCE_STATUSES = ["pending", "approved", "rejected"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export interface AttendanceRecord {
  id: string;
  staffMemberId: string;
  staffName: string | null;
  action: AttendanceAction;
  recordedAt: string;
  latitude: number | null;
  longitude: number | null;
  geofenceId: string | null;
  geofenceName: string | null;
  deviceInfo: string | null;
  status: AttendanceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface AttendanceListResult {
  items: AttendanceRecord[];
  meta: PageMeta;
}

export interface AttendanceListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: AttendanceStatus;
  action?: AttendanceAction;
  staffMemberId?: string;
}

export interface AttendanceInput {
  staffMemberId: string;
  action: AttendanceAction;
  recordedAt?: string;
  latitude?: number;
  longitude?: number;
  geofenceId?: string;
  deviceInfo?: string;
  status?: AttendanceStatus;
}

export interface GeofenceOption {
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
  list(params: AttendanceListParams): Promise<AttendanceListResult> {
    return apiRequest<AttendanceListResult>("/hr/attendance", { query: cleanParams(params) });
  },
  create(input: AttendanceInput): Promise<AttendanceRecord> {
    return apiRequest<AttendanceRecord>("/hr/attendance", { method: "POST", body: input });
  },
  update(id: string, input: Partial<AttendanceInput>): Promise<AttendanceRecord> {
    return apiRequest<AttendanceRecord>(`/hr/attendance/${id}`, { method: "PATCH", body: input });
  },
  review(id: string, status: Extract<AttendanceStatus, "approved" | "rejected">): Promise<AttendanceRecord> {
    return apiRequest<AttendanceRecord>(`/hr/attendance/${id}/review`, { method: "PATCH", body: { status } });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/hr/attendance/${id}`, { method: "DELETE" });
  },
  geofenceOptions(): Promise<GeofenceOption[]> {
    return apiRequest<GeofenceOption[]>("/hr/geofences/options");
  },
};

const KEY = ["hr", "attendance"] as const;

export function useAttendance(params: AttendanceListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
}

export function useGeofenceOptions() {
  return useQuery({
    queryKey: ["hr", "geofences", "options"],
    queryFn: () => api.geofenceOptions(),
    staleTime: 5 * 60_000,
  });
}

export function useCreateAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AttendanceInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useReviewAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) => api.review(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  pending: "Kutilmoqda",
  approved: "Tasdiqlangan",
  rejected: "Rad etilgan",
};

export const ATTENDANCE_STATUS_TONE: Record<AttendanceStatus, "caution" | "positive" | "negative"> = {
  pending: "caution",
  approved: "positive",
  rejected: "negative",
};

export const ATTENDANCE_ACTION_LABELS: Record<AttendanceAction, string> = {
  check_in: "Kirish",
  check_out: "Chiqish",
};

export const PAGE_SIZES = [10, 20, 50, 100] as const;
