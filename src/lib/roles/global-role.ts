import type { Role } from "@/lib/api/roles";

/**
 * Global rol ogohlantirishi — sof mantiq.
 *
 * NEGA KERAK: global rol (`isGlobal`) barcha maktablarda BIR XIL. Uni
 * tahrirlash yoki o'chirish har bir maktabdagi shu roldagi foydalanuvchilarga
 * tegadi va o'zgarish 30 soniya ichida kuchga kiradi (ruxsatlar reyestri
 * keshi). UI'da esa bu global rol maktab rolidan hech nima bilan farq
 * qilmasdi — CEO buni bilmasdan bosishi mumkin edi.
 *
 * Komponentdan ajratilgan: bu yerda React yo'q, shuning uchun qoidani
 * to'g'ridan-to'g'ri test qilish mumkin (RTL o'rnatilmagan).
 */

/** Ogohlantirish talab qiladigan amallar. */
export type RoleAction = "update" | "delete" | "create";

/**
 * Shu amal uchun tasdiq so'ralishi kerakmi.
 *
 * `create` ATAYLAB ogohlantirilmaydi: yangi rol hali hech kimga
 * biriktirilmagan, ya'ni portlash radiusi nol.
 */
export function requiresGlobalWarning(
  role: Pick<Role, "isGlobal"> | null | undefined,
  action: RoleAction,
): boolean {
  if (!role) return false;
  if (action === "create") return false;
  return role.isGlobal === true;
}

/**
 * Ogohlantirishda ko'rsatiladigan maktablar soni.
 *
 * Ro'yxat kelmagan bo'lsa (yuklanmoqda, yoki hisob global emas — u holda
 * `/hr/schools/options` bo'sh qaytadi) `null` qaytadi va UI raqamsiz,
 * umumiy matn ko'rsatadi. Noto'g'ri raqam ko'rsatishdan ko'ra raqamsiz
 * ogohlantirish yaxshiroq.
 */
export function affectedSchoolCount(schools: readonly unknown[] | undefined | null): number | null {
  if (!schools || schools.length === 0) return null;
  return schools.length;
}
