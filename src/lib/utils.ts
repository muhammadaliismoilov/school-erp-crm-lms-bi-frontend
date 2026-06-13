import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatMoney(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(n);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
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
