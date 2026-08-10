/**
 * Chartlar uchun yagona rang palitrasi.
 *
 * Loyiha aksenti — elektr-laym, shuning uchun barcha diagrammalar yashil
 * oilada qoladi: laym (78°) dan feruza-yashil (170°) gacha ohang aylanadi.
 * Yorug'lik ~46% — parchment fonida ham, qora fonida ham o'qiladi.
 *
 * DIQQAT: CSS tokenlari (`--accent` va h.k.) RGB triplet ("132 196 16") sifatida
 * saqlanadi, ularni SVG `fill`/`stroke` ga to'g'ridan-to'g'ri berib bo'lmaydi —
 * `rgb(var(--accent))` ko'rinishida o'rash yoki shu yerdagi ranglardan foydalanish kerak.
 */

const HUE_START = 78; // laym
const HUE_END = 170; // feruza-yashil

/** n ta ajralib turuvchi yashil ohang qaytaradi (laym → feruza). */
export function greenRamp(n: number): string[] {
  if (n <= 0) return [];
  if (n === 1) return [`hsl(${HUE_START} 64% 46%)`];
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const hue = HUE_START + (HUE_END - HUE_START) * t;
    // laym uchida to'yinganlik biroz yuqori, feruza uchida pastroq — ko'z bir tekis ko'radi
    const sat = 66 - 10 * t;
    const light = 44 + 8 * t;
    return `hsl(${hue.toFixed(0)} ${sat.toFixed(0)}% ${light.toFixed(0)}%)`;
  });
}

/** Chiziqli/maydonli diagrammalar uchun asosiy yashil. */
export const ACCENT_GREEN = "hsl(88 64% 45%)";
