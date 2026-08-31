import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Qorovul: serverga uzatiladigan qidiruv DOIM debouncelangan bo'lsin.
 *
 * Qidiruv matni React Query kalitida turadi — ya'ni xom holatni uzatish HAR
 * bosilgan harf uchun yangi so'rov demak. O'lchandi: "Ismoilov" yozish 8 ta
 * HTTP so'rov hosil qilardi va birinchisi (`search=I`) 400 qaytarardi, chunki
 * backend DTO'larining bir qismi eng kamida 2 belgi talab qiladi. Foydalanuvchi
 * bitta harf yozib to'xtasa ekranda sababsiz "Xatolik yuz berdi" chiqardi.
 *
 * Bu jim qaytadigan xato: yangi sahifa eski sahifadan nusxa olib yoziladi va
 * hech narsa buzilmaganday ko'rinadi. Shu sabab qoida sinov bilan qulflanadi.
 *
 * QAMROV: faqat serverga uzatiladigan qidiruv (`search:` so'rov obyektida).
 * `useMemo` bilan mahalliy filtrlaydigan sahifalar (xona, sinf, chorak...)
 * tarmoqqa chiqmaydi va bu qoidaga tushmaydi.
 */
const SRC = resolve(__dirname, "../..");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const tsxFiles = [join(SRC, "app"), join(SRC, "components")]
  .flatMap((dir) => walk(dir))
  .filter((file) => file.endsWith(".tsx"));

/** `search: search`, `search: search.trim()`, `search: search || undefined`. */
const RAW_SEARCH = /search:\s*search\b/;

const offenders = tsxFiles
  .filter((file) => RAW_SEARCH.test(readFileSync(file, "utf8")))
  .map((file) => relative(SRC, file));

const debounced = tsxFiles.filter((file) =>
  readFileSync(file, "utf8").includes("useDebouncedSearch("),
);

describe("serverga uzatilgan qidiruv debouncelangan", () => {
  it("skaner ishlayapti (fayllar topildi)", () => {
    // Yo'l buzilsa ro'yxat bo'shab qolardi va qoida abadiy yashil bo'lardi.
    expect(tsxFiles.length).toBeGreaterThan(50);
  });

  it("qoida haqiqatan qo'llanilgan (o'lik sinov emas)", () => {
    expect(debounced.length).toBeGreaterThan(10);
  });

  it("hech bir sahifa xom `search` holatini so'rovga uzatmaydi", () => {
    expect(offenders).toEqual([]);
  });
});
