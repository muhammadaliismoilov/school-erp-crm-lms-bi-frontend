import { describe, it, expect } from "vitest";
import type {
  PaymentType,
  PaymentTypeListResult,
  PaymentTypeStats,
} from "./payment-types";

describe("payment-types types", () => {
  it("PaymentType shape carries name/code/system flags", () => {
    const pt: PaymentType = {
      id: "1",
      name: "Naqd",
      code: "cash",
      isActive: true,
      isSystem: true,
      sortOrder: 1,
      createdAt: "2026-06-09T00:00:00.000Z",
      updatedAt: "2026-06-09T00:00:00.000Z",
    };
    expect(pt.name).toBe("Naqd");
    expect(pt.isSystem).toBe(true);
  });

  it("stats expose total, addedThisMonth and latest", () => {
    const stats: PaymentTypeStats = {
      total: 2,
      addedThisMonth: 2,
      latestName: "Naqd",
      latestCreatedAt: "2026-06-09T00:00:00.000Z",
    };
    expect(stats.total).toBe(2);
    expect(stats.latestName).toBe("Naqd");
  });

  it("list result couples items with meta and stats", () => {
    const result: PaymentTypeListResult = {
      items: [],
      meta: { page: 1, limit: 20, total: 0, pageCount: 1 },
      stats: { total: 0, addedThisMonth: 0, latestName: null, latestCreatedAt: null },
    };
    expect(result.meta.limit).toBe(20);
    expect(result.stats.latestName).toBeNull();
  });
});
