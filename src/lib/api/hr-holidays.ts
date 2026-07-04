import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

// Ish kalendari (/hr/holidays) — bayram/dam olish kunlari. Oklad xodimning
// kunlik stavkasi (oylik ÷ ish kunlari) shu kalendarga bog'liq.

export interface Holiday {
  id: string;
  date: string;
  name: string;
}

export interface HolidayInput {
  date: string;
  name: string;
}

const api = {
  list(from?: string, to?: string): Promise<Holiday[]> {
    const query: Record<string, string> = {};
    if (from) query.from = from;
    if (to) query.to = to;
    return apiRequest<Holiday[]>("/hr/holidays", { query });
  },
  create(input: HolidayInput): Promise<Holiday> {
    return apiRequest<Holiday>("/hr/holidays", { method: "POST", body: input });
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/hr/holidays/${id}`, { method: "DELETE" });
  },
};

const KEY = ["hr", "holidays"] as const;

export function useHolidays(from?: string, to?: string) {
  return useQuery({
    queryKey: [...KEY, from ?? "", to ?? ""],
    queryFn: () => api.list(from, to),
    staleTime: 30_000,
  });
}

export function useCreateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: HolidayInput) => api.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
