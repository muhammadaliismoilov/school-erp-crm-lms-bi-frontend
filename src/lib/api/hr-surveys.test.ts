import { describe, it, expect } from "vitest";
import {
  PAGE_SIZES,
  SURVEY_STATUS_LABELS,
  SURVEY_STATUS_TONE,
  SURVEY_TYPE_LABELS,
  type Survey,
} from "./hr-surveys";

describe("hr-surveys constants", () => {
  it("type labels localized to Uzbek", () => {
    expect(SURVEY_TYPE_LABELS.anonymous).toBe("Anonim");
    expect(SURVEY_TYPE_LABELS.public).toBe("Ochiq");
  });

  it("status labels match draft/active/closed", () => {
    expect(SURVEY_STATUS_LABELS.draft).toBe("Qoralama");
    expect(SURVEY_STATUS_LABELS.active).toBe("Faol");
    expect(SURVEY_STATUS_LABELS.closed).toBe("Yakunlangan");
    expect(SURVEY_STATUS_TONE.active).toBe("positive");
  });

  it("page sizes expose 10/20/50/100", () => {
    expect([...PAGE_SIZES]).toEqual([10, 20, 50, 100]);
  });
});

describe("hr-surveys types", () => {
  it("Survey carries anonymity and date range", () => {
    const s: Survey = {
      id: "s-1",
      title: "Xodimlar qoniqishi",
      description: null,
      type: "anonymous",
      status: "draft",
      isAnonymous: true,
      startDate: "2026-06-02",
      endDate: "2026-06-20",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    expect(s.isAnonymous).toBe(true);
    expect(s.endDate).toBe("2026-06-20");
  });
});
