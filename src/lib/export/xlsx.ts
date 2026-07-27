/**
 * Tashqi kutubxonasiz .xlsx (OOXML SpreadsheetML) yozuvchi.
 *
 * ZIP konteyneri "stored" (siqilmagan, method=0) usulda yig'iladi — Excel, LibreOffice
 * va Google Sheets bunday arxivni muammosiz ochadi, deflate implementatsiyasi shart emas.
 * Matnlar `inlineStr` sifatida yoziladi, shuning uchun sharedStrings.xml ham kerak emas.
 *
 * Qo'llab-quvvatlanadi: bir nechta varaq, ustun kengligi, qalin shrift, katak foni va
 * shrift rangi, tekislash, chegara, birlashtirilgan kataklar va muzlatilgan panel.
 */

// ---------------------------------------------------------------- Turlar

export interface XlsxCellStyle {
  bold?: boolean;
  /** Katak foni, "RRGGBB" (alfa'siz). */
  fill?: string;
  /** Shrift rangi, "RRGGBB". */
  color?: string;
  align?: "left" | "center" | "right";
  valign?: "top" | "center" | "bottom";
  wrap?: boolean;
  border?: boolean;
  /** Shrift o'lchami (pt), sukut 11. */
  size?: number;
}

export type XlsxValue = string | number | null | undefined;

export interface XlsxCell {
  value: XlsxValue;
  style?: XlsxCellStyle;
}

export type XlsxRow = (XlsxCell | XlsxValue)[];

export interface XlsxSheet {
  name: string;
  rows: XlsxRow[];
  /** Ustun kengliklari (Excel "character" birligida), chapdan o'ngga. */
  columns?: number[];
  /** Birlashtiriladigan diapazonlar, masalan "A1:F1". */
  merges?: string[];
  /** Muzlatiladigan yuqori qatorlar / chap ustunlar soni. */
  freeze?: { rows?: number; cols?: number };
  /** Avtofiltr diapazoni, masalan "A1:K1". */
  autoFilter?: string;
}

// ---------------------------------------------------------------- Yordamchilar

const encoder = new TextEncoder();

/** 0 → "A", 25 → "Z", 26 → "AA". */
export function columnLetter(index: number): string {
  let n = index;
  let out = "";
  do {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return out;
}

/** XML matn/atributlari uchun xavfli belgilarni ekranlash. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    // XML 1.0 da taqiqlangan boshqaruv belgilari (tab/LF/CR dan tashqari).
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

/** Excel varaq nomi cheklovlari: 31 belgi, `[]:*?/\` ishlatib bo'lmaydi. */
export function sanitizeSheetName(name: string, fallback = "Sheet"): string {
  const cleaned = name.replace(/[[\]:*?/\\]/g, " ").trim().slice(0, 31);
  return cleaned || fallback;
}

/** "RRGGBB" → "FFRRGGBB" (ARGB). `#` prefiksi va 3 belgili shakl ham qabul qilinadi. */
export function toArgb(color: string): string {
  let hex = color.replace(/^#/, "").toUpperCase();
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  if (!/^[0-9A-F]{6}$/.test(hex)) return "FF000000";
  return `FF${hex}`;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ---------------------------------------------------------------- ZIP

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

/** Siqilmagan (method=0) ZIP arxivini yig'adi. */
function zip(entries: ZipEntry[]): Uint8Array<ArrayBuffer> {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  // Barcha yozuvlarga bitta sana: 1980-01-01 00:00 (DOS epoxasining boshi) — natija deterministik.
  const dosTime = 0;
  const dosDate = 33; // (1980-1980)<<9 | 1<<5 | 1

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true); // imzo
    lv.setUint16(4, 20, true); // kerakli versiya
    lv.setUint16(6, 0x0800, true); // bayroq: nom UTF-8
    lv.setUint16(8, 0, true); // usul: stored
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true); // siqilgan hajm
    lv.setUint32(22, size, true); // asl hajm
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true); // extra yo'q
    local.set(nameBytes, 30);

    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true); // yaratgan versiya
    cv.setUint16(6, 20, true); // kerakli versiya
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true); // extra
    cv.setUint16(32, 0, true); // izoh
    cv.setUint16(34, 0, true); // disk raqami
    cv.setUint16(36, 0, true); // ichki atributlar
    cv.setUint32(38, 0, true); // tashqi atributlar
    cv.setUint32(42, offset, true); // lokal sarlavha ofseti
    central.set(nameBytes, 46);

    locals.push(local, entry.data);
    centrals.push(central);
    offset += local.length + size;
  }

  const centralSize = centrals.reduce((sum, c) => sum + c.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const parts = [...locals, ...centrals, eocd];
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const part of parts) {
    out.set(part, pos);
    pos += part.length;
  }
  return out;
}

// ---------------------------------------------------------------- Uslublar

interface StyleTables {
  /** Uslub kaliti → cellXfs indeksi. */
  index: Map<string, number>;
  fonts: string[];
  fills: string[];
  xfs: string[];
}

function createStyleTables(): StyleTables {
  return {
    index: new Map([["", 0]]),
    // 0-shrift — sukut.
    fonts: ['<font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font>'],
    // OOXML talabi: 0-to'ldirish "none", 1-si "gray125" bo'lishi shart.
    fills: ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'],
    xfs: ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'],
  };
}

function styleKey(style: XlsxCellStyle): string {
  return [
    style.bold ? "b" : "",
    style.fill ?? "",
    style.color ?? "",
    style.align ?? "",
    style.valign ?? "",
    style.wrap ? "w" : "",
    style.border ? "r" : "",
    style.size ?? "",
  ].join("|");
}

/** Uslubni jadvallarga qo'shadi (yoki mavjudini qayta ishlatadi) va `s` indeksini qaytaradi. */
function registerStyle(tables: StyleTables, style?: XlsxCellStyle): number {
  if (!style) return 0;
  const key = styleKey(style);
  if (key === "|||||||") return 0;
  const existing = tables.index.get(key);
  if (existing !== undefined) return existing;

  let fontId = 0;
  if (style.bold || style.color || style.size) {
    const parts = [
      style.bold ? "<b/>" : "",
      `<sz val="${style.size ?? 11}"/>`,
      style.color ? `<color rgb="${toArgb(style.color)}"/>` : '<color theme="1"/>',
      '<name val="Calibri"/><family val="2"/>',
    ].join("");
    const font = `<font>${parts}</font>`;
    fontId = tables.fonts.indexOf(font);
    if (fontId === -1) fontId = tables.fonts.push(font) - 1;
  }

  let fillId = 0;
  if (style.fill) {
    const fill =
      `<fill><patternFill patternType="solid">` +
      `<fgColor rgb="${toArgb(style.fill)}"/><bgColor indexed="64"/>` +
      `</patternFill></fill>`;
    fillId = tables.fills.indexOf(fill);
    if (fillId === -1) fillId = tables.fills.push(fill) - 1;
  }

  const borderId = style.border ? 1 : 0;
  const alignment =
    style.align || style.valign || style.wrap
      ? `<alignment${style.align ? ` horizontal="${style.align}"` : ""}` +
        `${style.valign ? ` vertical="${style.valign}"` : ""}` +
        `${style.wrap ? ' wrapText="1"' : ""}/>`
      : "";

  const attrs =
    `numFmtId="0" fontId="${fontId}" fillId="${fillId}" borderId="${borderId}" xfId="0"` +
    `${fontId ? ' applyFont="1"' : ""}${fillId ? ' applyFill="1"' : ""}` +
    `${borderId ? ' applyBorder="1"' : ""}${alignment ? ' applyAlignment="1"' : ""}`;

  const xf = alignment ? `<xf ${attrs}>${alignment}</xf>` : `<xf ${attrs}/>`;
  const id = tables.xfs.push(xf) - 1;
  tables.index.set(key, id);
  return id;
}

function stylesXml(tables: StyleTables): string {
  const thin = '<left style="thin"><color rgb="FFD4D4D4"/></left>' +
    '<right style="thin"><color rgb="FFD4D4D4"/></right>' +
    '<top style="thin"><color rgb="FFD4D4D4"/></top>' +
    '<bottom style="thin"><color rgb="FFD4D4D4"/></bottom><diagonal/>';
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<fonts count="${tables.fonts.length}">${tables.fonts.join("")}</fonts>` +
    `<fills count="${tables.fills.length}">${tables.fills.join("")}</fills>` +
    `<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>` +
    `<border>${thin}</border></borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
    `<cellXfs count="${tables.xfs.length}">${tables.xfs.join("")}</cellXfs>` +
    `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
    `</styleSheet>`
  );
}

// ---------------------------------------------------------------- Varaq

function normalizeCell(cell: XlsxCell | XlsxValue): XlsxCell {
  if (cell !== null && typeof cell === "object") return cell;
  return { value: cell };
}

function sheetXml(sheet: XlsxSheet, tables: StyleTables): string {
  const freezeRows = sheet.freeze?.rows ?? 0;
  const freezeCols = sheet.freeze?.cols ?? 0;
  const pane =
    freezeRows || freezeCols
      ? `<pane${freezeCols ? ` xSplit="${freezeCols}"` : ""}${freezeRows ? ` ySplit="${freezeRows}"` : ""}` +
        ` topLeftCell="${columnLetter(freezeCols)}${freezeRows + 1}" activePane="bottomRight" state="frozen"/>`
      : "";

  const cols = sheet.columns?.length
    ? `<cols>${sheet.columns
        .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
        .join("")}</cols>`
    : "";

  const rows = sheet.rows
    .map((row, rowIndex) => {
      const r = rowIndex + 1;
      const cells = row
        .map((raw, colIndex) => {
          const cell = normalizeCell(raw);
          const s = registerStyle(tables, cell.style);
          const ref = `${columnLetter(colIndex)}${r}`;
          const sAttr = s ? ` s="${s}"` : "";
          if (cell.value === null || cell.value === undefined || cell.value === "") {
            // Bo'sh, lekin uslubli katak ham chizilishi kerak (chegara/fon uchun).
            return s ? `<c r="${ref}"${sAttr}/>` : "";
          }
          if (typeof cell.value === "number" && Number.isFinite(cell.value)) {
            return `<c r="${ref}"${sAttr}><v>${cell.value}</v></c>`;
          }
          const text = escapeXml(String(cell.value));
          return `<c r="${ref}"${sAttr} t="inlineStr"><is><t xml:space="preserve">${text}</t></is></c>`;
        })
        .join("");
      return cells ? `<row r="${r}">${cells}</row>` : `<row r="${r}"/>`;
    })
    .join("");

  const merges = sheet.merges?.length
    ? `<mergeCells count="${sheet.merges.length}">` +
      sheet.merges.map((ref) => `<mergeCell ref="${ref}"/>`).join("") +
      `</mergeCells>`
    : "";

  // CT_Worksheet ketma-ketligi: sheetData → autoFilter → mergeCells.
  const filter = sheet.autoFilter ? `<autoFilter ref="${sheet.autoFilter}"/>` : "";

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetViews><sheetView workbookViewId="0">${pane}</sheetView></sheetViews>` +
    `<sheetFormatPr defaultRowHeight="15"/>` +
    cols +
    `<sheetData>${rows}</sheetData>` +
    filter +
    merges +
    `</worksheet>`
  );
}

// ---------------------------------------------------------------- Ommaviy API

/** Varaqlardan .xlsx faylining baytlarini yig'adi. */
export function buildXlsx(sheets: XlsxSheet[]): Uint8Array<ArrayBuffer> {
  if (!sheets.length) throw new Error("buildXlsx: kamida bitta varaq kerak");

  const tables = createStyleTables();
  // Uslublar varaq XML'i yozilayotganda ro'yxatga olinadi, shuning uchun avval varaqlar.
  const sheetXmls = sheets.map((sheet) => sheetXml(sheet, tables));

  const usedNames = new Set<string>();
  const names = sheets.map((sheet, i) => {
    let name = sanitizeSheetName(sheet.name, `Sheet${i + 1}`);
    let suffix = 2;
    while (usedNames.has(name.toLowerCase())) {
      name = `${sanitizeSheetName(sheet.name, `Sheet${i + 1}`).slice(0, 28)} ${suffix++}`;
    }
    usedNames.add(name.toLowerCase());
    return name;
  });

  const stylesRelId = sheets.length + 1;

  const contentTypes =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
    sheets
      .map(
        (_, i) =>
          `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ` +
          `ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
      )
      .join("") +
    `</Types>`;

  const rootRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`;

  const workbook =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ` +
    `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheets>` +
    names
      .map((name, i) => `<sheet name="${escapeXml(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
      .join("") +
    `</sheets></workbook>`;

  const workbookRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    sheets
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" ` +
          `Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" ` +
          `Target="worksheets/sheet${i + 1}.xml"/>`,
      )
      .join("") +
    `<Relationship Id="rId${stylesRelId}" ` +
    `Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    `</Relationships>`;

  const entries: ZipEntry[] = [
    { name: "[Content_Types].xml", data: encoder.encode(contentTypes) },
    { name: "_rels/.rels", data: encoder.encode(rootRels) },
    { name: "xl/workbook.xml", data: encoder.encode(workbook) },
    { name: "xl/_rels/workbook.xml.rels", data: encoder.encode(workbookRels) },
    { name: "xl/styles.xml", data: encoder.encode(stylesXml(tables)) },
    ...sheetXmls.map((xml, i) => ({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      data: encoder.encode(xml),
    })),
  ];

  return zip(entries);
}

/** Faylni brauzerda yuklab olish (`.xlsx` kengaytmasi avtomatik qo'shiladi). */
export function downloadXlsx(fileName: string, sheets: XlsxSheet[]): void {
  const bytes = buildXlsx(sheets);
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
