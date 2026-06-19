import { describe, it, expect } from "vitest";
import { attendanceTone } from "./gradebook";

describe("attendanceTone", () => {
  it("maps each attendance status to a tone class", () => {
    expect(attendanceTone("present")).toBe("bg-positive");
    expect(attendanceTone("late")).toBe("bg-amber");
    expect(attendanceTone("absent")).toBe("bg-negative");
    expect(attendanceTone("excused")).toBe("bg-ink-muted");
  });

  it("falls back to a neutral tone when unset", () => {
    expect(attendanceTone(null)).toBe("bg-line");
    expect(attendanceTone(undefined)).toBe("bg-line");
  });
});
