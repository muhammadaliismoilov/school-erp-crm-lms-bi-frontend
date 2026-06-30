import { describe, it, expect } from "vitest";
import {
  CHANGE_REQUEST_STATUS_LABELS,
  CHANGE_REQUEST_STATUS_TONE,
  CHANGE_REQUEST_TYPE_LABELS,
  CHANGE_REQUEST_STATUSES,
  CHANGE_REQUEST_TYPES,
  PAGE_SIZES,
  type ChangeRequest,
} from "./transaction-change-requests";

describe("transaction-change-requests constants", () => {
  it("status labels localized to Uzbek", () => {
    expect(CHANGE_REQUEST_STATUS_LABELS.pending).toBe("Kutilmoqda");
    expect(CHANGE_REQUEST_STATUS_LABELS.approved).toBe("Tasdiqlangan");
    expect(CHANGE_REQUEST_STATUS_LABELS.rejected).toBe("Rad etilgan");
  });

  it("type labels cover update and delete", () => {
    expect(CHANGE_REQUEST_TYPE_LABELS.update).toBe("Tahrirlash");
    expect(CHANGE_REQUEST_TYPE_LABELS.delete).toBe("O‘chirish");
  });

  it("status tone maps pending→caution, approved→positive, rejected→negative", () => {
    expect(CHANGE_REQUEST_STATUS_TONE.pending).toBe("caution");
    expect(CHANGE_REQUEST_STATUS_TONE.approved).toBe("positive");
    expect(CHANGE_REQUEST_STATUS_TONE.rejected).toBe("negative");
  });

  it("enumerations expose the expected members", () => {
    expect([...CHANGE_REQUEST_STATUSES]).toEqual(["pending", "approved", "rejected"]);
    expect([...CHANGE_REQUEST_TYPES]).toEqual(["update", "delete"]);
  });

  it("page sizes expose 10/20/50/100", () => {
    expect([...PAGE_SIZES]).toEqual([10, 20, 50, 100]);
  });
});

describe("transaction-change-requests types", () => {
  it("ChangeRequest carries snapshot, proposed changes and review fields", () => {
    const req: ChangeRequest = {
      id: "r-1",
      transactionId: "tx-1",
      requestType: "update",
      proposedChanges: { amount: 750000 },
      txType: "expense",
      txAmount: 500000,
      txDate: "2026-05-10",
      txPersonName: "Aliyev Javohir",
      reason: "Summa noto‘g‘ri",
      status: "pending",
      requestedById: "u-1",
      requestedByName: "Requester",
      reviewedById: null,
      reviewedByName: null,
      reviewedAt: null,
      reviewNote: null,
      applied: false,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    expect(req.proposedChanges?.amount).toBe(750000);
    expect(req.status).toBe("pending");
  });
});
