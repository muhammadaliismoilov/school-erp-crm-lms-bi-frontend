import { describe, it, expect } from "vitest";
import { buildExamQuery, combineDateTime, splitDateTime } from "./exams";

describe("buildExamQuery", () => {
  it("always sends kind and defaults page to 1", () => {
    expect(buildExamQuery({ kind: "class" })).toEqual({ kind: "class", page: 1 });
    expect(buildExamQuery({ kind: "course" })).toEqual({ kind: "course", page: 1 });
  });

  it("drops empty values and trims search", () => {
    expect(buildExamQuery({ kind: "class", search: "   " })).toEqual({ kind: "class", page: 1 });
    expect(buildExamQuery({ kind: "class", search: "  Test " }).search).toBe("Test");
  });

  it("includes all provided filters", () => {
    expect(
      buildExamQuery({
        kind: "class",
        quarterNumber: 2,
        classId: "c1",
        subjectId: "s1",
        teacherId: "t1",
        examType: "control_work",
        status: "scheduled",
        dateFrom: "2026-06-01",
        dateTo: "2026-06-30",
        page: 3,
        limit: 50,
      }),
    ).toEqual({
      kind: "class",
      quarterNumber: 2,
      classId: "c1",
      subjectId: "s1",
      teacherId: "t1",
      examType: "control_work",
      status: "scheduled",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-30",
      page: 3,
      limit: 50,
    });
  });

  it("normalizes a non-positive page to 1", () => {
    expect(buildExamQuery({ kind: "course", page: 0 }).page).toBe(1);
    expect(buildExamQuery({ kind: "course", page: -2 }).page).toBe(1);
  });
});

describe("combineDateTime", () => {
  it("returns undefined without a date", () => {
    expect(combineDateTime("", "10:00")).toBeUndefined();
  });

  it("defaults missing/invalid time to 00:00", () => {
    expect(combineDateTime("2026-06-23", "")).toBe(new Date("2026-06-23T00:00:00").toISOString());
    expect(combineDateTime("2026-06-23", "bad")).toBe(new Date("2026-06-23T00:00:00").toISOString());
  });

  it("combines date + time into an ISO datetime", () => {
    expect(combineDateTime("2026-06-23", "11:30")).toBe(new Date("2026-06-23T11:30:00").toISOString());
  });
});

describe("splitDateTime", () => {
  it("returns empty parts for null/invalid", () => {
    expect(splitDateTime(null)).toEqual({ date: "", time: "" });
    expect(splitDateTime("not-a-date")).toEqual({ date: "", time: "" });
  });

  it("round-trips with combineDateTime", () => {
    const iso = combineDateTime("2026-06-23", "11:30")!;
    expect(splitDateTime(iso)).toEqual({ date: "2026-06-23", time: "11:30" });
  });
});
