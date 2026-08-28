import { describe, it, expect } from "vitest";
import type { Role } from "@/lib/api/roles";
import { affectedSchoolCount, requiresGlobalWarning } from "./global-role";

/**
 * Global rol barcha maktablarda BIR XIL: `teacher` ni tahrirlash har bir
 * maktabdagi o'qituvchilarga tegadi va 30 soniya ichida kuchga kiradi.
 * UI'da bu maktab rolidan hech nima bilan farq qilmasdi.
 */
const globalRol = { isGlobal: true } as Role;
const maktabRoli = { isGlobal: false } as Role;

describe("requiresGlobalWarning", () => {
  it("global rolni TAHRIRLASHDA ogohlantiradi", () => {
    expect(requiresGlobalWarning(globalRol, "update")).toBe(true);
  });

  it("global rolni O'CHIRISHDA ham ogohlantiradi", () => {
    // O'chirish tahrirlashdan xavfliroq: rol hamma maktabda yo'qoladi.
    expect(requiresGlobalWarning(globalRol, "delete")).toBe(true);
  });

  it("YARATISHDA ogohlantirmaydi — yangi rol hali hech kimda yo'q", () => {
    expect(requiresGlobalWarning(globalRol, "create")).toBe(false);
  });

  it("maktab roli uchun hech qachon ogohlantirmaydi", () => {
    expect(requiresGlobalWarning(maktabRoli, "update")).toBe(false);
    expect(requiresGlobalWarning(maktabRoli, "delete")).toBe(false);
  });

  it("rol yo'q bo'lsa (yangi forma) ogohlantirmaydi", () => {
    expect(requiresGlobalWarning(null, "update")).toBe(false);
    expect(requiresGlobalWarning(undefined, "delete")).toBe(false);
  });

  it("`isGlobal` maydoni yetib kelmagan eski javobda ogohlantirmaydi", () => {
    // Qat'iy `=== true`: `undefined` ni "global" deb talqin qilish har bir
    // maktab rolida keraksiz tasdiq oynasi chiqarardi.
    expect(requiresGlobalWarning({} as Role, "update")).toBe(false);
  });
});

describe("affectedSchoolCount", () => {
  it("ro'yxat uzunligini qaytaradi", () => {
    expect(affectedSchoolCount([{}, {}, {}, {}])).toBe(4);
  });

  it("ro'yxat yo'q yoki bo'sh bo'lsa null — UI raqamsiz matn ko'rsatadi", () => {
    // Noto'g'ri raqamdan ko'ra raqamsiz ogohlantirish yaxshiroq.
    expect(affectedSchoolCount(undefined)).toBeNull();
    expect(affectedSchoolCount(null)).toBeNull();
    expect(affectedSchoolCount([])).toBeNull();
  });
});
