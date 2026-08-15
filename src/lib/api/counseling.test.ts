import { describe, it, expect } from "vitest";
import {
  COUNSELING_RISK_LABELS,
  COUNSELING_RISK_LEVELS,
  COUNSELING_SESSION_TYPE_LABELS,
  COUNSELING_SESSION_TYPES,
  type CounselingSessionDetail,
} from "./counseling";

describe("counseling constants", () => {
  it("har bir seans turi uchun o'zbekcha yorliq bor", () => {
    for (const type of COUNSELING_SESSION_TYPES) {
      expect(COUNSELING_SESSION_TYPE_LABELS[type]).toBeTruthy();
    }
  });

  it("har bir xavf darajasi uchun yorliq bor", () => {
    for (const level of COUNSELING_RISK_LEVELS) {
      expect(COUNSELING_RISK_LABELS[level]).toBeTruthy();
    }
  });

  it("backend `SESSION_TYPES`/`RISK_LEVELS` bilan mos (counseling.dto.ts)", () => {
    expect([...COUNSELING_SESSION_TYPES]).toEqual(["individual", "group", "assessment", "follow_up"]);
    expect([...COUNSELING_RISK_LEVELS]).toEqual(["low", "medium", "high"]);
  });
});

describe("counseling types", () => {
  it("CounselingSessionDetail — izoh faqat shu shaklda mavjud (Summary'da yo'q)", () => {
    const detail: CounselingSessionDetail = {
      id: "s-1",
      studentId: "stu-1",
      studentName: "Aliyev Vali",
      counselorId: "psy-1",
      counselorName: "Karimova Dilnoza",
      sessionDate: "2026-09-01T09:00:00.000Z",
      sessionType: "individual",
      riskLevel: "medium",
      followUpDate: null,
      createdAt: "2026-09-01T09:00:00.000Z",
      notes: "Maxfiy matn",
    };
    expect(detail.notes).toBe("Maxfiy matn");
    expect(detail.studentName).toBe("Aliyev Vali");
  });
});
