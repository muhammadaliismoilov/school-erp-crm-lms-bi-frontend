import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

// Backend: TurnstileDeviceController (/turnstile-devices).

export type TurnstileDirection = "in" | "out" | "both";

export interface TurnstileDevice {
  id: string;
  deviceNumber: string;
  name: string | null;
  direction: TurnstileDirection;
  active: boolean;
  lastSeenAt?: string | null;
}

/** Yaratish/rotatsiyada API kalit BIR MARTA qaytariladi. */
export interface DeviceWithKey {
  id: string;
  deviceNumber: string;
  name: string | null;
  direction: TurnstileDirection;
  active: boolean;
  apiKey: string;
}

export interface DeviceInput {
  deviceNumber: string;
  name?: string;
  direction?: TurnstileDirection;
}

const api = {
  list(): Promise<TurnstileDevice[]> {
    return apiRequest<TurnstileDevice[]>("/turnstile-devices");
  },
  create(input: DeviceInput): Promise<DeviceWithKey> {
    return apiRequest<DeviceWithKey>("/turnstile-devices", { method: "POST", body: input });
  },
  update(id: string, input: Partial<DeviceInput> & { active?: boolean }): Promise<TurnstileDevice> {
    return apiRequest<TurnstileDevice>(`/turnstile-devices/${id}`, { method: "PATCH", body: input });
  },
  rotateKey(id: string): Promise<DeviceWithKey> {
    return apiRequest<DeviceWithKey>(`/turnstile-devices/${id}/rotate-key`, { method: "POST" });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/turnstile-devices/${id}`, { method: "DELETE" });
  },
};

const KEY = ["turnstile-devices"] as const;

export function useTurnstileDevices() {
  return useQuery({ queryKey: KEY, queryFn: api.list, staleTime: 30_000 });
}

export function useCreateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DeviceInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<DeviceInput> & { active?: boolean } }) =>
      api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRotateDeviceKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.rotateKey(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
