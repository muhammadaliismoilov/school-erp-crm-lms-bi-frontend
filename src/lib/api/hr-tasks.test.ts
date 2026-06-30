import { describe, it, expect } from "vitest";
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_PRIORITIES,
  PAGE_SIZES,
  type Task,
} from "./hr-tasks";

describe("hr-tasks constants", () => {
  it("status labels localized to Uzbek", () => {
    expect(TASK_STATUS_LABELS.pending).toBe("Kutilmoqda");
    expect(TASK_STATUS_LABELS.in_progress).toBe("Jarayonda");
    expect(TASK_STATUS_LABELS.review).toBe("Ko‘rib chiqilmoqda");
    expect(TASK_STATUS_LABELS.done).toBe("Bajarildi");
    expect(TASK_STATUS_LABELS.cancelled).toBe("Bekor qilindi");
  });

  it("priority labels localized to Uzbek", () => {
    expect(TASK_PRIORITY_LABELS.low).toBe("Past");
    expect(TASK_PRIORITY_LABELS.medium).toBe("O‘rta");
    expect(TASK_PRIORITY_LABELS.high).toBe("Yuqori");
    expect(TASK_PRIORITY_LABELS.urgent).toBe("Tezkor");
  });

  it("enumerations + page sizes", () => {
    expect([...TASK_STATUSES]).toEqual(["pending", "in_progress", "review", "done", "cancelled"]);
    expect([...TASK_PRIORITIES]).toEqual(["low", "medium", "high", "urgent"]);
    expect([...PAGE_SIZES]).toEqual([10, 20, 50, 100]);
  });
});

describe("hr-tasks types", () => {
  it("Task carries project, assignee, status and priority", () => {
    const t: Task = {
      id: "t-1",
      title: "Hujjat",
      description: null,
      projectId: "p-1",
      projectName: "Darsla",
      assigneeId: "s-1",
      assigneeName: "Valiyev Ali",
      status: "in_progress",
      priority: "high",
      startDate: "2026-06-19",
      endDate: "2026-06-30",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    expect(t.status).toBe("in_progress");
    expect(t.priority).toBe("high");
  });
});
