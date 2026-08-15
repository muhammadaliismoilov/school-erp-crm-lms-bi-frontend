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
      ? entry.children.map((child) => ({ href: child.href, permission: child.permission }))
      : [{ href: entry.href, permission: entry.permission }],
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
  return matchRouteRule(path)?.permission;
}
