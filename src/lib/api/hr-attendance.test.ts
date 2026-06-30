import { describe, it, expect } from "vitest";
import {
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_TONE,
  ATTENDANCE_ACTION_LABELS,
  ATTENDANCE_ACTIONS,
  ATTENDANCE_STATUSES,
  PAGE_SIZES,
  type AttendanceRecord,
} from "./hr-attendance";

describe("hr-attendance constants", () => {
  it("status labels localized to Uzbek", () => {
    expect(ATTENDANCE_STATUS_LABELS.pending).toBe("Kutilmoqda");
    expect(ATTENDANCE_STATUS_LABELS.approved).toBe("Tasdiqlangan");
    expect(ATTENDANCE_STATUS_LABELS.rejected).toBe("Rad etilgan");
  });

  it("action labels map kirish/chiqish", () => {
    expect(ATTENDANCE_ACTION_LABELS.check_in).toBe("Kirish");
    expect(ATTENDANCE_ACTION_LABELS.check_out).toBe("Chiqish");
  });

  it("status tone maps pending→caution, approved→positive, rejected→negative", () => {
    expect(ATTENDANCE_STATUS_TONE.pending).toBe("caution");
    expect(ATTENDANCE_STATUS_TONE.approved).toBe("positive");
    expect(ATTENDANCE_STATUS_TONE.rejected).toBe("negative");
  });

  it("enumerations + page sizes", () => {
    expect([...ATTENDANCE_ACTIONS]).toEqual(["check_in", "check_out"]);
    expect([...ATTENDANCE_STATUSES]).toEqual(["pending", "approved", "rejected"]);
    expect([...PAGE_SIZES]).toEqual([10, 20, 50, 100]);
  });
});

describe("hr-attendance types", () => {
  it("AttendanceRecord carries staff, action, geo and status", () => {
    const r: AttendanceRecord = {
      id: "a-1",
      staffMemberId: "s-1",
      staffName: "Valiyev Ali",
      action: "check_in",
      recordedAt: "2026-06-19T09:00:00.000Z",
      latitude: 41.31,
      longitude: 69.24,
      geofenceId: null,
      geofenceName: "Bosh ofis",
      deviceInfo: null,
      status: "pending",
      createdAt: "2026-06-19T09:00:00.000Z",
      updatedAt: "2026-06-19T09:00:00.000Z",
    };
    expect(r.action).toBe("check_in");
    expect(r.geofenceName).toBe("Bosh ofis");
  });
});
