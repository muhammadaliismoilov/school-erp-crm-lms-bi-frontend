import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export type AchievementCategory =
  | "academic"
  | "olympiad"
  | "sport"
  | "art"
  | "community"
  | "participation";

export type AchievementRank =
  | "first"
  | "second"
  | "third"
  | "fourth"
  | "fifth"
  | "participation";

export type AchievementIcon =
  | "trophy"
  | "medal"
  | "award"
  | "star"
  | "certificate"
  | "crown";

export interface Achievement {
  id: string;
  studentId: string;
  title: string;
  category: AchievementCategory;
  rank: AchievementRank;
  icon: AchievementIcon;
  achievedAt?: string | null;
  organization?: string | null;
  description?: string | null;
  certificateUrl?: string | null;
  createdAt: string;
}

export interface AchievementStats {
  total: number;
  first: number;
  second: number;
  third: number;
}

export interface AchievementInput {
  title: string;
  category: AchievementCategory;
  rank: AchievementRank;
  icon?: AchievementIcon;
  achievedAt?: string;
  organization?: string;
  description?: string;
  certificateUrl?: string;
}

const KEY = (studentId: string) => ["student-achievements", studentId] as const;

export function useAchievements(studentId: string, category?: AchievementCategory) {
  return useQuery({
    queryKey: [...KEY(studentId), category ?? "all"],
    queryFn: () =>
      apiRequest<Achievement[]>(`/students/${studentId}/achievements`, {
        query: category ? { category } : undefined,
      }),
  });
}

export function useAchievementStats(studentId: string) {
  return useQuery({
    queryKey: [...KEY(studentId), "stats"],
    queryFn: () =>
      apiRequest<AchievementStats>(`/students/${studentId}/achievements/stats`),
  });
}

export function useCreateAchievement(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AchievementInput) =>
      apiRequest<Achievement>(`/students/${studentId}/achievements`, {
        method: "POST",
        body: input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(studentId) }),
  });
}

export function useUpdateAchievement(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AchievementInput> }) =>
      apiRequest<Achievement>(`/students/${studentId}/achievements/${id}`, {
        method: "PATCH",
        body: input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(studentId) }),
  });
}

export function useDeleteAchievement(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ id: string }>(`/students/${studentId}/achievements/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(studentId) }),
  });
}
