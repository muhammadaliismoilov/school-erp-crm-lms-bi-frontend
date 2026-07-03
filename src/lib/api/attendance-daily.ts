import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "./client";
import type { AttendanceStatus } from "./attendance-sessions";

// Backend: AttendanceController GET /attendance/daily.

export interface DailyBoardRow {
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string | null;
  status: AttendanceStatus;
  checkInTime: string | null;
  checkOutTime: string | null;
}

export interface DailyBoard {
  date: string;
  rows: DailyBoardRow[];
  summary: { arrived: number; inSchool: number; left: number };
}

export function useDailyBoard(date: string) {
  return useQuery({
    queryKey: ["attendance-daily", date],
    queryFn: () => apiRequest<DailyBoard>("/attendance/daily", { query: { date } }),
    enabled: Boolean(date),
    staleTime: 15_000,
  });
}
