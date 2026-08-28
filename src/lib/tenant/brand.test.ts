import { describe, it, expect } from "vitest";
import type { AuthenticatedUser } from "@/lib/api/types";
import { PLATFORM_NAME } from "@/lib/platform";
import { resolveBrand, schoolInitials } from "./brand";

const user = (u: Partial<AuthenticatedUser>): AuthenticatedUser =>
  ({ roles: [], schoolId: undefined, ...u }) as AuthenticatedUser;

describe("schoolInitials", () => {
  it("ikki so'zdan bosh harflar", () => {
    expect(schoolInitials("Elegant School")).toBe("ES");
    expect(schoolInitials("Yuton School")).toBe("YS");
  });

  it("bir so'zdan dastlabki ikki harf", () => {
    expect(schoolInitials("Uno")).toBe("UN");
  });

  it("uchdan ortiq so'zda faqat dastlabki ikkitasi olinadi", () => {
    expect(schoolInitials("Test Wizard School")).toBe("TW");
  });

  it("ortiqcha bo'shliqlar hisobga olinmaydi", () => {
    expect(schoolInitials("  Elegant   School  ")).toBe("ES");
  });

  it("bo'sh nom qulatmaydi", () => {
    expect(schoolInitials("   ")).toBe("?");
  });
});

describe("resolveBrand", () => {
  it("maktab xodimi — o'z maktabi nomi va nishon harflari", () => {
    const brand = resolveBrand(user({ schoolId: "s1", schoolName: "Elegant School" }));
    expect(brand).toMatchObject({ kind: "school", title: "Elegant School", initials: "ES" });
    expect(brand.subtitleKey).toBe("brand.school");
  });

  it("global CEO — 'Bosh ofis', harf emas belgi (initials null)", () => {
    // Mezon rol emas, maktabga bog'lanmaganlik: `ceo` roli super-admin emas.
    const brand = resolveBrand(user({ schoolId: null, roles: ["ceo"], schoolName: null }));
    expect(brand).toMatchObject({ kind: "global", title: "Bosh ofis", initials: null });
    expect(brand.subtitleKey).toBe("brand.network");
  });

  it("super-admin ham global ko'rinishda", () => {
    expect(resolveBrand(user({ schoolId: null, roles: ["super-admin"] })).kind).toBe("global");
  });

  it("maktab nomi yetib kelmagan eski sessiya — platforma nomiga tushadi", () => {
    // `schoolId` bor, lekin nom yo'q: "School" degan begona so'z chiqmasin.
    const brand = resolveBrand(user({ schoolId: "s1", schoolName: undefined }));
    expect(brand).toMatchObject({ kind: "fallback", title: PLATFORM_NAME, initials: null });
  });

  it("bo'sh satrli nom ham zaxira hisoblanadi", () => {
    expect(resolveBrand(user({ schoolId: "s1", schoolName: "   " })).kind).toBe("fallback");
  });

  it("foydalanuvchi yo'q (yuklanmoqda) — qulatmaydi", () => {
    expect(resolveBrand(null).kind).toBe("fallback");
    expect(resolveBrand(undefined).title).toBe(PLATFORM_NAME);
  });

  it("`schoolId: undefined` global DEB HISOBLANMAYDI", () => {
    // Eski token'da maydon umuman bo'lmasligi mumkin — uni "global" deb
    // talqin qilish maktab xodimiga "Bosh ofis" deb yozib qo'yardi.
    expect(resolveBrand(user({ schoolId: undefined, schoolName: "Uno" })).kind).toBe("school");
  });
});
