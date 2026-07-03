import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

// Backend: NotificationChannelController (/notification-channels) — o'z kanallari.

export type NotificationChannelType = "telegram" | "push";

export interface NotificationChannel {
  id: string;
  type: NotificationChannelType;
  address: string;
  isPreferred: boolean;
  language: string;
  active: boolean;
}

export interface RegisterChannelInput {
  type: NotificationChannelType;
  address: string;
  language?: string;
  isPreferred?: boolean;
}

const KEY = ["notification-channels"] as const;

export function useMyChannels() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => apiRequest<NotificationChannel[]>("/notification-channels"),
    staleTime: 30_000,
  });
}

export function useRegisterChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterChannelInput) =>
      apiRequest<NotificationChannel>("/notification-channels", { method: "PUT", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (type: NotificationChannelType) =>
      apiRequest<void>(`/notification-channels/${type}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
