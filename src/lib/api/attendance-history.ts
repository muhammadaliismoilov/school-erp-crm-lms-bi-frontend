import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "./client";
import type { AttendanceStatus, SessionType } from "./attendance-sessions";

// Backend: GET /attendance-sessions/student/:id/history.

export interface HistorySessionItem {
  subjectName: string;
  sessionType: SessionType;
  startTime: string;
  status: AttendanceStatus;
  minutesLate: number | null;
}

export interface HistoryDay {
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  dailyStatus: AttendanceStatus | null;
  sessions: HistorySessionItem[];
}

export function useStudentHistory(studentId: string, from: string, to: string) {
  return useQuery({
    queryKey: ["attendance-history", studentId, from, to],
    queryFn: () =>
      apiRequest<HistoryDay[]>(`/attendance-sessions/student/${studentId}/history`, {
        query: { from, to },
      }),
    enabled: Boolean(studentId && from && to),
    staleTime: 30_000,
  });
}
