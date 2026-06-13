import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export const INTEGRATION_CODES = ["openai", "onlinepbx"] as const;
export type IntegrationCode = (typeof INTEGRATION_CODES)[number];

export const OPENAI_MODELS = ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"] as const;
export type OpenAiModel = (typeof OPENAI_MODELS)[number];

export interface Integration {
  id: string;
  name: string;
  code: IntegrationCode | string;
  description: string | null;
  category: string;
  isEnabled: boolean;
  /** Secret fields arrive masked (e.g. "sk-proj...abcd"). */
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface IntegrationStats {
  totalCount: number;
  connectedCount: number;
}

export interface IntegrationPageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface IntegrationListResult {
  items: Integration[];
  meta: IntegrationPageMeta;
  stats: IntegrationStats;
}

export interface IntegrationListParams {
  search?: string;
  category?: string;
  isEnabled?: boolean;
  page?: number;
  limit?: number;
}

export interface IntegrationUpdateInput {
  isEnabled?: boolean;
  config?: Record<string, unknown>;
}

export interface IntegrationTestResult {
  ok: boolean;
  message: string;
}

const integrationsApi = {
  list(params: IntegrationListParams): Promise<IntegrationListResult> {
    return apiRequest<IntegrationListResult>("/integrations", { query: { ...params } });
  },
  get(id: string): Promise<Integration> {
    return apiRequest<Integration>(`/integrations/${id}`);
  },
  update(id: string, input: IntegrationUpdateInput): Promise<Integration> {
    return apiRequest<Integration>(`/integrations/${id}`, { method: "PATCH", body: input });
  },
  test(id: string): Promise<IntegrationTestResult> {
    return apiRequest<IntegrationTestResult>(`/integrations/${id}/test`, { method: "POST", body: {} });
  },
};

const INTEGRATIONS_KEY = ["integrations"] as const;

export function useIntegrations(params: IntegrationListParams) {
  return useQuery({
    queryKey: [...INTEGRATIONS_KEY, params],
    queryFn: () => integrationsApi.list(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useUpdateIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: IntegrationUpdateInput }) =>
      integrationsApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: INTEGRATIONS_KEY }),
  });
}

export function useTestIntegration() {
  return useMutation({
    mutationFn: (id: string) => integrationsApi.test(id),
  });
}
