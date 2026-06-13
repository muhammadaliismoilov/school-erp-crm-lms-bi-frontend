import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface AcademicYearStats {
  totalCount: number;
  currentYearName: string | null;
  currentCalendarYear: number;
}

export interface AcademicYearListResult {
  items: AcademicYear[];
  stats: AcademicYearStats;
}

export interface AcademicYearInput {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
}

const api = {
  list(): Promise<AcademicYearListResult> {
    return apiRequest<AcademicYearListResult>("/academic/years");
  },
  create(input: AcademicYearInput): Promise<AcademicYear> {
    return apiRequest<AcademicYear>("/academic/years", { method: "POST", body: input });
  },
  update(id: string, input: Partial<AcademicYearInput>): Promise<AcademicYear> {
    return apiRequest<AcademicYear>(`/academic/years/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/academic/years/${id}`, { method: "DELETE" });
  },
  setCurrent(id: string): Promise<AcademicYear> {
    return apiRequest<AcademicYear>(`/academic/years/${id}/set-current`, { method: "POST", body: {} });
  },
};

const KEY = ["academic-years"] as const;

export function useAcademicYears() {
  return useQuery({ queryKey: KEY, queryFn: () => api.list(), staleTime: 30_000 });
}

export function useCreateAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AcademicYearInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AcademicYearInput> }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSetCurrentAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.setCurrent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
