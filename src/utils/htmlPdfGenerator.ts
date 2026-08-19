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

const numberFormatter = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 2,
});

function lookupTitle(
  items: LookupValueDto[] | null | undefined,
  code: string | null | undefined,
) {
  if (!code) return "";
  return (
    items?.find((item) => String(item.code) === String(code))?.title ?? code
  );
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "دارد" : "ندارد";
  if (typeof value === "number") return numberFormatter.format(value);
  if (Array.isArray(value)) return value.filter(Boolean).join("، ") || "—";
  return String(value);
}

function escapeHtml(value: unknown) {
  return displayValue(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replace(/\r?\n/g, "<br>");
}

function isNumericValue(value: unknown) {
  if (typeof value === "number") return true;
  if (typeof value !== "string") return false;
  return /^[\s+\-−0-9۰-۹٠-٩/٫٬,.-]+$/.test(value);
}

function valueHtml(value: unknown) {
  const content = escapeHtml(value);
  return isNumericValue(value)
    ? `<bdi class="numeric" dir="ltr">${content}</bdi>`
    : content;
}

function field(label: string, value: unknown, wide = false) {
  return `<div class="field${wide ? " wide" : ""}">
    <div class="label">${escapeHtml(label)}</div>
    <div class="value">${valueHtml(value)}</div>
  </div>`;
}

function section(title: string, content: string) {
  return `<section>
    <h2>${escapeHtml(title)}</h2>
    <div class="grid">${content}</div>
  </section>`;
}

function tableRow(
  title: string,
  area: unknown,
  unitPrice: unknown,
  totalPrice: unknown,
  total = false,
) {
  return `<tr class="${total ? "total" : ""}">
    <td>${escapeHtml(title)}</td>
    <td>${valueHtml(area)}</td>
    <td>${valueHtml(unitPrice)}</td>
    <td>${valueHtml(totalPrice)}</td>
  </tr>`;
}

function priceTable(data: PropertyAppraisalInputDto) {
  const rows: Array<[string, unknown, unknown, unknown]> = [
    ["عرصه کل", data.landArea, data.landUnitPrice, data.landTotalPrice],
    [
      "قدرالسهم",
      data.landShareArea,
      data.landShareUnitPrice,
      data.landShareTotalPrice,
    ],
    [
      "زیرزمین",
      data.basementArea,
      data.basementUnitPrice,
      data.basementTotalPrice,
    ],
    [
      "همکف",
      data.groundFloorArea,
      data.groundFloorUnitPrice,
      data.groundFloorTotalPrice,
    ],
    [
      "نیم‌طبقه",
      data.mezzanineArea,
      data.mezzanineUnitPrice,
      data.mezzanineTotalPrice,
    ],
    ["طبقه اول", data.floor1Area, data.floor1UnitPrice, data.floor1TotalPrice],
    ["طبقه دوم", data.floor2Area, data.floor2UnitPrice, data.floor2TotalPrice],
    ["طبقه سوم", data.floor3Area, data.floor3UnitPrice, data.floor3TotalPrice],
    [
      "طبقه چهارم",
      data.floor4Area,
      data.floor4UnitPrice,
      data.floor4TotalPrice,
    ],
    ["طبقه پنجم", data.floor5Area, data.floor5UnitPrice, data.floor5TotalPrice],
    [
      "سایر طبقات",
      data.otherFloorsArea,
      data.otherFloorsUnitPrice,
      data.otherFloorsTotalPrice,
    ],
    [
      "محوطه‌سازی",
      data.landscapingArea,
      data.landscapingUnitPrice,
      data.landscapingTotalPrice,
    ],
    [
      "تأسیسات",
      data.facilitiesArea,
      data.facilitiesUnitPrice,
      data.facilitiesTotalPrice,
    ],
  ];

  return `<table class="prices">
    <thead><tr><th>شرح</th><th>مساحت</th><th>بهای واحد</th><th>مبلغ کل</th></tr></thead>
    <tbody>
      ${rows.map((row) => tableRow(...row)).join("")}
      ${tableRow("جمع کل", data.totalArea, data.totalUnitPrice, data.totalPrice, true)}
      ${tableRow("تعدیل سرقفلی", "", "", data.goodwillAdjustment, true)}
      ${tableRow("مبلغ نهایی", "", "", data.finalPrice, true)}
    </tbody>
  </table>`;
}

function createReportHtml(
  data: PropertyAppraisalInputDto,
  lookups: PropertyAppraisalLookupsDto,
  metadata: AppraisalPdfMetadata,
) {
  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(`ارزیابی ملک - ${data.applicantName || "گزارش"}`)}</title>
<style>
@font-face{font-family:Vazirmatn;src:url("${fontDataUrl}") format("truetype");font-weight:400;font-style:normal}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#edf2f7;color:#17202a;font-family:Vazirmatn,Tahoma,Arial,sans-serif;font-size:11px;line-height:1.85}
.page{width:210mm;min-height:297mm;margin:10mm auto;padding:11mm;background:#fff;border:1px solid #d9e2ec;border-radius:12px;box-shadow:0 12px 32px rgba(29,55,82,.12)}
.header{overflow:hidden;border:1px solid #173b63;border-radius:10px;margin-bottom:14px;box-shadow:0 3px 10px rgba(23,59,99,.1)}
.header-title{background:linear-gradient(110deg,#173b63,#256b91);color:#fff;text-align:center;font-size:18px;font-weight:700;letter-spacing:.2px;padding:7px}
.meta{display:grid;grid-template-columns:repeat(3,1fr);gap:0;padding:7px 9px;background:#fbfdff}
.meta div{padding:2px 10px;border-left:1px solid #dbe4ed;color:#45586b}.meta div:last-child{border-left:0}
section{margin:0 0 14px;break-inside:avoid}
h2{font-size:13px;color:#173b63;background:linear-gradient(90deg,#edf6fc,#e3eff8);border-right:4px solid #2b82a8;border-radius:6px;padding:4px 10px;margin:0 0 6px;box-shadow:inset 0 -1px #d6e5f0}
.grid{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #ccd8e4;border-radius:7px;overflow:hidden}
.field{min-height:51px;border-left:1px solid #d8e1ea;border-bottom:1px solid #d8e1ea;padding:5px 8px;overflow-wrap:anywhere;background:#fff}
.field:nth-child(even){background:#fbfdff}.field.wide{grid-column:1/-1;min-height:58px}
.label{color:#607487;font-size:9px;margin-bottom:2px}.value{font-size:11px;white-space:normal;color:#172b3f}.numeric{direction:ltr;unicode-bidi:isolate;display:inline-block;letter-spacing:.1px}
table{width:100%;border-collapse:separate;border-spacing:0;table-layout:fixed;border:1px solid #b9c8d6;border-radius:7px;overflow:hidden}th,td{border-left:1px solid #c8d4df;border-bottom:1px solid #c8d4df;padding:4px 6px;text-align:center;overflow-wrap:anywhere}th:last-child,td:last-child{border-left:0}tr:last-child td{border-bottom:0}
th{background:linear-gradient(110deg,#173b63,#245e82);color:#fff;font-weight:400}td:first-child,th:first-child{width:30%;text-align:right;padding-right:10px}tbody tr:nth-child(even) td{background:#f8fbfd}.total td{background:#e7f2fa;color:#173b63;font-weight:700}
.signatures{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px;break-inside:avoid}.signature{height:78px;border:1px dashed #9fb1c2;border-radius:7px;text-align:center;padding-top:8px;color:#607487;background:#fbfdff}
@page{size:A4;margin:0} @media print{html,body{background:#fff}.page{width:auto;min-height:0;margin:0;border:0;border-radius:0;box-shadow:none;padding:9mm}.page+.page{break-before:page}}
@media screen{.page{min-height:297mm}}
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-title">گزارش ارزیابی ملک</div>
    <div class="meta">
      <div>شعبه: ${escapeHtml(data.branchName)}</div>
      <div>شماره درخواست: ${valueHtml(metadata.requestCode)}</div>
      <div>تاریخ: ${valueHtml(metadata.date)}</div>
    </div>
  </div>
  ${section(
    "مشخصات متقاضی و تسهیلات",
    [
      field("نام متقاضی", data.applicantName),
      field("نوع تسهیلات", data.loanType),
      field("میزان تسهیلات", data.loanAmount),
      field("نام مالک", data.ownerName),
      field("تلفن ملک", data.ownerPhone),
      field(
        "متصرف ملک",
        lookupTitle(lookups.propertyOccupiers, data.propertyOccupierCode),
      ),
      field("نشانی ملک", data.ownerAddress, true),
      field("توضیحات متصرف", data.propertyOccupierDescription, true),
    ].join(""),
  )}
  ${section(
    "اطلاعات ثبتی و سند",
    [
      field("شماره ملک", data.propertyNumber),
      field("مفروز و مجزی از", data.seperatedFrom),
      field("قطعه تفکیکی", data.separationPiece),
      field("شماره ثبت", data.registrationNumber),
      field("صفحه", data.page),
      field("شماره دفتر", data.officeNumber),
      field("بخش", data.part),
      field("شهر", data.city),
      field("سند قطعی مالکیت", data.hasDefinitiveOwnershipDocument),
      field(
        "نوع سند",
        lookupTitle(
          lookups.definitiveOwnershipDocumentTypes,
          data.definitiveOwnershipDocumentTypeCode,
        ),
      ),
      field("شماره ورقه مالکیت", data.titleDeedNumber),
      field("تعداد جلد/برگه", data.pageCount),
      field("تعداد دانگ", data.dong),
      field("کدپستی", data.postalCode),
    ].join(""),
  )}
  ${section(
    "مشخصات و کاربری ملک",
    [
      field("منطقه شهرداری", data.municipalArea),
      field("نوع ملک", data.propertyType),
      field("کاربری طبق پایان کار", data.useAccordingToTheCompletionOfTheWork),
      field(
        "نوع پایان کار",
        lookupTitle(
          lookups.typeOfWorkCompletions,
          data.typeOfWorkCompletionCode,
        ),
      ),
      field("نوع استفاده از ملک", data.typeOfUseOfTheProperty),
      field("تطابق مساحت با سند", data.hasMatchingTheAreaWithTheDocument),
      field(
        "نوع ملک وقفی",
        lookupTitle(
          lookups.typeOfEndowmentProperties,
          data.typeOfEndowmentPropertyCode,
        ),
      ),
      field("سایر توضیحات وقف", data.typeOfEndowmentPropertyIfOther),
      field(
        "موضوع ارزیابی",
        lookupTitle(lookups.evaluationTopics, data.evaluationTopicCode),
      ),
      field("توضیحات عدم تطابق", data.explanationInCaseOfDisagreement, true),
    ].join(""),
  )}
  ${section("جدول ارزیابی", priceTable(data))}
</div>
<div class="page">
  ${section(
    "مشخصات فنی ساختمان",
    [
      field("تعداد طبقات", data.totalFloors),
      field("تعداد واحدها به تفکیک کاربری", data.usageBreakdown, true),
      field(
        "نوع سازه",
        lookupTitle(lookups.structureTypes, data.structureTypeCode),
      ),
      field("سایر نوع سازه", data.structureTypeOther),
      field("نماسازی", data.facadeType),
      field("نحوه محاسبه قدمت بنا", data.buildingAgeCalculation),
      field("سیستم گرمایشی", data.heatingSystem),
      field("سیستم سرمایشی", data.coolingSystem),
    ].join(""),
  )}
  ${section(
    "انشعابات و مجوزها",
    [
      field("آب", data.hasWater),
      field("برق", data.hasElectricity),
      field("گاز", data.hasGas),
      field("تلفن", data.hasTelephone),
      field("اصلاحی شهرداری", data.hasMunicipalCorrection),
      field("مشخصات برق", data.electricityDetails),
      field("توضیحات خاص بر و کف", data.certificateDetails, true),
      field("توضیحات و سایر مشخصات", data.otherDetails, true),
    ].join(""),
  )}
  ${section(
    "وضعیت مالکیت و کیفیت ساختمان",
    [
      field("مالک در قید حیات است", data.isOwnerAlive),
      field(
        "وضعیت انحصار وراثت",
        lookupTitle(lookups.inheritanceStatuses, data.inheritanceStatusCode),
      ),
      field(
        "موقعیت شهری",
        lookupTitle(lookups.urbanLocationGrades, data.urbanLocationGradeCode),
      ),
      field(
        "آسیب‌پذیری بلایای طبیعی",
        lookupTitle(
          lookups.disasterVulnerabilities,
          data.disasterVulnerabilityCode,
        ),
      ),
      field(
        "کیفیت ساخت و مصالح",
        lookupTitle(
          lookups.constructionQualities,
          data.constructionQualityCode,
        ),
      ),
    ].join(""),
  )}
  ${section(
    "امکانات و مشاعات",
    [
      field("پارکینگ", data.hasParking),
      field("پارکینگ مشاعی", data.hasSharedParking),
      field("تعداد پارکینگ", data.parkingCount),
      field("انباری", data.hasStorage),
      field("تعداد انباری", data.storageCount),
      field("مساحت انباری", data.storageArea),
      field("آسانسور", data.hasElevator),
      field("تعداد آسانسور", data.elevatorCount),
      field("امتیازات مشاعی یا اختصاصی دیگر", data.otherPrivileges, true),
    ].join(""),
  )}
  ${section(
    "اسناد و تعهدات",
    [
      field("دارای گواهی", data.hasCertificate),
      field(
        "نوع گواهی",
        lookupTitle(lookups.buildingCertificates, data.certificateTypeCode),
      ),
      field("شماره گواهی", data.certificateNumber),
      field("تاریخ گواهی", data.certificateDate),
      field("در رهن یا بازداشت", data.isMortgagedOrSeized),
      field("ذی‌نفع رهن یا بازداشت", data.mortgageBeneficiary, true),
    ].join(""),
  )}
  ${section(
    "منافع و اجاره",
    [
      field("منافع به غیر واگذار شده", data.hasTransferredBenefits),
      field("توضیحات واگذاری منافع", data.benefitsTransferDescription, true),
      field("در اختیار مستأجر", data.isOccupiedByTenant),
      field("پیش‌پرداخت اجاره", data.rentalAdvancePayment),
      field("اجاره ماهیانه", data.monthlyRent),
      field(
        "نوع اجاره‌نامه",
        lookupTitle(lookups.leaseTypes, data.leaseTypeCode),
      ),
      field("کد رهگیری اجاره", data.leaseTrackingCode),
      field("شماره اجاره‌نامه", data.leaseNumber),
      field("تاریخ اجاره‌نامه", data.leaseDate),
    ].join(""),
  )}
  ${section(
    "مغازه و وضعیت فروش",
    [
      field("دارای مغازه", data.hasShop),
      field("تعداد مغازه", data.shopCount),
      field("متصرف مغازه", data.shopOccupier),
      field("نوع کسب", data.shopBusinessType),
      field("سهل‌البیع", data.isReadilyMarketable),
      field("توضیحات وضعیت فروش", data.marketabilityNotes, true),
      field(
        "مبنای قیمت‌گذاری",
        lookupTitle(
          lookups.valuationPriceBasises,
          data.valuationPriceBasisCode,
        ),
      ),
      field("تخلف مشهود", data.hasVisibleViolation),
      field("توضیحات تخلف", data.visibleViolationDescription, true),
      field("توضیحات تکمیلی وثیقه", data.additionalCollateralDescription, true),
    ].join(""),
  )}
  ${section(
    "جمع‌بندی ارزیابی",
    [
      field("مبلغ نهایی", data.finalPrice),
      field("مبلغ نهایی به حروف", data.finalPriceInWords, true),
      field("نام شعبه", data.branchName),
      field("کد شعبه", data.branchCode),
    ].join(""),
  )}
  <div class="signatures"><div class="signature">مهر و امضای ارزیاب</div><div class="signature">مهر و امضای شعبه</div></div>
</div>
</body>
</html>`;
}

export async function generateAppraisalHtmlPDF(
  data: PropertyAppraisalInputDto,
  lookups: PropertyAppraisalLookupsDto,
  metadata: AppraisalPdfMetadata = {},
) {
  // استفاده از iframe به جای window.open
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error("امکان ایجاد پنجره چاپ وجود ندارد.");
  }

  iframeDoc.open();
  iframeDoc.write(createReportHtml(data, lookups, metadata));
  iframeDoc.close();

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      document.body.removeChild(iframe);
      reject(new Error("خطا در چاپ PDF"));
    }, 30000);

    const print = () => {
      iframe.contentWindow?.addEventListener(
        "afterprint",
        () => {
          clearTimeout(timeout);
          document.body.removeChild(iframe);
          resolve();
        },
        { once: true },
      );

      try {
        iframe.contentWindow?.print();
      } catch (error) {
        clearTimeout(timeout);
        document.body.removeChild(iframe);
        reject(error);
      }
    };

    if (iframeDoc.fonts?.ready) {
      void iframeDoc.fonts.ready.then(print);
    } else {
      print();
    }
  });
}
