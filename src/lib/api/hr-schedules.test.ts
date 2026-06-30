import { describe, it, expect } from "vitest";
import { PAGE_SIZES, WEEKDAY_LABELS, WEEKDAY_ORDER, type WorkSchedule } from "./hr-schedules";

describe("hr-schedules constants", () => {
  it("weekday labels localized to Uzbek", () => {
    expect(WEEKDAY_LABELS.monday).toBe("Dushanba");
    expect(WEEKDAY_LABELS.sunday).toBe("Yakshanba");
  });

  it("weekday order starts on Monday and has 7 days", () => {
    expect(WEEKDAY_ORDER[0]).toBe("monday");
    expect(WEEKDAY_ORDER).toHaveLength(7);
  });

  it("page sizes expose 10/20/50/100", () => {
    expect([...PAGE_SIZES]).toEqual([10, 20, 50, 100]);
  });
});

describe("hr-schedules types", () => {
  it("schedule carries day rows with lunch breaks", () => {
    const s: WorkSchedule = {
      id: "sch-1",
      name: "Standart 5 kunlik",
      description: null,
      isStandard: true,
      days: [
        { weekday: "monday", startTime: "09:00", endTime: "18:00", lunchStart: "13:00", lunchEnd: "14:00" },
      ],
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    expect(s.isStandard).toBe(true);
    expect(s.days[0].lunchStart).toBe("13:00");
  });
});
