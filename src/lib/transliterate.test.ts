import { describe, it, expect } from "vitest";
import { latinToCyrillic } from "./transliterate";

describe("latinToCyrillic", () => {
  it("maps basic latin letters to cyrillic", () => {
    expect(latinToCyrillic("Ali")).toBe("Али");
    expect(latinToCyrillic("Valiyev")).toBe("Валиев");
  });

  it("handles digraphs sh/ch", () => {
    expect(latinToCyrillic("Shoira")).toBe("Шоира");
    expect(latinToCyrillic("Choriev")).toBe("Чориэв");
  });

  it("handles apostrophe letters o' and g'", () => {
    expect(latinToCyrillic("o'g'il")).toBe("ўғил");
  });

  it("preserves capitalization of digraphs", () => {
    expect(latinToCyrillic("Sh")).toBe("Ш");
  });

  it("returns empty string for empty input", () => {
    expect(latinToCyrillic("")).toBe("");
  });
});
