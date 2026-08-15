import { describe, it, expect } from "vitest";
import {
  CLASS_LEADER_STATUS_LABELS,
  classLeaderStatus,
  type ClassLeaderAssignment,
} from "./hr-class-leaderships";

describe("classLeaderStatus", () => {
  it("boshlanish sanasi kelajakda bo'lsa — 'upcoming'", () => {
    expect(classLeaderStatus({ startDate: "2099-01-01", endDate: null })).toBe("upcoming");
  });

  it("tugash sanasi o'tmishda bo'lsa — 'ended'", () => {
    expect(classLeaderStatus({ startDate: "2020-01-01", endDate: "2020-06-01" })).toBe("ended");
  });

  it("boshlangan, tugamagan (endDate=null) — 'active'", () => {
    expect(classLeaderStatus({ startDate: "2020-01-01", endDate: null })).toBe("active");
  });

  it("boshlangan, tugash sanasi kelajakda — hamon 'active'", () => {
    expect(classLeaderStatus({ startDate: "2020-01-01", endDate: "2099-01-01" })).toBe("active");
  });

  it("har uch holat uchun yorliq mavjud", () => {
    expect(CLASS_LEADER_STATUS_LABELS.active).toBe("Faol");
    expect(CLASS_LEADER_STATUS_LABELS.upcoming).toBe("Kelajakda");
    expect(CLASS_LEADER_STATUS_LABELS.ended).toBe("Tugagan");
  });
});

describe("hr-class-leaderships types", () => {
  it("ClassLeaderAssignment serverda hal qilingan teacherName/className ni oladi", () => {
    const a: ClassLeaderAssignment = {
      id: "a-1",
      teacherId: "t-1",
      teacherName: "Aliyeva Nodira",
      classId: "c-1",
      className: "5-A",
      startDate: "2026-09-01",
      endDate: null,
      note: null,
      createdAt: "2026-09-01T00:00:00.000Z",
    };
    expect(a.teacherName).toBe("Aliyeva Nodira");
    expect(a.className).toBe("5-A");
  });
});
