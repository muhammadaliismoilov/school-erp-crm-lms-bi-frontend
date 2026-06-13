import { describe, it, expect } from "vitest";
import {
  isoToDMY,
  dmyToISO,
  maskDMY,
  formatDateDMY,
  formatNumberSpaced,
  maskNumber,
  stripNumber,
  toNumber,
} from "./format";

describe("isoToDMY", () => {
  it("ISO sanani dd/mm/yyyy ga aylantiradi", () => {
    expect(isoToDMY("2026-06-13")).toBe("13/06/2026");
  });
  it("to'liq ISO datetime ham ishlaydi", () => {
    expect(isoToDMY("2026-01-09T10:20:30.000Z")).toBe("09/01/2026");
  });
  it("bo'sh/noto'g'ri → ''", () => {
    expect(isoToDMY("")).toBe("");
    expect(isoToDMY(null)).toBe("");
    expect(isoToDMY("salom")).toBe("");
  });
});

describe("dmyToISO", () => {
  it("dd/mm/yyyy → ISO", () => {
    expect(dmyToISO("13/06/2026")).toBe("2026-06-13");
    expect(dmyToISO("01/01/2000")).toBe("2000-01-01");
  });
  it("to'liq bo'lmagan → null", () => {
    expect(dmyToISO("13/06")).toBeNull();
    expect(dmyToISO("1/6/2026")).toBeNull();
    expect(dmyToISO("")).toBeNull();
  });
  it("haqiqiy bo'lmagan kalendar sanasi → null", () => {
    expect(dmyToISO("31/02/2026")).toBeNull();
    expect(dmyToISO("00/01/2026")).toBeNull();
    expect(dmyToISO("13/13/2026")).toBeNull();
  });
  it("kabisa yili 29/02 to'g'ri", () => {
    expect(dmyToISO("29/02/2024")).toBe("2024-02-29");
    expect(dmyToISO("29/02/2026")).toBeNull();
  });
  it("isoToDMY bilan teskari mos (round-trip)", () => {
    expect(isoToDMY(dmyToISO("13/06/2026")!)).toBe("13/06/2026");
  });
});

describe("maskDMY", () => {
  it("yozilayotgan raqamlarga / qo'yadi", () => {
    expect(maskDMY("1")).toBe("1");
    expect(maskDMY("13")).toBe("13");
    expect(maskDMY("1306")).toBe("13/06");
    expect(maskDMY("13062026")).toBe("13/06/2026");
  });
  it("raqam bo'lmaganlarni tashlaydi, 8 ta bilan cheklaydi", () => {
    expect(maskDMY("13/06/2026")).toBe("13/06/2026");
    expect(maskDMY("13a06b2026999")).toBe("13/06/2026");
  });
});

describe("formatDateDMY", () => {
  it("ISO string → dd/mm/yyyy", () => {
    expect(formatDateDMY("2026-06-13")).toBe("13/06/2026");
  });
  it("Date obyekti ishlaydi", () => {
    expect(formatDateDMY(new Date(Date.UTC(2026, 5, 13)))).toBe("13/06/2026");
  });
  it("bo'sh/noto'g'ri → —", () => {
    expect(formatDateDMY(null)).toBe("—");
    expect(formatDateDMY("")).toBe("—");
    expect(formatDateDMY("xxx")).toBe("—");
  });
});

describe("formatNumberSpaced", () => {
  it("mingliklarni bo'shliq bilan ajratadi", () => {
    expect(formatNumberSpaced(100)).toBe("100");
    expect(formatNumberSpaced(1000)).toBe("1 000");
    expect(formatNumberSpaced(10000)).toBe("10 000");
    expect(formatNumberSpaced(100000)).toBe("100 000");
    expect(formatNumberSpaced(1000000)).toBe("1 000 000");
  });
  it("kasr qismini saqlaydi", () => {
    expect(formatNumberSpaced(1000.5)).toBe("1 000.5");
    expect(formatNumberSpaced(4.5)).toBe("4.5");
  });
  it("manfiy son", () => {
    expect(formatNumberSpaced(-1000)).toBe("-1 000");
  });
  it("string kirish", () => {
    expect(formatNumberSpaced("100000")).toBe("100 000");
  });
  it("bo'sh/noto'g'ri → —", () => {
    expect(formatNumberSpaced(null)).toBe("—");
    expect(formatNumberSpaced("")).toBe("—");
    expect(formatNumberSpaced("abc")).toBe("—");
  });
  it("nol", () => {
    expect(formatNumberSpaced(0)).toBe("0");
  });
});

describe("maskNumber", () => {
  it("yozilayotgan butun sonni guruhlaydi", () => {
    expect(maskNumber("1000")).toBe("1 000");
    expect(maskNumber("100000")).toBe("100 000");
    expect(maskNumber("1000000")).toBe("1 000 000");
  });
  it("son bo'lmaganlarni tashlaydi", () => {
    expect(maskNumber("1a0b0c0")).toBe("1 000");
  });
  it("boshidagi nollarni tozalaydi", () => {
    expect(maskNumber("007")).toBe("7");
  });
  it("decimal=false da nuqtani tashlaydi", () => {
    expect(maskNumber("1000.5", false)).toBe("10 005");
  });
  it("decimal=true da kasrni saqlaydi", () => {
    expect(maskNumber("1000.5", true)).toBe("1 000.5");
    expect(maskNumber("4.", true)).toBe("4.");
    expect(maskNumber("1.2.3", true)).toBe("1.23");
  });
  it("bo'sh → ''", () => {
    expect(maskNumber("")).toBe("");
  });
});

describe("stripNumber / toNumber", () => {
  it("bo'shliqlarni olib tashlaydi", () => {
    expect(stripNumber("100 000")).toBe("100000");
    expect(stripNumber("1 000 000.5")).toBe("1000000.5");
  });
  it("toNumber toza son qaytaradi", () => {
    expect(toNumber("100 000")).toBe(100000);
    expect(toNumber("1 000.5")).toBe(1000.5);
  });
  it("bo'sh/noto'g'ri → null", () => {
    expect(toNumber("")).toBeNull();
    expect(toNumber(null)).toBeNull();
    expect(toNumber(".")).toBeNull();
  });
  it("mask → strip round-trip backend toza son oladi", () => {
    expect(stripNumber(maskNumber("100000"))).toBe("100000");
    expect(stripNumber(maskNumber("1000000.50", true))).toBe("1000000.50");
  });
});
