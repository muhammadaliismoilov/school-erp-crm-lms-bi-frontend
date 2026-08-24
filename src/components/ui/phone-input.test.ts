import { describe, expect, it } from "vitest";
import {
  isBlankUzPhone,
  isCompleteUzPhone,
  normalizeUzPhone,
  trimmedUzPhone,
  UZ_PHONE_PREFIX,
} from "./phone-input";

describe("normalizeUzPhone", () => {
  it("bo'sh matnni faqat prefiksga aylantiradi", () => {
    expect(normalizeUzPhone("")).toBe("+998");
  });

  it("998 bilan boshlanmagan raqamlar oldiga prefiks qo'shadi", () => {
    expect(normalizeUzPhone("901234567")).toBe("+998901234567");
  });

  it("allaqachon 998 bilan boshlangan raqamni takrorlamaydi", () => {
    expect(normalizeUzPhone("+998901234567")).toBe("+998901234567");
    expect(normalizeUzPhone("998901234567")).toBe("+998901234567");
  });

  it("bo'shliq, tire va qavslarni tozalaydi", () => {
    expect(normalizeUzPhone("+998 (90) 123-45-67")).toBe("+998901234567");
  });

  it("9 ta raqamdan ortig'ini kesib tashlaydi", () => {
    expect(normalizeUzPhone("+998901234567999")).toBe("+998901234567");
  });

  it("prefiksni o'chirishga urinishni tiklaydi", () => {
    expect(normalizeUzPhone("+99")).toBe("+998");
    expect(normalizeUzPhone("+")).toBe("+998");
  });
});

describe("isBlankUzPhone", () => {
  it("bo'sh va faqat-prefiks qiymatlarni bo'sh deb hisoblaydi", () => {
    expect(isBlankUzPhone("")).toBe(true);
    expect(isBlankUzPhone(undefined)).toBe(true);
    expect(isBlankUzPhone(null)).toBe(true);
    expect(isBlankUzPhone(UZ_PHONE_PREFIX)).toBe(true);
  });

  it("kamida bitta raqam kiritilgan bo'lsa bo'sh emas deb hisoblaydi", () => {
    expect(isBlankUzPhone("+9989")).toBe(false);
  });
});

describe("isCompleteUzPhone", () => {
  it("to'liq 9 xonali raqamni qabul qiladi", () => {
    expect(isCompleteUzPhone("+998901234567")).toBe(true);
  });

  it("to'liqsiz yoki noto'g'ri formatni rad etadi", () => {
    expect(isCompleteUzPhone("+998")).toBe(false);
    expect(isCompleteUzPhone("+99890123456")).toBe(false);
    expect(isCompleteUzPhone("901234567")).toBe(false);
    expect(isCompleteUzPhone("+1234567890")).toBe(false);
  });
});

describe("trimmedUzPhone", () => {
  it("bo'sh qiymat uchun undefined qaytaradi (ixtiyoriy maydonlar uchun)", () => {
    expect(trimmedUzPhone("")).toBeUndefined();
    expect(trimmedUzPhone(UZ_PHONE_PREFIX)).toBeUndefined();
  });

  it("to'ldirilgan qiymatni qaytaradi", () => {
    expect(trimmedUzPhone("+998901234567")).toBe("+998901234567");
  });
});
