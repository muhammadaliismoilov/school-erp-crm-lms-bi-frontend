import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getDbHealth,
  isStale,
  parseLevel,
  resetDbHealth,
  setDbHealthLevel,
  subscribeDbHealth,
} from "./store";

beforeEach(() => resetDbHealth());

describe("parseLevel", () => {
  it("ma'lum darajalarni qabul qiladi", () => {
    expect(parseLevel("ok")).toBe("ok");
    expect(parseLevel("BUSY")).toBe("busy");
    expect(parseLevel(" critical ")).toBe("critical");
  });

  it("noma'lum qiymatni rad etadi", () => {
    // Sarlavha tashqaridan keladi. Tasodifiy satr holatga tushsa, chiroq
    // rang jadvalidan chiqib ketardi va umuman chizilmasdi.
    expect(parseLevel("green")).toBeNull();
    expect(parseLevel("")).toBeNull();
    expect(parseLevel(null)).toBeNull();
    expect(parseLevel(undefined)).toBeNull();
  });
});

describe("isStale", () => {
  const now = 1_800_000_000_000;

  it("hech qachon yangilanmagan holat eskirgan", () => {
    expect(isStale({ level: null, updatedAt: null }, now)).toBe(true);
  });

  it("yangi holat eskirgan emas", () => {
    expect(isStale({ level: "ok", updatedAt: now - 10_000 }, now)).toBe(false);
  });

  it("chegaradan oshgan holat eskirgan", () => {
    // Foydalanuvchi jim turganda sarlavha kelmaydi; ko'rsatilgan rang
    // haqiqatdan uzoqlashadi va zaxira poll ishga tushishi kerak.
    expect(isStale({ level: "ok", updatedAt: now - 61_000 }, now)).toBe(true);
  });
});

describe("holat", () => {
  it("darajani yozadi va obunachilarga xabar beradi", () => {
    const seen: unknown[] = [];
    subscribeDbHealth((s) => seen.push(s.level));

    setDbHealthLevel("busy", 1_000);

    expect(getDbHealth()).toEqual({ level: "busy", updatedAt: 1_000 });
    expect(seen).toEqual(["busy"]);
  });

  it("null daraja mavjud holatni buzmaydi", () => {
    // Sarlavhasiz javob (masalan public endpoint) oxirgi ma'lum holatni
    // o'chirib tashlamasligi kerak.
    setDbHealthLevel("critical", 1_000);
    setDbHealthLevel(null, 2_000);
    expect(getDbHealth().level).toBe("critical");
  });

  it("bir xil daraja qayta kelganda ham vaqt yangilanadi", () => {
    // Aks holda holat "eskirgan" bo'lib qolib, zaxira poll bekorga ishlardi.
    setDbHealthLevel("ok", 1_000);
    setDbHealthLevel("ok", 5_000);
    expect(getDbHealth().updatedAt).toBe(5_000);
  });

  it("obunani bekor qilish mumkin", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeDbHealth(listener);
    unsubscribe();
    setDbHealthLevel("busy");
    expect(listener).not.toHaveBeenCalled();
  });
});
