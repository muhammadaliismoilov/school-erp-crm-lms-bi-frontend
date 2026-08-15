import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

export type QuarterStatus = "planned" | "current" | "completed";

export interface Quarter {
  id: string;
  academicYearId: string;
  quarterNumber: number;
  name: string;
  startDate: string;
  endDate: string;
  status: QuarterStatus;
  academicYear?: { id: string; name: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuarterStats {
  total: number;
  planned: number;
  current: number;
  completed: number;
}

export interface QuarterListResult {
  items: Quarter[];
  stats: QuarterStats;
}

export interface QuarterInput {
  academicYearId: string;
  quarterNumber: number;
  startDate: string;
  endDate: string;
}

const api = {
  list(academicYearId?: string): Promise<QuarterListResult> {
    // Query `query` opsiyasi orqali — qolgan modullar bilan bir xil (qo'lda
    // yozilgan `?...` yo'lni statik tahlildan yashirib qo'yardi).
    return apiRequest<QuarterListResult>("/academic/quarters", {
      query: { academicYearId },
    });
  },
  create(input: QuarterInput): Promise<Quarter> {
    return apiRequest<Quarter>("/academic/quarters", { method: "POST", body: input });
  },
  update(id: string, input: Partial<QuarterInput>): Promise<Quarter> {
    return apiRequest<Quarter>(`/academic/quarters/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/academic/quarters/${id}`, { method: "DELETE" });
  },
};

const KEY = (academicYearId?: string) => ["quarters", academicYearId ?? "all"] as const;

export function useQuarters(academicYearId?: string) {
  return useQuery({
    queryKey: KEY(academicYearId),
    queryFn: () => api.list(academicYearId),
    staleTime: 30_000,
  });
}

export function useCreateQuarter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: QuarterInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quarters"] }),
  });
}

export function useUpdateQuarter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<QuarterInput> }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quarters"] }),
  });
}

export function useDeleteQuarter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quarters"] }),
  });
}
