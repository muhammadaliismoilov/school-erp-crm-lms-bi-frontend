import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export const STUDENT_PAYMENT_STATUSES = ["paid", "partial", "pending"] as const;
export type StudentPaymentStatus = (typeof STUDENT_PAYMENT_STATUSES)[number];

export interface StudentPayment {
  id: string;
  studentId: string | null;
  studentName: string;
  classId: string | null;
  className: string | null;
  amount: number;
  planAmount: number | null;
  paymentDate: string;
  month: number;
  year: number;
  paymentTypeId: string | null;
  paymentTypeName: string | null;
  paymentTypeCode: string | null;
  receiptNumber: string;
  status: StudentPaymentStatus;
  note: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdByRole: string | null;
  updatedBy: string | null;
  updatedByName: string | null;
  updatedByRole: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export interface StudentPaymentStats {
  monthlyPlan: number;
  collected: number;
  remaining: number;
  paidToday: number;
  count: number;
}

export interface StudentPaymentPageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface StudentPaymentListResult {
  items: StudentPayment[];
  meta: StudentPaymentPageMeta;
  stats: StudentPaymentStats;
}

export interface PaymentTypeOption {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  sortOrder: number;
}

export interface StudentPaymentOptions {
  paymentTypes: PaymentTypeOption[];
}

export interface StudentPaymentListParams {
  page?: number;
  limit?: number;
  search?: string;
  month?: number;
  year?: number;
  paymentTypeId?: string;
  paymentTypeCode?: string;
  classId?: string;
  studentId?: string;
  status?: StudentPaymentStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface StudentPaymentInput {
  studentId: string;
  amount: number;
  planAmount?: number;
  paymentTypeId?: string;
  paymentDate?: string;
  month?: number;
  year?: number;
  receiptNumber?: string;
  status?: StudentPaymentStatus;
  note?: string;
}

function cleanParams(
  params: StudentPaymentListParams,
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      out[key] = value as string | number;
    }
  }
  return out;
}

const api = {
  list(params: StudentPaymentListParams): Promise<StudentPaymentListResult> {
    return apiRequest<StudentPaymentListResult>("/student-payments", { query: cleanParams(params) });
  },
  options(): Promise<StudentPaymentOptions> {
    return apiRequest<StudentPaymentOptions>("/student-payments/options");
  },
  exportRows(params: StudentPaymentListParams): Promise<StudentPayment[]> {
    return apiRequest<StudentPayment[]>("/student-payments/export", { query: cleanParams(params) });
  },
  get(id: string): Promise<StudentPayment> {
    return apiRequest<StudentPayment>(`/student-payments/${id}`);
  },
  create(input: StudentPaymentInput): Promise<StudentPayment> {
    return apiRequest<StudentPayment>("/student-payments", { method: "POST", body: input });
  },
  update(id: string, input: Partial<StudentPaymentInput>): Promise<StudentPayment> {
    return apiRequest<StudentPayment>(`/student-payments/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/student-payments/${id}`, { method: "DELETE" });
  },
};

const KEY = ["student-payments"] as const;
const OPTIONS_KEY = ["student-payments", "options"] as const;

export function useStudentPayments(params: StudentPaymentListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useStudentPaymentOptions() {
  return useQuery({
    queryKey: OPTIONS_KEY,
    queryFn: () => api.options(),
    staleTime: 5 * 60_000,
  });
}

export function useStudentPayment(id: string | null) {
  return useQuery({
    queryKey: [...KEY, "detail", id],
    queryFn: () => api.get(id as string),
    enabled: !!id,
  });
}

export function useCreateStudentPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StudentPaymentInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateStudentPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<StudentPaymentInput> }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteStudentPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function exportStudentPayments(params: StudentPaymentListParams): Promise<StudentPayment[]> {
  return api.exportRows(params);
}

export const MONTH_LABELS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
] as const;

/** Oy nomi (1–12). Diapazondan tashqarida "—". */
export function monthLabel(month: number | null | undefined): string {
  if (!month || month < 1 || month > 12) return "—";
  return MONTH_LABELS[month - 1];
}

export const STATUS_LABELS: Record<StudentPaymentStatus, string> = {
  paid: "To‘langan",
  partial: "Qisman",
  pending: "Kutilmoqda",
};

/** Holatga mos rang ohangi (badge uchun). */
export const STATUS_TONES: Record<StudentPaymentStatus, string> = {
  paid: "bg-emerald-500/12 text-emerald-600",
  partial: "bg-amber-500/12 text-amber-600",
  pending: "bg-ink-muted/12 text-ink-muted",
};
