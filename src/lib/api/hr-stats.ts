import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "./client";

export interface HrStatsOverview {
  staff: { total: number; active: number; onLeaveToday: number; newThisMonth: number };
  attendance: { presentToday: number; activeStaff: number; rate: number };
  recruitment: { openVacancies: number; activeCandidates: number; hiredThisMonth: number };
  interactions: { total: number; completed: number };
  tasks: { total: number; done: number };
}

const api = {
  overview(): Promise<HrStatsOverview> {
    return apiRequest<HrStatsOverview>("/hr/statistics/overview");
  },
};

const KEY = ["hr", "statistics"] as const;

export function useHrStats() {
  return useQuery({
    queryKey: [...KEY, "overview"],
    queryFn: () => api.overview(),
    staleTime: 30_000,
  });
}
