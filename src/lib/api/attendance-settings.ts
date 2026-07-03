import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

// Backend: AttendanceSettingsController (/attendance/settings).

export interface AttendanceSettings {
  lateThresholdMinutes: number;
  correctionWindowMinutes: number;
  notifyOnEntry: boolean;
  notifyOnExit: boolean;
  notifyOnSession: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

const KEY = ["attendance-settings"] as const;

export function useAttendanceSettings() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => apiRequest<AttendanceSettings>("/attendance/settings"),
    staleTime: 60_000,
  });
}

export function useUpdateAttendanceSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<AttendanceSettings>) =>
      apiRequest<AttendanceSettings>("/attendance/settings", { method: "PUT", body: input }),
    onSuccess: (data) => qc.setQueryData(KEY, data),
  });
}
