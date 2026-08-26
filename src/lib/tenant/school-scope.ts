import type { AuthenticatedUser } from "@/lib/api/types";
import { isAdminHostname, isRootHostname, isTenantBypassHostname } from "./hostname";

/**
 * Maktab tanlagichi (SchoolSwitcher) ko'rinishi qoidalari — sof mantiq.
 *
 * Komponentdan ajratilgan: bu yerda React yo'q, shuning uchun qoidalarni
 * to'g'ridan-to'g'ri test qilish mumkin. Ko'rinish sharti ikki qismdan iborat
 * va IKKALASI ham bajarilishi shart: hisob global bo'lishi va sirt maktabga
 * qulflanmagan bo'lishi.
 */

/**
 * Hisob barcha maktablar ustidan ishlaydimi.
 *
 * Mezon ROL EMAS, balki maktabga bog'lanmaganlik: `schoolId === null`.
 * Ilgari `roles.includes("super-admin")` ishlatilardi va global CEO (`ceo`
 * roli, `schoolId=null`) tanlagichni ko'rmasdi.
 *
 * `undefined` ATAYLAB global hisoblanmaydi: eski sessiya token'ida maydon
 * umuman bo'lmasligi mumkin, va uni "global" deb talqin qilish maktabga
 * bog'langan foydalanuvchiga begona maktablar ro'yxatini ko'rsatib qo'yardi.
 * Bunday sessiyalar uchun `super-admin` roli zaxira mezon bo'lib qoladi.
 */
export function isGlobalAccount(user: Pick<AuthenticatedUser, "roles" | "schoolId"> | null | undefined): boolean {
  if (!user) return false;
  return user.schoolId === null || (user.roles ?? []).includes("super-admin");
}

/**
 * Shu sirtda maktab almashtirish mumkinmi.
 *
 * Real maktab subdomenida (`elegantschool.crm.uz`) ATAYLAB mumkin emas — u
 * yerda butun sirt bitta maktabga qulflangan, global hisob ham boshqasiga
 * o'ta olmaydi. Ruxsat etilgan sirtlar: `admin.*`, apex (`crm.uz`), lokal
 * `localhost` va hozirgi Vercel manzillari.
 */
export function isSchoolSwitchableHost(hostname: string): boolean {
  return isAdminHostname(hostname) || isRootHostname(hostname) || isTenantBypassHostname(hostname);
}

/** Tanlagich shu foydalanuvchi va shu sirt uchun ko'rinadimi. */
export function canSeeSchoolSwitcher(
  user: Pick<AuthenticatedUser, "roles" | "schoolId"> | null | undefined,
  hostname: string,
): boolean {
  return isGlobalAccount(user) && isSchoolSwitchableHost(hostname);
}
