import type { Appeal, AppealStatus } from "@/lib/api/appeals";

/**
 * Murojaat muddati bo'yicha sof mantiq — React'siz, shuning uchun
 * to'g'ridan-to'g'ri test qilinadi.
 */

/** Yopilgan murojaatning muddati endi ahamiyatsiz. */
const OPEN_STATUSES: readonly AppealStatus[] = ["pending", "in_progress"];

export type SlaTone = "overdue" | "soon" | "calm" | "closed";

export interface SlaState {
  tone: SlaTone;
  /** Muddatgacha (musbat) yoki muddatdan keyin (manfiy) qolgan to'liq soatlar. */
  hoursLeft: number;
  /** Ko'rsatish uchun kun soni — har doim musbat, yaxlitlangan. */
  days: number;
  hours: number;
}

/**
 * Murojaat muddatining holati.
 *
 * `soon` chegarasi 24 soat: bir kundan kam qolgan murojaat bugun ko'rilishi
 * kerak, shuning uchun u ro'yxatda ajralib turadi. Yopilgan murojaat hech
 * qachon "kechikkan" bo'lmaydi — u allaqachon hal qilingan, muddat belgisi
 * faqat chalg'itadi.
 */
export function resolveSla(
  appeal: Pick<Appeal, "dueAt" | "status">,
  now: Date = new Date(),
): SlaState {
  const diffMs = new Date(appeal.dueAt).getTime() - now.getTime();
  const hoursLeft = Math.trunc(diffMs / 3_600_000);
  const absHours = Math.abs(hoursLeft);
  const state = {
    hoursLeft,
    days: Math.floor(absHours / 24),
    hours: absHours % 24,
  };

  if (!OPEN_STATUSES.includes(appeal.status)) {
    return { ...state, tone: "closed" };
  }
  if (diffMs < 0) return { ...state, tone: "overdue" };
  if (hoursLeft < 24) return { ...state, tone: "soon" };
  return { ...state, tone: "calm" };
}

/**
 * Murojaat qiluvchi nomi.
 *
 * Anonim bo'lsa ism KO'RSATILMAYDI — backend uni saqlamaydi ham, lekin bu
 * yerdagi tekshiruv eski yozuvlarni ham qoplaydi (ikkinchi himoya qatlami,
 * backend'dagi xabar matni bilan bir xil qoida).
 */
export function applicantName(
  appeal: Pick<Appeal, "isAnonymous" | "fullName">,
  anonymousLabel: string,
): string {
  if (appeal.isAnonymous) return anonymousLabel;
  return appeal.fullName?.trim() || anonymousLabel;
}

/** Holat tablari uchun tartib — ochiqlar oldinda, yopilganlar keyin. */
export const STATUS_TABS: readonly AppealStatus[] = [
  "pending",
  "in_progress",
  "resolved",
  "rejected",
];
