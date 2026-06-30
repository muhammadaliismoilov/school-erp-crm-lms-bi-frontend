import { describe, it, expect } from "vitest";
import {
  INTERACTION_STATUS_LABELS,
  INTERACTION_STATUS_TONE,
  INTERACTION_TYPE_LABELS,
  PAGE_SIZES,
  type Interaction,
} from "./hr-interactions";

describe("hr-interactions constants", () => {
  it("type labels match the screenshot dropdown", () => {
    expect(INTERACTION_TYPE_LABELS.call).toBe("Qo'ng'iroq");
    expect(INTERACTION_TYPE_LABELS.meeting).toBe("Uchrashuv");
    expect(INTERACTION_TYPE_LABELS.email).toBe("Email");
    expect(INTERACTION_TYPE_LABELS.interview).toBe("Suhbat");
    expect(INTERACTION_TYPE_LABELS.other).toBe("Boshqa");
  });

  it("status labels and tones cover planned/completed/cancelled", () => {
    expect(INTERACTION_STATUS_LABELS.planned).toBe("Rejalashtirilgan");
    expect(INTERACTION_STATUS_TONE.completed).toBe("positive");
    expect(INTERACTION_STATUS_TONE.cancelled).toBe("negative");
  });

  it("page sizes expose 10/20/50/100", () => {
    expect([...PAGE_SIZES]).toEqual([10, 20, 50, 100]);
  });
});

describe("hr-interactions types", () => {
  it("Interaction carries scheduling and result fields", () => {
    const it: Interaction = {
      id: "i-1",
      title: "Birinchi suhbat",
      type: "interview",
      status: "planned",
      candidateId: "c-1",
      candidateName: "Aziz Karimov",
      location: "Office",
      scheduledAt: "2026-07-01T10:00:00.000Z",
      endAt: null,
      purpose: null,
      description: null,
      result: null,
      summary: null,
      nextSteps: null,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    expect(it.type).toBe("interview");
    expect(it.candidateName).toBe("Aziz Karimov");
  });
});
