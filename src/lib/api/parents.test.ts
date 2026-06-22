import { describe, it, expect } from "vitest";
import { childClassLabel, childName, generatePassword } from "./parents";

describe("childName", () => {
  it("joins first and last name", () => {
    expect(childName({ firstName: "Aziz", lastName: "Aliyev" })).toBe("Aziz Aliyev");
  });

  it("trims when last name is missing", () => {
    expect(childName({ firstName: "Aziz" })).toBe("Aziz");
    expect(childName({ firstName: "Aziz", lastName: null })).toBe("Aziz");
  });
});

describe("childClassLabel", () => {
  it("prefers the explicit class name", () => {
    expect(childClassLabel({ name: "2-B", gradeLevel: 2, section: "B" })).toBe("2-B");
  });

  it("falls back to grade-section when no name", () => {
    expect(childClassLabel({ gradeLevel: 3, section: "A" })).toBe("3-A");
  });

  it("returns empty string for no class", () => {
    expect(childClassLabel(null)).toBe("");
    expect(childClassLabel(undefined)).toBe("");
  });
});

describe("generatePassword", () => {
  it("respects the requested length", () => {
    expect(generatePassword(14)).toHaveLength(14);
    expect(generatePassword(8)).toHaveLength(8);
  });

  it("excludes ambiguous characters (0 O 1 l I)", () => {
    const pw = generatePassword(200);
    expect(pw).not.toMatch(/[0O1lI]/);
  });

  it("produces different values across calls", () => {
    expect(generatePassword()).not.toBe(generatePassword());
  });
});
