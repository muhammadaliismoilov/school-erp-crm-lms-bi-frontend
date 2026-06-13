import { describe, it, expect } from "vitest";
import {
  hourOptions,
  minuteOptions,
  normalizeTime,
  splitTime,
  joinTime,
  isValidTime,
  toMinutes,
} from "./time";

describe("hourOptions / minuteOptions", () => {
  it("24 ta soat, nol bilan", () => {
    const h = hourOptions();
    expect(h).toHaveLength(24);
    expect(h[0]).toBe("00");
    expect(h[23]).toBe("23");
  });

  it("daqiqa 5 qadam (default) → 12 ta", () => {
    const m = minuteOptions();
    expect(m).toHaveLength(12);
    expect(m).toContain("00");
    expect(m).toContain("55");
    expect(m).not.toContain("01");
  });

  it("daqiqa 1 qadam → 60 ta", () => {
    expect(minuteOptions(1)).toHaveLength(60);
  });

  it("noto'g'ri qadam → 5 ga qaytadi", () => {
    expect(minuteOptions(0)).toHaveLength(12);
  });
});

describe("normalizeTime", () => {
  it("HH:mm normallashtiradi", () => {
    expect(normalizeTime("8:0")).toBe("08:00");
    expect(normalizeTime("08:45:00")).toBe("08:45");
    expect(normalizeTime("14:5")).toBe("14:05");
  });
  it("bo'sh/noto'g'ri → ''", () => {
    expect(normalizeTime("")).toBe("");
    expect(normalizeTime(null)).toBe("");
    expect(normalizeTime("25:00")).toBe("");
    expect(normalizeTime("08:70")).toBe("");
    expect(normalizeTime("salom")).toBe("");
  });
});

describe("splitTime / joinTime", () => {
  it("ajratadi va birlashtiradi (round-trip)", () => {
    expect(splitTime("08:45")).toEqual({ hour: "08", minute: "45" });
    expect(joinTime("08", "45")).toBe("08:45");
  });
  it("bo'sh qism → ''", () => {
    expect(splitTime("")).toEqual({ hour: "", minute: "" });
    expect(joinTime("08", "")).toBe("");
    expect(joinTime("", "45")).toBe("");
  });
});

describe("isValidTime / toMinutes", () => {
  it("validlik", () => {
    expect(isValidTime("08:00")).toBe(true);
    expect(isValidTime("24:00")).toBe(false);
    expect(isValidTime("")).toBe(false);
  });
  it("daqiqaga aylantiradi", () => {
    expect(toMinutes("08:00")).toBe(480);
    expect(toMinutes("00:30")).toBe(30);
    expect(toMinutes("noto'g'ri")).toBeNull();
  });
});
