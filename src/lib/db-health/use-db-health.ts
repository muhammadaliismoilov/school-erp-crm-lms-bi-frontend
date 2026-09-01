"use client";

import { useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { useCan } from "@/lib/auth/use-can";
import {
  getDbHealth,
  isStale,
  subscribeDbHealth,
  type DbHealthLevel,
} from "./store";

export interface DbHealthDetail {
  level: DbHealthLevel;
  signals: ("pool_waiting" | "slow_queries" | "query_errors")[];
  waiting: number;
  slowPerMinute: number;
  errorsPerMinute: number;
  warmingUp: boolean;
}

/**
 * Chiroq ko'rsatadigan daraja.
 *
 * Asosiy manba — har javobdagi `X-Db-Health` sarlavhasi, ya'ni QO'SHIMCHA
 * SO'ROV YO'Q. Zaxira poll faqat foydalanuvchi jim turganda ishlaydi:
 * sarlavha kelmasa daraja eskiradi va chiroq haqiqatdan uzoqlashadi.
 */
export function useDbHealthLevel(): DbHealthLevel | null {
  const can = useCan();
  const canMonitor = can("system.monitor");

  const state = useSyncExternalStore(
    subscribeDbHealth,
    getDbHealth,
    // Server tomonda holat yo'q — chiroq faqat brauzerda chiziladi.
    () => ({ level: null, updatedAt: null }),
  );

  useQuery({
    queryKey: ["system", "db-health", "heartbeat"],
    // Javobning O'ZI kerak emas: `apiRequest` sarlavhani ushlab, holatni
    // yangilaydi. Bu so'rov shunchaki "jim turgan foydalanuvchi" holatida
    // yurakni urib turadi.
    queryFn: () => apiRequest<DbHealthDetail>("/system/db-health"),
    enabled: canMonitor && isStale(state, Date.now()),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: false,
  });

  return canMonitor ? state.level : null;
}

/**
 * Panel ochilganda batafsil raqamlar.
 *
 * ATAYLAB alohida: raqamlar har javobda uchib yurishi shart emas, ular
 * faqat foydalanuvchi "nega qizil?" deb so'raganda kerak.
 */
export function useDbHealthDetail(enabled: boolean) {
  return useQuery({
    queryKey: ["system", "db-health", "detail"],
    queryFn: () => apiRequest<DbHealthDetail>("/system/db-health"),
    enabled,
    refetchInterval: enabled ? 10_000 : false,
    retry: false,
  });
}
