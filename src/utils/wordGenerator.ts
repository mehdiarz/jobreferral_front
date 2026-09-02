import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

import type {
  PropertyAppraisalInputDto,
  PropertyAppraisalLookupsDto,
} from "../services/PropertyAppraisalCrud/types";
import type { RequestSignatureOutputDto } from "../services/RequestSignatureCrud/types";
import { isoToPersianDateTimeForPdf } from "./persianToISO";

const DOCX_PATH = `${import.meta.env.BASE_URL}templates/appraisal-template.docx`;

// ==================== سمبل‌های چک‌باکس ====================

export const CHECK_SYMBOLS = {
  CHECKED: "☑",
  UNCHECKED: "☐",
} as const;

// کاراکتر جایگزین برای فیلدهای خالی
const EMPTY_PLACEHOLDER = "..........";

// تابع کمکی برای چک‌باکس تکی بر اساس Boolean
function displayCheckbox(value: boolean | null | undefined): string {
  return value === true ? CHECK_SYMBOLS.CHECKED : CHECK_SYMBOLS.UNCHECKED;
}

// تابع کمکی برای چک‌باکس‌های چندگزینه‌ای
function getCodedCheckboxes(
  baseFieldName: string,
  maxOptions: number,
  selectedCode: string | number | null | undefined,
): Record<string, string> {
  const result: Record<string, string> = {};
  const codeStr = String(selectedCode ?? "");

  for (let i = 1; i <= maxOptions; i++) {
    result[`${baseFieldName}${i}`] =
      String(i) === codeStr ? CHECK_SYMBOLS.CHECKED : CHECK_SYMBOLS.UNCHECKED;
  }
  return result;
}

// ==================== توابع کمکی برای Word ====================

function toPersianDigits(value: string | number): string {
  if (value === null || value === undefined) return "";

  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  return String(value)
    .replace(/\d/g, (digit) => persianDigits[Number(digit)])
    .replace(/٫/g, ".")
    .replace(/٬/g, ",");
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return EMPTY_PLACEHOLDER;
  }

  if (typeof value === "boolean") return value ? "دارد" : "ندارد";

  if (typeof value === "number") {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
      useGrouping: true,
    }).format(value);
  }

  return String(value);
}

function displayPersianNumber(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return EMPTY_PLACEHOLDER;
  }

  const formattedValue = displayValue(value);
  return toPersianDigits(formattedValue);
}

function displayPersianPlainNumber(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return EMPTY_PLACEHOLDER;
  }

  const plainValue = String(value).trim();
  return toPersianDigits(plainValue);
}

function normalizePersianText(value: string): string {
  if (value === EMPTY_PLACEHOLDER) return EMPTY_PLACEHOLDER;

  const normalized = value
    .normalize("NFC")
    .replace(/ي/g, "ی")
    .replace(/ى/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .replace(/\u200C/g, " ")
    .replace(/\u200D/g, "")
    .replace(/\uFEFF/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();

  return toPersianDigits(normalized);
}

function formatPersianDateTime(isoDateTime: string): string {
  if (!isoDateTime) return EMPTY_PLACEHOLDER;

  try {
    const persianDate = isoToPersianDateTimeForPdf(isoDateTime);
    return toPersianDigits(persianDate);
  } catch (error) {
    console.warn("Error formatting date:", error);
    return EMPTY_PLACEHOLDER;
  }
}

// ==================== تابع کمکی برای ساخت داده‌های docx ====================

function buildDocData(
  data: PropertyAppraisalInputDto,
  metadata: {
    requestCode?: string | null;
    date?: string | null;
    signatures?: RequestSignatureOutputDto[];
  },
) {
  // آماده‌سازی داده‌های امضا
  const rawSignatures = metadata.signatures ?? [];

  const signatures =
    rawSignatures.length > 0
      ? rawSignatures.map((sig) => ({
          fullName: sig?.fullName
            ? normalizePersianText(displayValue(sig.fullName))
            : EMPTY_PLACEHOLDER,
          roleName: sig?.roleName
            ? normalizePersianText(displayValue(sig.roleName))
            : EMPTY_PLACEHOLDER,
          personCode: sig?.personCode
            ? displayPersianPlainNumber(sig.personCode)
            : EMPTY_PLACEHOLDER,
          creationTime: sig?.creationTime
            ? formatPersianDateTime(sig.creationTime)
            : EMPTY_PLACEHOLDER,
        }))
      : [
          {
            fullName: EMPTY_PLACEHOLDER,
            roleName: EMPTY_PLACEHOLDER,
            personCode: EMPTY_PLACEHOLDER,
            creationTime: EMPTY_PLACEHOLDER,
          },
        ];

  // آماده‌سازی داده‌های اصلی فرم
  return {
    // ===== اطلاعات متقاضی =====
    applicantName: normalizePersianText(displayValue(data.applicantName)),
    ownerName: normalizePersianText(displayValue(data.ownerName)),
    ownerPhone: displayPersianNumber(data.ownerPhone),
    ownerAddress: normalizePersianText(displayValue(data.ownerAddress)),
    loanType: normalizePersianText(displayValue(data.loanType)),
    loanAmount: displayPersianNumber(data.loanAmount),
    propertyOccupierDescription: normalizePersianText(
      displayValue(data.propertyOccupierDescription),
    ),

    // چک‌باکس‌های متصرف
    ...getCodedCheckboxes("propertyOccupierCode", 5, data.propertyOccupierCode),

    // ===== اطلاعات ثبتی =====
    propertyNumber: displayPersianNumber(data.propertyNumber),
    seperatedFrom: normalizePersianText(displayValue(data.seperatedFrom)),
    separationPiece: displayPersianNumber(data.separationPiece),
    registrationNumber: displayPersianNumber(data.registrationNumber),
    page: displayPersianPlainNumber(data.page),
    officeNumber: displayPersianPlainNumber(data.officeNumber),
    part: normalizePersianText(displayValue(data.part)),
    city: normalizePersianText(displayValue(data.city)),
    titleDeedNumber: displayPersianNumber(data.titleDeedNumber),
    pageCount: displayPersianPlainNumber(data.pageCount),
    dong: displayPersianPlainNumber(data.dong),
    postalCode: displayPersianPlainNumber(data.postalCode),

    // ===== سند مالکیت =====
    hasDefinitiveOwnershipDocument: displayCheckbox(
      data.hasDefinitiveOwnershipDocument === true,
    ),
    noDefinitiveOwnershipDocument: displayCheckbox(
      data.hasDefinitiveOwnershipDocument === false,
    ),

    ...getCodedCheckboxes(
      "definitiveOwnershipDocumentTypeCode",
      6,
      data.definitiveOwnershipDocumentTypeCode,
    ),

    // ===== مشخصات ملک =====
    municipalArea: normalizePersianText(displayValue(data.municipalArea)),
    propertyType: normalizePersianText(displayValue(data.propertyType)),
    useAccordingToTheCompletionOfTheWork: normalizePersianText(
      displayValue(data.useAccordingToTheCompletionOfTheWork),
    ),
    typeOfUseOfTheProperty: normalizePersianText(
      displayValue(data.typeOfUseOfTheProperty),
    ),
    typeOfEndowmentPropertyIfOther: normalizePersianText(
      displayValue(data.typeOfEndowmentPropertyIfOther),
    ),
    explanationInCaseOfDisagreement: normalizePersianText(
      displayValue(data.explanationInCaseOfDisagreement),
    ),

    // تطابق مساحت
    hasMatchingTheAreaWithTheDocument: displayCheckbox(
      data.hasMatchingTheAreaWithTheDocument === true,
    ),
    noMatchingTheAreaWithTheDocument: displayCheckbox(
      data.hasMatchingTheAreaWithTheDocument === false,
    ),

    ...getCodedCheckboxes(
      "typeOfWorkCompletionCode",
      2,
      data.typeOfWorkCompletionCode,
    ),

    ...getCodedCheckboxes(
      "typeOfEndowmentPropertyCode",
      2,
      data.typeOfEndowmentPropertyCode,
    ),

    ...getCodedCheckboxes("evaluationTopicCode", 4, data.evaluationTopicCode),

    // ===== جدول ارزیابی =====
    landArea: displayPersianNumber(data.landArea),
    landUnitPrice: displayPersianNumber(data.landUnitPrice),
    landTotalPrice: displayPersianNumber(data.landTotalPrice),
    landShareArea: displayPersianNumber(data.landShareArea),
    landShareUnitPrice: displayPersianNumber(data.landShareUnitPrice),
    landShareTotalPrice: displayPersianNumber(data.landShareTotalPrice),
    basementArea: displayPersianNumber(data.basementArea),
    basementUnitPrice: displayPersianNumber(data.basementUnitPrice),
    basementTotalPrice: displayPersianNumber(data.basementTotalPrice),
    groundFloorArea: displayPersianNumber(data.groundFloorArea),
    groundFloorUnitPrice: displayPersianNumber(data.groundFloorUnitPrice),
    groundFloorTotalPrice: displayPersianNumber(data.groundFloorTotalPrice),
    mezzanineArea: displayPersianNumber(data.mezzanineArea),
    mezzanineUnitPrice: displayPersianNumber(data.mezzanineUnitPrice),
    mezzanineTotalPrice: displayPersianNumber(data.mezzanineTotalPrice),
    floor1Area: displayPersianNumber(data.floor1Area),
    floor1UnitPrice: displayPersianNumber(data.floor1UnitPrice),
    floor1TotalPrice: displayPersianNumber(data.floor1TotalPrice),
    floor2Area: displayPersianNumber(data.floor2Area),
    floor2UnitPrice: displayPersianNumber(data.floor2UnitPrice),
    floor2TotalPrice: displayPersianNumber(data.floor2TotalPrice),
    floor3Area: displayPersianNumber(data.floor3Area),
    floor3UnitPrice: displayPersianNumber(data.floor3UnitPrice),
    floor3TotalPrice: displayPersianNumber(data.floor3TotalPrice),
    floor4Area: displayPersianNumber(data.floor4Area),
    floor4UnitPrice: displayPersianNumber(data.floor4UnitPrice),
    floor4TotalPrice: displayPersianNumber(data.floor4TotalPrice),
    floor5Area: displayPersianNumber(data.floor5Area),
    floor5UnitPrice: displayPersianNumber(data.floor5UnitPrice),
    floor5TotalPrice: displayPersianNumber(data.floor5TotalPrice),
    otherFloorsArea: displayPersianNumber(data.otherFloorsArea),
    otherFloorsUnitPrice: displayPersianNumber(data.otherFloorsUnitPrice),
    otherFloorsTotalPrice: displayPersianNumber(data.otherFloorsTotalPrice),
    landscapingArea: displayPersianNumber(data.landscapingArea),
    landscapingUnitPrice: displayPersianNumber(data.landscapingUnitPrice),
    landscapingTotalPrice: displayPersianNumber(data.landscapingTotalPrice),
    facilitiesArea: displayPersianNumber(data.facilitiesArea),
    facilitiesUnitPrice: displayPersianNumber(data.facilitiesUnitPrice),
    facilitiesTotalPrice: displayPersianNumber(data.facilitiesTotalPrice),
    totalArea: displayPersianNumber(data.totalArea),
    totalUnitPrice: displayPersianNumber(data.totalUnitPrice),
    totalPrice: displayPersianNumber(data.totalPrice),
    goodwillAdjustment: displayPersianNumber(data.goodwillAdjustment),
    finalPrice: displayPersianNumber(data.finalPrice),
    finalPriceInWords: normalizePersianText(
      displayValue(data.finalPriceInWords),
    ),

    // ===== مشخصات فنی =====
    totalFloors: displayPersianPlainNumber(data.totalFloors),
    usageBreakdown: normalizePersianText(displayValue(data.usageBreakdown)),
    structureTypeOther: normalizePersianText(
      displayValue(data.structureTypeOther),
    ),
    facadeType: normalizePersianText(displayValue(data.facadeType)),
    buildingAgeCalculation: normalizePersianText(
      displayValue(data.buildingAgeCalculation),
    ),
    heatingSystem: normalizePersianText(displayValue(data.heatingSystem)),
    coolingSystem: normalizePersianText(displayValue(data.coolingSystem)),

    ...getCodedCheckboxes("structureTypeCode", 2, data.structureTypeCode),

    // ===== انشعابات =====
    hasWater: displayCheckbox(data.hasWater),
    hasElectricity: displayCheckbox(data.hasElectricity),
    hasGas: displayCheckbox(data.hasGas),
    hasTelephone: displayCheckbox(data.hasTelephone),

    hasMunicipalCorrection: displayCheckbox(
      data.hasMunicipalCorrection === true,
    ),
    noMunicipalCorrection: displayCheckbox(
      data.hasMunicipalCorrection === false,
    ),

    electricityDetails: normalizePersianText(
      displayValue(data.electricityDetails),
    ),
    certificateDetails: normalizePersianText(
      displayValue(data.certificateDetails),
    ),
    otherDetails: normalizePersianText(displayValue(data.otherDetails)),

    // ===== صفحه ۲ =====
    isOwnerAlive: displayCheckbox(data.isOwnerAlive),

    ...getCodedCheckboxes(
      "inheritanceStatusCode",
      2,
      data.inheritanceStatusCode,
    ),

    ...getCodedCheckboxes(
      "urbanLocationGradeCode",
      4,
      data.urbanLocationGradeCode,
    ),

    ...getCodedCheckboxes(
      "disasterVulnerabilityCode",
      3,
      data.disasterVulnerabilityCode,
    ),

    ...getCodedCheckboxes(
      "constructionQualityCode",
      4,
      data.constructionQualityCode,
    ),

    // ===== امکانات =====
    hasParking: displayCheckbox(data.hasParking),
    hasSharedParking: displayCheckbox(data.hasSharedParking),
    hasStorage: displayCheckbox(data.hasStorage),
    hasElevator: displayCheckbox(data.hasElevator),
    parkingCount: displayPersianPlainNumber(data.parkingCount),
    storageCount: displayPersianPlainNumber(data.storageCount),
    storageArea: displayPersianNumber(data.storageArea),
    elevatorCount: displayPersianPlainNumber(data.elevatorCount),
    otherPrivileges: normalizePersianText(displayValue(data.otherPrivileges)),

    // ===== اسناد =====
    hasCertificate: displayCheckbox(data.hasCertificate === true),
    noCertificate: displayCheckbox(data.hasCertificate === false),

    ...getCodedCheckboxes("certificateTypeCode", 3, data.certificateTypeCode),

    certificateNumber: displayPersianNumber(data.certificateNumber),
    certificateDate: normalizePersianText(displayValue(data.certificateDate)),

    // ===== رهن =====
    isMortgagedOrSeized: displayCheckbox(data.isMortgagedOrSeized === true),
    noMortgagedOrSeized: displayCheckbox(data.isMortgagedOrSeized === false),
    mortgageBeneficiary: normalizePersianText(
      displayValue(data.mortgageBeneficiary),
    ),

    // ===== منافع =====
    hasTransferredBenefits: displayCheckbox(
      data.hasTransferredBenefits === true,
    ),
    noTransferredBenefits: displayCheckbox(
      data.hasTransferredBenefits === false,
    ),
    benefitsTransferDescription: normalizePersianText(
      displayValue(data.benefitsTransferDescription),
    ),

    // ===== مستأجر =====
    isOccupiedByTenant: displayCheckbox(data.isOccupiedByTenant === true),
    noOccupiedByTenant: displayCheckbox(data.isOccupiedByTenant === false),
    rentalAdvancePayment: displayPersianNumber(data.rentalAdvancePayment),
    monthlyRent: displayPersianNumber(data.monthlyRent),

    ...getCodedCheckboxes("leaseTypeCode", 2, data.leaseTypeCode),

    leaseTrackingCode: displayPersianNumber(data.leaseTrackingCode),
    leaseNumber: displayPersianNumber(data.leaseNumber),
    leaseDate: normalizePersianText(displayValue(data.leaseDate)),

    // ===== مغازه =====
    hasShop: displayCheckbox(data.hasShop === true),
    noShop: displayCheckbox(data.hasShop === false),
    shopCount: displayPersianPlainNumber(data.shopCount),
    shopOccupier: normalizePersianText(displayValue(data.shopOccupier)),
    shopBusinessType: normalizePersianText(displayValue(data.shopBusinessType)),

    // ===== سهل‌البیع =====
    isReadilyMarketable: displayCheckbox(data.isReadilyMarketable === true),
    noReadilyMarketable: displayCheckbox(data.isReadilyMarketable === false),
    marketabilityNotes: normalizePersianText(
      displayValue(data.marketabilityNotes),
    ),

    ...getCodedCheckboxes(
      "valuationPriceBasisCode",
      3,
      data.valuationPriceBasisCode,
    ),

    // ===== تخلف =====
    hasVisibleViolation: displayCheckbox(data.hasVisibleViolation === true),
    noVisibleViolation: displayCheckbox(data.hasVisibleViolation === false),
    visibleViolationDescription: normalizePersianText(
      displayValue(data.visibleViolationDescription),
    ),
    additionalCollateralDescription: normalizePersianText(
      displayValue(data.additionalCollateralDescription),
    ),

    // ===== جمع‌بندی =====
    branchName: normalizePersianText(displayValue(data.branchName)),
    branchCode: displayPersianNumber(data.branchCode),

    // ===== داده‌های متادیتا =====
    requestCode: metadata.requestCode
      ? displayPersianPlainNumber(metadata.requestCode)
      : EMPTY_PLACEHOLDER,
    currentDate: metadata.date
      ? formatPersianDateTime(metadata.date)
      : EMPTY_PLACEHOLDER,

    // ===== لیست داینامیک امضاها =====
    signatures,
  };
}

// ==================== تابع جدید: تولید Blob بدون دانلود ====================

export async function createBlobAppraisalDocx(
  data: PropertyAppraisalInputDto,
  lookups: PropertyAppraisalLookupsDto,
  metadata: {
    requestCode?: string | null;
    date?: string | null;
    signatures?: RequestSignatureOutputDto[];
  } = {},
): Promise<Blob> {
  try {
    void lookups;

    // ۱. دریافت فایل قالب
    const response = await fetch(DOCX_PATH, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(
        `فایل پیدا نشد: ${DOCX_PATH} - Status: ${response.status}`,
      );
    }
    const content = await response.arrayBuffer();

    // ۲. آماده‌سازی Docxtemplater
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => EMPTY_PLACEHOLDER,
    });

    // ۳. آماده‌سازی داده‌ها
    const docData = buildDocData(data, metadata);

    // ۴. جایگذاری داده‌ها
    doc.render(docData);

    // ۵. تولید فایل به صورت Blob
    const docxBlob = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    return docxBlob;
  } catch (error) {
    console.error("Error generating docx:", error);
    throw error;
  }
}

// ==================== تابع اصلی (نسخه قبلی با دانلود) ====================

export async function generateAppraisalDocx(
  data: PropertyAppraisalInputDto,
  lookups: PropertyAppraisalLookupsDto,
  metadata: {
    requestCode?: string | null;
    date?: string | null;
    signatures?: RequestSignatureOutputDto[];
  } = {},
): Promise<void> {
  try {
    const docxBlob = await createBlobAppraisalDocx(data, lookups, metadata);

    // دانلود فایل
    saveAs(docxBlob, `AppraisalReport_${data.applicantName || "Report"}.docx`);
  } catch (error) {
    console.error("Error generating docx:", error);
    throw error;
  }
}
