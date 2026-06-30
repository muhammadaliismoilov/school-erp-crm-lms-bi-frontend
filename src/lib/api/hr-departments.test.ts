import { describe, it, expect } from "vitest";
import {
  DEPARTMENT_STATUS_LABELS,
  DEPARTMENT_STATUS_TONE,
  PAGE_SIZES,
  type Department,
} from "./hr-departments";

describe("hr-departments constants", () => {
  it("status labels localized to Uzbek", () => {
    expect(DEPARTMENT_STATUS_LABELS.active).toBe("Faol");
    expect(DEPARTMENT_STATUS_LABELS.inactive).toBe("Faol emas");
  });

  it("status tone maps active→positive, inactive→negative", () => {
    expect(DEPARTMENT_STATUS_TONE.active).toBe("positive");
    expect(DEPARTMENT_STATUS_TONE.inactive).toBe("negative");
  });

  it("page sizes expose 10/20/50/100", () => {
    expect([...PAGE_SIZES]).toEqual([10, 20, 50, 100]);
  });
});

describe("hr-departments types", () => {
  it("Department carries filial label, parent and status", () => {
    const d: Department = {
      id: "d-1",
      name: "Oquv bo‘limi",
      code: "oquv_bolimi",
      description: null,
      schoolId: null,
      schoolName: null,
      filialId: "b-1",
      filialLabel: "Yuton School , Gurlan",
      ownerLabel: "Yuton School , Gurlan",
      parentId: null,
      parentName: null,
      telegramChatId: null,
      status: "active",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    expect(d.filialLabel).toBe("Yuton School , Gurlan");
    expect(d.status).toBe("active");
  });
});
