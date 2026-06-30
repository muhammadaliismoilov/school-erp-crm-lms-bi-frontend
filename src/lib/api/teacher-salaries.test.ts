import { describe, it, expect } from "vitest";
import {
  formatPeriod,
  currentPeriod,
  recentPeriods,
  SALARY_STATUS_LABELS,
  PAGE_SIZES,
  type SalaryRow,
  type TeacherRateRow,
} from "./teacher-salaries";

describe("teacher-salaries helpers", () => {
  it("formatPeriod renders a YYYY-MM period as a Uzbek month label", () => {
    expect(formatPeriod("2026-05")).toBe("May 2026");
    expect(formatPeriod("2026-01")).toBe("Yanvar 2026");
    expect(formatPeriod("2026-12")).toBe("Dekabr 2026");
  });

  it("formatPeriod falls back to the raw value on an invalid month", () => {
    expect(formatPeriod("2026-13")).toBe("2026-13");
  });

  it("currentPeriod returns a valid YYYY-MM string", () => {
    expect(currentPeriod()).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
  });

  it("recentPeriods returns the requested count, newest first, with unique values", () => {
    const periods = recentPeriods(6);
    expect(periods).toHaveLength(6);
    expect(periods[0].value).toBe(currentPeriod());
    const values = new Set(periods.map((p) => p.value));
    expect(values.size).toBe(6);
  });

  it("status labels are localized to Uzbek", () => {
    expect(SALARY_STATUS_LABELS.pending).toBe("Kutilmoqda");
    expect(SALARY_STATUS_LABELS.approved).toBe("Tasdiqlangan");
  });

  it("page sizes expose 10/20/50/100", () => {
    expect([...PAGE_SIZES]).toEqual([10, 20, 50, 100]);
  });
});

describe("teacher-salaries types", () => {
  it("SalaryRow carries computed and final amounts plus status", () => {
    const row: SalaryRow = {
      id: "sal-1",
      teacherId: "t-1",
      fullName: "Toshmatov Aziz",
      completedLessons: 10,
      ratePerLesson: 50000,
      computedAmount: 500000,
      finalAmount: 500000,
      status: "pending",
      adjustmentReason: null,
      approvedAt: null,
      transactionId: null,
    };
    expect(row.finalAmount).toBe(500000);
    expect(row.status).toBe("pending");
  });

  it("TeacherRateRow couples a teacher with a per-lesson rate", () => {
    const rate: TeacherRateRow = {
      teacherId: "t-1",
      fullName: "Toshmatov Aziz",
      phone: null,
      employmentType: "full_time",
      level: "high",
      ratePerLesson: 50000,
    };
    expect(rate.ratePerLesson).toBe(50000);
    expect(rate.employmentType).toBe("full_time");
  });
});
