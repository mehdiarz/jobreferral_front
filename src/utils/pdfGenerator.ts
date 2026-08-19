import * as fontkit from "fontkit";
import { PDFDocument, type PDFFont, type PDFPage, rgb } from "pdf-lib";

import fontDataUrl from "../templates/Vazirmatn-Regular.ttf?inline";
import type {
  LookupValueDto,
  PropertyAppraisalInputDto,
  PropertyAppraisalLookupsDto,
} from "../services/PropertyAppraisalCrud/types";

type AppraisalPdfMetadata = {
  requestCode?: string | null;
  date?: string | null;
};

type PdfField = {
  label: string;
  value: unknown;
};

type PriceRow = {
  title: string;
  area: unknown;
  unitPrice: unknown;
  totalPrice: unknown;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 32;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const CONTENT_BOTTOM = 48;

const colors = {
  navy: rgb(0.08, 0.2, 0.36),
  blue: rgb(0.12, 0.37, 0.62),
  paleBlue: rgb(0.91, 0.95, 0.98),
  paleGray: rgb(0.96, 0.97, 0.98),
  border: rgb(0.69, 0.73, 0.78),
  text: rgb(0.08, 0.1, 0.13),
  muted: rgb(0.36, 0.4, 0.45),
  white: rgb(1, 1, 1),
};

const numberFormatter = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 2,
});

// ─── شکل‌دهی حروف عربی/فارسی ────────────────────────────────────
type ArabicGlyphForms = {
  isolated: number;
  final: number;
  initial?: number;
  medial?: number;
};

const arabicGlyphForms = new Map<string, ArabicGlyphForms>(
  [
    [0x0622, 0xfe81, 0xfe82],
    [0x0623, 0xfe83, 0xfe84],
    [0x0624, 0xfe85, 0xfe86],
    [0x0625, 0xfe87, 0xfe88],
    [0x0626, 0xfe89, 0xfe8a, 0xfe8b, 0xfe8c],
    [0x0627, 0xfe8d, 0xfe8e],
    [0x0628, 0xfe8f, 0xfe90, 0xfe91, 0xfe92],
    [0x0629, 0xfe93, 0xfe94],
    [0x062a, 0xfe95, 0xfe96, 0xfe97, 0xfe98],
    [0x062b, 0xfe99, 0xfe9a, 0xfe9b, 0xfe9c],
    [0x062c, 0xfe9d, 0xfe9e, 0xfe9f, 0xfea0],
    [0x062d, 0xfea1, 0xfea2, 0xfea3, 0xfea4],
    [0x062e, 0xfea5, 0xfea6, 0xfea7, 0xfea8],
    [0x062f, 0xfea9, 0xfeaa],
    [0x0630, 0xfeab, 0xfeac],
    [0x0631, 0xfead, 0xfeae],
    [0x0632, 0xfeaf, 0xfeb0],
    [0x0633, 0xfeb1, 0xfeb2, 0xfeb3, 0xfeb4],
    [0x0634, 0xfeb5, 0xfeb6, 0xfeb7, 0xfeb8],
    [0x0635, 0xfeb9, 0xfeba, 0xfebb, 0xfebc],
    [0x0636, 0xfebd, 0xfebe, 0xfebf, 0xfec0],
    [0x0637, 0xfec1, 0xfec2, 0xfec3, 0xfec4],
    [0x0638, 0xfec5, 0xfec6, 0xfec7, 0xfec8],
    [0x0639, 0xfec9, 0xfeca, 0xfecb, 0xfecc],
    [0x063a, 0xfecd, 0xfece, 0xfecf, 0xfed0],
    [0x0641, 0xfed1, 0xfed2, 0xfed3, 0xfed4],
    [0x0642, 0xfed5, 0xfed6, 0xfed7, 0xfed8],
    [0x0643, 0xfed9, 0xfeda, 0xfedb, 0xfedc],
    [0x0644, 0xfedd, 0xfede, 0xfedf, 0xfee0],
    [0x0645, 0xfee1, 0xfee2, 0xfee3, 0xfee4],
    [0x0646, 0xfee5, 0xfee6, 0xfee7, 0xfee8],
    [0x0647, 0xfee9, 0xfeea, 0xfeeb, 0xfeec],
    [0x0648, 0xfeed, 0xfeee],
    [0x0649, 0xfeef, 0xfef0],
    [0x064a, 0xfef1, 0xfef2, 0xfef3, 0xfef4],
    [0x067e, 0xfb56, 0xfb57, 0xfb58, 0xfb59],
    [0x0686, 0xfb7a, 0xfb7b, 0xfb7c, 0xfb7d],
    [0x0698, 0xfb8a, 0xfb8b],
    [0x06a9, 0xfb8e, 0xfb8f, 0xfb90, 0xfb91],
    [0x06af, 0xfb92, 0xfb93, 0xfb94, 0xfb95],
    [0x06c0, 0xfba4, 0xfba5],
    [0x06c1, 0xfba6, 0xfba7, 0xfba8, 0xfba9],
    [0x06cc, 0xfbfc, 0xfbfd, 0xfbfe, 0xfbff],
  ].map(([base, isolated, final, initial, medial]) => [
    String.fromCodePoint(base),
    { isolated, final, initial, medial },
  ]),
);

function isTransparentArabicMark(character: string) {
  const codePoint = character.codePointAt(0) ?? 0;
  return (
    (codePoint >= 0x064b && codePoint <= 0x065f) ||
    codePoint === 0x0670 ||
    (codePoint >= 0x06d6 && codePoint <= 0x06ed)
  );
}

function findJoiningNeighbor(
  characters: string[],
  startIndex: number,
  direction: -1 | 1,
) {
  for (
    let index = startIndex + direction;
    index >= 0 && index < characters.length;
    index += direction
  ) {
    if (isTransparentArabicMark(characters[index])) continue;
    return arabicGlyphForms.get(characters[index]);
  }
  return undefined;
}

function shapePersianText(text: string) {
  const characters = Array.from(text);

  return characters
    .map((character, index) => {
      const forms = arabicGlyphForms.get(character);
      if (!forms) return character;

      const previous = findJoiningNeighbor(characters, index, -1);
      const next = findJoiningNeighbor(characters, index, 1);
      const joinsPrevious =
        previous?.initial !== undefined && forms.final !== undefined;
      const joinsNext =
        forms.initial !== undefined && next?.final !== undefined;

      if (joinsPrevious && joinsNext && forms.medial !== undefined) {
        return String.fromCodePoint(forms.medial);
      }
      if (joinsPrevious) return String.fromCodePoint(forms.final);
      if (joinsNext && forms.initial !== undefined) {
        return String.fromCodePoint(forms.initial);
      }
      return String.fromCodePoint(forms.isolated);
    })
    .join("");
}

// ─── اصلاح تاریخ ────────────────────────────────────────────────
function reverseDateNumbers(text: string): string {
  return text.replace(/\d{4}\/\d{2}\/\d{2}/g, (match) => {
    const [year, month, day] = match.split("/");
    return `${day}/${month}/${year}`;
  });
}

function textWidth(font: PDFFont, text: string, size: number) {
  const shaped = shapePersianText(text);
  return font.widthOfTextAtSize(shaped, size);
}

function decodeBase64Asset(dataUrl: string, assetName: string) {
  const separatorIndex = dataUrl.indexOf(",");
  const metadata = dataUrl.slice(0, separatorIndex);

  if (
    separatorIndex < 0 ||
    !metadata.startsWith("data:") ||
    !metadata.includes(";base64")
  ) {
    throw new Error(`${assetName} به‌درستی داخل برنامه قرار نگرفته است.`);
  }

  try {
    const binary = globalThis.atob(dataUrl.slice(separatorIndex + 1));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes.buffer;
  } catch {
    throw new Error(`${assetName} قابل خواندن نیست.`);
  }
}

function lookupTitle(
  items: LookupValueDto[] | null | undefined,
  code: string | null | undefined,
) {
  if (!code) return "";
  return (
    items?.find((item) => String(item.code) === String(code))?.title ?? code
  );
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "بله" : "خیر";
  if (typeof value === "number") return numberFormatter.format(value);
  if (Array.isArray(value)) {
    const result = value.filter(Boolean).join("، ");
    return result || "—";
  }
  return String(value);
}

function fileSafeName(value: string) {
  return value
    .replace(/[<>:"/\\|?*]/g, "-")
    .split("")
    .filter((character) => character.charCodeAt(0) >= 32)
    .join("")
    .trim();
}

function splitLongWord(
  word: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
) {
  const pieces: string[] = [];
  let current = "";

  for (const character of word) {
    const candidate = `${current}${character}`;
    if (current && textWidth(font, candidate, size) > maxWidth) {
      pieces.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }

  if (current) pieces.push(current);
  return pieces;
}

function wrapText(
  value: unknown,
  font: PDFFont,
  size: number,
  maxWidth: number,
) {
  const text = displayValue(value).replace(/\r/g, "").trim();
  const paragraphs = text.split("\n");
  const lines: string[] = [];

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let current = "";

    for (const word of words) {
      const pieces =
        textWidth(font, word, size) > maxWidth
          ? splitLongWord(word, font, size, maxWidth)
          : [word];

      for (const piece of pieces) {
        const candidate = current ? `${current} ${piece}` : piece;
        if (textWidth(font, candidate, size) <= maxWidth) {
          current = candidate;
        } else {
          if (current) lines.push(current);
          current = piece;
        }
      }
    }

    if (current) lines.push(current);
    if (paragraphIndex < paragraphs.length - 1) lines.push("");
  });

  return lines.length ? lines : ["—"];
}

// ─── توابع رسم متن ──────────────────────────────────────────────
function drawRightAlignedText(
  page: PDFPage,
  font: PDFFont,
  text: string,
  right: number,
  y: number,
  size: number,
  color = colors.text,
) {
  const shapedText = shapePersianText(text);
  const width = font.widthOfTextAtSize(shapedText, size);
  page.drawText(shapedText, {
    x: right - width,
    y,
    size,
    font,
    color,
  });
}

function drawCenteredText(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  width: number,
  size: number,
  color = colors.text,
) {
  const shapedText = shapePersianText(text);
  const shapedTextWidth = font.widthOfTextAtSize(shapedText, size);
  page.drawText(shapedText, {
    x: x + Math.max(0, (width - shapedTextWidth) / 2),
    y,
    size,
    font,
    color,
  });
}

// ─── ساخت ردیف‌های جدول ارزیابی ─────────────────────────────────
function priceRows(data: PropertyAppraisalInputDto): PriceRow[] {
  return [
    {
      title: "عرصه کل",
      area: data.landArea,
      unitPrice: data.landUnitPrice,
      totalPrice: data.landTotalPrice,
    },
    {
      title: "قدرالسهم",
      area: data.landShareArea,
      unitPrice: data.landShareUnitPrice,
      totalPrice: data.landShareTotalPrice,
    },
    {
      title: "زیرزمین",
      area: data.basementArea,
      unitPrice: data.basementUnitPrice,
      totalPrice: data.basementTotalPrice,
    },
    {
      title: "همکف",
      area: data.groundFloorArea,
      unitPrice: data.groundFloorUnitPrice,
      totalPrice: data.groundFloorTotalPrice,
    },
    {
      title: "نیم‌طبقه",
      area: data.mezzanineArea,
      unitPrice: data.mezzanineUnitPrice,
      totalPrice: data.mezzanineTotalPrice,
    },
    {
      title: "طبقه اول",
      area: data.floor1Area,
      unitPrice: data.floor1UnitPrice,
      totalPrice: data.floor1TotalPrice,
    },
    {
      title: "طبقه دوم",
      area: data.floor2Area,
      unitPrice: data.floor2UnitPrice,
      totalPrice: data.floor2TotalPrice,
    },
    {
      title: "طبقه سوم",
      area: data.floor3Area,
      unitPrice: data.floor3UnitPrice,
      totalPrice: data.floor3TotalPrice,
    },
    {
      title: "طبقه چهارم",
      area: data.floor4Area,
      unitPrice: data.floor4UnitPrice,
      totalPrice: data.floor4TotalPrice,
    },
    {
      title: "طبقه پنجم",
      area: data.floor5Area,
      unitPrice: data.floor5UnitPrice,
      totalPrice: data.floor5TotalPrice,
    },
    {
      title: "سایر طبقات",
      area: data.otherFloorsArea,
      unitPrice: data.otherFloorsUnitPrice,
      totalPrice: data.otherFloorsTotalPrice,
    },
    {
      title: "محوطه‌سازی",
      area: data.landscapingArea,
      unitPrice: data.landscapingUnitPrice,
      totalPrice: data.landscapingTotalPrice,
    },
    {
      title: "تأسیسات",
      area: data.facilitiesArea,
      unitPrice: data.facilitiesUnitPrice,
      totalPrice: data.facilitiesTotalPrice,
    },
  ];
}

// ─── کلاس Layout ────────────────────────────────────────────────
class AppraisalPdfLayout {
  private page!: PDFPage;
  private cursorY = 0;
  private readonly document: PDFDocument;
  private readonly font: PDFFont;
  private readonly data: PropertyAppraisalInputDto;
  private readonly metadata: AppraisalPdfMetadata;

  constructor(
    document: PDFDocument,
    font: PDFFont,
    data: PropertyAppraisalInputDto,
    metadata: AppraisalPdfMetadata,
  ) {
    this.document = document;
    this.font = font;
    this.data = data;
    this.metadata = metadata;
    this.addPage();
  }

  private addPage() {
    this.page = this.document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.drawPageHeader();
    this.cursorY = PAGE_HEIGHT - 94;
  }

  private drawPageHeader() {
    const boxY = PAGE_HEIGHT - 72;

    this.page.drawRectangle({
      x: MARGIN,
      y: boxY,
      width: CONTENT_WIDTH,
      height: 48,
      color: colors.white,
      borderColor: colors.navy,
      borderWidth: 1.2,
    });
    this.page.drawRectangle({
      x: MARGIN,
      y: boxY + 31,
      width: CONTENT_WIDTH,
      height: 17,
      color: colors.navy,
    });
    drawCenteredText(
      this.page,
      this.font,
      "گزارش ارزیابی ملک",
      MARGIN,
      boxY + 35,
      CONTENT_WIDTH,
      11,
      colors.white,
    );

    const third = CONTENT_WIDTH / 3;
    drawRightAlignedText(
      this.page,
      this.font,
      `شعبه: ${displayValue(this.data.branchName)}`,
      MARGIN + CONTENT_WIDTH - 8,
      boxY + 11,
      7.5,
    );
    drawCenteredText(
      this.page,
      this.font,
      `شماره درخواست: ${displayValue(this.metadata.requestCode)}`,
      MARGIN + third,
      boxY + 11,
      third,
      7.5,
    );

    const rawDate = displayValue(this.metadata.date);
    const fixedDate = reverseDateNumbers(rawDate);
    const dateText = `تاریخ: ${fixedDate}`;
    const shapedDate = shapePersianText(dateText);

    this.page.drawText(shapedDate, {
      x: MARGIN + 8,
      y: boxY + 11,
      size: 7.5,
      font: this.font,
      color: colors.text,
    });
  }

  private ensureSpace(requiredHeight: number) {
    if (this.cursorY - requiredHeight < CONTENT_BOTTOM) {
      this.addPage();
    }
  }

  addSection(title: string) {
    this.ensureSpace(70);
    this.cursorY -= 4;
    this.page.drawRectangle({
      x: MARGIN,
      y: this.cursorY - 22,
      width: CONTENT_WIDTH,
      height: 22,
      color: colors.paleBlue,
      borderColor: colors.blue,
      borderWidth: 0.8,
    });
    drawRightAlignedText(
      this.page,
      this.font,
      title,
      MARGIN + CONTENT_WIDTH - 8,
      this.cursorY - 15,
      9,
      colors.navy,
    );
    this.cursorY -= 26;
  }

  addFields(rows: PdfField[][]) {
    for (const row of rows) {
      const columnWidth = CONTENT_WIDTH / row.length;
      const valueWidth = columnWidth - 16;
      const lineSets = row.map((field) =>
        wrapText(field.value, this.font, 8.3, valueWidth),
      );
      const maxLines = Math.max(...lineSets.map((lines) => lines.length));
      const rowHeight = Math.max(38, 24 + maxLines * 11);

      this.ensureSpace(rowHeight);
      const bottom = this.cursorY - rowHeight;

      row.forEach((field, index) => {
        const x = MARGIN + CONTENT_WIDTH - (index + 1) * columnWidth;

        this.page.drawRectangle({
          x,
          y: bottom,
          width: columnWidth,
          height: rowHeight,
          color: index % 2 === 0 ? colors.white : colors.paleGray,
          borderColor: colors.border,
          borderWidth: 0.55,
        });
        drawRightAlignedText(
          this.page,
          this.font,
          field.label,
          x + columnWidth - 7,
          this.cursorY - 12,
          7,
          colors.muted,
        );

        lineSets[index].forEach((line, lineIndex) => {
          drawRightAlignedText(
            this.page,
            this.font,
            line,
            x + columnWidth - 7,
            this.cursorY - 25 - lineIndex * 11,
            8.3,
          );
        });
      });

      this.cursorY = bottom;
    }
  }

  addEvaluationTable(rows: PriceRow[], totals: PriceRow[]) {
    const columns = [
      { title: "شرح", width: 135 },
      { title: "مساحت", width: 90 },
      { title: "بهای واحد", width: 130 },
      { title: "مبلغ کل", width: CONTENT_WIDTH - 355 },
    ];

    const drawHeader = () => {
      const height = 25;
      this.ensureSpace(height + 23);
      let right = MARGIN + CONTENT_WIDTH;

      columns.forEach((column) => {
        const x = right - column.width;
        this.page.drawRectangle({
          x,
          y: this.cursorY - height,
          width: column.width,
          height,
          color: colors.navy,
          borderColor: colors.white,
          borderWidth: 0.5,
        });
        drawCenteredText(
          this.page,
          this.font,
          column.title,
          x,
          this.cursorY - 17,
          column.width,
          8,
          colors.white,
        );
        right = x;
      });

      this.cursorY -= height;
    };

    drawHeader();

    [...rows, ...totals].forEach((row, rowIndex) => {
      if (this.cursorY - 23 < CONTENT_BOTTOM) {
        this.addPage();
        this.addSection("ادامه جدول ارزیابی");
        drawHeader();
      }

      const values = [
        row.title,
        displayValue(row.area),
        displayValue(row.unitPrice),
        displayValue(row.totalPrice),
      ];
      const isTotal = rowIndex >= rows.length;
      let right = MARGIN + CONTENT_WIDTH;

      columns.forEach((column, columnIndex) => {
        const x = right - column.width;
        this.page.drawRectangle({
          x,
          y: this.cursorY - 23,
          width: column.width,
          height: 23,
          color: isTotal
            ? colors.paleBlue
            : rowIndex % 2 === 0
              ? colors.white
              : colors.paleGray,
          borderColor: colors.border,
          borderWidth: 0.5,
        });
        drawCenteredText(
          this.page,
          this.font,
          values[columnIndex],
          x + 3,
          this.cursorY - 15,
          column.width - 6,
          isTotal ? 8 : 7.6,
          isTotal ? colors.navy : colors.text,
        );
        right = x;
      });

      this.cursorY -= 23;
    });
  }

  addSignatures() {
    this.ensureSpace(100);
    this.cursorY -= 10;

    const columnWidth = CONTENT_WIDTH / 2;
    const labels = ["مهر و امضای ارزیاب", "مهر و امضای شعبه"];

    labels.forEach((label, index) => {
      const x = MARGIN + index * columnWidth;
      this.page.drawRectangle({
        x,
        y: this.cursorY - 78,
        width: columnWidth,
        height: 78,
        color: colors.white,
        borderColor: colors.border,
        borderWidth: 0.6,
      });
      drawCenteredText(
        this.page,
        this.font,
        label,
        x,
        this.cursorY - 16,
        columnWidth,
        8,
        colors.muted,
      );
    });

    this.cursorY -= 78;
  }

  finish() {
    const pages = this.document.getPages();

    pages.forEach((page, index) => {
      page.drawLine({
        start: { x: MARGIN, y: 33 },
        end: { x: MARGIN + CONTENT_WIDTH, y: 33 },
        thickness: 0.5,
        color: colors.border,
      });
      drawCenteredText(
        page,
        this.font,
        `صفحه ${numberFormatter.format(index + 1)} از ${numberFormatter.format(pages.length)}`,
        MARGIN,
        20,
        CONTENT_WIDTH,
        7,
        colors.muted,
      );
    });
  }
}

// ─── تابع اصلی تولید PDF ────────────────────────────────────────
export async function generateAppraisalPDF(
  data: PropertyAppraisalInputDto,
  lookups: PropertyAppraisalLookupsDto,
  metadata: AppraisalPdfMetadata = {},
) {
  const fontBuffer = decodeBase64Asset(fontDataUrl, "فونت فارسی PDF");
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const font = await pdfDoc.embedFont(fontBuffer);
  const layout = new AppraisalPdfLayout(pdfDoc, font, data, metadata);

  // ─── بخش ۱: مشخصات متقاضی و تسهیلات ───
  layout.addSection("مشخصات متقاضی و تسهیلات");
  layout.addFields([
    [
      { label: "نام متقاضی", value: data.applicantName },
      { label: "نوع تسهیلات", value: data.loanType },
      { label: "میزان تسهیلات", value: data.loanAmount },
    ],
    [
      { label: "نام مالک", value: data.ownerName },
      { label: "تلفن ملک", value: data.ownerPhone },
      {
        label: "متصرف ملک",
        value: lookupTitle(
          lookups.propertyOccupiers,
          data.propertyOccupierCode,
        ),
      },
    ],
    [{ label: "نشانی ملک", value: data.ownerAddress }],
    [{ label: "توضیحات متصرف", value: data.propertyOccupierDescription }],
  ]);

  // ─── بخش ۲: اطلاعات ثبتی و سند ───
  layout.addSection("اطلاعات ثبتی و سند");
  layout.addFields([
    [
      { label: "شماره ملک", value: data.propertyNumber },
      { label: "مفروز و مجزی از", value: data.seperatedFrom },
      { label: "قطعه تفکیکی", value: data.separationPiece },
      { label: "شماره ثبت", value: data.registrationNumber },
    ],
    [
      { label: "صفحه", value: data.page },
      { label: "شماره دفتر", value: data.officeNumber },
      { label: "بخش", value: data.part },
      { label: "شهر", value: data.city },
    ],
    [
      { label: "سند قطعی مالکیت", value: data.hasDefinitiveOwnershipDocument },
      {
        label: "نوع سند",
        value: lookupTitle(
          lookups.definitiveOwnershipDocumentTypes,
          data.definitiveOwnershipDocumentTypeCode,
        ),
      },
      { label: "شماره ورقه مالکیت", value: data.titleDeedNumber },
    ],
    [
      { label: "تعداد جلد/برگه", value: data.pageCount },
      { label: "تعداد دانگ", value: data.dong },
      { label: "کدپستی", value: data.postalCode },
    ],
  ]);

  // ─── بخش ۳: مشخصات و کاربری ملک ───
  layout.addSection("مشخصات و کاربری ملک");
  layout.addFields([
    [
      { label: "منطقه شهرداری", value: data.municipalArea },
      { label: "نوع ملک", value: data.propertyType },
      {
        label: "کاربری طبق پایان کار",
        value: data.useAccordingToTheCompletionOfTheWork,
      },
    ],
    [
      {
        label: "نوع پایان کار",
        value: lookupTitle(
          lookups.typeOfWorkCompletions,
          data.typeOfWorkCompletionCode,
        ),
      },
      { label: "نوع استفاده از ملک", value: data.typeOfUseOfTheProperty },
      {
        label: "تطابق مساحت با سند",
        value: data.hasMatchingTheAreaWithTheDocument,
      },
    ],
    [
      {
        label: "توضیحات عدم تطابق",
        value: data.explanationInCaseOfDisagreement,
      },
    ],
    [
      {
        label: "نوع ملک وقفی",
        value: lookupTitle(
          lookups.typeOfEndowmentProperties,
          data.typeOfEndowmentPropertyCode,
        ),
      },
      {
        label: "سایر توضیحات وقف",
        value: data.typeOfEndowmentPropertyIfOther,
      },
      {
        label: "موضوع ارزیابی",
        value: lookupTitle(lookups.evaluationTopics, data.evaluationTopicCode),
      },
    ],
  ]);

  // ─── بخش ۴: جدول ارزیابی ───
  layout.addSection("جدول ارزیابی");
  layout.addEvaluationTable(priceRows(data), [
    {
      title: "جمع کل",
      area: data.totalArea,
      unitPrice: data.totalUnitPrice,
      totalPrice: data.totalPrice,
    },
    {
      title: "تعدیل سرقفلی",
      area: "",
      unitPrice: "",
      totalPrice: data.goodwillAdjustment,
    },
    {
      title: "مبلغ نهایی",
      area: "",
      unitPrice: "",
      totalPrice: data.finalPrice,
    },
  ]);
  layout.addFields([
    [{ label: "مبلغ نهایی به حروف", value: data.finalPriceInWords }],
  ]);

  // ─── بخش ۵: مشخصات فنی ساختمان ───
  layout.addSection("مشخصات فنی ساختمان");
  layout.addFields([
    [
      { label: "تعداد طبقات", value: data.totalFloors },
      { label: "تعداد واحدها به تفکیک کاربری", value: data.usageBreakdown },
    ],
    [
      {
        label: "نوع سازه",
        value: lookupTitle(lookups.structureTypes, data.structureTypeCode),
      },
      { label: "سایر نوع سازه", value: data.structureTypeOther },
      { label: "نماسازی", value: data.facadeType },
    ],
    [
      { label: "نحوه محاسبه قدمت بنا", value: data.buildingAgeCalculation },
      { label: "سیستم گرمایشی", value: data.heatingSystem },
      { label: "سیستم سرمایشی", value: data.coolingSystem },
    ],
  ]);

  // ─── بخش ۶: انشعابات و مجوزها ───
  layout.addSection("انشعابات و مجوزها");
  layout.addFields([
    [
      { label: "آب", value: data.hasWater },
      { label: "برق", value: data.hasElectricity },
      { label: "گاز", value: data.hasGas },
      { label: "تلفن", value: data.hasTelephone },
      { label: "اصلاحی شهرداری", value: data.hasMunicipalCorrection },
    ],
    [
      { label: "مشخصات برق", value: data.electricityDetails },
      { label: "توضیحات خاص بر و کف", value: data.certificateDetails },
    ],
    [{ label: "توضیحات و سایر مشخصات", value: data.otherDetails }],
  ]);

  // ─── بخش ۷: وضعیت مالکیت و کیفیت ساختمان ───
  layout.addSection("وضعیت مالکیت و کیفیت ساختمان");
  layout.addFields([
    [
      { label: "مالک در قید حیات است", value: data.isOwnerAlive },
      {
        label: "وضعیت انحصار وراثت",
        value: lookupTitle(
          lookups.inheritanceStatuses,
          data.inheritanceStatusCode,
        ),
      },
    ],
    [
      {
        label: "موقعیت شهری",
        value: lookupTitle(
          lookups.urbanLocationGrades,
          data.urbanLocationGradeCode,
        ),
      },
      {
        label: "آسیب‌پذیری بلایای طبیعی",
        value: lookupTitle(
          lookups.disasterVulnerabilities,
          data.disasterVulnerabilityCode,
        ),
      },
      {
        label: "کیفیت ساخت و مصالح",
        value: lookupTitle(
          lookups.constructionQualities,
          data.constructionQualityCode,
        ),
      },
    ],
  ]);

  // ─── بخش ۸: امکانات و مشاعات ───
  layout.addSection("امکانات و مشاعات");
  layout.addFields([
    [
      { label: "پارکینگ", value: data.hasParking },
      { label: "پارکینگ مشاعی", value: data.hasSharedParking },
      { label: "تعداد پارکینگ", value: data.parkingCount },
    ],
    [
      { label: "انباری", value: data.hasStorage },
      { label: "تعداد انباری", value: data.storageCount },
      { label: "مساحت انباری", value: data.storageArea },
    ],
    [
      { label: "آسانسور", value: data.hasElevator },
      { label: "تعداد آسانسور", value: data.elevatorCount },
    ],
    [{ label: "امتیازات مشاعی یا اختصاصی دیگر", value: data.otherPrivileges }],
  ]);

  // ─── بخش ۹: اسناد و تعهدات ───
  layout.addSection("اسناد و تعهدات");
  layout.addFields([
    [
      { label: "دارای گواهی", value: data.hasCertificate },
      {
        label: "نوع گواهی",
        value: lookupTitle(
          lookups.buildingCertificates,
          data.certificateTypeCode,
        ),
      },
      { label: "شماره گواهی", value: data.certificateNumber },
      { label: "تاریخ گواهی", value: data.certificateDate },
    ],
    [
      { label: "در رهن یا بازداشت", value: data.isMortgagedOrSeized },
      { label: "ذی‌نفع رهن یا بازداشت", value: data.mortgageBeneficiary },
    ],
  ]);

  // ─── بخش ۱۰: منافع و اجاره ───
  layout.addSection("منافع و اجاره");
  layout.addFields([
    [
      { label: "منافع به غیر واگذار شده", value: data.hasTransferredBenefits },
      {
        label: "توضیحات واگذاری منافع",
        value: data.benefitsTransferDescription,
      },
    ],
    [
      { label: "در اختیار مستأجر", value: data.isOccupiedByTenant },
      { label: "پیش‌پرداخت اجاره", value: data.rentalAdvancePayment },
      { label: "اجاره ماهیانه", value: data.monthlyRent },
    ],
    [
      {
        label: "نوع اجاره‌نامه",
        value: lookupTitle(lookups.leaseTypes, data.leaseTypeCode),
      },
      { label: "کد رهگیری اجاره", value: data.leaseTrackingCode },
      { label: "شماره اجاره‌نامه", value: data.leaseNumber },
      { label: "تاریخ اجاره‌نامه", value: data.leaseDate },
    ],
  ]);

  // ─── بخش ۱۱: مغازه و وضعیت فروش ───
  layout.addSection("مغازه و وضعیت فروش");
  layout.addFields([
    [
      { label: "دارای مغازه", value: data.hasShop },
      { label: "تعداد مغازه", value: data.shopCount },
      { label: "متصرف مغازه", value: data.shopOccupier },
      { label: "نوع کسب", value: data.shopBusinessType },
    ],
    [
      { label: "سهل‌البیع", value: data.isReadilyMarketable },
      { label: "توضیحات وضعیت فروش", value: data.marketabilityNotes },
    ],
    [
      {
        label: "مبنای قیمت‌گذاری",
        value: lookupTitle(
          lookups.valuationPriceBasises,
          data.valuationPriceBasisCode,
        ),
      },
      { label: "تخلف مشهود", value: data.hasVisibleViolation },
    ],
    [{ label: "توضیحات تخلف", value: data.visibleViolationDescription }],
    [
      {
        label: "توضیحات تکمیلی وثیقه",
        value: data.additionalCollateralDescription,
      },
    ],
  ]);

  // ─── بخش ۱۲: جمع‌بندی ارزیابی ───
  layout.addSection("جمع‌بندی ارزیابی");
  layout.addFields([
    [
      { label: "مبلغ نهایی", value: data.finalPrice },
      { label: "نام شعبه", value: data.branchName },
      { label: "کد شعبه", value: data.branchCode },
    ],
    [{ label: "مبلغ نهایی به حروف", value: data.finalPriceInWords }],
  ]);

  layout.addSignatures();
  layout.finish();

  pdfDoc.setTitle(
    `ارزیابی ملک - ${data.applicantName || metadata.requestCode || "گزارش"}`,
  );
  pdfDoc.setSubject("گزارش ارزیابی ملک");
  pdfDoc.setCreator("Job Referral UI");

  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength,
  ) as ArrayBuffer;
  const blob = new Blob([pdfBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const applicantName = fileSafeName(data.applicantName || "گزارش");

  link.href = url;
  link.download = `ارزیابی-ملک-${applicantName || "گزارش"}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
