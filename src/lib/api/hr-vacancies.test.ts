import { describe, it, expect } from "vitest";
import {
  PAGE_SIZES,
  VACANCY_STATUS_LABELS,
  VACANCY_STATUS_TONE,
  type Vacancy,
} from "./hr-vacancies";

describe("hr-vacancies constants", () => {
  it("status labels match the screenshot filter wording", () => {
    expect(VACANCY_STATUS_LABELS.open).toBe("Ochiq");
    expect(VACANCY_STATUS_LABELS.closed).toBe("Yopiq");
    expect(VACANCY_STATUS_LABELS.draft).toBe("Qoralama");
    expect(VACANCY_STATUS_LABELS.pending).toBe("Kutishda");
  });

  it("status tone maps open→positive, closed→negative", () => {
    expect(VACANCY_STATUS_TONE.open).toBe("positive");
    expect(VACANCY_STATUS_TONE.closed).toBe("negative");
    expect(VACANCY_STATUS_TONE.pending).toBe("caution");
  });

  it("page sizes expose 10/20/50/100", () => {
    expect([...PAGE_SIZES]).toEqual([10, 20, 50, 100]);
  });
});

describe("hr-vacancies types", () => {
  it("Vacancy carries salary range and recruiter", () => {
    const v: Vacancy = {
      id: "v-1",
      title: "Matematika o'qituvchisi",
      status: "open",
      departmentId: "d-1",
      departmentName: "O'quv bo'limi",
      positionId: null,
      positionTitle: null,
      recruiterId: null,
      recruiterName: "Valiyev Ali",
      minSalary: 5000000,
      maxSalary: 10000000,
      responsibilities: null,
      requirements: null,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    expect(v.minSalary).toBe(5000000);
    expect(v.recruiterName).toBe("Valiyev Ali");
  });
});
