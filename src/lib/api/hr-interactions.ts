import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export type InteractionType = "call" | "meeting" | "email" | "interview" | "other";
export type InteractionStatus = "planned" | "completed" | "cancelled";

export interface Interaction {
  id: string;
  title: string;
  type: InteractionType;
  status: InteractionStatus;
  candidateId: string | null;
  candidateName: string | null;
  location: string | null;
  scheduledAt: string | null;
  endAt: string | null;
  purpose: string | null;
  description: string | null;
  result: string | null;
  summary: string | null;
  nextSteps: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface InteractionListResult {
  items: Interaction[];
  meta: PageMeta;
}

export interface InteractionListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: InteractionType;
  status?: InteractionStatus;
  candidateId?: string;
}

export interface InteractionInput {
  title: string;
  type?: InteractionType;
  status?: InteractionStatus;
  candidateId?: string;
  location?: string;
  scheduledAt?: string;
  endAt?: string;
  purpose?: string;
  description?: string;
  result?: string;
  summary?: string;
  nextSteps?: string;
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
  list(params: InteractionListParams): Promise<InteractionListResult> {
    return apiRequest<InteractionListResult>("/hr/interactions", { query: cleanParams(params) });
  },
  create(input: InteractionInput): Promise<Interaction> {
    return apiRequest<Interaction>("/hr/interactions", { method: "POST", body: input });
  },
  update(id: string, input: Partial<InteractionInput>): Promise<Interaction> {
    return apiRequest<Interaction>(`/hr/interactions/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/hr/interactions/${id}`, { method: "DELETE" });
  },
};

const KEY = ["hr", "interactions"] as const;

export function useInteractionList(params: InteractionListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
}

export function useCreateInteraction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InteractionInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateInteraction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<InteractionInput> }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteInteraction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  call: "Qo'ng'iroq",
  meeting: "Uchrashuv",
  email: "Email",
  interview: "Suhbat",
  other: "Boshqa",
};

export const INTERACTION_STATUS_LABELS: Record<InteractionStatus, string> = {
  planned: "Rejalashtirilgan",
  completed: "Bajarilgan",
  cancelled: "Bekor qilingan",
};

export const INTERACTION_STATUS_TONE: Record<InteractionStatus, "caution" | "positive" | "negative"> = {
  planned: "caution",
  completed: "positive",
  cancelled: "negative",
};

export const PAGE_SIZES = [10, 20, 50, 100] as const;
