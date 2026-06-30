import { describe, it, expect } from "vitest";
import {
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_TONE,
  LEAVE_TYPE_LABELS,
  LEAVE_STATUSES,
  LEAVE_TYPES,
  PAGE_SIZES,
  type Leave,
} from "./hr-leaves";

describe("hr-leaves constants", () => {
  it("status labels localized to Uzbek", () => {
    expect(LEAVE_STATUS_LABELS.requested).toBe("Kutilmoqda");
    expect(LEAVE_STATUS_LABELS.approved).toBe("Tasdiqlangan");
    expect(LEAVE_STATUS_LABELS.rejected).toBe("Rad etilgan");
    expect(LEAVE_STATUS_LABELS.cancelled).toBe("Bekor qilingan");
  });

  it("status tone maps requested→caution, approved→positive, rejected→negative", () => {
    expect(LEAVE_STATUS_TONE.requested).toBe("caution");
    expect(LEAVE_STATUS_TONE.approved).toBe("positive");
    expect(LEAVE_STATUS_TONE.rejected).toBe("negative");
  });

  it("type labels cover all leave types", () => {
    expect(LEAVE_TYPE_LABELS.annual).toBe("Yillik");
    expect(LEAVE_TYPE_LABELS.sick).toBe("Kasal");
    expect(LEAVE_TYPE_LABELS.unpaid).toBe("To‘lanmagan");
    expect(LEAVE_TYPE_LABELS.maternity).toBe("Onalik");
    expect(LEAVE_TYPE_LABELS.paternity).toBe("Otalik");
    expect(LEAVE_TYPE_LABELS.study).toBe("O‘qish");
    expect(LEAVE_TYPE_LABELS.other).toBe("Boshqa");
  });

  it("enumerations + page sizes", () => {
    expect([...LEAVE_STATUSES]).toEqual(["requested", "approved", "rejected", "cancelled"]);
    expect(LEAVE_TYPES).toHaveLength(7);
    expect([...PAGE_SIZES]).toEqual([10, 20, 50, 100]);
  });
});

describe("hr-leaves types", () => {
  it("Leave carries staff, type, dates, days and status", () => {
    const l: Leave = {
      id: "l-1",
      staffMemberId: "s-1",
      staffName: "Valiyev Ali",
      type: "annual",
      startDate: "2026-07-01",
      endDate: "2026-07-05",
      days: 5,
      reason: null,
      status: "requested",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    expect(l.days).toBe(5);
    expect(l.type).toBe("annual");
  });
});
