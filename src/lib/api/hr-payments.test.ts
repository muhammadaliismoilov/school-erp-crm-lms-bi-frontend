import { describe, it, expect } from "vitest";
import {
  PAGE_SIZES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONE,
  type HrPayment,
} from "./hr-payments";

describe("hr-payments constants", () => {
  it("status labels match the screenshot filter wording", () => {
    expect(PAYMENT_STATUS_LABELS.pending).toBe("Kutilmoqda");
    expect(PAYMENT_STATUS_LABELS.processing).toBe("Jarayonda");
    expect(PAYMENT_STATUS_LABELS.paid).toBe("To'langan");
    expect(PAYMENT_STATUS_LABELS.failed).toBe("Muvaffaqiyatsiz");
    expect(PAYMENT_STATUS_LABELS.cancelled).toBe("Bekor qilingan");
  });

  it("tones flag paid positive and failed negative", () => {
    expect(PAYMENT_STATUS_TONE.paid).toBe("positive");
    expect(PAYMENT_STATUS_TONE.failed).toBe("negative");
  });

  it("page sizes expose 10/20/50/100", () => {
    expect([...PAGE_SIZES]).toEqual([10, 20, 50, 100]);
  });
});

describe("hr-payments types", () => {
  it("payment carries amount, date and staff link", () => {
    const p: HrPayment = {
      id: "pay-1",
      staffMemberId: "s-1",
      staffName: "Valiyev Ali",
      amount: 4000000,
      paymentDate: "2026-06-30",
      status: "pending",
      timesheetId: null,
      note: null,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    expect(p.amount).toBe(4000000);
    expect(p.status).toBe("pending");
  });
});
