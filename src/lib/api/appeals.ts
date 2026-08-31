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
  /** Anonim murojaatda `fullName`/`phone` backend'da saqlanmaydi — null keladi. */
  isAnonymous: boolean;
  fullName: string | null;
  phone: string | null;
  type: AppealType;
  targetRole: TargetRole;
  description: string;
  source: AppealSource;
  status: AppealStatus;
  assigneeUserId: string | null;
  resolutionNote: string | null;
  resolvedById: string | null;
  resolvedAt: string | null;
  /** Javob berish muddati: shikoyat 3 kun, taklif 7 kun. */
  dueAt: string;
  publicLinkId: string | null;
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
  /** Faqat bosh ofis yubora oladi; maktab xodimi uchun backend rad etadi. */
  schoolId?: string;
  isAnonymous?: boolean;
  fullName?: string;
  phone?: string;
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

/** Status update / resolution (matches UpdateAppealDto). */
export interface AppealUpdateInput extends Partial<AppealInput> {
  status?: AppealStatus;
  resolutionNote?: string;
}

/** Public unauthenticated submission (matches PublicCreateAppealDto). */
export interface PublicAppealInput {
  isAnonymous?: boolean;
  fullName?: string;
  phone?: string;
  type: AppealType;
  targetRole: TargetRole;
  description: string;
  /** Honeypot — must stay empty; real users never see this field. */
  website?: string;
}

const appealsApi = {
  list(params: AppealListParams): Promise<AppealListResult> {
    return apiRequest<AppealListResult>("/appeals", { query: { ...params } });
  },
  create(input: AppealInput): Promise<Appeal> {
    return apiRequest<Appeal>("/appeals", { method: "POST", body: input });
  },
  update(id: string, input: AppealUpdateInput): Promise<Appeal> {
    return apiRequest<Appeal>(`/appeals/${id}`, { method: "PATCH", body: input });
  },
  assign(id: string, assigneeUserId: string | null): Promise<Appeal> {
    return apiRequest<Appeal>(`/appeals/${id}/assign`, {
      method: "PATCH",
      body: { assigneeUserId },
    });
  },
  transfer(id: string, schoolId: string): Promise<Appeal> {
    return apiRequest<Appeal>(`/appeals/${id}/transfer`, {
      method: "PATCH",
      body: { schoolId },
    });
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

export interface PublicAppealLinkInfo {
  valid: boolean;
  title: string;
  /** Havola tegishli maktab nomi — ota-ona qaysi maktabga yozayotganini ko'rsin. */
  schoolName: string | null;
}

/** Public, unauthenticated calls. */
export function validatePublicAppealToken(token: string): Promise<PublicAppealLinkInfo> {
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
    mutationFn: ({ id, input }: { id: string; input: AppealUpdateInput }) =>
      appealsApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: APPEALS_KEY }),
  });
}

export function useAssignAppeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assigneeUserId }: { id: string; assigneeUserId: string | null }) =>
      appealsApi.assign(id, assigneeUserId),
    onSuccess: () => qc.invalidateQueries({ queryKey: APPEALS_KEY }),
  });
}

export function useTransferAppeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, schoolId }: { id: string; schoolId: string }) =>
      appealsApi.transfer(id, schoolId),
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
    // Maktab tanlanmaganda backend 400 qaytaradi — bu holat qayta urinishdan
    // o'zgarmaydi. Standart 3 marta urinish `isError` ni sekundlarga
    // kechiktirardi va sahifa shu vaqt ichida "havola yaratilmagan" degan
    // YOLG'ON xabarni ko'rsatib turardi.
    retry: false,
  });
}

export function useCreateAppealPublicLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => appealsApi.createPublicLink(),
    onSuccess: (data) => qc.setQueryData(["appeals", "public-link"], data),
  });
}
