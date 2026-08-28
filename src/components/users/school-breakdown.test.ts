import { describe, it, expect } from "vitest";
import type { SchoolUserBreakdownRow } from "@/lib/api/users";
import { isRowClickable, shouldRenderBreakdown } from "./school-breakdown";

/**
 * Maktab kesimining ko'rinish va tartib qoidalari.
 *
 * Komponentni to'g'ridan-to'g'ri sinab bo'lmaydi (RTL o'rnatilmagan), shuning
 * uchun qarorlar shu yerda sof funksiya sifatida qulflanadi.
 */
const qator = (over: Partial<SchoolUserBreakdownRow>): SchoolUserBreakdownRow => ({
  schoolId: "s1",
  name: "Maktab",
  accounts: 10,
  students: 5,
  active: 1,
  ...over,
});

describe("shouldRenderBreakdown", () => {
  it("bir nechta maktab bo'lsa chiziladi (global hisob)", () => {
    expect(shouldRenderBreakdown([qator({}), qator({ schoolId: "s2" })])).toBe(true);
  });

  it("bitta qator bo'lsa chizilmaydi — kartalar bilan takror bo'lardi", () => {
    expect(shouldRenderBreakdown([qator({})])).toBe(false);
  });

  it("ma'lumot kelmagan yoki bo'sh bo'lsa chizilmaydi", () => {
    expect(shouldRenderBreakdown(undefined)).toBe(false);
    expect(shouldRenderBreakdown([])).toBe(false);
  });
});

describe("isRowClickable", () => {
  it("maktab qatori bosiladi", () => {
    expect(isRowClickable({ schoolId: "s1" })).toBe(true);
  });

  it("maktabsiz qator bosilmaydi", () => {
    expect(isRowClickable({ schoolId: null })).toBe(false);
  });
});
