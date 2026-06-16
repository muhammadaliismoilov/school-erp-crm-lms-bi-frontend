import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

export const REFERRAL_TEMPLATES = ["classic", "centered", "split", "fullscreen"] as const;
export type ReferralTemplate = (typeof REFERRAL_TEMPLATES)[number];

export type ReferralStatus = "active" | "expired";

export interface Referral {
  id: string;
  name: string;
  code: string;
  url: string;
  description?: string | null;
  source?: { id: string; name: string } | null;
  expiresAt?: string | null;
  template: ReferralTemplate;
  themeColor?: string | null;
  isActive: boolean;
  status: ReferralStatus;
  leadCount: number;
  createdAt?: string;
}

export interface ReferralStats {
  total: number;
  active: number;
  expired: number;
  withSource: number;
}

export interface ReferralListResult {
  items: Referral[];
  meta: { page: number; limit: number; total: number; pageCount: number };
  stats: ReferralStats;
}

export interface ReferralFilters {
  search?: string;
  status?: ReferralStatus;
  page?: number;
  limit?: number;
}

export interface ReferralInput {
  name: string;
  description?: string;
  sourceId?: string;
  expiresAt?: string;
  template?: ReferralTemplate;
  themeColor?: string;
}

export interface PublicReferralInfo {
  valid: boolean;
  name: string;
  description?: string | null;
  template: ReferralTemplate;
  themeColor?: string | null;
  sourceName?: string | null;
}

export interface PublicReferralLeadInput {
  firstName: string;
  lastName?: string;
  phone: string;
  /** Honeypot — must stay empty. */
  website?: string;
}

const api = {
  list(filters: ReferralFilters): Promise<ReferralListResult> {
    return apiRequest<ReferralListResult>("/crm/referrals", {
      query: filters as Record<string, string | number>,
    });
  },
  get(id: string): Promise<Referral> {
    return apiRequest<Referral>(`/crm/referrals/${id}`);
  },
  create(input: ReferralInput): Promise<Referral> {
    return apiRequest<Referral>("/crm/referrals", { method: "POST", body: input });
  },
  update(id: string, input: Partial<ReferralInput> & { isActive?: boolean }): Promise<Referral> {
    return apiRequest<Referral>(`/crm/referrals/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/crm/referrals/${id}`, { method: "DELETE" });
  },
};

const KEY = ["crm", "referrals"] as const;

export function useReferrals(filters: ReferralFilters) {
  return useQuery({
    queryKey: [...KEY, filters],
    queryFn: () => api.list(filters),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useCreateReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ReferralInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ReferralInput> & { isActive?: boolean } }) =>
      api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

// --- Public (unauthenticated) landing page ---

export function validatePublicReferral(code: string): Promise<PublicReferralInfo> {
  return apiRequest<PublicReferralInfo>(`/public/referral/${code}`, { auth: false });
}

export function submitPublicReferralLead(
  code: string,
  input: PublicReferralLeadInput,
): Promise<{ id: string }> {
  return apiRequest<{ id: string }>(`/public/referral/${code}/leads`, {
    method: "POST",
    body: input,
    auth: false,
  });
}
