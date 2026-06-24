import { describe, it, expect } from "vitest";
import {
  MONTH_LABELS,
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
  monthLabel,
  typeTone,
} from "./transactions";

describe("transactions constants", () => {
  it("exposes the two transaction types matching the toggle", () => {
    expect(TRANSACTION_TYPES).toEqual(["income", "expense"]);
  });

  it("has an Uzbek label for every type", () => {
    for (const t of TRANSACTION_TYPES) {
      expect(TRANSACTION_TYPE_LABELS[t]).toBeTruthy();
    }
  });

  it("lists all twelve months", () => {
    expect(MONTH_LABELS).toHaveLength(12);
    expect(MONTH_LABELS[0]).toBe("Yanvar");
    expect(MONTH_LABELS[11]).toBe("Dekabr");
  });
});

describe("monthLabel", () => {
  it("maps 1-12 to a name", () => {
    expect(monthLabel(6)).toBe("Iyun");
    expect(monthLabel(1)).toBe("Yanvar");
  });

  it("returns a dash for out-of-range or empty values", () => {
    expect(monthLabel(0)).toBe("—");
    expect(monthLabel(13)).toBe("—");
    expect(monthLabel(null)).toBe("—");
    expect(monthLabel(undefined)).toBe("—");
  });
});

describe("typeTone", () => {
  it("returns the matching tone key", () => {
    expect(typeTone("income")).toBe("income");
    expect(typeTone("expense")).toBe("expense");
  });
});
