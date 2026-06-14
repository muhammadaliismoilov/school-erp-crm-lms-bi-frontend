import { describe, it, expect } from "vitest";
import { buildWeekSchedule, type SubjectScheduleLesson } from "./subjects";

const lesson = (over: Partial<SubjectScheduleLesson>): SubjectScheduleLesson => ({
  id: Math.random().toString(36),
  lessonDate: "2026-06-24",
  weekday: 3,
  class: { id: "c1", name: "1-A" },
  periodLabel: "1-dars",
  startTime: "08:30",
  endTime: "09:15",
  ...over,
});

describe("buildWeekSchedule", () => {
  it("returns an empty grid for no lessons", () => {
    expect(buildWeekSchedule([])).toEqual([]);
  });

  it("groups lessons by period and weekday", () => {
    const rows = buildWeekSchedule([
      lesson({ periodLabel: "1-dars", startTime: "08:30", weekday: 1 }),
      lesson({ periodLabel: "1-dars", startTime: "08:30", weekday: 3 }),
      lesson({ periodLabel: "2-dars", startTime: "09:30", weekday: 1 }),
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0].periodLabel).toBe("1-dars");
    expect(rows[0].cells[1]).toHaveLength(1);
    expect(rows[0].cells[3]).toHaveLength(1);
    expect(rows[0].cells[2]).toBeUndefined();
  });

  it("orders rows by start time", () => {
    const rows = buildWeekSchedule([
      lesson({ periodLabel: "3-dars", startTime: "10:30", weekday: 2 }),
      lesson({ periodLabel: "1-dars", startTime: "08:30", weekday: 2 }),
      lesson({ periodLabel: "2-dars", startTime: "09:30", weekday: 2 }),
    ]);

    expect(rows.map((r) => r.periodLabel)).toEqual(["1-dars", "2-dars", "3-dars"]);
  });

  it("stacks multiple lessons in the same period/weekday cell", () => {
    const rows = buildWeekSchedule([
      lesson({ periodLabel: "1-dars", startTime: "08:30", weekday: 5, class: { id: "c1", name: "1-A" } }),
      lesson({ periodLabel: "1-dars", startTime: "08:30", weekday: 5, class: { id: "c2", name: "2-B" } }),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].cells[5]).toHaveLength(2);
  });
});
