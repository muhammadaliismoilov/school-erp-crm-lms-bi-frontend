import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export const PARENT_TYPES = ["mother", "father", "guardian", "other"] as const;
export type ParentType = (typeof PARENT_TYPES)[number];

export const COMM_SENTIMENTS = ["positive", "neutral", "negative"] as const;
export type CommSentiment = (typeof COMM_SENTIMENTS)[number];

export interface ParentComm {
  id: string;
  studentId: string;
  studentName: string | null;
  classId: string | null;
  className: string | null;
  parentId: string | null;
  parentName: string | null;
  parentType: ParentType;
  sentiment: CommSentiment;
  tutorId: string | null;
  tutorName: string | null;
  createdById: string | null;
  staffName: string | null;
  educationScore: number | null;
  classLeaderScore: number | null;
  extracurricularScore: number | null;
  organizationalScore: number | null;
  purpose: string | null;
  notes: string | null;
  communicationDate: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export interface ParentCommStats {
  totalCount: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
}

export interface ParentCommPageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface ParentCommListResult {
  items: ParentComm[];
  meta: ParentCommPageMeta;
  stats: ParentCommStats;
}

export interface ParentCommListParams {
  page?: number;
  limit?: number;
  sentiment?: CommSentiment;
  classId?: string;
  year?: number;
  month?: number;
  search?: string;
}

export interface ParentCommInput {
  studentId: string;
  classId?: string;
  parentId?: string;
  parentType: ParentType;
  sentiment: CommSentiment;
  tutorId?: string;
  educationScore?: number;
  classLeaderScore?: number;
  extracurricularScore?: number;
  organizationalScore?: number;
  purpose?: string;
  notes?: string;
  communicationDate?: string;
}

const api = {
  list(params: ParentCommListParams): Promise<ParentCommListResult> {
    return apiRequest<ParentCommListResult>("/parent-communications", { query: { ...params } });
  },
  create(input: ParentCommInput): Promise<ParentComm> {
    return apiRequest<ParentComm>("/parent-communications", { method: "POST", body: input });
  },
  update(id: string, input: Partial<ParentCommInput>): Promise<ParentComm> {
    return apiRequest<ParentComm>(`/parent-communications/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/parent-communications/${id}`, { method: "DELETE" });
  },
};

const KEY = ["parent-comms"] as const;

export function useParentComms(params: ParentCommListParams) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useCreateParentComm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ParentCommInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateParentComm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ParentCommInput> }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteParentComm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export const PARENT_TYPE_LABELS: Record<ParentType, string> = {
  mother: "Ona",
  father: "Ota",
  guardian: "Vasiy",
  other: "Boshqa",
};

export const COMM_SENTIMENT_LABELS: Record<CommSentiment, string> = {
  positive: "Ijobiy",
  neutral: "Neytral",
  negative: "Salbiy",
};
