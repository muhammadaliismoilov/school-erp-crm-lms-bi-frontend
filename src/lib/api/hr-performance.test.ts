import { describe, it, expect } from "vitest";
import {
  PAGE_SIZES,
  PERF_STATUS_LABELS,
  PERF_STATUS_TONE,
  type PerformanceReview,
} from "./hr-performance";

describe("hr-performance constants", () => {
  it("status labels localized", () => {
    expect(PERF_STATUS_LABELS.draft).toBe("Qoralama");
    expect(PERF_STATUS_LABELS.completed).toBe("Yakunlangan");
    expect(PERF_STATUS_TONE.completed).toBe("positive");
  });

  it("page sizes expose 10/20/50/100", () => {
    expect([...PAGE_SIZES]).toEqual([10, 20, 50, 100]);
  });
});

describe("hr-performance types", () => {
  it("review carries period and rating", () => {
    const r: PerformanceReview = {
      id: "r-1",
      staffMemberId: "s-1",
      staffName: "Valiyev Ali",
      reviewerId: null,
      reviewerName: null,
      periodStart: "2026-01-01",
      periodEnd: "2026-06-30",
      overallRating: 4,
      strengths: null,
      improvements: null,
      goals: null,
      notes: null,
      status: "completed",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    expect(r.overallRating).toBe(4);
    expect(r.staffName).toBe("Valiyev Ali");
  });
});
