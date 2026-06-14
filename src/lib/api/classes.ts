import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

/** Mirrors backend ClassLanguage enum. */
export const CLASS_LANGUAGES = ["uz", "ru", "en"] as const;
export type ClassLanguage = (typeof CLASS_LANGUAGES)[number];

export interface ClassAcademicYearBrief {
  id: string;
  name: string;
}

export interface ClassRoomBrief {
  id: string;
  roomNumber: string;
  floor: number;
  label: string;
}

export interface ClassCuratorBrief {
  id: string;
  fullName: string;
  phone?: string | null;
}

export interface ClassStats {
  studentCount: number;
  maleCount: number;
  femaleCount: number;
  averageMastery: number;
  averageAttendance: number;
}

export interface SchoolClass {
  id: string;
  name: string;
  gradeLevel: number;
  section: string;
  language: ClassLanguage | string;
  academicYear: ClassAcademicYearBrief;
  room: ClassRoomBrief;
  curator: ClassCuratorBrief;
  stats: ClassStats;
  capacity?: number;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
}

export interface ClassStudentRow {
  id: string;
  fullName: string;
  gender?: string | null;
  studentCode?: string | null;
  mastery: number;
  attendance: number;
}

export interface ClassDetail extends SchoolClass {
  students: ClassStudentRow[];
}

export interface ClassListStats {
  totalClasses: number;
  totalStudents: number;
  languages: { uz: number; ru: number; en: number };
}

export interface ClassListResult {
  items: SchoolClass[];
  stats: ClassListStats;
}

export interface ClassQuery {
  academicYearId?: string;
  gradeLevel?: number;
  language?: ClassLanguage;
  roomId?: string;
  curatorId?: string;
  search?: string;
}

export interface ClassInput {
  gradeLevel: number;
  section: string;
  language: ClassLanguage;
  roomId: string;
  curatorId: string;
  academicYearId: string;
  capacity?: number;
}

export interface TransferInput {
  academicYearId: string;
  targetClassId: string;
  studentIds?: string[];
}

export interface TransferResult {
  sourceClassId: string;
  targetClassId: string;
  movedStudentCount: number;
}

export interface SendSmsInput {
  templateId?: string;
  body?: string;
  studentIds?: string[];
  scheduledAt?: string;
}

export interface SendSmsResult {
  campaignId: string;
  channel: string;
  totalRecipients: number;
  skippedCount: number;
  status: string;
  scheduledAt?: string | null;
}

/**
 * Build the SMS payload from the modal fields. A date (optionally with a time)
 * schedules the message; without a date the SMS is sent immediately. Returns
 * `null` when neither a template nor a body is provided (invalid).
 */
export function buildSmsInput(fields: {
  templateId?: string;
  body?: string;
  date?: string;
  time?: string;
}): SendSmsInput | null {
  const templateId = fields.templateId?.trim();
  const body = fields.body?.trim();
  if (!templateId && !body) return null;

  let scheduledAt: string | undefined;
  if (fields.date) {
    const clock = fields.time && fields.time.length > 0 ? fields.time : "09:00";
    const parsed = new Date(`${fields.date}T${clock}:00`);
    if (!Number.isNaN(parsed.getTime())) {
      scheduledAt = parsed.toISOString();
    }
  }

  return {
    ...(templateId ? { templateId } : {}),
    ...(body ? { body } : {}),
    ...(scheduledAt ? { scheduledAt } : {}),
  };
}

export interface MessageTemplate {
  id: string;
  code: string;
  name: string;
  channel: string;
  subject?: string | null;
  body: string;
  variables: string[];
  active: boolean;
}

const api = {
  list(query?: ClassQuery): Promise<ClassListResult> {
    return apiRequest<ClassListResult>("/academic/classes", { query: query as Record<string, string | number> });
  },
  get(id: string): Promise<ClassDetail> {
    return apiRequest<ClassDetail>(`/academic/classes/${id}`);
  },
  create(input: ClassInput): Promise<SchoolClass> {
    return apiRequest<SchoolClass>("/academic/classes", { method: "POST", body: input });
  },
  update(id: string, input: Partial<ClassInput>): Promise<SchoolClass> {
    return apiRequest<SchoolClass>(`/academic/classes/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/academic/classes/${id}`, { method: "DELETE" });
  },
  transfer(id: string, input: TransferInput): Promise<TransferResult> {
    return apiRequest<TransferResult>(`/academic/classes/${id}/transfer-students`, {
      method: "POST",
      body: input,
    });
  },
  sendSms(id: string, input: SendSmsInput): Promise<SendSmsResult> {
    return apiRequest<SendSmsResult>(`/academic/classes/${id}/send-sms`, {
      method: "POST",
      body: input,
    });
  },
  templates(): Promise<MessageTemplate[]> {
    return apiRequest<MessageTemplate[]>("/communication/templates");
  },
};

const KEY = ["classes"] as const;

export function useClassList(query?: ClassQuery) {
  return useQuery({
    queryKey: [...KEY, query],
    queryFn: () => api.list(query),
    staleTime: 30_000,
  });
}

export function useClass(id: string | null) {
  return useQuery({
    queryKey: [...KEY, "detail", id],
    queryFn: () => api.get(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ClassInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ClassInput> }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useTransferStudents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TransferInput }) => api.transfer(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSendClassSms() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SendSmsInput }) => api.sendSms(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useMessageTemplates() {
  return useQuery({
    queryKey: ["message-templates"],
    queryFn: () => api.templates(),
    staleTime: 60_000,
  });
}
