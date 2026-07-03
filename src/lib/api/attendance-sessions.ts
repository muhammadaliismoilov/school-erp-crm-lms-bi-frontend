import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

// Backend: SessionAttendanceController + AttendanceAgendaService (/attendance-sessions/*).

export type AttendanceStatus = "present" | "absent" | "late" | "excused" | "left_early";
export type SessionStatus = "scheduled" | "open" | "confirmed" | "cancelled";
export type SessionType = "lesson" | "course";
export type AttendanceSource = "auto" | "manual";

export interface AgendaItem {
  slotId: string;
  sessionId: string | null;
  status: SessionStatus;
  sessionType: SessionType;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  startTime: string;
  endTime: string;
  counts: Record<AttendanceStatus, number> | null;
  total: number | null;
}

export interface ClassSession {
  id: string;
  slotId: string | null;
  date: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  sessionType: SessionType;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  confirmedByTeacherId: string | null;
  confirmedAt: string | null;
}

export interface RosterEntry {
  id: string;
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  minutesLate: number | null;
  source: AttendanceSource;
  note: string | null;
}

export interface OpenSessionResult {
  session: ClassSession;
  roster: RosterEntry[];
}

export interface AttendanceEntryInput {
  studentId: string;
  status: AttendanceStatus;
  minutesLate?: number;
  note?: string;
}

const api = {
  agenda(date: string, teacherId?: string): Promise<AgendaItem[]> {
    return apiRequest<AgendaItem[]>("/attendance-sessions/agenda", {
      query: { date, teacherId },
    });
  },
  open(slotId: string, date: string): Promise<OpenSessionResult> {
    return apiRequest<OpenSessionResult>("/attendance-sessions/open", {
      method: "POST",
      body: { slotId, date },
    });
  },
  roster(sessionId: string): Promise<RosterEntry[]> {
    return apiRequest<RosterEntry[]>(`/attendance-sessions/${sessionId}/roster`);
  },
  confirm(sessionId: string, entries: AttendanceEntryInput[]): Promise<{ session: ClassSession }> {
    return apiRequest<{ session: ClassSession }>(`/attendance-sessions/${sessionId}/confirm`, {
      method: "POST",
      body: { entries },
    });
  },
  correct(
    sessionId: string,
    studentId: string,
    input: { status: AttendanceStatus; minutesLate?: number; note?: string; reason?: string },
  ): Promise<{ attendance: RosterEntry }> {
    return apiRequest<{ attendance: RosterEntry }>(
      `/attendance-sessions/${sessionId}/students/${studentId}`,
      { method: "PATCH", body: input },
    );
  },
};

const KEY = ["attendance-sessions"] as const;

export function useAgenda(date: string, teacherId?: string) {
  return useQuery({
    queryKey: [...KEY, "agenda", date, teacherId ?? null],
    queryFn: () => api.agenda(date, teacherId),
    enabled: Boolean(date),
    staleTime: 15_000,
  });
}

export function useSessionRoster(sessionId: string | null) {
  return useQuery({
    queryKey: [...KEY, "roster", sessionId],
    queryFn: () => api.roster(sessionId as string),
    enabled: Boolean(sessionId),
    staleTime: 10_000,
  });
}

export function useOpenSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slotId, date }: { slotId: string; date: string }) => api.open(slotId, date),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, "agenda"] }),
  });
}

export function useConfirmSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, entries }: { sessionId: string; entries: AttendanceEntryInput[] }) =>
      api.confirm(sessionId, entries),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCorrectAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      studentId,
      input,
    }: {
      sessionId: string;
      studentId: string;
      input: { status: AttendanceStatus; minutesLate?: number; note?: string; reason?: string };
    }) => api.correct(sessionId, studentId, input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [...KEY, "roster", vars.sessionId] });
      qc.invalidateQueries({ queryKey: [...KEY, "agenda"] });
    },
  });
}
