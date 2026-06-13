/**
 * Sana va son formatlash — butun app bo'ylab yagona qoida.
 *
 * Sana: ko'rinish `dd/mm/yyyy` (kun/oy/yil), saqlash/jo'natish ISO `yyyy-mm-dd`.
 * Son:  ko'rinish mingliklar oddiy bo'shliq bilan `100 000`, kasr saqlanadi
 *       (`1 000.5`). Backendga bo'shliqsiz toza son ketadi (`100000.5`).
 *
 * Hammasi pure funksiya — vitest bilan test qilinadi.
 */

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})/; // yyyy-mm-dd[...]
const DMY_RE = /^(\d{2})\/(\d{2})\/(\d{4})$/; // dd/mm/yyyy

/** ISO `yyyy-mm-dd` (yoki to'liq ISO datetime) → `dd/mm/yyyy`. Noto'g'ri → "". */
export function isoToDMY(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = ISO_RE.exec(iso);
  if (!m) return "";
  const [, y, mo, d] = m;
  return `${d}/${mo}/${y}`;
}

/**
 * `dd/mm/yyyy` → ISO `yyyy-mm-dd`. To'liq emas yoki haqiqiy sana bo'lmasa null.
 * Kalendar haqiqiyligini ham tekshiradi (masalan 31/02/2026 → null).
 */
export function dmyToISO(dmy: string | null | undefined): string | null {
  if (!dmy) return null;
  const m = DMY_RE.exec(dmy.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  // Haqiqiy kalendar sanasi tekshiruvi (oy/yil overflow'siz).
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() !== month - 1 ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/**
 * Foydalanuvchi yozayotgan matnni progressiv `dd/mm/yyyy` ko'rinishiga keltiradi.
 * Faqat raqamlarni oladi, `/` ni avtomatik qo'yadi, 8 raqam bilan cheklaydi.
 */
export function maskDMY(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const parts: string[] = [];
  if (digits.length >= 1) parts.push(digits.slice(0, 2));
  if (digits.length >= 3) parts.push(digits.slice(2, 4));
  if (digits.length >= 5) parts.push(digits.slice(4, 8));
  return parts.join("/");
}

/** Har qanday sana qiymatini ko'rsatish uchun `dd/mm/yyyy`. Noto'g'ri/bo'sh → "—". */
export function formatDateDMY(value: string | Date | null | undefined): string {
  if (!value) return "—";
  let iso: string;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "—";
    iso = value.toISOString();
  } else {
    iso = value;
  }
  const out = isoToDMY(iso);
  if (out) return out;
  // ISO bo'lmagan format kelsa, Date orqali urinib ko'ramiz.
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/**
 * Sonni mingliklar oddiy bo'shliq bilan ko'rsatadi: `100000` → `100 000`,
 * `1000.5` → `1 000.5`. Noto'g'ri/bo'sh → "—".
 */
export function formatNumberSpaced(
  value: number | string | null | undefined,
): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  const neg = n < 0;
  const abs = Math.abs(n);
  const [intPart, fracPart] = String(abs).split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const body = fracPart ? `${grouped}.${fracPart}` : grouped;
  return neg ? `-${body}` : body;
}

/**
 * Input ichida yozilayotgan sonni live `100 000` ko'rinishiga keltiradi.
 * `allowDecimal` rost bo'lsa bitta `.` va kasr qismini saqlaydi.
 * Bo'sh kiritma → "".
 */
export function maskNumber(raw: string, allowDecimal = false): string {
  if (raw == null) return "";
  const neg = raw.trim().startsWith("-");
  let cleaned = raw.replace(/[^\d.]/g, "");
  if (allowDecimal) {
    const firstDot = cleaned.indexOf(".");
    if (firstDot !== -1) {
      const intDigits = cleaned.slice(0, firstDot).replace(/\./g, "");
      const fracDigits = cleaned.slice(firstDot + 1).replace(/\./g, "");
      cleaned = `${intDigits}.${fracDigits}`;
    }
  } else {
    cleaned = cleaned.replace(/\./g, "");
  }
  if (cleaned === "" || cleaned === ".") return cleaned === "." ? "0." : "";
  const [intPart, fracPart] = cleaned.split(".");
  const intClean = intPart.replace(/^0+(?=\d)/, "") || "0";
  const grouped = intClean.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  let out = grouped;
  if (allowDecimal && cleaned.includes(".")) out = `${grouped}.${fracPart ?? ""}`;
  return neg ? `-${out}` : out;
}

/** Maskalangan sonni backendga jo'natish uchun toza string: `100 000.5` → `100000.5`. */
export function stripNumber(masked: string | null | undefined): string {
  if (masked == null) return "";
  return masked.replace(/\s/g, "").trim();
}

/** Maskalangan sonni number ga aylantiradi. Bo'sh/noto'g'ri → null. */
export function toNumber(masked: string | null | undefined): number | null {
  const s = stripNumber(masked);
  if (s === "" || s === "-" || s === ".") return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}
