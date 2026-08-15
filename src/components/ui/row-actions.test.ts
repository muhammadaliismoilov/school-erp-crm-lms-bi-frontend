import { describe, expect, it } from "vitest";
import { Pencil, Trash2, Eye } from "lucide-react";
import { allowedRowActions, visibleRowActions, type RowAction } from "./row-actions";

interface Row {
  id: string;
  locked: boolean;
}

const noop = () => undefined;

const actions: RowAction<Row>[] = [
  { key: "view", label: "Ko‘rish", icon: Eye, onSelect: noop },
  {
    key: "edit",
    label: "Tahrirlash",
    icon: Pencil,
    permission: "hr-branches.update",
    onSelect: noop,
    hidden: (row) => row.locked,
  },
  {
    key: "delete",
    label: "O‘chirish",
    icon: Trash2,
    permission: "hr-branches.delete",
    onSelect: noop,
  },
];

const openRow: Row = { id: "1", locked: false };
const lockedRow: Row = { id: "2", locked: true };

describe("allowedRowActions", () => {
  it("imtiyozsiz amal hammaga ochiq qoladi", () => {
    expect(allowedRowActions(actions, []).map((a) => a.key)).toEqual(["view"]);
  });

  it("faqat berilgan imtiyozdagi amallarni qoldiradi", () => {
    expect(allowedRowActions(actions, ["hr-branches.update"]).map((a) => a.key)).toEqual([
      "view",
      "edit",
    ]);
  });

  it("wildcard bilan hammasi ochiladi", () => {
    expect(allowedRowActions(actions, ["*.*"])).toHaveLength(3);
  });

  it("qatorga bog'liq hidden bu bosqichda tekshirilmaydi", () => {
    // Ustun ko'rinishi butun jadvalga tegishli — bitta yopiq qator uni yashirmaydi.
    expect(allowedRowActions(actions, ["hr-branches.update"]).map((a) => a.key)).toContain(
      "edit",
    );
  });
});

describe("visibleRowActions", () => {
  it("hidden qaytargan amalni chiqarib tashlaydi", () => {
    expect(visibleRowActions(actions, lockedRow, ["*.*"]).map((a) => a.key)).toEqual([
      "view",
      "delete",
    ]);
    expect(visibleRowActions(actions, openRow, ["*.*"]).map((a) => a.key)).toEqual([
      "view",
      "edit",
      "delete",
    ]);
  });

  it("imtiyoz va hidden birga qo'llanadi", () => {
    expect(visibleRowActions(actions, lockedRow, ["hr-branches.update"]).map((a) => a.key)).toEqual(
      ["view"],
    );
  });
});
