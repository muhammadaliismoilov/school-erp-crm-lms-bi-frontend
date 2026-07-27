import { describe, expect, it } from "vitest";
import type { QuarterView, ScheduleGrid } from "@/lib/api/schedule";
import {
  buildQuarterWorkbook,
  buildTemplateWorkbook,
  contrastColor,
  formatDate,
  safeFileName,
  type ScheduleExportLabels,
} from "./schedule-xlsx";
import type { XlsxCell, XlsxRow } from "./xlsx";

const periods = [
  { id: "p1", code: "1", startTime: "08:30:00", endTime: "09:15:00", order: 1 },
  { id: "p2", code: "2", startTime: "09:25:00", endTime: "10:10:00", order: 2 },
];

const subjects = [
  { id: "s1", name: { uz: "Matematika" }, color: "#4f46e5" },
  { id: "s2", name: { uz: "Ona tili" }, color: "#fbbf24" },
];

const view: QuarterView = {
  quarterId: "q1",
  classId: "c1",
  teacherId: null,
  startDate: "2026-09-01",
  endDate: "2026-09-14",
  days: [1, 2, 3, 4, 5],
  periods,
  subjects,
  weeks: [
    {
      weekNumber: 1,
      startDate: "2026-09-01",
      endDate: "2026-09-07",
      isCurrent: true,
      cells: {
        // Ataylab teskari tartibda — ro'yxat varag'i saralashini tekshirish uchun.
        "2:p2": {
          id: "l2",
          subjectId: "s2",
          subjectName: { uz: "Ona tili" },
          subjectColor: "#fbbf24",
          teacherName: "Karimova Nodira",
          className: "9-A",
          roomName: null,
          isSubstituted: true,
          lessonDate: "2026-09-02",
          weekday: 2,
        },
        "1:p1": {
          id: "l1",
          subjectId: "s1",
          subjectName: { uz: "Matematika" },
          subjectColor: "#4f46e5",
          teacherName: "Aliyev O‘tkir",
          className: "9-A",
          roomName: "204",
          isSubstituted: false,
          lessonDate: "2026-09-01",
          weekday: 1,
        },
      },
    },
    // Bo'sh hafta — grid varag'ida bloki chiqmasligi kerak.
    { weekNumber: 2, startDate: "2026-09-08", endDate: "2026-09-14", isCurrent: false, cells: {} },
  ],
};

const grid: ScheduleGrid = {
  quarterId: "q1",
  classId: "c1",
  days: [1, 2, 3, 4, 5],
  periods,
  subjects,
  cells: {
    "1:p1": {
      id: "l1",
      subjectId: "s1",
      subjectName: { uz: "Matematika" },
      subjectColor: "#4f46e5",
      teacherName: "Aliyev O‘tkir",
      roomName: "204",
      isSubstituted: false,
    },
  },
};

const labels: ScheduleExportLabels = {
  title: "9-A · 1-chorak",
  gridSheet: "Jadval",
  listSheet: "Ro‘yxat",
  week: (n) => `${n}-hafta`,
  day: (d) => ["Dush", "Sesh", "Chor", "Pay", "Juma", "Shan", "Yak"][d - 1],
  period: "Para",
  date: "Sana",
  weekCol: "Hafta",
  dayCol: "Kun",
  start: "Boshlanishi",
  end: "Tugashi",
  subject: "Fan",
  teacher: "O‘qituvchi",
  className: "Sinf",
  room: "Xona",
  substituted: "Almashtirilgan",
  yes: "Ha",
};

const opts = {
  days: [1, 2, 3, 4, 5],
  mode: "class" as const,
  labels,
  localize: (n: unknown) => (n as { uz: string }).uz,
};

/** Katakning matn qiymati (uslubli yoki oddiy bo'lishidan qat'i nazar). */
const text = (row: XlsxRow, col: number): string => {
  const cell = row[col];
  const value = cell !== null && typeof cell === "object" ? (cell as XlsxCell).value : cell;
  return value === null || value === undefined ? "" : String(value);
};

describe("contrastColor", () => {
  it("och fonda qora, to'q fonda oq shrift tanlaydi", () => {
    expect(contrastColor("#fbbf24")).toBe("1F2937");
    expect(contrastColor("#4f46e5")).toBe("FFFFFF");
    expect(contrastColor("ffffff")).toBe("1F2937");
    expect(contrastColor("000000")).toBe("FFFFFF");
  });

  it("yaroqsiz rangda to'q shriftga qaytadi", () => {
    expect(contrastColor("yashil")).toBe("1F2937");
  });
});

describe("formatDate", () => {
  it("ISO sanani kun.oy.yil ga o'giradi", () => {
    expect(formatDate("2026-09-05")).toBe("05.09.2026");
  });

  it("qisqa qiymatni o'zgartirmaydi", () => {
    expect(formatDate("2026-09")).toBe("2026-09");
  });
});

describe("safeFileName", () => {
  it("bo'sh qismlarni tashlab, xavfli belgilarni tozalaydi", () => {
    expect(safeFileName(["jadval", null, "9-A", "1-chorak"])).toBe("jadval-9-A-1-chorak");
    expect(safeFileName(["a/b:c", "  d  e "])).toBe("a-b-c-d-e");
  });

  it("hammasi bo'sh bo'lsa zaxira nom beradi", () => {
    expect(safeFileName([null, "", "///"])).toBe("jadval");
  });
});

describe("buildQuarterWorkbook", () => {
  const [gridSheet, listSheet] = buildQuarterWorkbook(view, opts);

  it("ikki varaq qaytaradi", () => {
    expect(gridSheet.name).toBe("Jadval");
    expect(listSheet.name).toBe("Ro‘yxat");
  });

  it("grid varag'ida sarlavha va hafta bloklari bo'ladi", () => {
    expect(text(gridSheet.rows[0], 0)).toBe("9-A · 1-chorak");
    expect(text(gridSheet.rows[2], 0)).toBe("1-hafta · 01.09.2026 – 07.09.2026");
    // Kun sarlavhasi qatori.
    expect(gridSheet.rows[3].map((_, i) => text(gridSheet.rows[3], i))).toEqual([
      "Para",
      "Dush",
      "Sesh",
      "Chor",
      "Pay",
      "Juma",
    ]);
  });

  it("bo'sh haftani tashlab ketadi", () => {
    const weekHeaders = gridSheet.rows.filter((r) => text(r, 0).includes("-hafta"));
    expect(weekHeaders).toHaveLength(1);
  });

  it("darsni fan/o'qituvchi/xona qatorlari bilan yozadi", () => {
    // 5-qator (indeks 4) — 1-para; dushanba ustuni (indeks 1).
    expect(text(gridSheet.rows[4], 1)).toBe("Matematika\nAliyev O‘tkir\n204");
    // 2-para, seshanba — almashtirilgan dars ⇄ belgisi bilan, xonasiz.
    expect(text(gridSheet.rows[5], 2)).toBe("Ona tili\n⇄ Karimova Nodira");
  });

  it("dars katagiga fan rangi va kontrast shrift beradi", () => {
    const cell = gridSheet.rows[4][1] as XlsxCell;
    expect(cell.style?.fill).toBe("4f46e5");
    expect(cell.style?.color).toBe("FFFFFF");
  });

  it("para ustunini muzlatadi va birlashtirishlarni beradi", () => {
    expect(gridSheet.freeze).toEqual({ cols: 1 });
    expect(gridSheet.merges).toContain("A1:F1");
    expect(gridSheet.merges).toContain("A3:F3");
  });

  it("ro'yxat varag'i sana va para tartibida saralanadi", () => {
    expect(listSheet.rows).toHaveLength(3); // sarlavha + 2 dars
    expect(text(listSheet.rows[1], 0)).toBe("01.09.2026");
    expect(text(listSheet.rows[2], 0)).toBe("02.09.2026");
  });

  it("ro'yxat qatorlari to'liq maydonlarni o'z ichiga oladi", () => {
    const row = listSheet.rows[2];
    expect(row.map((_, i) => text(row, i))).toEqual([
      "02.09.2026",
      "1",
      "Sesh",
      "2",
      "09:25",
      "10:10",
      "Ona tili",
      "Karimova Nodira",
      "9-A",
      "",
      "Ha",
    ]);
  });

  it("ro'yxat varag'iga avtofiltr va muzlatilgan sarlavha qo'yadi", () => {
    expect(listSheet.autoFilter).toBe("A1:K1");
    expect(listSheet.freeze).toEqual({ rows: 1 });
  });

  it("o'qituvchi rejimida katakda sinf ko'rsatiladi", () => {
    const [teacherGrid] = buildQuarterWorkbook(view, { ...opts, mode: "teacher" });
    expect(text(teacherGrid.rows[4], 1)).toBe("Matematika\n9-A\n204");
  });

  it("kun filtri ustunlar sonini kamaytiradi", () => {
    const [oneDay] = buildQuarterWorkbook(view, { ...opts, days: [1] });
    expect(oneDay.rows[3]).toHaveLength(2);
    expect(oneDay.merges).toContain("A1:B1");
  });
});

describe("buildTemplateWorkbook", () => {
  it("bitta varaq va sanasiz grid qaytaradi", () => {
    const sheets = buildTemplateWorkbook(grid, opts);
    expect(sheets).toHaveLength(1);
    const [sheet] = sheets;
    expect(text(sheet.rows[0], 0)).toBe("9-A · 1-chorak");
    expect(text(sheet.rows[2], 0)).toBe("Para");
    expect(text(sheet.rows[3], 1)).toBe("Matematika\nAliyev O‘tkir\n204");
    expect(sheet.freeze).toEqual({ rows: 3, cols: 1 });
  });
});
