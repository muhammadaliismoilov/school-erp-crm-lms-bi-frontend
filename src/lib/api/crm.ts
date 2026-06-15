import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "interested",
  "trial_lesson",
  "contract",
  "rejected",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface LeadSourceBrief {
  id: string;
  name: string;
}

export interface LeadAssigneeBrief {
  id: string;
  fullName: string;
}

export interface Lead {
  id: string;
  firstName: string;
  lastName?: string | null;
  fullName: string;
  phone: string;
  email?: string | null;
  status: LeadStatus;
  source?: LeadSourceBrief | null;
  assignedTo?: LeadAssigneeBrief | null;
  notes?: string | null;
  referralCode?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type LeadStats = { total: number } & Record<LeadStatus, number>;

export interface LeadListResult {
  items: Lead[];
  meta: { page: number; limit: number; total: number; pageCount: number };
  stats: LeadStats;
}

export interface LeadFilters {
  search?: string;
  status?: LeadStatus;
  sourceId?: string;
  assignedToId?: string;
  page?: number;
  limit?: number;
}

export interface LeadInput {
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  status?: LeadStatus;
  sourceId?: string;
  assignedToId?: string;
  notes?: string;
}

export interface Source {
  id: string;
  name: string;
  code: string;
  icon?: string | null;
  leadCount: number;
  createdAt?: string;
}

export interface SourceInput {
  name: string;
  icon?: string;
}

/** Bucket leads by status for the kanban board. Pure + testable. */
export function groupLeadsByStatus(leads: Lead[]): Record<LeadStatus, Lead[]> {
  const groups = Object.fromEntries(LEAD_STATUSES.map((s) => [s, [] as Lead[]])) as Record<
    LeadStatus,
    Lead[]
  >;
  for (const lead of leads) {
    if (groups[lead.status]) groups[lead.status].push(lead);
  }
  return groups;
}

const api = {
  listLeads(filters: LeadFilters): Promise<LeadListResult> {
    return apiRequest<LeadListResult>("/crm/leads", { query: filters as Record<string, string | number> });
  },
  getLead(id: string): Promise<Lead> {
    return apiRequest<Lead>(`/crm/leads/${id}`);
  },
  createLead(input: LeadInput): Promise<Lead> {
    return apiRequest<Lead>("/crm/leads", { method: "POST", body: input });
  },
  updateLead(id: string, input: Partial<LeadInput>): Promise<Lead> {
    return apiRequest<Lead>(`/crm/leads/${id}`, { method: "PATCH", body: input });
  },
  moveLead(id: string, status: LeadStatus): Promise<Lead> {
    return apiRequest<Lead>(`/crm/leads/${id}/status`, { method: "PATCH", body: { status } });
  },
  removeLead(id: string): Promise<void> {
    return apiRequest<void>(`/crm/leads/${id}`, { method: "DELETE" });
  },
  listSources(search?: string): Promise<Source[]> {
    return apiRequest<Source[]>("/crm/sources", { query: { search } });
  },
  createSource(input: SourceInput): Promise<Source> {
    return apiRequest<Source>("/crm/sources", { method: "POST", body: input });
  },
  updateSource(id: string, input: Partial<SourceInput>): Promise<Source> {
    return apiRequest<Source>(`/crm/sources/${id}`, { method: "PATCH", body: input });
  },
  removeSource(id: string): Promise<void> {
    return apiRequest<void>(`/crm/sources/${id}`, { method: "DELETE" });
  },
};

const LEADS_KEY = ["crm", "leads"] as const;
const SOURCES_KEY = ["crm", "sources"] as const;

export function useLeads(filters: LeadFilters) {
  return useQuery({
    queryKey: [...LEADS_KEY, filters],
    queryFn: () => api.listLeads(filters),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useLead(id: string | null) {
  return useQuery({
    queryKey: [...LEADS_KEY, "detail", id],
    queryFn: () => api.getLead(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LeadInput) => api.createLead(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: LEADS_KEY }),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<LeadInput> }) => api.updateLead(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: LEADS_KEY }),
  });
}

export function useMoveLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) => api.moveLead(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: LEADS_KEY }),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.removeLead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: LEADS_KEY }),
  });
}

export function useLeadSources(search?: string) {
  return useQuery({
    queryKey: [...SOURCES_KEY, search ?? null],
    queryFn: () => api.listSources(search),
    staleTime: 60_000,
  });
}

export function useCreateSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SourceInput) => api.createSource(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm"] }),
  });
}

export function useUpdateSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<SourceInput> }) => api.updateSource(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm"] }),
  });
}

export function useDeleteSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.removeSource(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm"] }),
  });
}
