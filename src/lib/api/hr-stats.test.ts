import { describe, it, expect } from "vitest";
import { type HrStatsOverview } from "./hr-stats";

describe("hr-stats types", () => {
  it("HrStatsOverview groups staff, attendance, recruitment, interactions and tasks", () => {
    const s: HrStatsOverview = {
      staff: { total: 10, active: 8, onLeaveToday: 1, newThisMonth: 2 },
      attendance: { presentToday: 6, activeStaff: 8, rate: 75 },
      recruitment: { openVacancies: 1, activeCandidates: 4, hiredThisMonth: 1 },
      interactions: { total: 5, completed: 2 },
      tasks: { total: 7, done: 3 },
    };
    expect(s.attendance.rate).toBe(75);
    expect(s.recruitment.openVacancies).toBe(1);
  });
});
