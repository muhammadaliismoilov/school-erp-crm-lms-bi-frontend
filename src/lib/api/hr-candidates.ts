import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export type CandidateStage =
  | "new"
  | "screening"
  | "interview"
  | "test"
  | "offer"
  | "hired"
  | "rejected";

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string | null;
  vacancyId: string | null;
  vacancyTitle: string | null;
  recruiterId: string | null;
  recruiterName: string | null;
  stage: CandidateStage;
  stageStatus: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface CandidateListResult {
  items: Candidate[];
  meta: PageMeta;
}

export interface CandidateListParams {
  page?: number;
  limit?: number;
  search?: string;
  stage?: CandidateStage;
  vacancyId?: string;
}

export interface CandidateInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  vacancyId?: string;
  recruiterId?: string;
  stage?: CandidateStage;
  stageStatus?: string;
  notes?: string;
}

export interface CandidateStageInput {
  stage: CandidateStage;
  stageStatus?: string;
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
  list(params: CandidateListParams): Promise<CandidateListResult> {
    return apiRequest<CandidateListResult>("/hr/candidates", { query: cleanParams(params) });
  },
  create(input: CandidateInput): Promise<Candidate> {
    return apiRequest<Candidate>("/hr/candidates", { method: "POST", body: input });
  },
  update(id: string, input: Partial<CandidateInput>): Promise<Candidate> {
    return apiRequest<Candidate>(`/hr/candidates/${id}`, { method: "PATCH", body: input });
  },
  updateStage(id: string, input: CandidateStageInput): Promise<Candidate> {
    return apiRequest<Candidate>(`/hr/candidates/${id}/stage`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/hr/candidates/${id}`, { method: "DELETE" });
  },
};

const KEY = ["hr", "candidates"] as const;

export function useCandidateList(params: CandidateListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
}

export function useCreateCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CandidateInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CandidateInput> }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCandidateStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CandidateStageInput }) => api.updateStage(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export const STAGE_LABELS: Record<CandidateStage, string> = {
  new: "Yangi",
  screening: "Screening",
  interview: "Suhbat",
  test: "Test",
  offer: "Taklif",
  hired: "Ishga olingan",
  rejected: "Rad etilgan",
};

export const STAGE_TONE: Record<CandidateStage, "neutral" | "accent" | "caution" | "positive" | "negative"> = {
  new: "neutral",
  screening: "accent",
  interview: "accent",
  test: "caution",
  offer: "caution",
  hired: "positive",
  rejected: "negative",
};

export const STAGE_ORDER: CandidateStage[] = [
  "new",
  "screening",
  "interview",
  "test",
  "offer",
  "hired",
  "rejected",
];

export const PAGE_SIZES = [10, 20, 50, 100] as const;
