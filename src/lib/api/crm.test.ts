import { describe, it, expect } from "vitest";
import { groupLeadsByStatus, LEAD_STATUSES, type Lead } from "./crm";

const lead = (id: string, status: Lead["status"]): Lead => ({
  id,
  firstName: "A",
  fullName: "A",
  phone: "+998901234567",
  status,
});

describe("groupLeadsByStatus", () => {
  it("returns a bucket for every status, empty by default", () => {
    const groups = groupLeadsByStatus([]);
    expect(Object.keys(groups).sort()).toEqual([...LEAD_STATUSES].sort());
    for (const status of LEAD_STATUSES) {
      expect(groups[status]).toEqual([]);
    }
  });

  it("places leads in their status bucket", () => {
    const groups = groupLeadsByStatus([
      lead("1", "new"),
      lead("2", "new"),
      lead("3", "contract"),
    ]);
    expect(groups.new.map((l) => l.id)).toEqual(["1", "2"]);
    expect(groups.contract).toHaveLength(1);
    expect(groups.rejected).toHaveLength(0);
  });

  it("ignores leads with an unknown status", () => {
    const groups = groupLeadsByStatus([{ ...lead("9", "new"), status: "unknown" as Lead["status"] }]);
    expect(Object.values(groups).flat()).toHaveLength(0);
  });
});
