import { describe, it, expect } from "vitest";
import {
  GRADE_REQUEST_KINDS,
  GRADE_REQUEST_KIND_LABELS,
  GRADE_REQUEST_STATUSES,
  GRADE_REQUEST_STATUS_LABELS,
} from "./grade-requests";

describe("grade-requests constants", () => {
  it("exposes the three grade kinds matching the tabs", () => {
    expect(GRADE_REQUEST_KINDS).toEqual(["assessment", "course", "quarter"]);
  });

  it("exposes the three workflow statuses", () => {
    expect(GRADE_REQUEST_STATUSES).toEqual(["pending", "approved", "rejected"]);
  });

  it("has an Uzbek label for every kind", () => {
    for (const kind of GRADE_REQUEST_KINDS) {
      expect(GRADE_REQUEST_KIND_LABELS[kind]).toBeTruthy();
    }
    expect(GRADE_REQUEST_KIND_LABELS.assessment).toBe("Baholash");
    expect(GRADE_REQUEST_KIND_LABELS.course).toBe("Kurs bahosi");
    expect(GRADE_REQUEST_KIND_LABELS.quarter).toBe("Choraklik baho");
  });

  it("has an Uzbek label for every status", () => {
    for (const status of GRADE_REQUEST_STATUSES) {
      expect(GRADE_REQUEST_STATUS_LABELS[status]).toBeTruthy();
    }
    expect(GRADE_REQUEST_STATUS_LABELS.pending).toBe("Kutilmoqda");
    expect(GRADE_REQUEST_STATUS_LABELS.approved).toBe("Tasdiqlangan");
    expect(GRADE_REQUEST_STATUS_LABELS.rejected).toBe("Rad etilgan");
  });
});
