import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { GatedModule } from "./schools";

/**
 * Qorovul: bayroqli modullar ro'yxati backend bilan BIR XIL qolsin.
 *
 * Ikki ro'yxat ikki repoda yashaydi. Ular ajralib ketsa xato JIM bo'ladi:
 * backend yangi modulni bayroqlaydi, frontend esa u haqda bilmaydi — bo'lim
 * menyuda ko'rinib turadi-yu, sahifasi 403 qaytaradi. Teskarisi ham xuddi
 * shunday yomon: frontend mavjud bo'lmagan kalitni so'raydi va bayroq har doim
 * `undefined` bo'lib, bo'lim abadiy yopiq qoladi.
 */
const BACKEND_GATED = resolve(
  __dirname,
  "../../../../yuton_backend/src/modules/schools/gated-modules.ts",
);

/** Frontend `GatedModule` birlashmasidagi kalitlar — tipdan emas, qiymatdan. */
const FRONTEND_MODULES: GatedModule[] = ["integrations", "branches"];

function backendModules(): string[] | null {
  if (!existsSync(BACKEND_GATED)) return null;
  const text = readFileSync(BACKEND_GATED, "utf8");
  const block = text.match(/export const GATED_MODULES = \{([\s\S]*?)\} as const;/);
  if (!block) return null;
  return [...block[1].matchAll(/^\s*(\w+):\s*\{/gm)].map((m) => m[1]);
}

describe("bayroqli modullar", () => {
  it("frontend ro'yxati tipdagi birlashma bilan mos", () => {
    // Ro'yxatni tipdan avtomatik chiqarib bo'lmaydi (tiplar ish vaqtida yo'q),
    // shuning uchun qo'lda yoziladi. Bu tekshiruv uni tip bilan bog'lab turadi:
    // tipga yangi kalit qo'shilsa-yu ro'yxatga qo'shilmasa, TS yiqiladi.
    const all: Record<GatedModule, true> = { integrations: true, branches: true };
    expect(FRONTEND_MODULES.sort()).toEqual(Object.keys(all).sort());
  });

  it("backend ro'yxati bilan aynan bir xil", () => {
    const backend = backendModules();
    if (!backend) {
      // Yonma-yon backend repo yo'q — bu bosqich o'tkazib yuboriladi.
      expect(backend).toBeNull();
      return;
    }
    expect(backend.sort()).toEqual([...FRONTEND_MODULES].sort());
  });
});
