import { describe, it, expect } from "vitest";
import {
  UZ_MONTHS,
  UZ_WEEKDAYS_SHORT,
  buildCalendarGrid,
  isoToUTC,
  toISO,
  yearRange,
} from "./calendar";

describe("buildCalendarGrid", () => {
  it("har doim 42 katak qaytaradi", () => {
    expect(buildCalendarGrid(2026, 5)).toHaveLength(42);
  });

  it("dushanbadan boshlanadi va oy birinchi kunini to'g'ri joylaydi", () => {
    // 2026-06-01 = dushanba → leading 0, birinchi katak aynan 01.
    const grid = buildCalendarGrid(2026, 5);
    expect(grid[0]).toEqual({ iso: "2026-06-01", day: 1, inMonth: true });
  });

  it("oy boshida oldingi oy kunlari bilan to'ldiradi", () => {
    // 2026-09-01 = seshanba → 1 ta to'ldiruvchi (dushanba 08-31).
    const grid = buildCalendarGrid(2026, 8);
    expect(grid[0]).toEqual({ iso: "2026-08-31", day: 31, inMonth: false });
    expect(grid[1]).toEqual({ iso: "2026-09-01", day: 1, inMonth: true });
  });

  it("oydagi barcha kunlar inMonth=true", () => {
    const grid = buildCalendarGrid(2026, 1); // fevral 2026 = 28 kun
    const inMonth = grid.filter((c) => c.inMonth);
    expect(inMonth).toHaveLength(28);
    expect(inMonth[0].iso).toBe("2026-02-01");
    expect(inMonth[27].iso).toBe("2026-02-28");
  });

  it("kabisa fevralini to'g'ri (2024 = 29 kun)", () => {
    const inMonth = buildCalendarGrid(2024, 1).filter((c) => c.inMonth);
    expect(inMonth).toHaveLength(29);
  });
});

describe("toISO / isoToUTC", () => {
  it("toISO nol bilan to'ldiradi", () => {
    expect(toISO(2026, 0, 5)).toBe("2026-01-05");
    expect(toISO(2026, 11, 31)).toBe("2026-12-31");
  });

  it("isoToUTC taqqoslanadigan timestamp beradi", () => {
    expect(isoToUTC("2026-06-13")).toBe(Date.UTC(2026, 5, 13));
    expect(isoToUTC("")).toBeNull();
    expect(isoToUTC("noto'g'ri")).toBeNull();
  });
});

describe("yearRange", () => {
  it("markazdan ±span yillar", () => {
    const years = yearRange(2026, 2);
    expect(years).toEqual([2024, 2025, 2026, 2027, 2028]);
  });
});

describe("konstantalar", () => {
  it("12 oy va 7 hafta kuni", () => {
    expect(UZ_MONTHS).toHaveLength(12);
    expect(UZ_WEEKDAYS_SHORT).toHaveLength(7);
    expect(UZ_WEEKDAYS_SHORT[0]).toBe("Du");
  });
});
