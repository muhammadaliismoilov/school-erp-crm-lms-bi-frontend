import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDateDMY, formatNumberSpaced } from "@/lib/format";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Pul summasi — mingliklar bo'shliq bilan, butun som: `100 000`. */
export function formatMoney(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  if (Number.isNaN(n)) return "—";
  return formatNumberSpaced(Math.round(n));
}

/** Sana ko'rsatish — `dd/mm/yyyy` (kun/oy/yil). */
export function formatDate(value: string | Date | null | undefined): string {
  return formatDateDMY(value);
}

export function initials(first?: string, last?: string): string {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
}

/** Reads a possibly-localized text field: a plain string or `{ uz, ru, en }`. */
export function loc(value: unknown): string {
  if (!value) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    return String(o.uz ?? o.en ?? o.ru ?? "—");
  }
  return String(value);
}

/** Joins first + last name from any object that carries them. */
export function fullName(value: unknown): string {
  if (!value || typeof value !== "object") return "—";
  const o = value as Record<string, unknown>;
  const name = [o.firstName, o.lastName].filter(Boolean).join(" ").trim();
  return name || String(o.fullName ?? o.username ?? "—");
}
