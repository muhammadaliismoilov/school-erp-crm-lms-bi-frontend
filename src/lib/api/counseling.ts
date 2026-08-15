import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

/** Mirrors backend `SESSION_TYPES`. */
export const COUNSELING_SESSION_TYPES = ["individual", "group", "assessment", "follow_up"] as const;
export type CounselingSessionType = (typeof COUNSELING_SESSION_TYPES)[number];

export const COUNSELING_SESSION_TYPE_LABELS: Record<CounselingSessionType, string> = {
  individual: "Individual",
  group: "Guruhiy",
  assessment: "Baholash",
  follow_up: "Kuzatuv",
};

/** Mirrors backend `RISK_LEVELS`. */
export const COUNSELING_RISK_LEVELS = ["low", "medium", "high"] as const;
export type CounselingRiskLevel = (typeof COUNSELING_RISK_LEVELS)[number];

export const COUNSELING_RISK_LABELS: Record<CounselingRiskLevel, string> = {
  low: "Past",
  medium: "O'rta",
  high: "Yuqori",
};

/** Mirrors backend `CounselingSessionSummary` — ro'yxat uchun, izohsiz. */
export interface CounselingSessionSummary {
  id: string;
  studentId: string;
  studentName: string | null;
  counselorId: string;
  counselorName: string | null;
  sessionDate: string;
  sessionType: string;
  riskLevel: CounselingRiskLevel | null;
  followUpDate: string | null;
  createdAt: string;
}

/** Mirrors backend `CounselingSessionDetail` — faqat bitta yozuv ochilganda. */
export interface CounselingSessionDetail extends CounselingSessionSummary {
  notes: string;
}

export interface CreateCounselingSessionInput {
  studentId: string;
  counselorId: string;
  sessionDate: string;
  sessionType: CounselingSessionType;
  notes: string;
  riskLevel?: CounselingRiskLevel;
  followUpDate?: string;
}

export type UpdateCounselingSessionInput = Partial<CreateCounselingSessionInput>;

const api = {
  list(): Promise<CounselingSessionSummary[]> {
    return apiRequest<CounselingSessionSummary[]>("/counseling/sessions");
  },
  listByStudent(studentId: string): Promise<CounselingSessionSummary[]> {
    return apiRequest<CounselingSessionSummary[]>(`/counseling/students/${studentId}/sessions`);
  },
  get(id: string): Promise<CounselingSessionDetail> {
    return apiRequest<CounselingSessionDetail>(`/counseling/sessions/${id}`);
  },
  create(input: CreateCounselingSessionInput): Promise<CounselingSessionDetail> {
    return apiRequest<CounselingSessionDetail>("/counseling/sessions", { method: "POST", body: input });
  },
  update(id: string, input: UpdateCounselingSessionInput): Promise<CounselingSessionDetail> {
    return apiRequest<CounselingSessionDetail>(`/counseling/sessions/${id}`, { method: "PATCH", body: input });
  },
};

const KEY = ["counseling"] as const;

/** `studentId` berilsa — shu o'quvchining tarixi; bo'lmasa — hammasi. */
export function useCounselingSessions(studentId?: string) {
  return useQuery({
    queryKey: [...KEY, "list", studentId ?? "all"],
    queryFn: () => (studentId ? api.listByStudent(studentId) : api.list()),
    staleTime: 10_000,
  });
}

export function useCounselingSession(id: string | null) {
  return useQuery({
    queryKey: [...KEY, "detail", id],
    queryFn: () => api.get(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateCounselingSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCounselingSessionInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCounselingSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCounselingSessionInput }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
