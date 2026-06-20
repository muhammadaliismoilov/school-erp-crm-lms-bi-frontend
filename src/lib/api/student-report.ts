import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

// ----------------------------------------------------------------- Conclusions

export interface StudentConclusion {
  studentId: string;
  academicYearId?: string | null;
  tutorNote?: string | null;
  tutorMetrics: Record<string, number>;
  psychologistNote?: string | null;
  psychMetrics: Record<string, number>;
}

export interface ConclusionInput {
  academicYearId?: string;
  tutorNote?: string;
  tutorMetrics?: Record<string, number>;
  psychologistNote?: string;
  psychMetrics?: Record<string, number>;
}

// ----------------------------------------------------------------- SMART goals

export interface SmartGoalItem {
  id?: string;
  title: string;
  deadline?: string | null;
  result?: string | null;
}

export interface StudentSmartGoals {
  studentId: string;
  academicYearId?: string | null;
  characterNote?: string | null;
  developmentNote?: string | null;
  workNote?: string | null;
  smartGoals: SmartGoalItem[];
}

export interface SmartGoalsInput {
  academicYearId?: string;
  characterNote?: string;
  developmentNote?: string;
  workNote?: string;
  smartGoals?: SmartGoalItem[];
}

const KEY = (studentId: string) => ["student-report", studentId] as const;

export function useConclusion(studentId: string) {
  return useQuery({
    queryKey: [...KEY(studentId), "conclusion"],
    queryFn: () => apiRequest<StudentConclusion>(`/students/${studentId}/conclusions`),
  });
}

export function useUpsertConclusion(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ConclusionInput) =>
      apiRequest<StudentConclusion>(`/students/${studentId}/conclusions`, {
        method: "PUT",
        body: input,
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [...KEY(studentId), "conclusion"] }),
  });
}

export function useSmartGoals(studentId: string) {
  return useQuery({
    queryKey: [...KEY(studentId), "smart-goals"],
    queryFn: () => apiRequest<StudentSmartGoals>(`/students/${studentId}/smart-goals`),
  });
}

export function useUpsertSmartGoals(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SmartGoalsInput) =>
      apiRequest<StudentSmartGoals>(`/students/${studentId}/smart-goals`, {
        method: "PUT",
        body: input,
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [...KEY(studentId), "smart-goals"] }),
  });
}
