import { describe, it, expect } from "vitest";
import {
  MONTH_LABELS,
  STATUS_LABELS,
  STATUS_TONES,
  STUDENT_PAYMENT_STATUSES,
  monthLabel,
} from "./student-payments";

describe("student-payments constants", () => {
  it("exposes the three payment statuses (rasmdagi HOLAT)", () => {
    expect(STUDENT_PAYMENT_STATUSES).toEqual(["paid", "partial", "pending"]);
  });

  it("has an Uzbek label and tone for every status", () => {
    for (const s of STUDENT_PAYMENT_STATUSES) {
      expect(STATUS_LABELS[s]).toBeTruthy();
      expect(STATUS_TONES[s]).toBeTruthy();
    }
  });

  it("lists all twelve months", () => {
    expect(MONTH_LABELS).toHaveLength(12);
    expect(MONTH_LABELS[0]).toBe("Yanvar");
    expect(MONTH_LABELS[11]).toBe("Dekabr");
  });
});

describe("monthLabel", () => {
  it("maps 1-12 to a name", () => {
    expect(monthLabel(6)).toBe("Iyun");
    expect(monthLabel(1)).toBe("Yanvar");
  });

  it("returns a dash for out-of-range or empty values", () => {
    expect(monthLabel(0)).toBe("—");
    expect(monthLabel(13)).toBe("—");
    expect(monthLabel(null)).toBe("—");
    expect(monthLabel(undefined)).toBe("—");
  });
});
