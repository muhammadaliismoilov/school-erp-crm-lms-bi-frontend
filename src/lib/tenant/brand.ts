import type { AuthenticatedUser } from "@/lib/api/types";
import { PLATFORM_NAME } from "@/lib/platform";
import { isGlobalAccount } from "./school-scope";

/**
 * Yon paneldagi brend — sof mantiq (React yo'q, to'g'ridan-to'g'ri test qilinadi).
 *
 * NEGA: ilgari hamma foydalanuvchi bir xil "School / CONSOLE" yozuvini ko'rardi.
 * Ko'p maktabli platformada bu ikki narsani yashiradi: (1) foydalanuvchi QAYSI
 * maktabda ishlayotganini, (2) global hisob maktab hisobidan farq qilishini.
 *
 * Yechim ko'p ijarali SaaS naqshi bo'yicha: BIRINCHI qator — kontekst egasi
 * (maktab nomi yoki "Bosh ofis"), IKKINCHI qator — platforma/doira tavsifi.
 * Ya'ni bir qarashda "men kimman va qayerdaman" o'qiladi.
 */

export type BrandKind = "global" | "school" | "fallback";

export interface Brand {
  kind: BrandKind;
  /** Katta, birinchi qator — kontekst egasi. */
  title: string;
  /** Kichik, ikkinchi qator — i18n kaliti (doira tavsifi). */
  subtitleKey: string;
  /**
   * Nishondagi harflar. Global hisobda `null` — u yerda harf emas, belgi
   * chiziladi: global hisob maktab hisoblaridan KO'RINISHI bilan ajralib tursin.
   */
  initials: string | null;
}

/**
 * Maktab nomidan nishon harflari: ikki so'zdan bosh harflar ("Elegant School"
 * → "ES"), bir so'zdan dastlabki ikki harf ("Uno" → "UN").
 */
export function schoolInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function resolveBrand(
  user: Pick<AuthenticatedUser, "roles" | "schoolId" | "schoolName"> | null | undefined,
): Brand {
  // Global hisob (CEO, super-admin) — maktabdan YUQORIDA turadi, shuning uchun
  // maktab nomi emas, doira nomi ko'rsatiladi.
  if (isGlobalAccount(user)) {
    return {
      kind: "global",
      title: "Bosh ofis",
      subtitleKey: "brand.network",
      initials: null,
    };
  }

  const name = user?.schoolName?.trim();
  if (name) {
    return { kind: "school", title: name, subtitleKey: "brand.school", initials: schoolInitials(name) };
  }

  // Maktab nomi yetib kelmagan (eski sessiya, yoki maktab o'chirilgan) —
  // platforma nomiga tushamiz, "School" degan begona so'z chiqmasin.
  return { kind: "fallback", title: PLATFORM_NAME, subtitleKey: "brand.console", initials: null };
}
