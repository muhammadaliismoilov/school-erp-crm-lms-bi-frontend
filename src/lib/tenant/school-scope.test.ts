import { describe, expect, it } from "vitest";
import {
  canSeeSchoolSwitcher,
  isGlobalAccount,
  isSchoolSwitchableHost,
  isSingleSchoolContext,
} from "./school-scope";

/**
 * Maktab tanlagichi ko'rinishi.
 *
 * NEGA BU TESTLAR: ikkita nuqson topilgan edi (2026-08-26).
 *  1. Shart `roles.includes("super-admin")` edi — global CEO (`ceo` roli,
 *     `schoolId=null`) tanlagichni ko'rmasdi, holbuki u aynan barcha maktablar
 *     ustidan ishlaydi.
 *  2. Ruxsat etilgan sirtlar ro'yxatida `localhost` yo'q edi — lokal ishlab
 *     chiqishda tanlagich HECH KIMGA, hatto super-adminga ham chiqmasdi.
 */
describe("isGlobalAccount", () => {
  it("global CEO (ceo roli, schoolId=null) — global", () => {
    expect(isGlobalAccount({ roles: ["ceo"], schoolId: null })).toBe(true);
  });

  it("super-admin (schoolId=null) — global", () => {
    expect(isGlobalAccount({ roles: ["super-admin"], schoolId: null })).toBe(true);
  });

  it("maktabga bog'langan director — global EMAS", () => {
    expect(isGlobalAccount({ roles: ["director"], schoolId: "school-1" })).toBe(false);
  });

  it("maktabga bog'langan ceo — global EMAS (rol o'zi yetarli emas)", () => {
    expect(isGlobalAccount({ roles: ["ceo"], schoolId: "school-1" })).toBe(false);
  });

  it("schoolId undefined (eski sessiya) — o'zi global emas", () => {
    expect(isGlobalAccount({ roles: ["ceo"] })).toBe(false);
  });

  it("schoolId undefined bo'lsa ham super-admin roli zaxira mezon", () => {
    expect(isGlobalAccount({ roles: ["super-admin"] })).toBe(true);
  });

  it("foydalanuvchi yo'q — global emas", () => {
    expect(isGlobalAccount(null)).toBe(false);
    expect(isGlobalAccount(undefined)).toBe(false);
  });
});

describe("isSchoolSwitchableHost", () => {
  it.each(["admin.crm.uz", "admin.localhost:3000", "crm.uz", "localhost", "localhost:3000", "yuton.vercel.app"])(
    "ruxsat etilgan sirt: %s",
    (host) => {
      expect(isSchoolSwitchableHost(host)).toBe(true);
    },
  );

  it.each(["elegantschool.crm.uz", "yuton.crm.uz", "uno.crm.uz", "elegantschool.localhost:3000"])(
    "maktab subdomeni — almashtirib bo'lmaydi: %s",
    (host) => {
      expect(isSchoolSwitchableHost(host)).toBe(false);
    },
  );
});

describe("canSeeSchoolSwitcher", () => {
  const globalCeo = { roles: ["ceo"], schoolId: null };
  const maktabDirektori = { roles: ["director"], schoolId: "school-1" };

  it("global CEO apex domenda ko'radi", () => {
    expect(canSeeSchoolSwitcher(globalCeo, "crm.uz")).toBe(true);
  });

  it("global CEO lokalda ko'radi", () => {
    expect(canSeeSchoolSwitcher(globalCeo, "localhost:3000")).toBe(true);
  });

  it("global CEO maktab subdomenida KO'RMAYDI (sirt qulflangan)", () => {
    expect(canSeeSchoolSwitcher(globalCeo, "elegantschool.crm.uz")).toBe(false);
  });

  it("maktab direktori admin sirtida ham KO'RMAYDI", () => {
    expect(canSeeSchoolSwitcher(maktabDirektori, "admin.crm.uz")).toBe(false);
  });
});

/**
 * 2026-08-28: "Maktab ma'lumotlari" bo'limi maktab xodimiga ham reestr
 * ko'rinishida chizilardi — bitta qatorli jadval yonida "Maktab yaratish"
 * tugmasi. Mezon RUXSAT emas, KONTEKST: backend ham aynan shu mantiq bilan
 * (`user.schoolId ?? X-School-Id`) bitta qator qaytaradi.
 */
describe("isSingleSchoolContext", () => {
  it("maktabga bog'langan xodim — profil ko'rinishi", () => {
    expect(isSingleSchoolContext({ schoolId: "s1" }, null)).toBe(true);
  });

  it("global CEO maktab tanlagan bo'lsa — u ham profil ko'radi", () => {
    // U o'sha maktab ICHIDA ishlayapti, ya'ni reestr emas.
    expect(isSingleSchoolContext({ schoolId: null }, "s2")).toBe(true);
  });

  it("global CEO 'Barcha maktablar' da — to'liq reestr", () => {
    expect(isSingleSchoolContext({ schoolId: null }, null)).toBe(false);
  });

  it("foydalanuvchi yo'q (yuklanmoqda) — reestr, qulamaydi", () => {
    expect(isSingleSchoolContext(null, null)).toBe(false);
    expect(isSingleSchoolContext(undefined, null)).toBe(false);
  });

  it("bo'sh satrli aktiv maktab kontekst hisoblanmaydi", () => {
    expect(isSingleSchoolContext({ schoolId: null }, "")).toBe(false);
  });
});
