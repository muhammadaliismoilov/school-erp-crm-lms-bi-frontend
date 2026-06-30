import { describe, it, expect } from "vitest";
import {
  POSITION_STATUS_LABELS,
  POSITION_STATUS_TONE,
  PAGE_SIZES,
  type Position,
} from "./hr-positions";

describe("hr-positions constants", () => {
  it("status labels localized to Uzbek", () => {
    expect(POSITION_STATUS_LABELS.active).toBe("Faol");
    expect(POSITION_STATUS_LABELS.inactive).toBe("Faol emas");
  });

  it("status tone maps active→positive, inactive→negative", () => {
    expect(POSITION_STATUS_TONE.active).toBe("positive");
    expect(POSITION_STATUS_TONE.inactive).toBe("negative");
  });

  it("page sizes expose 10/20/50/100", () => {
    expect([...PAGE_SIZES]).toEqual([10, 20, 50, 100]);
  });
});

describe("hr-positions types", () => {
  it("Position carries department name, filial label and salary", () => {
    const p: Position = {
      id: "p-1",
      title: "Zavuch",
      code: "zavuch",
      description: null,
      baseSalary: 4000000,
      departmentId: "d-1",
      departmentName: "Oquv bo‘limi",
      schoolId: null,
      schoolName: null,
      filialId: null,
      filialLabel: null,
      ownerLabel: null,
      status: "active",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    expect(p.baseSalary).toBe(4000000);
    expect(p.departmentName).toBe("Oquv bo‘limi");
  });
});
