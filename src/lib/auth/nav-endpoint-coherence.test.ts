/**
 * Menyu darvozasi ↔ endpoint muvofiqligi.
 *
 * T-01 ning ildizi shu edi: menyu `hr.read` ni tekshirardi, backend esa
 * `hr-staff.read` ni talab qilardi. Ikkala tomon ham "to'g'ri" ko'rinardi,
 * lekin ular BOSHQA-BOSHQA savolga javob berardi — natijada granular
 * huquqlarga ega foydalanuvchi menyuni umuman ko'rmasdi.
 *
 * Bu sinov shu bo'shliqni yopadi: har bir menyu yaprog'ining darvozasi —
 * o'sha sahifa CHAQIRADIGAN endpointlardan birortasi HAQIQATAN talab
 * qiladigan kod bo'lishi kerak.
 *
 * Ish tartibi:
 *  1. `nav.ts` dan yaproq → darvoza;
 *  2. sahifa faylidan → import qilingan `@/lib/api/*` modullari;
 *  3. modullardagi `apiRequest` GET chaqiruvlaridan → backend yo'llari;
 *  4. yonma-yon `yuton_backend/` controllerlaridan → yo'l uchun talab kodlari.
 *
 * Backend repo yonma-yon bo'lmasa (CI'da alohida build) — sinov o'tkazib
 * yuboriladi. Nomzod topilmagan sahifalar (statik hub sahifalar, generic
 * `resource` yuklagichi) ham tekshirilmaydi: ular uchun yolg'on ogohlantirish
 * berishdan ko'ra jim qolish afzal.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { NAV_ITEMS, isGroup, type NavLeaf } from "@/lib/nav";

const SRC = resolve(__dirname, "../..");
const PAGES = join(SRC, "app", "(dashboard)");
const API_DIR = join(SRC, "lib", "api");
const BACKEND_SRC = resolve(SRC, "../../yuton_backend/src");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/** `:id` / `${x}` → `{}` — ikkala tomonni solishtirish uchun bir shaklga. */
const normalize = (path: string): string =>
  path
    .split("?")[0]
    .replace(/\$\{[^}]*\}/g, "{}")
    .replace(/:[A-Za-z0-9_]+/g, "{}")
    .replace(/\/+/g, "/")
    .replace(/\/$/, "") || "/";

/** Backend: GET yo'li → talab qilinadigan ruxsat kodlari. */
function backendGetPermissions(): Map<string, string[]> | null {
  if (!existsSync(BACKEND_SRC)) return null;

  const permissionsFile = join(BACKEND_SRC, "common", "constants", "permissions.ts");
  const catalog = new Map<string, string>();
  for (const m of readFileSync(permissionsFile, "utf8").matchAll(
    /^ {2}([A-Z0-9_]+): '([^']+)',$/gm,
  )) {
    catalog.set(m[1], m[2]);
  }

  const result = new Map<string, string[]>();
  const routeRe = /@(Get|Post|Patch|Put|Delete|All)\(\s*(?:['"]([^'"]*)['"])?\s*\)/g;

  for (const file of walk(BACKEND_SRC)) {
    if (!file.endsWith(".controller.ts")) continue;
    const text = readFileSync(file, "utf8");
    const ctrl = text.match(/@Controller\(\s*(\{[\s\S]*?\}|'[^']*'|"[^"]*")\s*\)/);
    const rawBase = ctrl?.[1] ?? "";
    const base = rawBase.startsWith("{")
      ? (rawBase.match(/path:\s*['"]([^'"]*)['"]/)?.[1] ?? "")
      : rawBase.replace(/['"{} ]/g, "");

    const hits = [...text.matchAll(routeRe)];
    for (const [index, hit] of hits.entries()) {
      if (hit[1].toUpperCase() !== "GET") continue;
      const end = index + 1 < hits.length ? hits[index + 1].index! : text.length;
      const seg = text.slice(hit.index! + hit[0].length, end);
      const perms = seg.match(/@Permissions\(\[([^\]]*)\]/);
      if (!perms) continue;
      const codes = [...perms[1].matchAll(/AppPermission\.([A-Z0-9_]+)/g)]
        .map((r) => catalog.get(r[1]))
        .filter((c): c is string => Boolean(c));
      if (codes.length === 0) continue;
      const path = normalize(
        "/" + [base.replace(/^\/|\/$/g, ""), (hit[2] ?? "").replace(/^\/|\/$/g, "")]
          .filter(Boolean)
          .join("/"),
      );
      result.set(path, [...(result.get(path) ?? []), ...codes]);
    }
  }
  return result;
}

/** `@/lib/api/<mod>` → shu modul chaqiradigan GET yo'llari. */
function apiModuleGetPaths(): Map<string, string[]> {
  const callRe = /apiRequest[^(]{0,300}\(\s*(`[^`]*`|"[^"]*"|'[^']*')([^;]{0,500})/gs;
  const constRe = /^\s*const\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*["'`]([^"'`]*)["'`]\s*;/gm;
  const map = new Map<string, string[]>();

  for (const file of walk(API_DIR)) {
    if (!file.endsWith(".ts") || file.includes(".test.")) continue;
    const text = readFileSync(file, "utf8");
    const consts = new Map<string, string>();
    for (const m of text.matchAll(constRe)) consts.set(m[1], m[2]);

    const paths: string[] = [];
    for (const m of text.matchAll(callRe)) {
      const method = m[2].match(/method:\s*"(GET|POST|PATCH|PUT|DELETE)"/)?.[1] ?? "GET";
      if (method !== "GET") continue;
      const raw = m[1]
        .slice(1, -1)
        .replace(/\$\{([^}]*)\}/g, (_, name) => consts.get(name.trim()) ?? "${}");
      paths.push(normalize(raw));
    }
    map.set(file.split("/").pop()!.replace(/\.ts$/, ""), paths);
  }
  return map;
}

const leaves: NavLeaf[] = NAV_ITEMS.flatMap((entry) =>
  isGroup(entry) ? entry.children : [entry],
);

describe("menyu darvozasi endpoint talabiga mos", () => {
  const backend = backendGetPermissions();
  const modulePaths = apiModuleGetPaths();

  it("nav yaproqlari topildi (skaner ishlayotganining kafolati)", () => {
    expect(leaves.length).toBeGreaterThan(40);
  });

  it("har bir darvoza sahifaning haqiqiy endpoint talabidan olingan", () => {
    if (!backend) {
      expect(backend).toBeNull(); // yonma-yon backend yo'q — bosqich o'tkazildi
      return;
    }

    const mismatches: string[] = [];

    for (const leaf of leaves) {
      if (!leaf.permission) continue;
      const pageFile = join(PAGES, leaf.href.replace(/^\//, ""), "page.tsx");
      if (!existsSync(pageFile)) continue;

      const text = readFileSync(pageFile, "utf8");
      const mods = [...text.matchAll(/from "@\/lib\/api\/([a-z0-9-]+)"/g)].map((m) => m[1]);

      const candidates = new Set<string>();
      for (const mod of mods) {
        for (const path of modulePaths.get(mod) ?? []) {
          for (const code of backend.get(path) ?? []) candidates.add(code);
        }
      }

      // Nomzod yo'q (statik hub sahifa yoki generic yuklagich) — tekshirmaymiz.
      if (candidates.size === 0) continue;
      if (!candidates.has(leaf.permission)) {
        mismatches.push(
          `${leaf.href}: darvoza "${leaf.permission}", sahifa esa ${[...candidates]
            .sort()
            .join(" / ")} talab qiladi`,
        );
      }
    }

    expect(mismatches).toEqual([]);
  });
});

describe("guruh ko'rinishi", () => {
  it("har guruhning HAR bir yaprog'ida darvoza bor (meros olish yo'q)", () => {
    // Guruh darajasida darvoza qolmagani uchun, imtiyozsiz yaproq hammaga
    // ochiq bo'lib qolardi. O'z-o'zini himoya qilmaydigan yaproq bo'lmasin.
    const ungated = NAV_ITEMS.filter(isGroup).flatMap((group) =>
      group.children.filter((child) => !child.permission).map((child) => child.href),
    );
    expect(ungated).toEqual([]);
  });

  it("guruhlarda darvoza qolmagan", () => {
    const gated = NAV_ITEMS.filter(isGroup)
      .filter((group) => "permission" in group && (group as { permission?: string }).permission)
      .map((group) => group.id);
    expect(gated).toEqual([]);
  });
});
