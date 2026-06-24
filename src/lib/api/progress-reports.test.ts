import { describe, it, expect } from "vitest";
import { gradeColorClass } from "./progress-reports";

describe("gradeColorClass", () => {
  it("null uchun neytral rang qaytaradi", () => {
    expect(gradeColorClass(null)).toContain("text-ink-muted");
  });

  it("a'lo (>=4.5) uchun ijobiy rang", () => {
    expect(gradeColorClass(5)).toContain("text-positive");
    expect(gradeColorClass(4.5)).toContain("text-positive");
  });

  it("yaxshi (>=3.5) uchun ko'k rang", () => {
    expect(gradeColorClass(4)).toContain("text-sky-600");
    expect(gradeColorClass(3.5)).toContain("text-sky-600");
  });

  it("qoniqarli (>=3) uchun amber rang", () => {
    expect(gradeColorClass(3)).toContain("text-amber");
    expect(gradeColorClass(3.4)).toContain("text-amber");
  });

  it("past (<3) uchun salbiy rang", () => {
    expect(gradeColorClass(2)).toContain("text-negative");
  });
});
