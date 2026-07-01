import { describe, it, expect } from "vitest";
import {
  GEOFENCE_STATUS_LABELS,
  formatCoordinate,
  PAGE_SIZES,
  type Geofence,
} from "./hr-geofences";

describe("hr-geofences helpers", () => {
  it("status labels localized to Uzbek", () => {
    expect(GEOFENCE_STATUS_LABELS.active).toBe("Faol");
    expect(GEOFENCE_STATUS_LABELS.inactive).toBe("Faol emas");
  });

  it("page sizes expose 10/20/50/100", () => {
    expect([...PAGE_SIZES]).toEqual([10, 20, 50, 100]);
  });

  it("formatCoordinate renders 6 decimals and treats null as 0", () => {
    expect(formatCoordinate(0)).toBe("0.000000");
    expect(formatCoordinate(null)).toBe("0.000000");
    expect(formatCoordinate(41.311081)).toBe("41.311081");
  });
});

describe("hr-geofences types", () => {
  it("Geofence carries coordinates, radius and active flag", () => {
    const g: Geofence = {
      id: "g-1",
      name: "gutlan",
      latitude: 0,
      longitude: 0,
      radiusM: 100,
      isActive: true,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    expect(g.radiusM).toBe(100);
    expect(g.isActive).toBe(true);
  });
});
