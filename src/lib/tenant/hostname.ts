/**
 * Bitta manba — hostname'ga asoslangan subdomain-tenant aniqlash mantig'i.
 * Edge middleware'da ham, brauzerda (login sahifasi) ham ishlatiladi,
 * shuning uchun faqat pure JS — Node'ga xos API yo'q. Har funksiya o'z
 * kirishini mustaqil normallashtiradi (port kesish + kichik harf).
 */

function normalizeHostname(hostWithPort: string): string {
  return (hostWithPort.split(":")[0] ?? "").toLowerCase();
}

export function stripPort(hostWithPort: string): string {
  return normalizeHostname(hostWithPort);
}

/**
 * Vercel preview/production alias domenlari — `crm.uz` DNS ko'chishi
 * yakunlanmaguncha hozirgi (global SchoolSwitcher) xatti-harakatni saqlaydi.
 */
export function isTenantBypassHostname(hostname: string): boolean {
  const h = normalizeHostname(hostname);
  return h === "vercel.app" || h.endsWith(".vercel.app");
}

/** Superadmin sirti — barcha maktablarni ko'radi, SchoolSwitcher shu yerda ishlaydi. */
export function isAdminHostname(hostname: string): boolean {
  return normalizeHostname(hostname).split(".")[0] === "admin";
}

/** Apex — hech qanday subdomainsiz asosiy domen (masalan `crm.uz`, `localhost`). */
export function isRootHostname(hostname: string): boolean {
  const h = normalizeHostname(hostname);
  return h === "crm.uz" || h === "localhost";
}
