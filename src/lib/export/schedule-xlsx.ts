/**
 * Dars jadvalini .xlsx ish kitobiga aylantirish.
 *
 * Chorak/oy ko'rinishi uchun ikki varaq tayyorlanadi:
 *  - "Jadval"  — bosma ko'rinishga o'xshash grid: har hafta bloki, qatorlar = paralar,
 *                ustunlar = kunlar, katak foni fan rangida.
 *  - "Ro'yxat" — avtofiltrli tekis ro'yxat (sana, para, fan, o'qituvchi, xona...) —
 *                saralash va umumlashtirish uchun.
 * Shablon ko'rinishi uchun bitta grid varaq (sanasiz, hafta kunlari bo'yicha).
 *
 * Modul toza (React'siz): barcha matnlar `labels` orqali beriladi, shuning uchun testda
 * i18n providerisiz tekshiriladi.
 */

import { cellKey, type QuarterView, type ScheduleGrid } from "@/lib/api/schedule";
import { columnLetter, downloadXlsx, type XlsxCell, type XlsxRow, type XlsxSheet } from "./xlsx";

export interface ScheduleExportLabels {
  /** Sarlavha satri, masalan "9-A · 1-chorak". */
  title: string;
  gridSheet: string;
  listSheet: string;
  /** Hafta yorlig'i, masalan (2) → "2-hafta". */
  week: (n: number) => string;
  /** ISO hafta kuni (1..7) → nomi. */
  day: (weekday: number) => string;
  period: string;
  date: string;
  weekCol: string;
  dayCol: string;
  start: string;
  end: string;
  subject: string;
  teacher: string;
  className: string;
  room: string;
  substituted: string;
  yes: string;
}

const HEAD_FILL = "F1F5F9";
const TITLE_SIZE = 13;

/** Fon rangiga mos o'qiladigan shrift rangi (qora yoki oq). */
export function contrastColor(hex: string): string {
  const clean = hex.replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return "1F2937";
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  // Nisbiy yorqinlik (sRGB koeffitsiyentlari).
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "1F2937" : "FFFFFF";
}

/** "2026-09-05" → "05.09.2026". */
export function formatDate(iso: string): string {
  if (iso.length < 10) return iso;
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
}

/** "08:30:00" → "08:30". */
const hhmm = (time?: string | null) => (time ? time.slice(0, 5) : "");

/** Katak matni: fan, o'qituvchi (yoki sinf) va xona — ustma-ust qatorlarda. */
function cellText(
  subject: string,
  secondary: string | null | undefined,
  room: string | null | undefined,
  substituted: boolean,
): string {
  const lines = [subject];
  if (secondary) lines.push(substituted ? `⇄ ${secondary}` : secondary);
  if (room) lines.push(room);
  return lines.join("\n");
}

function lessonCellStyle(color: string | null | undefined): XlsxCell["style"] {
  const fill = (color ?? "#94A3B8").replace(/^#/, "");
  return {
    fill,
    color: contrastColor(fill),
    align: "left",
    valign: "center",
    wrap: true,
    border: true,
    size: 10,
  };
}

const headStyle: XlsxCell["style"] = {
  bold: true,
  fill: HEAD_FILL,
  align: "center",
  valign: "center",
  border: true,
};

const periodStyle: XlsxCell["style"] = {
  bold: true,
  fill: HEAD_FILL,
  align: "center",
  valign: "center",
  border: true,
  size: 10,
};

const emptyStyle: XlsxCell["style"] = { border: true };

/** Grid varag'i uchun ustun kengliklari: para ustuni + kunlar. */
const gridColumns = (dayCount: number) => [12, ...Array.from({ length: dayCount }, () => 26)];

/** Chorak ko'rinishidan "Jadval" varag'i (har hafta alohida blok). */
function quarterGridSheet(
  view: QuarterView,
  days: number[],
  mode: "class" | "teacher",
  labels: ScheduleExportLabels,
  localize: (name: unknown) => string,
): XlsxSheet {
  const lastCol = columnLetter(days.length);
  const rows: XlsxRow[] = [];
  const merges: string[] = [];

  rows.push([{ value: labels.title, style: { bold: true, size: TITLE_SIZE } }]);
  merges.push(`A1:${lastCol}1`);
  rows.push([]);

  for (const week of view.weeks) {
    if (Object.keys(week.cells).length === 0) continue;

    const weekRow = rows.length + 1;
    rows.push([
      {
        value: `${labels.week(week.weekNumber)} · ${formatDate(week.startDate)} – ${formatDate(week.endDate)}`,
        style: { bold: true, fill: HEAD_FILL, valign: "center" },
      },
    ]);
    merges.push(`A${weekRow}:${lastCol}${weekRow}`);

    rows.push([
      { value: labels.period, style: headStyle },
      ...days.map((d) => ({ value: labels.day(d), style: headStyle })),
    ]);

    for (const period of view.periods) {
      rows.push([
        {
          value: `${period.code}\n${hhmm(period.startTime)}–${hhmm(period.endTime)}`,
          style: { ...periodStyle, wrap: true },
        },
        ...days.map((day): XlsxCell => {
          const cell = week.cells[cellKey(day, period.id)];
          if (!cell) return { value: "", style: emptyStyle };
          return {
            value: cellText(
              localize(cell.subjectName),
              mode === "teacher" ? cell.className : cell.teacherName,
              cell.roomName,
              cell.isSubstituted,
            ),
            style: lessonCellStyle(cell.subjectColor),
          };
        }),
      ]);
    }

    rows.push([]);
  }

  return {
    name: labels.gridSheet,
    rows,
    columns: gridColumns(days.length),
    merges,
    freeze: { cols: 1 },
  };
}

/** Chorak ko'rinishidan tekis "Ro'yxat" varag'i (avtofiltrli). */
function quarterListSheet(
  view: QuarterView,
  labels: ScheduleExportLabels,
  localize: (name: unknown) => string,
): XlsxSheet {
  const header = [
    labels.date,
    labels.weekCol,
    labels.dayCol,
    labels.period,
    labels.start,
    labels.end,
    labels.subject,
    labels.teacher,
    labels.className,
    labels.room,
    labels.substituted,
  ];

  const periodById = new Map(view.periods.map((p) => [p.id, p]));
  const rows: XlsxRow[] = [header.map((value) => ({ value, style: headStyle }))];

  const entries = view.weeks.flatMap((week) =>
    Object.entries(week.cells).map(([key, cell]) => ({
      week,
      cell,
      period: periodById.get(key.split(":")[1]),
    })),
  );

  // Sana, keyin para tartibi bo'yicha.
  entries.sort((a, b) => {
    if (a.cell.lessonDate !== b.cell.lessonDate) {
      return a.cell.lessonDate < b.cell.lessonDate ? -1 : 1;
    }
    return (a.period?.order ?? 0) - (b.period?.order ?? 0);
  });

  for (const { week, cell, period } of entries) {
    rows.push([
      formatDate(cell.lessonDate),
      week.weekNumber,
      labels.day(cell.weekday),
      period?.code ?? "",
      hhmm(period?.startTime),
      hhmm(period?.endTime),
      localize(cell.subjectName),
      cell.teacherName ?? "",
      cell.className ?? "",
      cell.roomName ?? "",
      cell.isSubstituted ? labels.yes : "",
    ]);
  }

  return {
    name: labels.listSheet,
    rows,
    columns: [12, 8, 12, 8, 10, 10, 24, 24, 10, 12, 14],
    freeze: { rows: 1 },
    autoFilter: `A1:${columnLetter(header.length - 1)}1`,
  };
}

/** Shablon (hafta kunlari bo'yicha siqilgan) ko'rinishidan bitta grid varaq. */
function templateGridSheet(
  grid: ScheduleGrid,
  days: number[],
  mode: "class" | "teacher",
  labels: ScheduleExportLabels,
  localize: (name: unknown) => string,
): XlsxSheet {
  const lastCol = columnLetter(days.length);
  const rows: XlsxRow[] = [];

  rows.push([{ value: labels.title, style: { bold: true, size: TITLE_SIZE } }]);
  rows.push([]);
  rows.push([
    { value: labels.period, style: headStyle },
    ...days.map((d) => ({ value: labels.day(d), style: headStyle })),
  ]);

  for (const period of grid.periods) {
    rows.push([
      {
        value: `${period.code}\n${hhmm(period.startTime)}–${hhmm(period.endTime)}`,
        style: { ...periodStyle, wrap: true },
      },
      ...days.map((day): XlsxCell => {
        const cell = grid.cells[cellKey(day, period.id)];
        if (!cell) return { value: "", style: emptyStyle };
        return {
          value: cellText(
            localize(cell.subjectName),
            mode === "teacher" ? cell.className : cell.teacherName,
            cell.roomName,
            cell.isSubstituted,
          ),
          style: lessonCellStyle(cell.subjectColor),
        };
      }),
    ]);
  }

  return {
    name: labels.gridSheet,
    rows,
    columns: gridColumns(days.length),
    merges: [`A1:${lastCol}1`],
    freeze: { rows: 3, cols: 1 },
  };
}

export interface ScheduleExportOptions {
  days: number[];
  mode: "class" | "teacher";
  labels: ScheduleExportLabels;
  /** Ko'p tilli nomni joriy tilga o'girish (`loc`). */
  localize: (name: unknown) => string;
}

/** Chorak/oy ko'rinishi uchun ikki varaqli ish kitobi. */
export function buildQuarterWorkbook(view: QuarterView, opts: ScheduleExportOptions): XlsxSheet[] {
  return [
    quarterGridSheet(view, opts.days, opts.mode, opts.labels, opts.localize),
    quarterListSheet(view, opts.labels, opts.localize),
  ];
}

/** Shablon ko'rinishi uchun bir varaqli ish kitobi. */
export function buildTemplateWorkbook(grid: ScheduleGrid, opts: ScheduleExportOptions): XlsxSheet[] {
  return [templateGridSheet(grid, opts.days, opts.mode, opts.labels, opts.localize)];
}

/** Fayl nomidagi xavfli belgilarni tozalash. */
export function safeFileName(parts: (string | undefined | null)[]): string {
  const name = parts
    .filter(Boolean)
    .join("-")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return name || "jadval";
}

export { downloadXlsx };
