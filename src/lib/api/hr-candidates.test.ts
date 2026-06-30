import { describe, it, expect } from "vitest";
import {
  PAGE_SIZES,
  STAGE_LABELS,
  STAGE_ORDER,
  STAGE_TONE,
  type Candidate,
} from "./hr-candidates";

describe("hr-candidates constants", () => {
  it("stage labels match the screenshot pipeline", () => {
    expect(STAGE_LABELS.new).toBe("Yangi");
    expect(STAGE_LABELS.screening).toBe("Screening");
    expect(STAGE_LABELS.interview).toBe("Suhbat");
    expect(STAGE_LABELS.test).toBe("Test");
    expect(STAGE_LABELS.offer).toBe("Taklif");
    expect(STAGE_LABELS.hired).toBe("Ishga olingan");
    expect(STAGE_LABELS.rejected).toBe("Rad etilgan");
  });

  it("stage order goes new → hired/rejected", () => {
    expect(STAGE_ORDER[0]).toBe("new");
    expect(STAGE_ORDER).toContain("hired");
    expect(STAGE_ORDER).toContain("rejected");
    expect(STAGE_ORDER).toHaveLength(7);
  });

  it("tones flag hired positive and rejected negative", () => {
    expect(STAGE_TONE.hired).toBe("positive");
    expect(STAGE_TONE.rejected).toBe("negative");
  });

  it("page sizes expose 10/20/50/100", () => {
    expect([...PAGE_SIZES]).toEqual([10, 20, 50, 100]);
  });
});

describe("hr-candidates types", () => {
  it("Candidate carries pipeline stage and vacancy link", () => {
    const c: Candidate = {
      id: "c-1",
      firstName: "Aziz",
      lastName: "Karimov",
      fullName: "Aziz Karimov",
      email: "aziz@example.com",
      phone: null,
      vacancyId: "v-1",
      vacancyTitle: "Matematika o'qituvchisi",
      recruiterId: null,
      recruiterName: null,
      stage: "interview",
      stageStatus: "Birinchi suhbat",
      notes: null,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    expect(c.stage).toBe("interview");
    expect(c.vacancyTitle).toBe("Matematika o'qituvchisi");
  });
});
