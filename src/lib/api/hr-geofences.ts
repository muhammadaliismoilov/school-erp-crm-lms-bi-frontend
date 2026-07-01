import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "./client";

export interface Geofence {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  radiusM: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface GeofenceListResult {
  items: Geofence[];
  meta: PageMeta;
}

export interface GeofenceListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GeofenceInput {
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  radiusM?: number | null;
  isActive?: boolean;
}

function cleanParams<T extends object>(params: T): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      out[key] = value as string | number;
    }
  }
  return out;
}

const api = {
  list(params: GeofenceListParams): Promise<GeofenceListResult> {
    return apiRequest<GeofenceListResult>("/hr/geofences", { query: cleanParams(params) });
  },
  create(input: GeofenceInput): Promise<Geofence> {
    return apiRequest<Geofence>("/hr/geofences", { method: "POST", body: input });
  },
  update(id: string, input: Partial<GeofenceInput>): Promise<Geofence> {
    return apiRequest<Geofence>(`/hr/geofences/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/hr/geofences/${id}`, { method: "DELETE" });
  },
};

const KEY = ["hr", "geofences"] as const;

export function useGeofenceList(params: GeofenceListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
}

export function useCreateGeofence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GeofenceInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateGeofence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<GeofenceInput> }) => api.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteGeofence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export const GEOFENCE_STATUS_LABELS = {
  active: "Faol",
  inactive: "Faol emas",
} as const;

/** Koordinatani jadval uchun 6 kasrli qilib ko'rsatadi (`0.000000`). */
export function formatCoordinate(value: number | null): string {
  return (value ?? 0).toFixed(6);
}

export const PAGE_SIZES = [10, 20, 50, 100] as const;
