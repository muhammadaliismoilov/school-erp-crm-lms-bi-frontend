import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export const APPEAL_TYPES = ["suggestion", "complaint"] as const;
export type AppealType = (typeof APPEAL_TYPES)[number];

export const APPEAL_SOURCES = ["manual", "public_link", "system"] as const;
export type AppealSource = (typeof APPEAL_SOURCES)[number];

export const APPEAL_STATUSES = ["pending", "in_progress", "resolved", "rejected"] as const;
export type AppealStatus = (typeof APPEAL_STATUSES)[number];

export const TARGET_ROLES = [
  "class_teacher",
  "deputy_director",
  "director",
  "accountant",
  "sales_manager",
  "psychologist",
  "doctor",
  "librarian",
] as const;
export type TargetRole = (typeof TARGET_ROLES)[number];

export const APPEAL_PERIODS = ["today", "yesterday", "week", "month"] as const;
export type AppealPeriod = (typeof APPEAL_PERIODS)[number];

export interface Appeal {
  id: string;
  fullName: string;
  phone: string;
  type: AppealType;
  targetRole: TargetRole;
  description: string;
  source: AppealSource;
  status: AppealStatus;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface AppealStats {
  totalCount: number;
  suggestionCount: number;
  complaintCount: number;
  monthCount: number;
}

export interface AppealPageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface AppealListResult {
  items: Appeal[];
  meta: AppealPageMeta;
  stats: AppealStats;
}

export interface AppealListParams {
  search?: string;
  type?: AppealType;
  status?: AppealStatus;
  targetRole?: TargetRole;
  source?: AppealSource;
  period?: AppealPeriod;
  page?: number;
  limit?: number;
}

/** Admin manual create (matches CreateAppealDto). */
export interface AppealInput {
  fullName: string;
  phone: string;
  type: AppealType;
  targetRole: TargetRole;
  description: string;
  source?: AppealSource;
}

export interface AppealPublicLink {
  token: string | null;
  url: string | null;
  active: boolean;
}

/** Public unauthenticated submission (matches PublicCreateAppealDto). */
export interface PublicAppealInput {
  fullName: string;
  phone: string;
  type: AppealType;
  targetRole: TargetRole;
  description: string;
}

const appealsApi = {
  list(params: AppealListParams): Promise<AppealListResult> {
    return apiRequest<AppealListResult>("/appeals", { query: { ...params } });
  },
  create(input: AppealInput): Promise<Appeal> {
    return apiRequest<Appeal>("/appeals", { method: "POST", body: input });
  },
  update(id: string, input: Partial<AppealInput> & { status?: AppealStatus }): Promise<Appeal> {
    return apiRequest<Appeal>(`/appeals/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/appeals/${id}`, { method: "DELETE" });
  },
  getPublicLink(): Promise<AppealPublicLink> {
    return apiRequest<AppealPublicLink>("/appeals/public-link");
  },
  createPublicLink(): Promise<AppealPublicLink> {
    return apiRequest<AppealPublicLink>("/appeals/public-link", { method: "POST", body: {} });
  },
};

/** Public, unauthenticated calls. */
export function validatePublicAppealToken(token: string): Promise<{ valid: boolean; title: string }> {
  return apiRequest(`/public/appeals/${token}`, { auth: false });
}
export function submitPublicAppeal(token: string, input: PublicAppealInput): Promise<{ id: string }> {
  return apiRequest(`/public/appeals/${token}`, { method: "POST", body: input, auth: false });
}

const APPEALS_KEY = ["appeals"] as const;

export function useAppeals(params: AppealListParams) {
  return useQuery({
    queryKey: [...APPEALS_KEY, params],
    queryFn: () => appealsApi.list(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useCreateAppeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AppealInput) => appealsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: APPEALS_KEY }),
  });
}

export function useUpdateAppeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AppealInput> & { status?: AppealStatus } }) =>
      appealsApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: APPEALS_KEY }),
  });
}

export function useDeleteAppeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appealsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: APPEALS_KEY }),
  });
}

export function useAppealPublicLink() {
  return useQuery({
    queryKey: ["appeals", "public-link"],
    queryFn: () => appealsApi.getPublicLink(),
    staleTime: 60_000,
  });
}

export function useCreateAppealPublicLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => appealsApi.createPublicLink(),
    onSuccess: (data) => qc.setQueryData(["appeals", "public-link"], data),
  });
}
