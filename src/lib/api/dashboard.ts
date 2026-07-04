import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "./client";

// Asosiy dashboard yig'ma ko'rsatkichlari (/analytics/overview). Seksiyalar
// server tomonda ruxsatga qarab kiritiladi — kelmagan seksiya = ruxsat yo'q.

export interface DashboardOverview {
  isOwner: boolean;
  generatedAt: string;
  students?: { active: number; newThisMonth: number; spark: number[] };
  attendanceToday?: {
    present: number;
    late: number;
    absent: number;
    totalActive: number;
    ratePct: number | null;
  };
  revenue?: { thisMonth: number; lastMonth: number; deltaPct: number | null; spark: number[] };
  debtors?: { count: number; amount: number };
  payrollFund?: { thisMonth: number };
  leads?: { newThisWeek: number; prevWeek: number; conversionRate: number | null; spark: number[] };
  /** BUGUN paneli: dars sessiyalari holati. */
  sessionsToday?: { total: number; confirmed: number; cancelled: number; pending: number };
  /** BUGUN paneli: bugun qabul qilingan to'lovlar. */
  paymentsToday?: { count: number; amount: number };
  /** BUGUN paneli: bugun kelmagan o'quvchilar (birinchi 8 ta ism). */
  absentPreview?: string[];
  /** Grafik: oxirgi 30 kun davomat foizi (yozuvsiz kun null — dam olish). */
  attendanceTrend?: Array<{ date: string; came: number; pct: number | null }>;
  /** Grafik: lidlar voronkasi (kanban tartibida, oxirida rejected). */
  leadFunnel?: Array<{ status: string; count: number }>;
  /** FAQAT EGA: filiallar taqqoslash jadvali. */
  branches?: Array<{
    id: string | null;
    name: string;
    students: number;
    revenueThisMonth: number;
    cameToday: number;
    attendancePct: number | null;
    leadsWeek: number;
  }>;
  /** FAQAT EGA: oxirgi faoliyat (audit'dan 10 yozuv). */
  recentActivity?: Array<{ at: string; actor: string | null; action: string; entity: string }>;
  actionCenter: Array<{ key: string; count: number }>;
}

export function useDashboardOverview() {
  return useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: () => apiRequest<DashboardOverview>("/analytics/overview"),
    staleTime: 30_000,
    // Davomat "jonli" bo'lishi uchun — sahifa ochiq turganda minutiga bir yangilanadi.
    refetchInterval: 60_000,
  });
}

/** 128_000_000 → "128 mln", 45_000 → "45 ming" (dashboard kartalari uchun ixcham). */
export function formatMoneyShort(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${trim(value / 1_000_000_000)} mlrd`;
  if (abs >= 1_000_000) return `${trim(value / 1_000_000)} mln`;
  if (abs >= 10_000) return `${trim(value / 1_000)} ming`;
  return new Intl.NumberFormat("uz-UZ").format(value);
}

function trim(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
