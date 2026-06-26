import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export const TRANSACTION_TYPES = ["income", "expense"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export type CategoryKind = "income" | "expense" | "both";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  purposeCategoryId: string | null;
  purposeCategoryName: string | null;
  paymentTypeId: string | null;
  paymentTypeName: string | null;
  personId: string | null;
  personName: string | null;
  personRole: string | null;
  month: number | null;
  year: number | null;
  note: string | null;
  receiptFileId: string | null;
  discountPercent: number | null;
  price: number | null;
  classId: string | null;
  studentId: string | null;
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

export interface TransactionStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  count: number;
}

export interface TransactionPageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface TransactionListResult {
  items: Transaction[];
  meta: TransactionPageMeta;
  stats: TransactionStats;
}

export interface MonthlyPoint {
  month: number;
  income: number;
  expense: number;
  net: number;
}

export interface BreakdownPoint {
  id: string | null;
  name: string;
  amount: number;
  count: number;
}

export interface TransactionStatistics {
  totals: TransactionStats;
  monthly: MonthlyPoint[];
  byCategory: BreakdownPoint[];
  byPaymentType: BreakdownPoint[];
}

export interface PaymentTypeOption {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  isSystem: boolean;
  sortOrder: number;
}

export interface CategoryOption {
  id: string;
  name: string;
  kind: CategoryKind;
  parentId: string | null;
  isStudentTuition: boolean;
  isActive: boolean;
  isSystem: boolean;
  sortOrder: number;
}

export interface TransactionOptions {
  paymentTypes: PaymentTypeOption[];
  categories: CategoryOption[];
}

export interface TransactionListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: TransactionType;
  paymentTypeId?: string;
  purposeCategoryId?: string;
  personId?: string;
  month?: number;
  dateFrom?: string;
  dateTo?: string;
  classId?: string;
  studentId?: string;
}

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  purposeCategoryId?: string;
  paymentTypeId?: string;
  personId?: string;
  month?: number;
  year?: number;
  date?: string;
  note?: string;
  receiptFileId?: string;
  discountPercent?: number;
  price?: number;
  classId?: string;
  studentId?: string;
}

export interface PaymentTypeInput {
  name: string;
  code?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CategoryInput {
  name: string;
  kind?: CategoryKind;
  parentId?: string;
  isStudentTuition?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

function cleanParams(params: TransactionListParams): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      out[key] = value as string | number;
    }
  }
  return out;
}

const api = {
  list(params: TransactionListParams): Promise<TransactionListResult> {
    return apiRequest<TransactionListResult>("/transactions", { query: cleanParams(params) });
  },
  statistics(params: TransactionListParams): Promise<TransactionStatistics> {
    return apiRequest<TransactionStatistics>("/transactions/statistics", { query: cleanParams(params) });
  },
  options(): Promise<TransactionOptions> {
    return apiRequest<TransactionOptions>("/transactions/options");
  },
  exportRows(params: TransactionListParams): Promise<Transaction[]> {
    return apiRequest<Transaction[]>("/transactions/export", { query: cleanParams(params) });
  },
  get(id: string): Promise<Transaction> {
    return apiRequest<Transaction>(`/transactions/${id}`);
  },
  create(input: TransactionInput): Promise<Transaction> {
    return apiRequest<Transaction>("/transactions", { method: "POST", body: input });
  },
  update(id: string, input: Partial<TransactionInput>): Promise<Transaction> {
    return apiRequest<Transaction>(`/transactions/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/transactions/${id}`, { method: "DELETE" });
  },
  createPaymentType(input: PaymentTypeInput): Promise<PaymentTypeOption> {
    return apiRequest<PaymentTypeOption>("/transactions/payment-types", { method: "POST", body: input });
  },
  createCategory(input: CategoryInput): Promise<CategoryOption> {
    return apiRequest<CategoryOption>("/transactions/categories", { method: "POST", body: input });
  },
};

const KEY = ["transactions"] as const;
const OPTIONS_KEY = ["transactions", "options"] as const;

export function useTransactions(params: TransactionListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useTransactionStatistics(params: TransactionListParams, enabled = true) {
  return useQuery({
    queryKey: [...KEY, "statistics", params],
    queryFn: () => api.statistics(params),
    placeholderData: keepPreviousData,
    enabled,
    staleTime: 30_000,
  });
}

export function useTransactionOptions() {
  return useQuery({
    queryKey: OPTIONS_KEY,
    queryFn: () => api.options(),
    staleTime: 5 * 60_000,
  });
}

export function useTransaction(id: string | null) {
  return useQuery({
    queryKey: [...KEY, "detail", id],
    queryFn: () => api.get(id as string),
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TransactionInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TransactionInput> }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCreatePaymentType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PaymentTypeInput) => api.createPaymentType(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: OPTIONS_KEY }),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryInput) => api.createCategory(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: OPTIONS_KEY }),
  });
}

export function exportTransactions(params: TransactionListParams): Promise<Transaction[]> {
  return api.exportRows(params);
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  income: "Kirim",
  expense: "Chiqim",
};

export const MONTH_LABELS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
] as const;

/** Oy nomi (1–12). Diapazondan tashqarida bo'sh satr. */
export function monthLabel(month: number | null | undefined): string {
  if (!month || month < 1 || month > 12) return "—";
  return MONTH_LABELS[month - 1];
}

/** Kirim → yashil tone, chiqim → qizil tone. */
export function typeTone(type: TransactionType): "income" | "expense" {
  return type;
}
