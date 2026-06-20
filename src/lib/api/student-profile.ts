import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

// ----------------------------------------------------------------- Overview

export interface OverviewParent {
  id: string;
  fullName: string;
  relation: string;
  phone: string;
  email?: string | null;
  isPrimary: boolean;
}

export interface OverviewTeacher {
  id: string;
  fullName: string;
  subject: string;
}

export interface StudentOverview {
  gpa: number | null;
  progress: number;
  attendancePct: number;
  coins: number;
  rank: number | null;
  classSize: number | null;
  personal: {
    fullName: string;
    middleName?: string | null;
    birthDate?: string | null;
    gender?: string | null;
    language: string;
    studentCode: string;
    nationalId?: string | null;
    classLabel?: string | null;
    contractNumber?: string | null;
    discountPercent: number;
    region?: string | null;
    district?: string | null;
    address?: string | null;
    personalPhone?: string | null;
  };
  parents: OverviewParent[];
  teachers: OverviewTeacher[];
  interests: string[];
}

// ----------------------------------------------------------------- Grades

export interface GpaDynamicPoint {
  quarterId: string;
  number: number;
  name: string;
  gpa: number | null;
}

export interface SubjectProgress {
  subjectId: string;
  name: string | null;
  average: number | null;
  attendancePct: number;
}

export interface QuarterGradeRow {
  subjectId: string;
  name: string;
  grades: Record<number, number | null>;
}

export interface GradeDistribution {
  excellent: number;
  good: number;
  satisfactory: number;
  poor: number;
}

export interface ProgressTestResult {
  examId: string;
  title: string;
  date?: string | null;
  score: number;
  maxScore: number;
}

export interface StudentGrades {
  studentId: string;
  fullName: string;
  gpa: number | null;
  progress: number;
  gpaDynamics: GpaDynamicPoint[];
  subjects: SubjectProgress[];
  quarterGrades: QuarterGradeRow[];
  quarters: { id: string; number: number; name: string }[];
  distribution: GradeDistribution;
  progressTests: ProgressTestResult[];
}

// ----------------------------------------------------------------- Attendance

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface StudentAttendance {
  total: number;
  counts: Record<AttendanceStatus, number>;
  attendancePct: number;
  recent: { date: string | null; subject: string; status: AttendanceStatus | null }[];
}

// ----------------------------------------------------------------- Schedule

export interface SchedulePeriod {
  id: string;
  code: string;
  startTime: string;
  endTime: string;
}

export interface ScheduleCell {
  weekday: number;
  periodId: string;
  subject: string;
  teacher: string | null;
  room: string | null;
}

export interface StudentSchedule {
  classLabel: string | null;
  periods: SchedulePeriod[];
  days: number[];
  cells: ScheduleCell[];
}

// ----------------------------------------------------------------- Payments

export interface PaymentRow {
  id: string;
  amount: number;
  date: string;
  method: string;
}

export interface StudentPayments {
  items: PaymentRow[];
  totalPaid: number;
}

// ----------------------------------------------------------------- Documents

export interface StudentDocument {
  id: string;
  type: string;
  fileUrl: string;
  createdAt: string;
}

const KEY = ["student-profile"] as const;

export function useStudentOverview(id: string | null) {
  return useQuery({
    queryKey: [...KEY, "overview", id],
    queryFn: () => apiRequest<StudentOverview>(`/students/${id}/overview`),
    enabled: Boolean(id),
  });
}

export function useStudentGrades(id: string | null) {
  return useQuery({
    queryKey: [...KEY, "grades", id],
    queryFn: () => apiRequest<StudentGrades>(`/students/${id}/grades`),
    enabled: Boolean(id),
  });
}

export function useStudentAttendance(id: string | null) {
  return useQuery({
    queryKey: [...KEY, "attendance", id],
    queryFn: () => apiRequest<StudentAttendance>(`/students/${id}/attendance`),
    enabled: Boolean(id),
  });
}

export function useStudentSchedule(id: string | null) {
  return useQuery({
    queryKey: [...KEY, "schedule", id],
    queryFn: () => apiRequest<StudentSchedule>(`/students/${id}/schedule`),
    enabled: Boolean(id),
  });
}

export function useStudentPayments(id: string | null) {
  return useQuery({
    queryKey: [...KEY, "payments", id],
    queryFn: () => apiRequest<StudentPayments>(`/students/${id}/payments`),
    enabled: Boolean(id),
  });
}

export function useStudentDocuments(id: string | null) {
  return useQuery({
    queryKey: [...KEY, "documents", id],
    queryFn: () => apiRequest<StudentDocument[]>(`/students/${id}/documents`),
    enabled: Boolean(id),
  });
}

export function useAddDocument(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { type: string; fileUrl: string }) =>
      apiRequest<StudentDocument>(`/students/${studentId}/documents`, {
        method: "POST",
        body: input,
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [...KEY, "documents", studentId] }),
  });
}

export function useDeleteDocument(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) =>
      apiRequest<{ id: string }>(`/students/${studentId}/documents/${documentId}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [...KEY, "documents", studentId] }),
  });
}
