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

export interface LeadTagBrief {
  id: string;
  name: string;
  color?: string | null;
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
  enrolledStudentId?: string | null;
  tags: LeadTagBrief[];
  commentsCount?: number;
  nextReminderAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const LEAD_TASK_FILTERS = ["has_open", "overdue", "none"] as const;
export type LeadTaskFilter = (typeof LEAD_TASK_FILTERS)[number];

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
  dateFrom?: string;
  dateTo?: string;
  taskFilter?: LeadTaskFilter;
  tagIds?: string[];
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

export interface LeadHistoryEntry {
  id: string;
  action: string;
  actorName?: string | null;
  timestamp: string;
  details?: Record<string, unknown> | null;
}

/** Map an audit action code to its i18n label key. Pure + testable. */
export function leadHistoryActionKey(action: string): string {
  switch (action) {
    case "lead.created":
      return "crm.history.created";
    case "lead.updated":
      return "crm.history.updated";
    case "lead.status_changed":
      return "crm.history.statusChanged";
    case "lead.deleted":
      return "crm.history.deleted";
    case "lead.comment_added":
      return "crm.history.commentAdded";
    case "lead.comment_updated":
      return "crm.history.commentUpdated";
    case "lead.comment_deleted":
      return "crm.history.commentDeleted";
    case "lead.tags_changed":
      return "crm.history.tagsChanged";
    case "lead.enrolled":
      return "crm.history.enrolled";
    default:
      return "crm.history.generic";
  }
}

export interface LeadComment {
  id: string;
  body: string;
  author?: LeadAssigneeBrief | null;
  remindAt?: string | null;
  reminderDone: boolean;
  isPinned: boolean;
  context?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadCommentInput {
  body: string;
  remindAt?: string;
  isPinned?: boolean;
}

export interface LeadCommentUpdate {
  body?: string;
  remindAt?: string | null;
  reminderDone?: boolean;
  isPinned?: boolean;
}

export interface LeadTag {
  id: string;
  name: string;
  color?: string | null;
  leadCount?: number;
}

export interface LeadTagInput {
  name: string;
  color?: string;
}

export interface EnrollStudentInput {
  lastName: string;
  firstName: string;
  middleName?: string;
  birthDate: string;
  gender?: "male" | "female" | "other";
  nationality?: string;
  birthCertificateSeries: string;
  birthCertificateNumber: string;
  passport?: string;
  jshshir?: string;
  passportIssuedDate?: string;
  guardianFullName: string;
  guardianRelation?: string;
  guardianPassport?: string;
  guardianJshshir?: string;
  guardianPhone: string;
  region?: string;
  district?: string;
  address?: string;
  personalPhone?: string;
}

export interface EnrollLeadResult {
  studentId: string;
  studentCode: string;
  fullName: string;
  leadId: string;
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
    const { tagIds, ...rest } = filters;
    const query: Record<string, string | number> = { ...(rest as Record<string, string | number>) };
    // The backend accepts a comma-separated tagIds param.
    if (tagIds?.length) query.tagIds = tagIds.join(",");
    return apiRequest<LeadListResult>("/crm/leads", { query });
  },
  getLead(id: string): Promise<Lead> {
    return apiRequest<Lead>(`/crm/leads/${id}`);
  },
  leadHistory(id: string): Promise<LeadHistoryEntry[]> {
    return apiRequest<LeadHistoryEntry[]>(`/crm/leads/${id}/history`);
  },
  createLead(input: LeadInput): Promise<Lead> {
    return apiRequest<Lead>("/crm/leads", { method: "POST", body: input });
  },
  updateLead(id: string, input: Partial<LeadInput>): Promise<Lead> {
    return apiRequest<Lead>(`/crm/leads/${id}`, { method: "PATCH", body: input });
  },
  moveLead(id: string, status: LeadStatus, comment?: string, remindAt?: string): Promise<Lead> {
    return apiRequest<Lead>(`/crm/leads/${id}/status`, {
      method: "PATCH",
      body: { status, ...(comment ? { comment } : {}), ...(remindAt ? { remindAt } : {}) },
    });
  },
  removeLead(id: string): Promise<void> {
    return apiRequest<void>(`/crm/leads/${id}`, { method: "DELETE" });
  },
  // --- Comments ---
  listComments(leadId: string): Promise<LeadComment[]> {
    return apiRequest<LeadComment[]>(`/crm/leads/${leadId}/comments`);
  },
  addComment(leadId: string, input: LeadCommentInput): Promise<LeadComment> {
    return apiRequest<LeadComment>(`/crm/leads/${leadId}/comments`, { method: "POST", body: input });
  },
  updateComment(leadId: string, commentId: string, input: LeadCommentUpdate): Promise<LeadComment> {
    return apiRequest<LeadComment>(`/crm/leads/${leadId}/comments/${commentId}`, { method: "PATCH", body: input });
  },
  removeComment(leadId: string, commentId: string): Promise<void> {
    return apiRequest<void>(`/crm/leads/${leadId}/comments/${commentId}`, { method: "DELETE" });
  },
  // --- Tags ---
  listTags(): Promise<LeadTag[]> {
    return apiRequest<LeadTag[]>("/crm/tags");
  },
  createTag(input: LeadTagInput): Promise<LeadTag> {
    return apiRequest<LeadTag>("/crm/tags", { method: "POST", body: input });
  },
  updateTag(id: string, input: Partial<LeadTagInput>): Promise<LeadTag> {
    return apiRequest<LeadTag>(`/crm/tags/${id}`, { method: "PATCH", body: input });
  },
  removeTag(id: string): Promise<void> {
    return apiRequest<void>(`/crm/tags/${id}`, { method: "DELETE" });
  },
  setLeadTags(leadId: string, tagIds: string[]): Promise<Lead> {
    return apiRequest<Lead>(`/crm/leads/${leadId}/tags`, { method: "PUT", body: { tagIds } });
  },
  // --- Enrollment ---
  enrollLead(leadId: string, input: EnrollStudentInput): Promise<EnrollLeadResult> {
    return apiRequest<EnrollLeadResult>(`/crm/leads/${leadId}/enroll`, { method: "POST", body: input });
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

export function useLeadHistory(id: string | null) {
  return useQuery({
    queryKey: [...LEADS_KEY, "history", id],
    queryFn: () => api.leadHistory(id as string),
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
    mutationFn: ({ id, status, comment, remindAt }: { id: string; status: LeadStatus; comment?: string; remindAt?: string }) =>
      api.moveLead(id, status, comment, remindAt),
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

// --- Comments ---
const COMMENTS_KEY = (leadId: string) => [...LEADS_KEY, "comments", leadId] as const;

export function useLeadComments(leadId: string | null) {
  return useQuery({
    queryKey: COMMENTS_KEY(leadId ?? ""),
    queryFn: () => api.listComments(leadId as string),
    enabled: Boolean(leadId),
  });
}

export function useAddComment(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LeadCommentInput) => api.addComment(leadId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: COMMENTS_KEY(leadId) });
      qc.invalidateQueries({ queryKey: LEADS_KEY });
    },
  });
}

export function useUpdateComment(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, input }: { commentId: string; input: LeadCommentUpdate }) =>
      api.updateComment(leadId, commentId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: COMMENTS_KEY(leadId) });
      qc.invalidateQueries({ queryKey: LEADS_KEY });
    },
  });
}

export function useDeleteComment(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => api.removeComment(leadId, commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: COMMENTS_KEY(leadId) });
      qc.invalidateQueries({ queryKey: LEADS_KEY });
    },
  });
}

// --- Tags ---
const TAGS_KEY = ["crm", "tags"] as const;

export function useLeadTags() {
  return useQuery({
    queryKey: TAGS_KEY,
    queryFn: () => api.listTags(),
    staleTime: 60_000,
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LeadTagInput) => api.createTag(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: TAGS_KEY }),
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<LeadTagInput> }) => api.updateTag(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm"] }),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.removeTag(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm"] }),
  });
}

export function useSetLeadTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, tagIds }: { leadId: string; tagIds: string[] }) => api.setLeadTags(leadId, tagIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: LEADS_KEY }),
  });
}

// --- Enrollment ---
export function useEnrollLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, input }: { leadId: string; input: EnrollStudentInput }) => api.enrollLead(leadId, input),
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
