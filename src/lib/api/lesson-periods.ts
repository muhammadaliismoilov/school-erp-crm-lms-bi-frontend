import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

export interface LessonPeriod {
  id: string;
  code: string;
  lessonNumber: number;
  startTime: string;
  endTime: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LessonPeriodStats {
  total: number;
  firstStartTime: string | null;
}

export interface LessonPeriodListResult {
  items: LessonPeriod[];
  stats: LessonPeriodStats;
}

export interface LessonPeriodInput {
  lessonNumber: number;
  startTime: string;
  endTime: string;
}

const api = {
  list(): Promise<LessonPeriodListResult> {
    return apiRequest<LessonPeriodListResult>("/academic/lesson-periods");
  },
  create(input: LessonPeriodInput): Promise<LessonPeriod> {
    return apiRequest<LessonPeriod>("/academic/lesson-periods", { method: "POST", body: input });
  },
  update(id: string, input: Partial<LessonPeriodInput>): Promise<LessonPeriod> {
    return apiRequest<LessonPeriod>(`/academic/lesson-periods/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/academic/lesson-periods/${id}`, { method: "DELETE" });
  },
};

const KEY = ["lesson-periods"] as const;

export function useLessonPeriods() {
  return useQuery({ queryKey: KEY, queryFn: () => api.list(), staleTime: 30_000 });
}

export function useCreateLessonPeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LessonPeriodInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateLessonPeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<LessonPeriodInput> }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteLessonPeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
