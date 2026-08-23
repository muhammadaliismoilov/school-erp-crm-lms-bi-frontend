/**
 * Imtiyoz kodlari uchun "qorovul" sinovi.
 *
 * `can()` tugmalarga tarqatilgach eng xavfli xato — YOZUV XATOSI:
 * `crm-lead.update` (`crm-leads.update` o'rniga) hech qanday xato bermaydi,
 * shunchaki tugma hech qachon ko'rinmaydi. Kompilyator bunday satrni tekshira
 * olmaydi, shuning uchun manba matnidan barcha imtiyoz kodlarini yig'ib
 * tekshiramiz.
 *
 * Ikki bosqich:
 * 1. SHAKL — har kod `<resurs>.<amal>` ko'rinishida va amal ma'lum ro'yxatdan.
 *    Bu tekshiruv har doim ishlaydi (CI'da backend repo bo'lmasa ham).
 * 2. KATALOG — yonma-yon turgan `yuton_backend/` topilsa, har kod backend
 *    `AppPermission` ro'yxatida borligi tasdiqlanadi. Backend yo'q bo'lsa
 *    bosqich o'tkazib yuboriladi (sinov qulamaydi).
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = resolve(__dirname, "../..");
const BACKEND_PERMISSIONS = resolve(
  SRC,
  "../../yuton_backend/src/common/constants/permissions.ts",
);

/**
 * Backend katalogidagi amallar. `manage` ATAYLAB yo'q: keng `<module>.manage`
 * kodi tizimdan olib tashlangan (1789900000000 migratsiyasi), shuning uchun
 * UI'da paydo bo'lsa — bu sinov uni xato deb ushlashi kerak.
 */
const KNOWN_ACTIONS = new Set([
  "read",
  "create",
  "update",
  "delete",
  "upload",
  "assign",
  "reconcile",
  "reset-password",
  "reassign-school",
  "*",
]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    if (!/\.tsx?$/.test(entry) || /\.test\.tsx?$/.test(entry)) return [];
    return [full];
  });
}

interface Found {
  code: string;
  file: string;
}

/**
 * Izohlarni olib tashlaydi — hujjatlardagi misollar (`can("x.read")`) haqiqiy
 * kod sifatida hisoblanmasligi kerak. Satr izohida `://` (URL) himoyalangan.
 */
function stripComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

/**
 * Manbadan imtiyoz kodlarini yig'adi. Qamrab olinadigan shakllar:
 * `can("x.y")`, `permission: "x.y"`, `permission="x.y"`, `anyOf`/`allOf`
 * massivlari va `useCrudPermissions("resurs")` (resurs → `resurs.read`).
 */
function collectCodes(): Found[] {
  const found: Found[] = [];
  const push = (code: string, file: string) => {
    found.push({ code, file: file.slice(SRC.length + 1) });
  };

  for (const file of sourceFiles(SRC)) {
    const text = stripComments(readFileSync(file, "utf8"));

    for (const m of text.matchAll(/\bcan\(\s*"([^"]+)"/g)) push(m[1], file);
    for (const m of text.matchAll(/\bpermission\s*[:=]\s*"([^"]+)"/g)) push(m[1], file);
    for (const m of text.matchAll(/\buseCrudPermissions\(\s*"([^"]+)"/g)) {
      // Hook to'rtala amalni tekshiradi; resursning o'zi mavjudligini `.read`
      // orqali tasdiqlaymiz (har resursda o'qish amali bor).
      push(`${m[1]}.read`, file);
    }
    for (const m of text.matchAll(/\b(?:anyOf|allOf)\s*[:=]\s*\{?\s*\[([^\]]+)\]/g)) {
      for (const lit of m[1].matchAll(/"([^"]+)"/g)) push(lit[1], file);
    }
  }

  return found;
}

/** Backend konstantalaridan `'modul.amal'` satrlarini o'qiydi. */
function backendCatalog(): Set<string> | null {
  if (!existsSync(BACKEND_PERMISSIONS)) return null;
  const text = readFileSync(BACKEND_PERMISSIONS, "utf8");
  const codes = new Set<string>();
  // Amal qismida defis ham bo'lishi mumkin (masalan `users.reset-password`).
  for (const m of text.matchAll(/'([a-z0-9-]+\.[a-z][a-z-]*)'/g)) codes.add(m[1]);
  return codes;
}

const codes = collectCodes();

describe("frontend imtiyoz kodlari", () => {
  it("manbadan kodlar topiladi (skaner ishlayotganining kafolati)", () => {
    // Skaner regexlari buzilsa ro'yxat bo'shab qoladi va qolgan sinovlar
    // "muvaffaqiyatli" ko'rinardi — shu tekshiruv buni oldini oladi.
    expect(codes.length).toBeGreaterThan(50);
  });

  it("har kod <resurs>.<amal> shaklida va amal ma'lum", () => {
    const bad = codes.filter(({ code }) => {
      const parts = code.split(".");
      if (parts.length !== 2) return true;
      const [resource, action] = parts;
      if (resource !== "*" && !/^[a-z][a-z0-9-]*$/.test(resource)) return true;
      return !KNOWN_ACTIONS.has(action);
    });

    expect(bad.map((b) => `${b.code} (${b.file})`)).toEqual([]);
  });

  it("har kod backend katalogida mavjud", () => {
    const catalog = backendCatalog();
    if (!catalog) {
      // Yonma-yon backend repo yo'q — bu bosqich o'tkazib yuboriladi.
      expect(catalog).toBeNull();
      return;
    }

    const unknown = codes.filter(
      ({ code }) => !code.startsWith("*.") && !catalog.has(code),
    );

    expect(unknown.map((u) => `${u.code} (${u.file})`)).toEqual([]);
  });
});
