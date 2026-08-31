import { describe, expect, it } from "vitest";
import { applicantName, resolveSla } from "./sla";

const NOW = new Date("2026-06-10T12:00:00.000Z");
const at = (iso: string) => ({ dueAt: iso, status: "pending" as const });

describe("resolveSla", () => {
  it("muddati o'tgan ochiq murojaatni kechikkan deb belgilaydi", () => {
    const sla = resolveSla(at("2026-06-08T12:00:00.000Z"), NOW);
    expect(sla.tone).toBe("overdue");
    expect(sla.days).toBe(2);
  });

  it("bir kundan kam qolganda diqqatga chaqiradi", () => {
    expect(resolveSla(at("2026-06-11T06:00:00.000Z"), NOW).tone).toBe("soon");
  });

  it("bir kundan ko'p qolganda tinch qoldiradi", () => {
    expect(resolveSla(at("2026-06-13T12:00:00.000Z"), NOW).tone).toBe("calm");
  });

  it("aynan 24 soat qolganda hali diqqat talab qilmaydi", () => {
    // Chegara qaysi tomonga tegishli ekani ataylab qulflanadi: 24 soat —
    // hali "calm", undan pastga tushgandagina "soon".
    expect(resolveSla(at("2026-06-11T12:00:00.000Z"), NOW).tone).toBe("calm");
    expect(resolveSla(at("2026-06-11T11:00:00.000Z"), NOW).tone).toBe("soon");
  });

  it("yopilgan murojaat muddati o'tgan bo'lsa ham kechikkan deb ko'rsatilmaydi", () => {
    // Hal qilingan murojaatda qizil muddat belgisi faqat chalg'itadi.
    const sla = resolveSla(
      { dueAt: "2026-06-01T12:00:00.000Z", status: "resolved" },
      NOW,
    );
    expect(sla.tone).toBe("closed");
  });
});

describe("applicantName", () => {
  it("anonim murojaatda ismni ko'rsatmaydi", () => {
    // Ikkinchi himoya qatlami: backend ismni saqlamaydi, lekin shu qoidadan
    // oldin yozilgan qatorda ism qolgan bo'lishi mumkin.
    expect(
      applicantName({ isAnonymous: true, fullName: "Ali Valiyev" }, "Anonim"),
    ).toBe("Anonim");
  });

  it("ism bo'lmasa ham anonim yorlig'iga tushadi", () => {
    expect(applicantName({ isAnonymous: false, fullName: null }, "Anonim")).toBe("Anonim");
    expect(applicantName({ isAnonymous: false, fullName: "  " }, "Anonim")).toBe("Anonim");
  });

  it("oddiy murojaatda ismni qaytaradi", () => {
    expect(
      applicantName({ isAnonymous: false, fullName: "Ali Valiyev" }, "Anonim"),
    ).toBe("Ali Valiyev");
  });
});
