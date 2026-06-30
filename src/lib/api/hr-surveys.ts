import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export type SurveyType = "anonymous" | "public";
export type SurveyStatus = "draft" | "active" | "closed";

export interface Survey {
  id: string;
  title: string;
  description: string | null;
  type: SurveyType;
  status: SurveyStatus;
  isAnonymous: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface SurveyListResult {
  items: Survey[];
  meta: PageMeta;
}

export interface SurveyListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: SurveyStatus;
}

export interface SurveyInput {
  title: string;
  description?: string;
  type?: SurveyType;
  isAnonymous?: boolean;
  startDate?: string;
  endDate?: string;
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
  list(params: SurveyListParams): Promise<SurveyListResult> {
    return apiRequest<SurveyListResult>("/hr/surveys", { query: cleanParams(params) });
  },
  create(input: SurveyInput): Promise<Survey> {
    return apiRequest<Survey>("/hr/surveys", { method: "POST", body: input });
  },
  update(id: string, input: Partial<SurveyInput>): Promise<Survey> {
    return apiRequest<Survey>(`/hr/surveys/${id}`, { method: "PATCH", body: input });
  },
  publish(id: string): Promise<Survey> {
    return apiRequest<Survey>(`/hr/surveys/${id}/publish`, { method: "PATCH" });
  },
  close(id: string): Promise<Survey> {
    return apiRequest<Survey>(`/hr/surveys/${id}/close`, { method: "PATCH" });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/hr/surveys/${id}`, { method: "DELETE" });
  },
};

const KEY = ["hr", "surveys"] as const;

export function useSurveyList(params: SurveyListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
}

export function useCreateSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SurveyInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<SurveyInput> }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function usePublishSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.publish(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCloseSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.close(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export const SURVEY_TYPE_LABELS: Record<SurveyType, string> = {
  anonymous: "Anonim",
  public: "Ochiq",
};

export const SURVEY_STATUS_LABELS: Record<SurveyStatus, string> = {
  draft: "Qoralama",
  active: "Faol",
  closed: "Yakunlangan",
};

export const SURVEY_STATUS_TONE: Record<SurveyStatus, "neutral" | "positive" | "caution"> = {
  draft: "neutral",
  active: "positive",
  closed: "caution",
};

export const PAGE_SIZES = [10, 20, 50, 100] as const;
