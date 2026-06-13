/**
 * <TimeInput> uchun pure vaqt yordamchilari — `HH:mm` (24 soat). Vitest bilan test qilinadi.
 */

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** "00".."23" soat opsiyalari. */
export function hourOptions(): string[] {
  return Array.from({ length: 24 }, (_, h) => pad2(h));
}

/** Berilgan qadam bilan daqiqa opsiyalari (default 5): "00","05",…,"55". */
export function minuteOptions(step = 5): string[] {
  const safe = step > 0 && step <= 60 ? step : 5;
  const out: string[] = [];
  for (let m = 0; m < 60; m += safe) out.push(pad2(m));
  return out;
}

/** Har qanday vaqt qiymatini `HH:mm` ga normallashtiradi ("8:0"→"08:00", "08:00:00"→"08:00"). Noto'g'ri → "". */
export function normalizeTime(value: string | null | undefined): string {
  if (!value) return "";
  const m = /^(\d{1,2}):(\d{1,2})/.exec(value.trim());
  if (!m) return "";
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return "";
  return `${pad2(h)}:${pad2(min)}`;
}

/** `HH:mm` ni { hour, minute } ga ajratadi (string qismlar). Bo'sh/noto'g'ri → bo'sh. */
export function splitTime(value: string | null | undefined): { hour: string; minute: string } {
  const norm = normalizeTime(value);
  if (!norm) return { hour: "", minute: "" };
  const [hour, minute] = norm.split(":");
  return { hour, minute };
}

/** Soat + daqiqani `HH:mm` ga birlashtiradi. Biror qism bo'sh → "". */
export function joinTime(hour: string, minute: string): string {
  if (hour === "" || minute === "") return "";
  return normalizeTime(`${hour}:${minute}`);
}

export function isValidTime(value: string | null | undefined): boolean {
  return normalizeTime(value) !== "";
}

/** `HH:mm` → yarim tundan boshlangan daqiqalar; noto'g'ri → null. */
export function toMinutes(value: string | null | undefined): number | null {
  const norm = normalizeTime(value);
  if (!norm) return null;
  const [h, m] = norm.split(":").map(Number);
  return h * 60 + m;
}
