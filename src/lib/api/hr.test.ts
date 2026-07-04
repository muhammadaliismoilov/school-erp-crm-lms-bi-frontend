import { describe, it, expect } from "vitest";
import {
  EMPLOYMENT_STATUS_LABELS,
  EMPLOYMENT_STATUS_TONE,
  GENDER_LABELS,
  EMPLOYMENT_STATUSES,
  PAGE_SIZES,
  type StaffMember,
} from "./hr";

describe("hr constants", () => {
  it("employment status labels localized to Uzbek", () => {
    expect(EMPLOYMENT_STATUS_LABELS.active).toBe("Faol");
    expect(EMPLOYMENT_STATUS_LABELS.dismissed).toBe("Faol emas");
    expect(EMPLOYMENT_STATUS_LABELS.on_leave).toBe("Ta'tilda");
  });

  it("status tone maps active→positive, dismissed→negative, on_leave→caution", () => {
    expect(EMPLOYMENT_STATUS_TONE.active).toBe("positive");
    expect(EMPLOYMENT_STATUS_TONE.dismissed).toBe("negative");
    expect(EMPLOYMENT_STATUS_TONE.on_leave).toBe("caution");
  });

  it("gender labels localized", () => {
    expect(GENDER_LABELS.male).toBe("Erkak");
    expect(GENDER_LABELS.female).toBe("Ayol");
  });

  it("enumerations + page sizes", () => {
    expect([...EMPLOYMENT_STATUSES]).toEqual(["active", "on_leave", "dismissed"]);
    expect([...PAGE_SIZES]).toEqual([10, 20, 50, 100]);
  });
});

describe("hr types", () => {
  it("StaffMember carries identity, employment and salary fields", () => {
    const s: StaffMember = {
      id: "s-1",
      employeeCode: "EMP-0001",
      userId: "u-1",
      firstName: "Ali",
      firstNameCyrillic: "Али",
      lastName: "Valiyev",
      lastNameCyrillic: "Валиев",
      middleName: null,
      middleNameCyrillic: null,
      gender: "male",
      birthDate: "2000-01-15",
      passportSeries: "AB1234567",
      pinfl: "12345678901234",
      phone: "+998901112233",
      email: "ali@example.uz",
      photoUrl: null,
      departmentId: "d-1",
      department: { id: "d-1", name: "Oquv", code: "study" },
      positionId: "p-1",
      position: { id: "p-1", title: "Manaviyat", code: "moral", baseSalary: 0 },
      hireDate: "2026-06-01",
      status: "active",
      salary: 5000000,
      qualificationCategory: "oliy",
      qualificationDate: "2025-06-01",
      kpiMode: null,
      kpiValue: 0,
      createdAt: "2026-06-01T00:00:00.000Z",
    };
    expect(s.salary).toBe(5000000);
    expect(s.department?.name).toBe("Oquv");
  });
});
