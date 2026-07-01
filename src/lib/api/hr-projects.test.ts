import { describe, it, expect } from "vitest";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TONE,
  PROJECT_COLOR_PRESETS,
  PAGE_SIZES,
  type Project,
} from "./hr-projects";

describe("hr-projects constants", () => {
  it("status labels localized to Uzbek", () => {
    expect(PROJECT_STATUS_LABELS.active).toBe("Faol");
    expect(PROJECT_STATUS_LABELS.inactive).toBe("Faol emas");
  });

  it("status tone maps active→positive, inactive→negative", () => {
    expect(PROJECT_STATUS_TONE.active).toBe("positive");
    expect(PROJECT_STATUS_TONE.inactive).toBe("negative");
  });

  it("page sizes expose 10/20/50/100", () => {
    expect([...PAGE_SIZES]).toEqual([10, 20, 50, 100]);
  });

  it("exposes a non-empty hex color palette", () => {
    expect(PROJECT_COLOR_PRESETS.length).toBeGreaterThan(0);
    for (const c of PROJECT_COLOR_PRESETS) expect(c).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe("hr-projects types", () => {
  it("Project carries name, description, color and status", () => {
    const p: Project = {
      id: "pr-1",
      name: "Darsla",
      description: "sdasdasdad",
      color: "#f59e0b",
      status: "active",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    expect(p.color).toBe("#f59e0b");
    expect(p.status).toBe("active");
  });
});
