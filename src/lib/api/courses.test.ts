import { describe, it, expect } from "vitest";
import { buildCourseQuery } from "./courses";

describe("buildCourseQuery", () => {
  it("defaults to page 1 and drops empty values", () => {
    expect(buildCourseQuery({})).toEqual({ page: 1 });
    expect(buildCourseQuery({ search: "   " })).toEqual({ page: 1 });
  });

  it("includes trimmed search, quarter and dates", () => {
    expect(
      buildCourseQuery({
        search: "  IT ",
        quarterNumber: 4,
        startDate: "2026-03-26",
        endDate: "2026-06-15",
        page: 2,
      }),
    ).toEqual({
      search: "IT",
      quarterNumber: 4,
      startDate: "2026-03-26",
      endDate: "2026-06-15",
      page: 2,
    });
  });

  it("normalizes a non-positive page to 1", () => {
    expect(buildCourseQuery({ page: 0 }).page).toBe(1);
    expect(buildCourseQuery({ page: -3 }).page).toBe(1);
  });

  it("passes the page limit through when set", () => {
    expect(buildCourseQuery({ limit: 24 })).toEqual({ page: 1, limit: 24 });
  });
});
