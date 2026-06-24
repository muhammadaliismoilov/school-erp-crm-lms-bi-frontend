import { describe, it, expect } from "vitest";
import {
  RATING_TRENDS,
  RATING_TREND_LABELS,
  RATING_TREND_TONES,
  type RatingTrend,
} from "./students-rating";

describe("students-rating constants", () => {
  it("exposes the three trend states", () => {
    expect(RATING_TRENDS).toEqual(["rising", "stable", "falling"]);
  });

  it("has an Uzbek label for every trend", () => {
    for (const trend of RATING_TRENDS) {
      expect(RATING_TREND_LABELS[trend]).toBeTruthy();
    }
    expect(RATING_TREND_LABELS.rising).toBe("O‘smoqda");
    expect(RATING_TREND_LABELS.stable).toBe("Barqaror");
    expect(RATING_TREND_LABELS.falling).toBe("Pasaymoqda");
  });

  it("maps each trend to a Badge tone", () => {
    const tones: Record<RatingTrend, string> = {
      rising: "positive",
      stable: "neutral",
      falling: "negative",
    };
    for (const trend of RATING_TRENDS) {
      expect(RATING_TREND_TONES[trend]).toBe(tones[trend]);
    }
  });
});
