/**
 * Marshrut → imtiyoz jadvali.
 *
 * Yon panel `NAV_ITEMS` ni `can()` bilan filtrlab, ruxsatsiz bo'limlarni
 * yashiradi. Ammo yashirish — himoya emas: foydalanuvchi manzilni qo'lda yozsa
 * sahifa baribir ochilar edi. Shu modul har marshrut uchun talab qilinadigan
 * imtiyozni aniqlab beradi, `DashboardShell` esa shunga qarab sahifani
 * ko'rsatadi yoki "ruxsat yo'q" ekranini chizadi.
 *
 * Bu — QULAYLIK qatlami: foydalanuvchiga ishlamaydigan ekran ko'rsatmaslik
 * uchun. Haqiqiy himoya backend'da (`PermissionsGuard` + `@Permissions`), chunki
 * bu yerdagi imtiyozlar ro'yxati localStorage'dan o'qiladi va ishonchsiz.
 */

import { NAV_ITEMS, isGroup } from "@/lib/nav";

export interface RouteRule {
  /** Marshrut prefiksi, masalan "/hr/employees". */
  href: string;
  /** Talab qilinadigan imtiyoz; bo'sh bo'lsa — hammaga ochiq. */
  permission?: string;
  /** Muqobil kodlar: shulardan bittasi yetarli (nav yaprog'idagi bilan bir xil). */
  anyOf?: string[];
  /**
   * Maktab darajasidagi modul kaliti. Imtiyozdan ALOHIDA qatlam: imtiyoz bor,
   * lekin modul shu maktabga yoqilmagan bo'lishi mumkin.
   */
  module?: string;
}

/**
 * Yon panelda yo'q, lekin himoya talab qiladigan sahifalar.
 * Navdagi yaproqlar bilan bir xil semantikaga ega.
 */
export const EXTRA_ROUTE_RULES: readonly RouteRule[] = [
  // Nav yaproqlari /academic/* ostida; /academic ning o'zi o'quv yillari jadvali.
  { href: "/academic", permission: "academic-years.read" },
  // /reports/academic-overview endpointiga uradi → REPORTS_READ.
  { href: "/academic/reports", permission: "reports.read" },
  // Butun backend API konsoli — navdan olib tashlangan, ammo manzil ochiq qolgan.
  { href: "/explorer", permission: "settings.read" },
];

/**
 * Ataylab ochiq qoldirilgan marshrutlar — imtiyoz talab qilinmaydi.
 * Ro'yxat hujjat vazifasini ham bajaradi: yangi sahifa qo'shilib, u na navda,
 * na shu yerda bo'lsa, `route-permissions.test.ts` sinovi yiqiladi.
 */
export const PUBLIC_ROUTES: readonly string[] = [
  "/", // asosiy panel — har seksiya server tomonda rolga qarab kesiladi
  "/profile", // o'z profili
  "/profile/notifications",
  "/profile/payslips",
  "/profile/devices",
  "/academic/students", // /students ga redirect
  "/crm", // /crm/leads ga redirect
];

/**
 * Navdan olingan qoidalar. MEROS OLISH YO'Q: har yaproq o'z imtiyozini o'zi
 * ko'rsatadi (guruhda darvoza yo'q). Meros olish, guruh kodi keng bo'lgani
 * uchun, yaproqni haqiqatda tekshirilmaydigan kod bilan "himoyalab" turardi.
 */
function rulesFromNav(): RouteRule[] {
  return NAV_ITEMS.flatMap<RouteRule>((entry) =>
    isGroup(entry)
      ? entry.children.map((child) => ({
          href: child.href,
          permission: child.permission,
          anyOf: child.anyOf,
          module: child.module,
        }))
      : [
          {
            href: entry.href,
            permission: entry.permission,
            anyOf: entry.anyOf,
            module: entry.module,
          },
        ],
  );
}

/**
 * Barcha qoidalar, uzun prefiksdan qisqasiga saralangan — shu tartib tufayli
 * `/attendance/devices` `/attendance` dan ustun keladi.
 */
export const ROUTE_RULES: readonly RouteRule[] = [
  ...rulesFromNav(),
  ...EXTRA_ROUTE_RULES,
].sort((a, b) => b.href.length - a.href.length);

/** Yakuniy "/" ni olib tashlaydi: "/hr/" → "/hr" ("/" o'zi tegilmaydi). */
export function normalizePath(pathname: string): string {
  if (!pathname.startsWith("/")) return "/";
  const withoutTrailing = pathname.replace(/\/+$/, "");
  return withoutTrailing === "" ? "/" : withoutTrailing;
}

/**
 * Segment chegarasini hisobga oluvchi moslik.
 * Oddiy `startsWith` "/students" ni "/students-rating" ga ham moslar edi.
 */
export function isUnder(pathname: string, href: string): boolean {
  const path = normalizePath(pathname);
  const base = normalizePath(href);
  if (base === "/") return path === "/";
  return path === base || path.startsWith(`${base}/`);
}

/** Marshrutga eng mos (eng uzun) qoidani qaytaradi. */
export function matchRouteRule(pathname: string): RouteRule | undefined {
  return ROUTE_RULES.find((rule) => isUnder(pathname, rule.href));
}

/**
 * Marshrut uchun talab qilinadigan imtiyoz.
 * `undefined` — imtiyoz talab qilinmaydi (ochiq yoki qoidasiz sahifa).
 */
export function resolveRoutePermission(pathname: string): string | undefined {
  const path = normalizePath(pathname);
  if (PUBLIC_ROUTES.some((open) => normalizePath(open) === path)) {
    return undefined;
  }
  const rule = matchRouteRule(path);
  // Muqobilli marshrutda "talab qilinadigan kod" bitta emas — ko'rsatish uchun
  // birinchisi olinadi (`ForbiddenNotice` shuni yozadi), tekshiruvni esa
  // `resolveRouteRequirement` bajaradi.
  return rule?.permission ?? rule?.anyOf?.[0];
}

/**
 * Marshrut bayroqli modulga bog'langan bo'lsa — uning kaliti.
 *
 * Yon panel bayroqli bo'limni yashiradi, lekin manzilni QO'LDA yozib kirishni
 * bu to'smaydi: sahifa ochilib, ichidagi so'rovlar 403 qaytarardi va
 * foydalanuvchi umumiy xato ekranini ko'rardi. Shu funksiya marshrut
 * qorovulini ham xuddi menyu bilan bir xil manbaga bog'laydi.
 */
export function resolveRouteModule(pathname: string): string | undefined {
  const path = normalizePath(pathname);
  if (PUBLIC_ROUTES.some((open) => normalizePath(open) === path)) {
    return undefined;
  }
  return matchRouteRule(path)?.module;
}

/**
 * Marshrut uchun to'liq shart — `<Can>` va `useAllowed` bilan bir xil shakl.
 * Sahifa qorovuli aynan SHUNI baholashi kerak: `resolveRoutePermission` faqat
 * bitta kod qaytaradi va muqobilli marshrutda noto'g'ri javob berardi.
 */
export function resolveRouteRequirement(
  pathname: string,
): { permission?: string; anyOf?: string[] } | undefined {
  const path = normalizePath(pathname);
  if (PUBLIC_ROUTES.some((open) => normalizePath(open) === path)) {
    return undefined;
  }
  const rule = matchRouteRule(path);
  if (!rule) return undefined;
  if (!rule.permission && !rule.anyOf) return undefined;
  return { permission: rule.permission, anyOf: rule.anyOf };
}
