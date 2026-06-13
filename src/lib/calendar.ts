/**
 * <DatePicker> uchun pure kalendar yordamchilari — UI'siz, vitest bilan test qilinadi.
 * Barcha sanalar ISO `yyyy-mm-dd`, hisob-kitob UTC'da (vaqt zonasidan xoli).
 */

export const UZ_MONTHS = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentyabr",
  "Oktyabr",
  "Noyabr",
  "Dekabr",
];

/** Dushanbadan boshlanadi. */
export const UZ_WEEKDAYS_SHORT = ["Du", "Se", "Cho", "Pa", "Ju", "Sha", "Ya"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toISO(year: number, month0: number, day: number): string {
  return `${year}-${pad(month0 + 1)}-${pad(day)}`;
}

export interface CalendarCell {
  iso: string;
  day: number;
  /** Ko'rsatilayotgan oyga tegishlimi (false → oldingi/keyingi oy "to'ldiruvchi" kuni). */
  inMonth: boolean;
}

/**
 * Berilgan oy uchun 6×7 = 42 katakli grid quradi (dushanbadan boshlab).
 * Oldingi/keyingi oy kunlari `inMonth: false` bilan to'ldiriladi.
 */
export function buildCalendarGrid(year: number, month0: number): CalendarCell[] {
  const firstOfMonth = new Date(Date.UTC(year, month0, 1));
  // JS: 0=Yakshanba … 6=Shanba. Dushanba-first ofset: (dow + 6) % 7.
  const leading = (firstOfMonth.getUTCDay() + 6) % 7;

  const cells: CalendarCell[] = [];
  // Grid boshlanish sanasi (oldingi oydan to'ldirish bilan).
  const start = new Date(Date.UTC(year, month0, 1 - leading));

  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    cells.push({
      iso: toISO(y, m, d.getUTCDate()),
      day: d.getUTCDate(),
      inMonth: m === month0 && y === year,
    });
  }

  return cells;
}

/** Tanlash ro'yxati uchun yillar oralig'i (markazdan ±span). */
export function yearRange(center: number, span = 8): number[] {
  const years: number[] = [];
  for (let y = center - span; y <= center + span; y++) years.push(y);
  return years;
}

/** ISO sanani UTC midnight timestamp'ga (taqqoslash uchun); noto'g'ri → null. */
export function isoToUTC(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}
