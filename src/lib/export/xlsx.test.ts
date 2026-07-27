import { describe, expect, it } from "vitest";
import {
  buildXlsx,
  columnLetter,
  crc32,
  escapeXml,
  sanitizeSheetName,
  toArgb,
  type XlsxSheet,
} from "./xlsx";

/**
 * Test uchun minimal ZIP o'quvchi — yozuvlar siqilmagan (method=0) bo'lgani uchun
 * markaziy katalogni o'qib, ma'lumotni to'g'ridan-to'g'ri kesib olish yetarli.
 */
function readZip(bytes: Uint8Array): Map<string, string> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder();

  // EOCD imzosini oxiridan qidiramiz.
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) throw new Error("EOCD topilmadi");

  const count = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  const files = new Map<string, string>();

  for (let i = 0; i < count; i++) {
    if (view.getUint32(offset, true) !== 0x02014b50) throw new Error("markaziy sarlavha buzuq");
    const size = view.getUint32(offset + 24, true);
    const nameLen = view.getUint16(offset + 28, true);
    const extraLen = view.getUint16(offset + 30, true);
    const commentLen = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLen));

    if (view.getUint32(localOffset, true) !== 0x04034b50) throw new Error("lokal sarlavha buzuq");
    const localNameLen = view.getUint16(localOffset + 26, true);
    const localExtraLen = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    const data = bytes.subarray(dataStart, dataStart + size);

    // CRC mosligini ham tekshiramiz — arxiv haqiqatan yaroqli.
    expect(crc32(data)).toBe(view.getUint32(offset + 16, true));

    files.set(name, decoder.decode(data));
    offset += 46 + nameLen + extraLen + commentLen;
  }

  return files;
}

describe("columnLetter", () => {
  it("indeksni Excel ustun harfiga aylantiradi", () => {
    expect(columnLetter(0)).toBe("A");
    expect(columnLetter(25)).toBe("Z");
    expect(columnLetter(26)).toBe("AA");
    expect(columnLetter(27)).toBe("AB");
    expect(columnLetter(51)).toBe("AZ");
    expect(columnLetter(52)).toBe("BA");
    expect(columnLetter(701)).toBe("ZZ");
    expect(columnLetter(702)).toBe("AAA");
  });
});

describe("escapeXml", () => {
  it("XML uchun xavfli belgilarni ekranlaydi", () => {
    expect(escapeXml(`a & b < c > d "e" 'f'`)).toBe(
      "a &amp; b &lt; c &gt; d &quot;e&quot; &apos;f&apos;",
    );
  });

  it("taqiqlangan boshqaruv belgilarini olib tashlaydi, tab/LF ni saqlaydi", () => {
    const withControls = `a${String.fromCharCode(0)}b${String.fromCharCode(7)}c`;
    expect(escapeXml(withControls)).toBe("abc");
    expect(escapeXml("a\tb\nc")).toBe("a\tb\nc");
  });

  it("o'zbekcha diakritikani buzmaydi", () => {
    expect(escapeXml("O‘qituvchi g‘alaba")).toBe("O‘qituvchi g‘alaba");
  });
});

describe("sanitizeSheetName", () => {
  it("taqiqlangan belgilarni almashtiradi va 31 belgigacha qisqartiradi", () => {
    expect(sanitizeSheetName("Jadval/2026:[chorak]")).toBe("Jadval 2026  chorak");
    expect(sanitizeSheetName("x".repeat(50))).toHaveLength(31);
  });

  it("bo'sh nom uchun zaxira qiymatni qaytaradi", () => {
    expect(sanitizeSheetName("   ", "Sheet1")).toBe("Sheet1");
  });
});

describe("toArgb", () => {
  it("turli shakllarni ARGB ga keltiradi", () => {
    expect(toArgb("#4f46e5")).toBe("FF4F46E5");
    expect(toArgb("4f46e5")).toBe("FF4F46E5");
    expect(toArgb("#abc")).toBe("FFAABBCC");
  });

  it("yaroqsiz rangda qora qaytaradi", () => {
    expect(toArgb("qizil")).toBe("FF000000");
  });
});

describe("crc32", () => {
  it("ma'lum vektorga mos keladi", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });
});

describe("buildXlsx", () => {
  const sheet: XlsxSheet = {
    name: "Jadval",
    rows: [
      [{ value: "Sarlavha", style: { bold: true, size: 13 } }],
      ["Fan", "Soat"],
      ["Matematika & fizika", 5],
      [{ value: "", style: { border: true } }, null],
    ],
    columns: [20, 10],
    merges: ["A1:B1"],
    freeze: { rows: 2, cols: 1 },
    autoFilter: "A2:B2",
  };

  it("yaroqli ZIP konteyner qaytaradi", () => {
    const bytes = buildXlsx([sheet]);
    expect(Array.from(bytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);

    const files = readZip(bytes);
    expect([...files.keys()]).toEqual([
      "[Content_Types].xml",
      "_rels/.rels",
      "xl/workbook.xml",
      "xl/_rels/workbook.xml.rels",
      "xl/styles.xml",
      "xl/worksheets/sheet1.xml",
    ]);
  });

  it("qiymatlarni to'g'ri turda yozadi", () => {
    const xml = readZip(buildXlsx([sheet])).get("xl/worksheets/sheet1.xml")!;
    // Matn — inlineStr, ekranlangan.
    expect(xml).toContain("<t xml:space=\"preserve\">Matematika &amp; fizika</t>");
    // Son — <v>, t atributisiz.
    expect(xml).toContain("<c r=\"B3\"><v>5</v></c>");
    // Bo'sh, lekin uslubli katak chiziladi; uslubsiz bo'sh katak tushib qoladi.
    expect(xml).toMatch(/<c r="A4" s="\d+"\/>/);
    expect(xml).not.toContain('r="B4"');
  });

  it("panel, birlashtirish, avtofiltr va ustunlarni yozadi", () => {
    const xml = readZip(buildXlsx([sheet])).get("xl/worksheets/sheet1.xml")!;
    expect(xml).toContain('<pane xSplit="1" ySplit="2" topLeftCell="B3" activePane="bottomRight" state="frozen"/>');
    expect(xml).toContain('<col min="1" max="1" width="20" customWidth="1"/>');
    expect(xml).toContain('<mergeCells count="1"><mergeCell ref="A1:B1"/></mergeCells>');
    // CT_Worksheet ketma-ketligi: autoFilter mergeCells dan oldin turishi shart.
    expect(xml.indexOf("<autoFilter")).toBeLessThan(xml.indexOf("<mergeCells"));
  });

  it("bir xil uslubni qayta ishlatadi", () => {
    const style = { fill: "FF0000", bold: true };
    const files = readZip(
      buildXlsx([{ name: "S", rows: [[{ value: "a", style }, { value: "b", style }]] }]),
    );
    const styles = files.get("xl/styles.xml")!;
    // Sukut + bitta yangi uslub.
    expect(styles).toContain('<cellXfs count="2">');

    const xml = files.get("xl/worksheets/sheet1.xml")!;
    const used = [...xml.matchAll(/ s="(\d+)"/g)].map((m) => m[1]);
    expect(new Set(used).size).toBe(1);
  });

  it("varaq nomlarini takrorlanmas qiladi", () => {
    const files = readZip(
      buildXlsx([
        { name: "Jadval", rows: [["a"]] },
        { name: "Jadval", rows: [["b"]] },
      ]),
    );
    const workbook = files.get("xl/workbook.xml")!;
    expect(workbook).toContain('name="Jadval"');
    expect(workbook).toContain('name="Jadval 2"');
    expect(files.has("xl/worksheets/sheet2.xml")).toBe(true);
  });

  it("styles.xml aloqasi varaqlardan keyingi rId ni oladi", () => {
    const rels = readZip(
      buildXlsx([
        { name: "A", rows: [["a"]] },
        { name: "B", rows: [["b"]] },
      ]),
    ).get("xl/_rels/workbook.xml.rels")!;
    expect(rels).toContain('Id="rId1"');
    expect(rels).toContain('Id="rId2"');
    expect(rels).toContain('Id="rId3"');
    expect(rels).toContain('Target="styles.xml"');
  });

  it("varaqsiz chaqiruvda xato beradi", () => {
    expect(() => buildXlsx([])).toThrow();
  });
});
