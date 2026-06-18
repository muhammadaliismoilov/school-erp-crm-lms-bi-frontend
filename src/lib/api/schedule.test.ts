import { describe, it, expect } from "vitest";
import { cellKey, historyActionKey, visibleDays } from "./schedule";

describe("cellKey", () => {
  it("builds a stable weekday:period key", () => {
    expect(cellKey(1, "p1")).toBe("1:p1");
    expect(cellKey(5, "abc")).toBe("5:abc");
  });
});

describe("visibleDays", () => {
  const days = [1, 2, 3, 4, 5];

  it("returns all days when filter is 'all'", () => {
    expect(visibleDays(days, "all")).toEqual([1, 2, 3, 4, 5]);
  });

  it("returns only the selected day", () => {
    expect(visibleDays(days, 3)).toEqual([3]);
  });

  it("returns an empty array when the day is not present", () => {
    expect(visibleDays(days, 7)).toEqual([]);
  });
});

describe("historyActionKey", () => {
  it("maps known audit actions to i18n keys", () => {
    expect(historyActionKey("lesson_schedule.cell_created")).toBe("sched.hist.created");
    expect(historyActionKey("lesson_schedule.cell_updated")).toBe("sched.hist.updated");
    expect(historyActionKey("lesson_schedule.cell_deleted")).toBe("sched.hist.deleted");
    expect(historyActionKey("lesson_schedule.generated")).toBe("sched.hist.generated");
    expect(historyActionKey("lesson_schedule.substituted")).toBe("sched.hist.substituted");
  });

  it("falls back to the generic key for unknown actions", () => {
    expect(historyActionKey("lesson_schedule.unknown")).toBe("sched.hist.generic");
  });
});
