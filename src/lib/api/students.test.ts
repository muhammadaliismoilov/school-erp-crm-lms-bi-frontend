import { describe, it, expect } from "vitest";
import {
  classLabel,
  fullName,
  initials,
  primaryParent,
  type Student,
} from "./students";

const baseStudent: Student = {
  id: "s1",
  firstName: "Ali",
  lastName: "Valiyev",
  studentCode: "ST-2026-0001",
  createdAt: "2026-06-01T00:00:00.000Z",
};

describe("classLabel", () => {
  it("formats grade and section as `grade-section`", () => {
    expect(classLabel({ id: "c1", name: "2-B", gradeLevel: 2, section: "B" })).toBe("2-B");
  });

  it("returns null when no class is set", () => {
    expect(classLabel(null)).toBeNull();
    expect(classLabel(undefined)).toBeNull();
  });
});

describe("fullName", () => {
  it("joins last, first and middle names in order", () => {
    expect(fullName({ firstName: "Ali", lastName: "Valiyev", middleName: "Akmalovich" })).toBe(
      "Valiyev Ali Akmalovich",
    );
  });

  it("skips an absent middle name", () => {
    expect(fullName({ firstName: "Ali", lastName: "Valiyev" })).toBe("Valiyev Ali");
  });
});

describe("initials", () => {
  it("takes the first letter of first and last name, uppercased", () => {
    expect(initials({ firstName: "ali", lastName: "valiyev" })).toBe("AV");
  });
});

describe("primaryParent", () => {
  it("prefers the parent flagged as primary", () => {
    const student: Student = {
      ...baseStudent,
      parents: [
        { id: "l1", relation: "mother", isPrimary: false, parent: { id: "p1", firstName: "Dilnoza", phone: "+998901111111" } },
        { id: "l2", relation: "father", isPrimary: true, parent: { id: "p2", firstName: "Akmal", phone: "+998902222222" } },
      ],
    };
    expect(primaryParent(student)?.id).toBe("p2");
  });

  it("falls back to the first parent when none is primary", () => {
    const student: Student = {
      ...baseStudent,
      parents: [
        { id: "l1", relation: "mother", isPrimary: false, parent: { id: "p1", firstName: "Dilnoza", phone: "+998901111111" } },
      ],
    };
    expect(primaryParent(student)?.id).toBe("p1");
  });

  it("returns null when there are no parents", () => {
    expect(primaryParent(baseStudent)).toBeNull();
  });
});
