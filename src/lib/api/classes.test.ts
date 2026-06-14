import { describe, it, expect } from "vitest";
import { buildSmsInput } from "./classes";

describe("buildSmsInput", () => {
  it("returns null when neither a template nor a body is given", () => {
    expect(buildSmsInput({})).toBeNull();
    expect(buildSmsInput({ body: "   " })).toBeNull();
  });

  it("builds an immediate message with a trimmed body", () => {
    expect(buildSmsInput({ body: "  Salom  " })).toEqual({ body: "Salom" });
  });

  it("keeps the template id and omits an empty body", () => {
    expect(buildSmsInput({ templateId: "tpl-1" })).toEqual({ templateId: "tpl-1" });
  });

  it("schedules with a date and explicit time", () => {
    const result = buildSmsInput({ body: "Salom", date: "2026-06-20", time: "09:30" });
    expect(result?.scheduledAt).toBe(new Date("2026-06-20T09:30:00").toISOString());
  });

  it("defaults the time to 09:00 when only a date is given", () => {
    const result = buildSmsInput({ body: "Salom", date: "2026-06-20" });
    expect(result?.scheduledAt).toBe(new Date("2026-06-20T09:00:00").toISOString());
  });

  it("omits scheduledAt when no date is given", () => {
    const result = buildSmsInput({ body: "Salom", time: "09:30" });
    expect(result?.scheduledAt).toBeUndefined();
  });
});
