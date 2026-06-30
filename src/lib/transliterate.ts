/**
 * O'zbek lotin yozuvini kirill yozuviga o'giradi. Ism-sharif maydonlari yonidagi
 * "transliteratsiya" tugmasi uchun ishlatiladi (lotin → kirill avtomatik to'ldirish).
 *
 * To'liq lingvistik aniqlikni da'vo qilmaydi — ism-shariflar uchun amaliy yetarli.
 */

// Ko'p harfli (digraf) birikmalar — avval tekshiriladi.
const DIGRAPHS: [string, string][] = [
  ["o'", "ў"],
  ["g'", "ғ"],
  ["sh", "ш"],
  ["ch", "ч"],
  ["ng", "нг"],
  ["yo", "ё"],
  ["yu", "ю"],
  ["ya", "я"],
  ["ye", "е"],
  ["ts", "ц"],
];

const SINGLES: Record<string, string> = {
  a: "а", b: "б", d: "д", e: "э", f: "ф", g: "г", h: "ҳ", i: "и",
  j: "ж", k: "к", l: "л", m: "м", n: "н", o: "о", p: "п", q: "қ",
  r: "р", s: "с", t: "т", u: "у", v: "в", x: "х", y: "й", z: "з",
  "'": "ъ",
};

function mapChar(ch: string): string {
  const lower = ch.toLowerCase();
  const mapped = SINGLES[lower];
  if (!mapped) return ch;
  // Bosh harfni saqlaymiz.
  return ch === lower ? mapped : mapped.toUpperCase();
}

/** Lotincha matnni kirillchaga o'giradi. */
export function latinToCyrillic(input: string): string {
  if (!input) return "";
  let result = "";
  let i = 0;
  const text = input;
  while (i < text.length) {
    let matched = false;
    // Apostrofning turli ko'rinishlarini normallashtiramiz (', ', ‘, ’).
    const two = text.slice(i, i + 2).replace(/[‘’`]/g, "'").toLowerCase();
    for (const [latin, cyr] of DIGRAPHS) {
      if (two === latin) {
        const isUpper = text[i] === text[i].toUpperCase() && text[i] !== text[i].toLowerCase();
        result += isUpper ? cyr.charAt(0).toUpperCase() + cyr.slice(1) : cyr;
        i += 2;
        matched = true;
        break;
      }
    }
    if (matched) continue;
    result += mapChar(text[i]);
    i += 1;
  }
  return result;
}
