import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

// ─── Sertifikatlar ────────────────────────────────────────────────────────────

export interface StaffCertificate {
  id: string;
  staffMemberId: string;
  name: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface StaffCertificateInput {
  name: string;
  expiresAt?: string;
}

// ─── Yutuqlar ─────────────────────────────────────────────────────────────────

export type StaffAchievementCategory =
  | "academic"
  | "olympiad"
  | "sport"
  | "art"
  | "community"
  | "participation";

export type StaffAchievementRank =
  | "first"
  | "second"
  | "third"
  | "fourth"
  | "fifth"
  | "participation";

export type StaffAchievementIcon =
  | "trophy"
  | "medal"
  | "award"
  | "star"
  | "certificate"
  | "crown";

export interface StaffAchievement {
  id: string;
  staffMemberId: string;
  title: string;
  category: StaffAchievementCategory;
  rank: StaffAchievementRank;
  icon: StaffAchievementIcon;
  achievedAt: string | null;
  organization: string | null;
  description: string | null;
  certificateUrl: string | null;
  createdAt: string;
}

export interface StaffAchievementInput {
  title: string;
  category?: StaffAchievementCategory;
  rank?: StaffAchievementRank;
  icon?: StaffAchievementIcon;
  achievedAt?: string;
  organization?: string;
  description?: string;
  certificateUrl?: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

const api = {
  listCertificates(staffId: string): Promise<StaffCertificate[]> {
    return apiRequest<StaffCertificate[]>(`/hr/staff/${staffId}/certificates`);
  },
  createCertificate(staffId: string, input: StaffCertificateInput): Promise<StaffCertificate> {
    return apiRequest<StaffCertificate>(`/hr/staff/${staffId}/certificates`, { method: "POST", body: input });
  },
  updateCertificate(staffId: string, certId: string, input: Partial<StaffCertificateInput>): Promise<StaffCertificate> {
    return apiRequest<StaffCertificate>(`/hr/staff/${staffId}/certificates/${certId}`, { method: "PATCH", body: input });
  },
  removeCertificate(staffId: string, certId: string): Promise<void> {
    return apiRequest<void>(`/hr/staff/${staffId}/certificates/${certId}`, { method: "DELETE" });
  },
  listAchievements(staffId: string): Promise<StaffAchievement[]> {
    return apiRequest<StaffAchievement[]>(`/hr/staff/${staffId}/achievements`);
  },
  createAchievement(staffId: string, input: StaffAchievementInput): Promise<StaffAchievement> {
    return apiRequest<StaffAchievement>(`/hr/staff/${staffId}/achievements`, { method: "POST", body: input });
  },
  updateAchievement(staffId: string, achId: string, input: Partial<StaffAchievementInput>): Promise<StaffAchievement> {
    return apiRequest<StaffAchievement>(`/hr/staff/${staffId}/achievements/${achId}`, { method: "PATCH", body: input });
  },
  removeAchievement(staffId: string, achId: string): Promise<void> {
    return apiRequest<void>(`/hr/staff/${staffId}/achievements/${achId}`, { method: "DELETE" });
  },
};

const CERT_KEY = (staffId: string) => ["hr", "staff", staffId, "certificates"] as const;
const ACH_KEY = (staffId: string) => ["hr", "staff", staffId, "achievements"] as const;

// ─── Sertifikat hooklari ──────────────────────────────────────────────────────

export function useStaffCertificates(staffId: string | null) {
  return useQuery({
    queryKey: CERT_KEY(staffId ?? ""),
    queryFn: () => api.listCertificates(staffId as string),
    enabled: !!staffId,
  });
}

export function useCreateStaffCertificate(staffId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StaffCertificateInput) => api.createCertificate(staffId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: CERT_KEY(staffId) }),
  });
}

export function useUpdateStaffCertificate(staffId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<StaffCertificateInput> }) =>
      api.updateCertificate(staffId, id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: CERT_KEY(staffId) }),
  });
}

export function useDeleteStaffCertificate(staffId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.removeCertificate(staffId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CERT_KEY(staffId) }),
  });
}

// ─── Yutuq hooklari ───────────────────────────────────────────────────────────

export function useStaffAchievements(staffId: string | null) {
  return useQuery({
    queryKey: ACH_KEY(staffId ?? ""),
    queryFn: () => api.listAchievements(staffId as string),
    enabled: !!staffId,
  });
}

export function useCreateStaffAchievement(staffId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StaffAchievementInput) => api.createAchievement(staffId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ACH_KEY(staffId) }),
  });
}

export function useUpdateStaffAchievement(staffId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<StaffAchievementInput> }) =>
      api.updateAchievement(staffId, id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ACH_KEY(staffId) }),
  });
}

export function useDeleteStaffAchievement(staffId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.removeAchievement(staffId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ACH_KEY(staffId) }),
  });
}

// ─── Yorliqlar ────────────────────────────────────────────────────────────────

export const STAFF_ACHIEVEMENT_CATEGORY_LABELS: Record<StaffAchievementCategory, string> = {
  academic: "Akademik",
  olympiad: "Olimpiada",
  sport: "Sport",
  art: "San'at",
  community: "Jamiyat",
  participation: "Ishtirok",
};

export const STAFF_ACHIEVEMENT_RANK_LABELS: Record<StaffAchievementRank, string> = {
  first: "1-o‘rin",
  second: "2-o‘rin",
  third: "3-o‘rin",
  fourth: "4-o‘rin",
  fifth: "5-o‘rin",
  participation: "Ishtirok",
};

export const STAFF_ACHIEVEMENT_ICON_LABELS: Record<StaffAchievementIcon, string> = {
  trophy: "Kubok",
  medal: "Medal",
  award: "Mukofot",
  star: "Yulduzcha",
  certificate: "Sertifikat",
  crown: "Toj",
};
