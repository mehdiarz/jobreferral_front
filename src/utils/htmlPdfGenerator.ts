import {
  PDFDocument,
  PDFName,
  PDFBool,
  PDFFont,
  PDFForm,
  TextAlignment,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import reshaper from "arabic-persian-reshaper";

import type {
  PropertyAppraisalInputDto,
  PropertyAppraisalLookupsDto,
} from "../services/PropertyAppraisalCrud/types";
import type { RequestSignatureOutputDto } from "../services/RequestSignatureCrud/types";
import { isoToPersianDateTimeForPdf } from "./persianToISO";

const PDF_PATH = `${import.meta.env.BASE_URL}templates/appraisal-template-acroform-final.pdf`;
const FONT_PATH = `${import.meta.env.BASE_URL}fonts/Vazirmatn-Regular.ttf`;

const BASE_FONT_SIZE = 8;
const MULTILINE_FONT_SIZE = 8;

type AppraisalPdfMetadata = {
  requestCode?: string | null;
  date?: string | null;
  signatures?: RequestSignatureOutputDto[];
};

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "boolean") return value ? "دارد" : "ندارد";
  if (typeof value === "number") {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
      useGrouping: true,
    }).format(value);
  }
  return String(value);
}

function toPersianDigits(value: string | number): string {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

  return String(value).replace(/\d/g, (digit) => {
    return persianDigits[Number(digit)];
  });
}

function reverseText(value: string): string {
  return Array.from(value).reverse().join("");
}

/**
 * pdf-lib/AcroForm در خروجی فارسی، ترتیب توکن‌های عددی را برعکس نشان می‌دهد.
 *
 * این تابع عددها و جداکننده‌های مربوط به آن‌ها را از قبل reverse می‌کند
 * تا در خروجی نهایی PDF درست نمایش داده شوند.
 *
 * مثال:
 * ۵,۰۰۰,۰۰۰,۰۰۰ -> ۰۰۰,۰۰۰,۰۰۰,۵
 * ۱۴۰۵/۰۶/۰۴ -> ۴۰/۶۰/۵۰۴۱
 *
 * سپس موتور PDF آن را به شکل دیداری درست نشان می‌دهد.
 */
function reverseNumericTokensForPdf(value: string): string {
  return value.replace(
    /[0-9۰-۹][0-9۰-۹,٬./:]*[0-9۰-۹]|[0-9۰-۹]/g,
    (numericToken) => reverseText(numericToken),
  );
}

/**
 * نمایش مبلغ، مساحت و عددهایی که جداکننده هزارگان دارند.
 */
function displayPersianNumberForPdf(value: unknown): string {
  const formattedValue = displayValue(value);

  if (!formattedValue) {
    return "";
  }

  return reverseNumericTokensForPdf(toPersianDigits(formattedValue));
}

/**
 * نمایش کدها و شماره‌ها بدون جداکننده هزارگان:
 * کد پرسنلی، کد پستی، شماره سند، کد رهگیری و ...
 */
function displayPersianPlainNumberForPdf(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const plainValue = String(value).trim();

  return reverseNumericTokensForPdf(toPersianDigits(plainValue));
}

function normalizePersianText(value: string): string {
  return value
    .normalize("NFC")
    .replace(/ي/g, "ی")
    .replace(/ى/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .replace(/\u200C/g, "")
    .replace(/\u200D/g, "")
    .replace(/\uFEFF/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\r\n?/g, "\n");
}

// wrap روی متن منطقی (قبل از reshape)
function wrapLogicalPersianText(value: string, maxLen = 60): string {
  const normalized = normalizePersianText(value);
  const sourceLines = normalized.split("\n");
  const result: string[] = [];

  for (const sourceLine of sourceLines) {
    const words = sourceLine.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) {
      result.push("");
      continue;
    }

    let currentLine = "";

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;

      if (candidate.length > maxLen && currentLine) {
        result.push(currentLine);
        currentLine = word;
      } else {
        currentLine = candidate;
      }
    }

    if (currentLine) {
      result.push(currentLine);
    }
  }

  return result.join("\n");
}

// reshape هر خط جداگانه
function prepareRtlTextForPdf(value: string): string {
  if (!value) return "";

  return normalizePersianText(value)
    .split("\n")
    .map((line) => {
      // قبل از reshape، فقط عددهای داخل متن را reverse می‌کنیم.
      // این کار باعث می‌شود پس از پردازش Arabic/Persian reshaper
      // عددها در PDF به ترتیب صحیح دیده شوند.
      const textWithFixedNumbers = reverseNumericTokensForPdf(line);

      return reshaper.PersianShaper.convertArabic(textWithFixedNumbers);
    })
    .join("\n");
}

async function fetchAsArrayBuffer(path: string): Promise<ArrayBuffer> {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`فایل پیدا نشد: ${path} - Status: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength === 0) {
    throw new Error(`فایل خالی است: ${path}`);
  }
  return buffer;
}

type TextFieldOptions = {
  multiline?: boolean;
  alignment?: "left" | "center" | "right";
  rtl?: boolean;
  wrap?: boolean;
  wrapLength?: number;
  fontSize?: number;
};

function getTextAlignment(
  alignment: TextFieldOptions["alignment"],
): TextAlignment {
  switch (alignment) {
    case "left":
      return TextAlignment.Left;
    case "center":
      return TextAlignment.Center;
    case "right":
    default:
      return TextAlignment.Right;
  }
}

function setTextField(
  form: PDFForm,
  fieldName: string,
  value: string,
  options: TextFieldOptions = {},
): void {
  try {
    const field = form.getTextField(fieldName);

    const cleanText = value;
    if (!cleanText.trim()) return;

    if (options.multiline) {
      field.enableMultiline();
    }

    // 1. نرمال‌سازی متن منطقی
    let logicalText = normalizePersianText(cleanText);

    // 2. wrap روی متن منطقی (قبل از reshape)
    if (options.wrap) {
      logicalText = wrapLogicalPersianText(
        logicalText,
        options.wrapLength ?? 60,
      );
    }

    // 3. reshape بعد از wrap
    const pdfText =
      options.rtl === false ? logicalText : prepareRtlTextForPdf(logicalText);

    // 4. alignment سفارشی
    const alignment =
      options.rtl === false
        ? getTextAlignment(options.alignment)
        : options.alignment === "center"
          ? TextAlignment.Center
          : TextAlignment.Left;

    field.setAlignment(alignment);

    // 5. فونت
    field.setFontSize(
      options.fontSize ??
        (options.multiline ? MULTILINE_FONT_SIZE : BASE_FONT_SIZE),
    );

    field.setText(pdfText);
  } catch (error) {
    console.warn(`Could not set text field "${fieldName}"`, error);
  }
}

function setCheckbox(form: PDFForm, fieldName: string, checked: boolean): void {
  try {
    const checkbox = form.getCheckBox(fieldName);

    if (checked) {
      checkbox.check();
    } else {
      checkbox.uncheck();
    }
  } catch (error) {
    console.warn(`Checkbox not found: ${fieldName}`, error);
  }
}

function setCodedCheckbox(
  form: PDFForm,
  baseFieldName: string,
  maxOptions: number,
  selectedCode: string | number | null | undefined,
): void {
  const codeStr = String(selectedCode ?? "");
  for (let i = 1; i <= maxOptions; i++) {
    setCheckbox(form, `${baseFieldName}${i}`, String(i) === codeStr);
  }
}

export async function generateAppraisalPdf(
  data: PropertyAppraisalInputDto,
  lookups: PropertyAppraisalLookupsDto,
  metadata: AppraisalPdfMetadata = {},
): Promise<string> {
  try {
    void lookups;

    const existingPdfBytes = await fetchAsArrayBuffer(PDF_PATH);
    const fontBytes = await fetchAsArrayBuffer(FONT_PATH);

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);

    const persianFont: PDFFont = await pdfDoc.embedFont(fontBytes, {
      subset: false,
    });

    const form = pdfDoc.getForm();

    // ==================== صفحه ۱ ====================

    // مشخصات متقاضی
    setTextField(form, "page1_applicantName", displayValue(data.applicantName));
    setTextField(form, "page1_ownerName", displayValue(data.ownerName));
    setTextField(
      form,
      "page1_ownerPhone",
      displayPersianNumberForPdf(data.ownerPhone),
      {
        alignment: "center",
        rtl: false,
      },
    );
    setTextField(form, "page1_ownerAddress", displayValue(data.ownerAddress), {
      multiline: true,
      wrap: true,
      wrapLength: 75,
      alignment: "center",
    });
    setTextField(form, "page1_loanType", displayValue(data.loanType));
    setTextField(
      form,
      "page1_loanAmount",
      displayPersianNumberForPdf(data.loanAmount),
      {
        alignment: "center",
        rtl: false,
      },
    );
    setTextField(
      form,
      "page1_propertyOccupierDescription",
      displayValue(data.propertyOccupierDescription),
    );

    // چک‌باکس متصرف
    setCodedCheckbox(
      form,
      "page1_propertyOccupierCode",
      5,
      data.propertyOccupierCode,
    );

    // اطلاعات ثبتی
    setTextField(
      form,
      "page1_propertyNumber",
      displayPersianNumberForPdf(data.propertyNumber),
      {
        alignment: "center",
        rtl: false,
      },
    );
    setTextField(form, "page1_seperatedFrom", displayValue(data.seperatedFrom));
    setTextField(
      form,
      "page1_separationPiece",
      displayPersianNumberForPdf(data.separationPiece),
    );
    setTextField(
      form,
      "page1_registrationNumber",
      displayPersianNumberForPdf(data.registrationNumber),
      {
        alignment: "center",
        rtl: false,
      },
    );
    setTextField(form, "page1_page", displayValue(data.page), {
      alignment: "center",
      rtl: false,
    });
    setTextField(
      form,
      "page1_officeNumber",
      displayPersianNumberForPdf(data.officeNumber),
      {
        alignment: "center",
        rtl: false,
      },
    );
    setTextField(form, "page1_part", displayValue(data.part));
    setTextField(form, "page1_city", displayValue(data.city));
    setTextField(
      form,

      "page1_titleDeedNumber",
      displayPersianNumberForPdf(data.titleDeedNumber),
      {
        alignment: "center",
        rtl: false,
      },
    );
    setTextField(
      form,

      "page1_pageCount",
      displayValue(data.pageCount),
      {
        alignment: "center",
        rtl: false,
      },
    );
    setTextField(form, "page1_dong", displayValue(data.dong), {
      alignment: "center",
      rtl: false,
    });
    setTextField(form, "page1_postalCode", displayValue(data.postalCode), {
      alignment: "center",
      rtl: false,
    });

    // سند قطعی مالکیت
    if (data.hasDefinitiveOwnershipDocument === true) {
      setCheckbox(form, "page1_hasDefinitiveOwnershipDocument", true);
      setCheckbox(form, "page1_noDefinitiveOwnershipDocument", false);
    } else if (data.hasDefinitiveOwnershipDocument === false) {
      setCheckbox(form, "page1_hasDefinitiveOwnershipDocument", false);
      setCheckbox(form, "page1_noDefinitiveOwnershipDocument", true);
    }

    // نوع سند
    setCodedCheckbox(
      form,
      "page1_definitiveOwnershipDocumentTypeCode",
      6,
      data.definitiveOwnershipDocumentTypeCode,
    );

    // مشخصات ملک
    setTextField(form, "page1_municipalArea", displayValue(data.municipalArea));
    setTextField(form, "page1_propertyType", displayValue(data.propertyType));
    setTextField(
      form,

      "page1_useAccordingToTheCompletionOfTheWork",
      displayValue(data.useAccordingToTheCompletionOfTheWork),
    );
    setTextField(
      form,

      "page1_typeOfUseOfTheProperty",
      displayValue(data.typeOfUseOfTheProperty),
    );
    setTextField(
      form,

      "page1_typeOfEndowmentPropertyIfOther",
      displayValue(data.typeOfEndowmentPropertyIfOther),
    );
    setTextField(
      form,

      "page1_explanationInCaseOfDisagreement",
      displayValue(data.explanationInCaseOfDisagreement),
      {
        multiline: true,
        wrap: true,
        wrapLength: 75,
        alignment: "center",
      },
    );

    // تطابق مساحت
    if (data.hasMatchingTheAreaWithTheDocument === true) {
      setCheckbox(form, "page1_hasMatchingTheAreaWithTheDocument", true);
      setCheckbox(form, "page1_noMatchingTheAreaWithTheDocument", false);
    } else if (data.hasMatchingTheAreaWithTheDocument === false) {
      setCheckbox(form, "page1_hasMatchingTheAreaWithTheDocument", false);
      setCheckbox(form, "page1_noMatchingTheAreaWithTheDocument", true);
    }

    // نوع پایان کار
    setCodedCheckbox(
      form,
      "page1_typeOfWorkCompletionCode",
      2,
      data.typeOfWorkCompletionCode,
    );

    // نوع ملک وقفی
    setCodedCheckbox(
      form,
      "page1_typeOfEndowmentPropertyCode",
      2,
      data.typeOfEndowmentPropertyCode,
    );

    // موضوع ارزیابی
    setCodedCheckbox(
      form,
      "page1_evaluationTopicCode",
      4,
      data.evaluationTopicCode,
    );

    // جدول ارزیابی
    const priceFields: Array<[string, unknown]> = [
      ["page1_landArea", data.landArea],
      ["page1_landUnitPrice", data.landUnitPrice],
      ["page1_landTotalPrice", data.landTotalPrice],
      ["page1_landShareArea", data.landShareArea],
      ["page1_landShareUnitPrice", data.landShareUnitPrice],
      ["page1_landShareTotalPrice", data.landShareTotalPrice],
      ["page1_basementArea", data.basementArea],
      ["page1_basementUnitPrice", data.basementUnitPrice],
      ["page1_basementTotalPrice", data.basementTotalPrice],
      ["page1_groundFloorArea", data.groundFloorArea],
      ["page1_groundFloorUnitPrice", data.groundFloorUnitPrice],
      ["page1_groundFloorTotalPrice", data.groundFloorTotalPrice],
      ["page1_mezzanineArea", data.mezzanineArea],
      ["page1_mezzanineUnitPrice", data.mezzanineUnitPrice],
      ["page1_mezzanineTotalPrice", data.mezzanineTotalPrice],
      ["page1_floor1Area", data.floor1Area],
      ["page1_floor1UnitPrice", data.floor1UnitPrice],
      ["page1_floor1TotalPrice", data.floor1TotalPrice],
      ["page1_floor2Area", data.floor2Area],
      ["page1_floor2UnitPrice", data.floor2UnitPrice],
      ["page1_floor2TotalPrice", data.floor2TotalPrice],
      ["page1_floor3Area", data.floor3Area],
      ["page1_floor3UnitPrice", data.floor3UnitPrice],
      ["page1_floor3TotalPrice", data.floor3TotalPrice],
      ["page1_floor4Area", data.floor4Area],
      ["page1_floor4UnitPrice", data.floor4UnitPrice],
      ["page1_floor4TotalPrice", data.floor4TotalPrice],
      ["page1_floor5Area", data.floor5Area],
      ["page1_floor5UnitPrice", data.floor5UnitPrice],
      ["page1_floor5TotalPrice", data.floor5TotalPrice],
      ["page1_otherFloorsArea", data.otherFloorsArea],
      ["page1_otherFloorsUnitPrice", data.otherFloorsUnitPrice],
      ["page1_otherFloorsTotalPrice", data.otherFloorsTotalPrice],
      ["page1_landscapingArea", data.landscapingArea],
      ["page1_landscapingUnitPrice", data.landscapingUnitPrice],
      ["page1_landscapingTotalPrice", data.landscapingTotalPrice],
      ["page1_facilitiesArea", data.facilitiesArea],
      ["page1_facilitiesUnitPrice", data.facilitiesUnitPrice],
      ["page1_facilitiesTotalPrice", data.facilitiesTotalPrice],
      ["page1_totalArea", data.totalArea],
      ["page1_totalUnitPrice", data.totalUnitPrice],
      ["page1_totalPrice", data.totalPrice],
      ["page1_goodwillAdjustment", data.goodwillAdjustment],
      ["page1_finalPrice", data.finalPrice],
    ];

    priceFields.forEach(([fieldName, value]) => {
      setTextField(
        form,

        fieldName,
        displayPersianNumberForPdf(value),
        {
          alignment: "center",
          rtl: false,
        },
      );
    });

    setTextField(
      form,

      "page1_finalPriceInWords",
      displayValue(data.finalPriceInWords),
      {
        multiline: false,
        wrap: false,
        alignment: "center",
        fontSize: 6.5,
      },
    );

    // مشخصات فنی
    setTextField(
      form,

      "page1_totalFloors",
      displayValue(data.totalFloors),
      {
        alignment: "center",
        rtl: false,
      },
    );
    setTextField(
      form,

      "page1_usageBreakdown",
      displayValue(data.usageBreakdown),
    );
    setTextField(
      form,

      "page1_structureTypeOther",
      displayValue(data.structureTypeOther),
    );
    setTextField(
      form,

      "page1_facadeType",
      displayValue(data.facadeType),
    );
    setTextField(
      form,

      "page1_buildingAgeCalculation",
      displayValue(data.buildingAgeCalculation),
    );
    setTextField(
      form,

      "page1_heatingSystem",
      displayValue(data.heatingSystem),
    );
    setTextField(
      form,

      "page1_coolingSystem",
      displayValue(data.coolingSystem),
    );

    // نوع سازه
    setCodedCheckbox(
      form,
      "page1_structureTypeCode",
      2,
      data.structureTypeCode,
    );

    // انشعابات
    setCheckbox(form, "page1_hasWater", data.hasWater === true);
    setCheckbox(form, "page1_hasElectricity", data.hasElectricity === true);
    setCheckbox(form, "page1_hasGas", data.hasGas === true);
    setCheckbox(form, "page1_hasTelephone", data.hasTelephone === true);

    // اصلاحی شهرداری
    if (data.hasMunicipalCorrection === true) {
      setCheckbox(form, "page1_hasMunicipalCorrection", true);
      setCheckbox(form, "page1_noMunicipalCorrection", false);
    } else if (data.hasMunicipalCorrection === false) {
      setCheckbox(form, "page1_hasMunicipalCorrection", false);
      setCheckbox(form, "page1_noMunicipalCorrection", true);
    }

    setTextField(
      form,

      "page1_electricityDetails",
      displayValue(data.electricityDetails),
    );
    setTextField(
      form,

      "page1_certificateDetails",
      displayValue(data.certificateDetails),
    );
    setTextField(
      form,

      "page1_otherDetails",
      displayValue(data.otherDetails),
      {
        multiline: true,
        wrap: true,
        wrapLength: 75,
        alignment: "center",
      },
    );

    // ==================== صفحه ۲ ====================

    // وضعیت مالکیت
    setCheckbox(form, "page2_isOwnerAlive", data.isOwnerAlive === true);

    // انحصار وراثت
    setCodedCheckbox(
      form,
      "page2_inheritanceStatusCode",
      2,
      data.inheritanceStatusCode,
    );

    // موقعیت شهری
    setCodedCheckbox(
      form,
      "page2_urbanLocationGradeCode",
      4,
      data.urbanLocationGradeCode,
    );

    // آسیب‌پذیری
    setCodedCheckbox(
      form,
      "page2_disasterVulnerabilityCode",
      3,
      data.disasterVulnerabilityCode,
    );

    // کیفیت ساخت
    setCodedCheckbox(
      form,
      "page2_constructionQualityCode",
      4,
      data.constructionQualityCode,
    );

    // امکانات
    setCheckbox(form, "page2_hasParking", data.hasParking === true);
    setCheckbox(form, "page2_hasSharedParking", data.hasSharedParking === true);
    setCheckbox(form, "page2_hasStorage", data.hasStorage === true);
    setCheckbox(form, "page2_hasElevator", data.hasElevator === true);

    setTextField(
      form,

      "page2_parkingCount",
      displayValue(data.parkingCount),
      {
        alignment: "center",
        rtl: false,
      },
    );
    setTextField(
      form,

      "page2_storageCount",
      displayValue(data.storageCount),
      {
        alignment: "center",
        rtl: false,
      },
    );
    setTextField(
      form,

      "page2_storageArea",
      displayValue(data.storageArea),
      {
        alignment: "center",
        rtl: false,
      },
    );
    setTextField(
      form,

      "page2_elevatorCount",
      displayValue(data.elevatorCount),
      {
        alignment: "center",
        rtl: false,
      },
    );
    setTextField(
      form,

      "page2_otherPrivileges",
      displayValue(data.otherPrivileges),
    );

    // اسناد
    if (data.hasCertificate === true) {
      setCheckbox(form, "page2_hasCertificate", true);
      setCheckbox(form, "page2_noCertificate", false);
    } else if (data.hasCertificate === false) {
      setCheckbox(form, "page2_hasCertificate", false);
      setCheckbox(form, "page2_noCertificate", true);
    }

    setCodedCheckbox(
      form,
      "page2_certificateTypeCode",
      3,
      data.certificateTypeCode,
    );

    setTextField(
      form,

      "page2_certificateNumber",
      displayPersianNumberForPdf(data.certificateNumber),
      {
        alignment: "center",
        rtl: false,
      },
    );
    setTextField(
      form,

      "page2_certificateDate",
      displayValue(data.certificateDate),
      {
        alignment: "center",
        rtl: false,
      },
    );

    // رهن
    if (data.isMortgagedOrSeized === true) {
      setCheckbox(form, "page2_isMortgagedOrSeized", true);
      setCheckbox(form, "page2_noMortgagedOrSeized", false);
    } else if (data.isMortgagedOrSeized === false) {
      setCheckbox(form, "page2_isMortgagedOrSeized", false);
      setCheckbox(form, "page2_noMortgagedOrSeized", true);
    }

    setTextField(
      form,

      "page2_mortgageBeneficiary",
      displayValue(data.mortgageBeneficiary),
    );

    // منافع
    if (data.hasTransferredBenefits === true) {
      setCheckbox(form, "page2_hasTransferredBenefits", true);
      setCheckbox(form, "page2_noTransferredBenefits", false);
    } else if (data.hasTransferredBenefits === false) {
      setCheckbox(form, "page2_hasTransferredBenefits", false);
      setCheckbox(form, "page2_noTransferredBenefits", true);
    }

    setTextField(
      form,

      "page2_benefitsTransferDescription",
      displayValue(data.benefitsTransferDescription),
      {
        multiline: true,
        wrap: true,
        wrapLength: 75,
        alignment: "center",
      },
    );

    // مستأجر
    if (data.isOccupiedByTenant === true) {
      setCheckbox(form, "page2_isOccupiedByTenant", true);
      setCheckbox(form, "page2_noOccupiedByTenant", false);
    } else if (data.isOccupiedByTenant === false) {
      setCheckbox(form, "page2_isOccupiedByTenant", false);
      setCheckbox(form, "page2_noOccupiedByTenant", true);
    }

    setTextField(
      form,

      "page2_rentalAdvancePayment",
      displayValue(data.rentalAdvancePayment),
      {
        alignment: "center",
        rtl: false,
      },
    );
    setTextField(
      form,

      "page2_monthlyRent",
      displayValue(data.monthlyRent),
      {
        alignment: "center",
        rtl: false,
      },
    );

    // اجاره
    setCodedCheckbox(form, "page2_leaseTypeCode", 2, data.leaseTypeCode);

    setTextField(
      form,

      "page2_leaseTrackingCode",
      displayValue(data.leaseTrackingCode),
      {
        alignment: "center",
        rtl: false,
      },
    );
    setTextField(
      form,

      "page2_leaseNumber",
      displayPersianNumberForPdf(data.leaseNumber),
      {
        alignment: "center",
        rtl: false,
      },
    );
    setTextField(
      form,

      "page2_leaseDate",
      displayValue(data.leaseDate),
      {
        alignment: "center",
        rtl: false,
      },
    );

    // مغازه
    if (data.hasShop === true) {
      setCheckbox(form, "page2_hasShop", true);
      setCheckbox(form, "page2_noShop", false);
    } else if (data.hasShop === false) {
      setCheckbox(form, "page2_hasShop", false);
      setCheckbox(form, "page2_noShop", true);
    }

    setTextField(
      form,

      "page2_shopCount",
      displayValue(data.shopCount),
      {
        alignment: "center",
        rtl: false,
      },
    );
    setTextField(
      form,

      "page2_shopOccupier",
      displayValue(data.shopOccupier),
    );
    setTextField(
      form,

      "page2_shopBusinessType",
      displayValue(data.shopBusinessType),
    );

    // سهل‌البیع
    if (data.isReadilyMarketable === true) {
      setCheckbox(form, "page2_isReadilyMarketable", true);
      setCheckbox(form, "page2_noReadilyMarketable", false);
    } else if (data.isReadilyMarketable === false) {
      setCheckbox(form, "page2_isReadilyMarketable", false);
      setCheckbox(form, "page2_noReadilyMarketable", true);
    }

    setTextField(
      form,

      "page2_marketabilityNotes1",
      displayValue(data.marketabilityNotes),
      {
        multiline: true,
        wrap: true,
        wrapLength: 75,
        alignment: "center",
      },
    );
    setTextField(
      form,

      "page2_marketabilityNotes2",
      displayValue(data.marketabilityNotes),
      {
        multiline: true,
        wrap: true,
        wrapLength: 75,
        alignment: "center",
      },
    );

    // مبنای قیمت‌گذاری
    setCodedCheckbox(
      form,
      "page2_valuationPriceBasisCode",
      3,
      data.valuationPriceBasisCode,
    );

    // تخلف
    if (data.hasVisibleViolation === true) {
      setCheckbox(form, "page2_hasVisibleViolation", true);
      setCheckbox(form, "page2_noVisibleViolation", false);
    } else if (data.hasVisibleViolation === false) {
      setCheckbox(form, "page2_hasVisibleViolation", false);
      setCheckbox(form, "page2_noVisibleViolation", true);
    }

    setTextField(
      form,

      "page2_visibleViolationDescription",
      displayValue(data.visibleViolationDescription),
      {
        multiline: true,
        wrap: true,
        wrapLength: 75,
        alignment: "center",
      },
    );
    setTextField(
      form,

      "page2_additionalCollateralDescription",
      displayValue(data.additionalCollateralDescription),
      {
        multiline: true,
        wrap: true,
        wrapLength: 75,
        alignment: "center",
      },
    );

    // جمع‌بندی
    setTextField(
      form,

      "page2_branchName",
      displayValue(data.branchName),
    );
    setTextField(
      form,

      "page2_branchCode",
      displayValue(data.branchCode),
      {
        alignment: "center",
        rtl: false,
      },
    );
    // امضاکنندگان درخواست
    // قالب PDF فعلی حداکثر ۴ امضا را نمایش می‌دهد.
    const signatures = metadata.signatures ?? [];
    const maxSignatureCount = 4;

    signatures.slice(0, maxSignatureCount).forEach((signature, index) => {
      const fieldIndex = index + 1;

      // نام و نام خانوادگی
      setTextField(
        form,

        `page2_signatureFullName${fieldIndex}`,
        displayValue(signature.fullName),
        {
          alignment: "center",
          fontSize: 7,
        },
      );

      // نقش سازمانی: با پیشوند فارسی
      setTextField(
        form,

        `page2_signatureRoleName${fieldIndex}`,
        signature.roleName?.trim() ? `نقش: ${signature.roleName.trim()}` : "",
        {
          alignment: "center",
          fontSize: 7,
        },
      );

      // کد پرسنلی: به‌صورت رشته، بدون جداکننده‌ی هزارگان
      const personCode = displayPersianPlainNumberForPdf(signature.personCode);

      setTextField(
        form,

        `page2_signaturePersonCode${fieldIndex}`,
        personCode ? `کد پرسنلی: ${personCode}` : "",
        {
          alignment: "center",
          rtl: false,
          fontSize: 7,
        },
      );

      // تاریخ و زمان امضا:
      // خروجی isoToPersianDateTime شامل اعداد فارسی است؛
      // rtl را false نگذار تا ترتیب متن و تاریخ برعکس نشود.
      setTextField(
        form,

        `page2_signatureCreationTime${fieldIndex}`,
        signature.creationTime
          ? reverseNumericTokensForPdf(
              isoToPersianDateTimeForPdf(signature.creationTime),
            )
          : "",
        {
          alignment: "center",
          rtl: false,
          fontSize: 6.5,
        },
      );
    });

    if (signatures.length > maxSignatureCount) {
      console.warn(
        `تعداد امضاها ${signatures.length} مورد است، اما قالب PDF فقط ${maxSignatureCount} امضا را نمایش می‌دهد.`,
      );
    }

    // ==================== نهایی‌سازی ====================

    try {
      form.acroForm.dict.set(PDFName.of("NeedAppearances"), PDFBool.False);
    } catch (e) {
      console.warn("Could not set NeedAppearances to false", e);
    }

    form.updateFieldAppearances(persianFont);
    form.flatten({ updateFieldAppearances: false });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([new Uint8Array(pdfBytes)], {
      type: "application/pdf",
    });

    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("PDF generation error:", error);
    throw error;
  }
}
