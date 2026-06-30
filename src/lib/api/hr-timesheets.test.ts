import { describe, it, expect } from "vitest";
import {
  MONTH_LABELS,
  PAGE_SIZES,
  TIMESHEET_STATUS_LABELS,
  TIMESHEET_STATUS_TONE,
  type Timesheet,
} from "./hr-timesheets";

describe("hr-timesheets constants", () => {
  it("status labels match the screenshot wording", () => {
    expect(TIMESHEET_STATUS_LABELS.draft).toBe("Qoralama");
    expect(TIMESHEET_STATUS_LABELS.submitted).toBe("Yuborilgan");
    expect(TIMESHEET_STATUS_LABELS.approved).toBe("Tasdiqlangan");
    expect(TIMESHEET_STATUS_TONE.approved).toBe("positive");
  });

  it("month labels cover the 12 Uzbek months", () => {
    expect(MONTH_LABELS).toHaveLength(12);
    expect(MONTH_LABELS[5]).toBe("Iyun");
  });

  it("page sizes expose 10/20/50/100", () => {
    expect([...PAGE_SIZES]).toEqual([10, 20, 50, 100]);
  });
});

describe("hr-timesheets types", () => {
  it("timesheet carries per-employee lines", () => {
    const t: Timesheet = {
      id: "ts-1",
      year: 2026,
      month: 6,
      departmentId: null,
      departmentName: null,
      status: "draft",
      submittedAt: null,
      approvedAt: null,
      note: null,
      lines: [{ id: "l-1", staffMemberId: "s-1", staffName: "Valiyev Ali", workedDays: 22, workedHours: 176, note: null }],
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    expect(t.lines[0].workedDays).toBe(22);
  });
});
