import { describe, it, expect } from "vitest";
import {
  COMM_SENTIMENTS,
  COMM_SENTIMENT_LABELS,
  PARENT_TYPES,
  PARENT_TYPE_LABELS,
} from "./parent-comms";

describe("parent-comms constants", () => {
  it("exposes the three sentiments matching the tabs", () => {
    expect(COMM_SENTIMENTS).toEqual(["positive", "neutral", "negative"]);
  });

  it("exposes the four parent types", () => {
    expect(PARENT_TYPES).toEqual(["mother", "father", "guardian", "other"]);
  });

  it("has an Uzbek label for every sentiment", () => {
    expect(COMM_SENTIMENT_LABELS.positive).toBe("Ijobiy");
    expect(COMM_SENTIMENT_LABELS.neutral).toBe("Neytral");
    expect(COMM_SENTIMENT_LABELS.negative).toBe("Salbiy");
  });

  it("has an Uzbek label for every parent type", () => {
    expect(PARENT_TYPE_LABELS.mother).toBe("Ona");
    expect(PARENT_TYPE_LABELS.father).toBe("Ota");
    expect(PARENT_TYPE_LABELS.guardian).toBe("Vasiy");
    expect(PARENT_TYPE_LABELS.other).toBe("Boshqa");
  });
});
