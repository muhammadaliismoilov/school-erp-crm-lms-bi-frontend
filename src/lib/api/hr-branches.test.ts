import { describe, it, expect } from "vitest";
import { flattenBranches, PAGE_SIZES, type BranchNode } from "./hr-branches";

function node(id: string, children: BranchNode[] = []): BranchNode {
  return {
    id,
    name: id,
    parentId: null,
    parentName: null,
    isHeadOffice: false,
    isActive: true,
    createdAt: "2026-06-01T00:00:00.000Z",
    children,
  };
}

describe("flattenBranches", () => {
  it("flattens a tree depth-first with depth markers", () => {
    const tree = [node("root", [node("child1"), node("child2")]), node("solo")];
    const flat = flattenBranches(tree);
    expect(flat.map((f) => f.node.id)).toEqual(["root", "child1", "child2", "solo"]);
    expect(flat.map((f) => f.depth)).toEqual([0, 1, 1, 0]);
  });

  it("returns empty for empty input", () => {
    expect(flattenBranches([])).toEqual([]);
  });
});

describe("hr-branches constants", () => {
  it("page sizes expose 10/20/50/100", () => {
    expect([...PAGE_SIZES]).toEqual([10, 20, 50, 100]);
  });
});
