import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

// Qurilmalar (sessiyalar) boshqaruvi — har kim faqat o'zinikini ko'radi/boshqaradi.

export interface UserSessionInfo {
  id: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastSeenAt: string | null;
  /** Shu brauzerning joriy sessiyasi (o'chirib bo'lmaydi — logout orqali). */
  current: boolean;
}

const KEY = ["auth", "sessions"] as const;

export function useMySessions() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => apiRequest<UserSessionInfo[]>("/auth/sessions"),
    staleTime: 15_000,
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest<{ revoked: boolean }>(`/auth/sessions/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRevokeOtherSessions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<{ revokedCount: number }>("/auth/sessions/others", { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Kirish tarixi — oxirgi 20 sessiya (chiqarilganlar ham). */
export interface SessionHistoryEntry extends UserSessionInfo {
  revokedAt: string | null;
}

export function useSessionHistory() {
  return useQuery({
    queryKey: [...KEY, "history"],
    queryFn: () => apiRequest<SessionHistoryEntry[]>("/auth/sessions/history"),
    staleTime: 30_000,
  });
}

// ─── Ikki bosqichli tekshiruv (2FA) ─────────────────────────────────────────

const TFA_KEY = ["auth", "2fa"] as const;

export function useTwoFactorStatus() {
  return useQuery({
    queryKey: TFA_KEY,
    queryFn: () => apiRequest<{ enabled: boolean }>("/auth/2fa/status"),
    staleTime: 30_000,
  });
}

export function useSetupTwoFactor() {
  return useMutation({
    mutationFn: () =>
      apiRequest<{ secret: string; otpauthUrl: string }>("/auth/2fa/setup", { method: "POST" }),
  });
}

export function useEnableTwoFactor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) =>
      apiRequest<{ enabled: boolean }>("/auth/2fa/enable", { method: "POST", body: { code } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: TFA_KEY }),
  });
}

export function useDisableTwoFactor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) =>
      apiRequest<{ enabled: boolean }>("/auth/2fa/disable", { method: "POST", body: { code } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: TFA_KEY }),
  });
}

export function useChangePassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      apiRequest<{ changed: boolean; revokedOtherSessions: number }>("/auth/change-password", {
        method: "POST",
        body: input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
