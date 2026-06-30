import { describe, it, expect } from "vitest";
import {
  CATEGORY_LABELS,
  DEGREE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  PAGE_SIZES,
  TEACHER_STATUS_LABELS,
  TEACHER_STATUS_TONE,
  WORK_TYPE_LABELS,
  type Teacher,
} from "./hr-teachers";

describe("hr-teachers constants", () => {
  it("work type labels localized to Uzbek", () => {
    expect(WORK_TYPE_LABELS.full).toBe("To'liq");
    expect(WORK_TYPE_LABELS.hourly).toBe("Soatbay");
  });

  it("category labels match the screenshot wording", () => {
    expect(CATEGORY_LABELS.oliy).toBe("Oliy toifali");
    expect(CATEGORY_LABELS.first).toBe("1-toifa");
    expect(CATEGORY_LABELS.second).toBe("2-toifa");
    expect(CATEGORY_LABELS.special).toBe("Maxsus");
  });

  it("status labels and tones cover every status", () => {
    expect(TEACHER_STATUS_LABELS.active).toBe("Faol");
    expect(TEACHER_STATUS_LABELS.on_leave).toBe("Ta'tilda");
    expect(TEACHER_STATUS_LABELS.dismissed).toBe("Bo'shatilgan");
    expect(TEACHER_STATUS_TONE.active).toBe("positive");
    expect(TEACHER_STATUS_TONE.dismissed).toBe("negative");
  });

  it("degree and employment labels are present", () => {
    expect(DEGREE_LABELS.bachelor).toBe("Bakalavr");
    expect(EMPLOYMENT_TYPE_LABELS.primary).toBe("Asosiy");
    expect(EMPLOYMENT_TYPE_LABELS.secondary).toBe("O'rindosh");
  });

  it("page sizes expose 10/20/50/100", () => {
    expect([...PAGE_SIZES]).toEqual([10, 20, 50, 100]);
  });
});

describe("hr-teachers types", () => {
  it("Teacher carries personal, work and role fields", () => {
    const t: Teacher = {
      id: "t-1",
      staffMemberId: null,
      firstName: "Aziz",
      lastName: "Karimov",
      middleName: null,
      fullName: "Karimov Aziz",
      gender: "male",
      birthDate: null,
      documentNumber: null,
      pinfl: null,
      phone: null,
      email: null,
      workType: "full",
      degree: "bachelor",
      employmentType: "primary",
      status: "active",
      category: "oliy",
      experienceYears: 4,
      ratePerLesson: 0,
      startDate: null,
      endDate: null,
      isSubjectTeacher: true,
      isAssistantTeacher: false,
      isMbr: false,
      isExtraLesson: false,
      isClassLeader: false,
      note: null,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    expect(t.fullName).toBe("Karimov Aziz");
    expect(t.isSubjectTeacher).toBe(true);
  });
});
