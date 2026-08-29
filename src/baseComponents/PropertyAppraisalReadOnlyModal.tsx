import { CheckboxField } from "./PropertyAppraisalFormComponents";
import Modal from "./Modal";
import FormButton from "./FormButton";
import type {
  PropertyAppraisalOutputDto,
  PropertyAppraisalLookupsDto,
  LookupValueDto,
} from "../services/PropertyAppraisalCrud/types";
import type { RequestSignatureOutputDto } from "../services/RequestSignatureCrud/types";
import { isoToPersianDateTime } from "../utils/persianToISO.tsx";

// ─── Styles ──────────────────────────────────────────────────────
const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all";

const labelClass = "mb-1 block text-xs font-medium text-gray-600";

const sectionClass = "bg-gray-50 p-4 rounded-xl space-y-4";

const sectionTitleClass =
  "font-bold text-sm text-blue-700 border-r-4 border-blue-700 pr-2";

// ─── Formatters ──────────────────────────────────────────────────
const formatNumber = (val?: string | number | null) => {
  if (val === undefined || val === null || val === "") return "";
  const clean = String(val).replace(/[^0-9]/g, "");
  if (!clean) return "";
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

function toOptions(items?: LookupValueDto[] | null) {
  return (items ?? []).map((item) => ({
    value: item.code,
    label: item.title,
  }));
}

export default function PropertyAppraisalReadOnlyModal({
  isOpen,
  appraisal,
  lookups,
  signatures = [],
  onClose,
  isGeneratingPdf = false,
  onGeneratePdf,
}: {
  isOpen: boolean;
  appraisal: PropertyAppraisalOutputDto | null;
  lookups: PropertyAppraisalLookupsDto;
  signatures?: RequestSignatureOutputDto[];
  isGeneratingPdf?: boolean;
  onGeneratePdf?: () => void;
  onClose: () => void;
}) {
  if (!appraisal) return null;

  const renderField = (
    label: string,
    field: keyof PropertyAppraisalOutputDto,
    type: "text" | "number" = "text",
    span:
      | "col-span-1"
      | "md:col-span-2"
      | "md:col-span-3"
      | "md:col-span-4" = "col-span-1",
  ) => (
    <div className={span}>
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        className={inputClass}
        readOnly
        value={String(appraisal[field] ?? "")}
      />
    </div>
  );

  const renderCurrencyField = (
    label: string,
    field: keyof PropertyAppraisalOutputDto,
    span:
      | "col-span-1"
      | "md:col-span-2"
      | "md:col-span-3"
      | "md:col-span-4" = "col-span-1",
  ) => (
    <div className={span}>
      <label className={labelClass}>{`${label} (ریال)`}</label>
      <input
        type="text"
        className={inputClass}
        readOnly
        value={formatNumber(appraisal[field] as string | number)}
      />
    </div>
  );

  const renderSelect = (
    label: string,
    field: keyof PropertyAppraisalOutputDto,
    options: { value: string; label: string }[],
    span:
      | "col-span-1"
      | "md:col-span-2"
      | "md:col-span-3"
      | "md:col-span-4" = "col-span-1",
  ) => (
    <div className={span}>
      <label className={labelClass}>{label}</label>
      <select
        className={`${inputClass} disabled:cursor-default disabled:opacity-100`}
        disabled
        value={String(appraisal[field] ?? "")}
      >
        <option value="">انتخاب کنید...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  const renderTextarea = (
    label: string,
    field: keyof PropertyAppraisalOutputDto,
    rows = 2,
    span:
      | "col-span-1"
      | "md:col-span-2"
      | "md:col-span-3"
      | "md:col-span-4" = "md:col-span-2",
  ) => (
    <div className={span}>
      <label className={labelClass}>{label}</label>
      <textarea
        className={inputClass}
        rows={rows}
        readOnly
        value={String(appraisal[field] ?? "")}
      />
    </div>
  );

  const renderSelectBoolean = (
    label: string,
    field: keyof PropertyAppraisalOutputDto,
  ) => (
    <div>
      <label className={labelClass}>{label}</label>
      <select
        className={`${inputClass} disabled:cursor-default disabled:opacity-100`}
        disabled
        value={
          appraisal[field] === true
            ? "true"
            : appraisal[field] === false
              ? "false"
              : ""
        }
      >
        <option value="">انتخاب کنید...</option>
        <option value="true">دارد</option>
        <option value="false">ندارد</option>
      </select>
    </div>
  );

  const renderCheckbox = (
    label: string,
    field: keyof PropertyAppraisalOutputDto,
  ) => (
    <CheckboxField
      label={label}
      checked={Boolean(appraisal[field])}
      disabled
      onChange={() => {}}
    />
  );

  const renderPriceRow = (
    title: string,
    areaField: keyof PropertyAppraisalOutputDto,
    unitPriceField: keyof PropertyAppraisalOutputDto,
    totalPriceField: keyof PropertyAppraisalOutputDto,
  ) => (
    <div className="border border-gray-200 rounded-lg p-3">
      <p className="text-xs font-bold text-gray-700 mb-2">{title}</p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>مساحت</label>
          <input
            type="number"
            className={inputClass}
            readOnly
            value={String(appraisal[areaField] ?? "")}
          />
        </div>
        <div>
          <label className={labelClass}>بهای واحد (ریال)</label>
          <input
            type="text"
            className={inputClass}
            readOnly
            value={formatNumber(appraisal[unitPriceField] as string | number)}
          />
        </div>
        <div>
          <label className={labelClass}>مبلغ کل (ریال)</label>
          <input
            type="text"
            className={inputClass}
            readOnly
            value={formatNumber(appraisal[totalPriceField] as string | number)}
          />
        </div>
      </div>
    </div>
  );

  const renderSignatureRow = (signature: RequestSignatureOutputDto) => (
    <div
      key={signature.id}
      className="grid grid-cols-4 gap-3 border-b border-gray-200 pb-3 last:border-b-0 last:pb-0"
    >
      <div>
        <label className={labelClass}>نام و نام خانوادگی</label>
        <input
          type="text"
          className={`${inputClass} bg-gray-100`}
          readOnly
          value={signature.fullName ?? ""}
        />
      </div>
      <div>
        <label className={labelClass}>کد پرسنلی</label>
        <input
          type="text"
          className={`${inputClass} bg-gray-100`}
          readOnly
          value={String(signature.personCode ?? "")}
        />
      </div>
      <div>
        <label className={labelClass}>نقش سازمانی</label>
        <input
          type="text"
          className={`${inputClass} bg-gray-100`}
          readOnly
          value={String(signature.roleName ?? "")}
        />
      </div>
      <div>
        <label className={labelClass}>تاریخ و زمان امضا</label>
        <input
          type="text"
          className={`${inputClass} bg-gray-100`}
          dir="ltr"
          readOnly
          value={
            signature.creationTime
              ? isoToPersianDateTime(signature.creationTime)
              : ""
          }
        />
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      isRTL
      header="فرم ارزیابی ملک"
      onClose={onClose}
      className="min-w-[1100px]"
      overlayLock={false}
      footerButtons={
        <div className="flex gap-2">
          {onGeneratePdf && (
            <FormButton
              title="دانلود PDF"
              variant="secondary"
              onClick={onGeneratePdf}
              isLoading={isGeneratingPdf}
              disabled={isGeneratingPdf}
            />
          )}
        </div>
      }
      renderContent={() => (
        <div
          className="space-y-6 text-right max-h-[70vh] overflow-y-auto px-1"
          dir="rtl"
        >
          {/* ── بخش ۱: مشخصات ملک و متقاضی ── */}
          <div className={sectionClass}>
            <h4 className={sectionTitleClass}>مشخصات ملک و متقاضی</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderField("نام متقاضی", "applicantName")}
              {renderField("نوع تسهیلات", "loanType")}
              {renderCurrencyField("میزان تسهیلات", "loanAmount")}
              {renderField("نام مالک", "ownerName")}
              {renderField(
                "نشانی ملک",
                "ownerAddress",
                "text",
                "md:col-span-2",
              )}
              {renderSelect(
                "متصرف ملک",
                "propertyOccupierCode",
                toOptions(lookups.propertyOccupiers),
              )}
              {renderTextarea(
                "توضیحات متصرف",
                "propertyOccupierDescription",
                2,
                "md:col-span-2",
              )}
            </div>
          </div>

          {/* ── بخش ۲: اطلاعات ثبتی ── */}
          <div className={sectionClass}>
            <h4 className={sectionTitleClass}>اطلاعات ثبتی و سند</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {renderField("شماره ملک", "propertyNumber")}
              {renderField("مفروز و مجزی از", "seperatedFrom")}
              {renderField("قطعه تفکیکی", "separationPiece")}
              {renderField("شماره ثبت", "registrationNumber")}
              {renderField("صفحه", "page")}
              {renderField("شماره دفتر", "officeNumber")}
              {renderField("بخش", "part")}
              {renderField("شهر", "city")}
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderSelectBoolean(
                  "پلاک فوق سند قطعی مالکیت",
                  "hasDefinitiveOwnershipDocument",
                )}
                {renderField("شماره ورقه مالکیت", "titleDeedNumber")}
                {renderField("کدپستی", "postalCode")}
              </div>

              {appraisal.hasDefinitiveOwnershipDocument === true && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-dashed pt-4">
                  {renderSelect(
                    "نوع سند",
                    "definitiveOwnershipDocumentTypeCode",
                    toOptions(lookups.definitiveOwnershipDocumentTypes),
                  )}
                  {renderField("تعداد جلد/برگه", "pageCount", "number")}
                  {renderField("تعداد دانگ", "dong", "number")}
                </div>
              )}
            </div>
          </div>

          {/* ── بخش ۳: مشخصات ملک و کاربری ── */}
          <div className={sectionClass}>
            <h4 className={sectionTitleClass}>مشخصات ملک و کاربری</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderField("منطقه شهرداری", "municipalArea")}
              {renderField("تلفن ملک", "ownerPhone")}
              {renderField("نوع ملک", "propertyType")}
              {renderField(
                "کاربری طبق پایان کار",
                "useAccordingToTheCompletionOfTheWork",
              )}
              {renderSelect(
                "نوع پایان کار",
                "typeOfWorkCompletionCode",
                toOptions(lookups.typeOfWorkCompletions),
              )}
              {renderField("نوع استفاده از ملک", "typeOfUseOfTheProperty")}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
              {renderSelectBoolean(
                "مطابقت مساحت با سند",
                "hasMatchingTheAreaWithTheDocument",
              )}
              {appraisal.hasMatchingTheAreaWithTheDocument === false &&
                renderTextarea(
                  "توضیحات عدم مطابقت",
                  "explanationInCaseOfDisagreement",
                  3,
                  "md:col-span-2",
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
              {renderSelect(
                "نوع ملک وقفی",
                "typeOfEndowmentPropertyCode",
                toOptions(lookups.typeOfEndowmentProperties),
              )}
              {renderField("سایر (وقفی)", "typeOfEndowmentPropertyIfOther")}
              {renderSelect(
                "موضوع ارزیابی",
                "evaluationTopicCode",
                toOptions(lookups.evaluationTopics),
              )}
            </div>
          </div>

          {/* ── بخش ۴: جدول ارزیابی ── */}
          <div className={sectionClass}>
            <h4 className={sectionTitleClass}>جدول ارزیابی</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderPriceRow(
                "عرصه کل",
                "landArea",
                "landUnitPrice",
                "landTotalPrice",
              )}
              {renderPriceRow(
                "قدرالسهم",
                "landShareArea",
                "landShareUnitPrice",
                "landShareTotalPrice",
              )}
              {renderPriceRow(
                "زیرزمین",
                "basementArea",
                "basementUnitPrice",
                "basementTotalPrice",
              )}
              {renderPriceRow(
                "همکف",
                "groundFloorArea",
                "groundFloorUnitPrice",
                "groundFloorTotalPrice",
              )}
              {renderPriceRow(
                "نیم‌طبقه",
                "mezzanineArea",
                "mezzanineUnitPrice",
                "mezzanineTotalPrice",
              )}
              {renderPriceRow(
                "طبقه اول",
                "floor1Area",
                "floor1UnitPrice",
                "floor1TotalPrice",
              )}
              {renderPriceRow(
                "طبقه دوم",
                "floor2Area",
                "floor2UnitPrice",
                "floor2TotalPrice",
              )}
              {renderPriceRow(
                "طبقه سوم",
                "floor3Area",
                "floor3UnitPrice",
                "floor3TotalPrice",
              )}
              {renderPriceRow(
                "طبقه چهارم",
                "floor4Area",
                "floor4UnitPrice",
                "floor4TotalPrice",
              )}
              {renderPriceRow(
                "طبقه پنجم",
                "floor5Area",
                "floor5UnitPrice",
                "floor5TotalPrice",
              )}
              {renderPriceRow(
                "سایر طبقات",
                "otherFloorsArea",
                "otherFloorsUnitPrice",
                "otherFloorsTotalPrice",
              )}
              {renderPriceRow(
                "محوطه‌سازی",
                "landscapingArea",
                "landscapingUnitPrice",
                "landscapingTotalPrice",
              )}
              {renderPriceRow(
                "تأسیسات",
                "facilitiesArea",
                "facilitiesUnitPrice",
                "facilitiesTotalPrice",
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 border-t pt-4">
              {renderField("جمع کل مساحت", "totalArea", "number")}
              {renderCurrencyField("بهای کل", "totalUnitPrice")}
              {renderCurrencyField("جمع کل مبلغ", "totalPrice")}
              {renderCurrencyField("سرقفلی", "goodwillAdjustment")}
              {renderCurrencyField("مبلغ نهایی (عدد)", "finalPrice")}
              {renderField(
                "مبلغ نهایی (حروف)",
                "finalPriceInWords",
                "text",
                "md:col-span-2",
              )}
            </div>
          </div>

          {/* ── بخش ۵: توضیحات تکمیلی ملک ── */}
          <div className={sectionClass}>
            <h4 className={sectionTitleClass}>توضیحات تکمیلی ملک</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderField("تعداد طبقات", "totalFloors", "number")}
              {renderField("تعداد واحدها به تفکیک کاربری", "usageBreakdown")}
              {renderSelect(
                "نوع سازه",
                "structureTypeCode",
                toOptions(lookups.structureTypes),
              )}
              {renderField("سایر (نوع سازه)", "structureTypeOther")}
              {renderField("نماسازی", "facadeType")}
              {renderField("نحوه محاسبه قدمت بنا", "buildingAgeCalculation")}
              {renderField("سیستم گرمایشی", "heatingSystem")}
              {renderField("سیستم سرمایشی", "coolingSystem")}
            </div>
          </div>

          {/* ── بخش ۶: انشعابات و مجوزها ── */}
          <div className={sectionClass}>
            <h4 className={sectionTitleClass}>انشعابات و مجوزها</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {renderCheckbox("آب", "hasWater")}
              {renderCheckbox("برق", "hasElectricity")}
              {renderCheckbox("گاز", "hasGas")}
              {renderCheckbox("تلفن", "hasTelephone")}
              {renderCheckbox("اصلاحی شهرداری", "hasMunicipalCorrection")}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField("مشخصات برق (فاز/آمپر)", "electricityDetails")}
              {renderTextarea("توضیحات خاص بر و کف", "certificateDetails", 2)}
              {renderTextarea("توضیحات و سایر مشخصات", "otherDetails", 2)}
            </div>
          </div>

          {/* ── بخش ۷: وضعیت مالکیت و کیفیت ── */}
          <div className={sectionClass}>
            <h4 className={sectionTitleClass}>وضعیت مالکیت و کیفیت ساختمان</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {renderCheckbox("مالک در قید حیات است", "isOwnerAlive")}
              {renderSelect(
                "وضعیت انحصار وراثت",
                "inheritanceStatusCode",
                toOptions(lookups.inheritanceStatuses),
              )}
              {renderSelect(
                "موقعیت شهری",
                "urbanLocationGradeCode",
                toOptions(lookups.urbanLocationGrades),
              )}
              {renderSelect(
                "آسیب‌پذیری بلایای طبیعی",
                "disasterVulnerabilityCode",
                toOptions(lookups.disasterVulnerabilities),
              )}
              {renderSelect(
                "کیفیت ساخت و مصالح",
                "constructionQualityCode",
                toOptions(lookups.constructionQualities),
              )}
            </div>
          </div>

          {/* ── بخش ۸: امکانات و مشاعات ── */}
          <div className={sectionClass}>
            <h4 className={sectionTitleClass}>امکانات و مشاعات</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {renderCheckbox("پارکینگ", "hasParking")}
              {renderCheckbox("پارکینگ مشاعی", "hasSharedParking")}
              {renderCheckbox("انباری", "hasStorage")}
              {renderCheckbox("آسانسور", "hasElevator")}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {renderField("تعداد پارکینگ", "parkingCount", "number")}
              {renderField("تعداد انباری", "storageCount", "number")}
              {renderField("مساحت انباری", "storageArea", "number")}
              {renderField("تعداد آسانسور", "elevatorCount", "number")}
            </div>
            {renderTextarea(
              "امتیازات مشاعی/اختصاصی دیگر",
              "otherPrivileges",
              2,
            )}
          </div>

          {/* ── بخش ۹: اسناد و تعهدات ── */}
          <div className={sectionClass}>
            <h4 className={sectionTitleClass}>اسناد و تعهدات</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {renderCheckbox("دارای گواهی", "hasCertificate")}
              {renderCheckbox("در رهن یا بازداشت", "isMortgagedOrSeized")}
            </div>
            {appraisal.hasCertificate === true && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderSelect(
                  "نوع گواهی",
                  "certificateTypeCode",
                  toOptions(lookups.buildingCertificates),
                )}
                {renderField("شماره گواهی", "certificateNumber")}
                {renderField("تاریخ گواهی", "certificateDate")}
              </div>
            )}
            {appraisal.isMortgagedOrSeized === true &&
              renderField("ذینفع رهن یا بازداشت", "mortgageBeneficiary")}
          </div>

          {/* ── بخش ۱۰: منافع و اجاره ── */}
          <div className={sectionClass}>
            <h4 className={sectionTitleClass}>منافع و اجاره</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {renderCheckbox(
                "منافع به غیر واگذار شده",
                "hasTransferredBenefits",
              )}
              {renderCheckbox("در اختیار مستاجر", "isOccupiedByTenant")}
            </div>
            {appraisal.hasTransferredBenefits === true &&
              renderTextarea(
                "توضیحات واگذاری منافع",
                "benefitsTransferDescription",
                2,
              )}
            {appraisal.isOccupiedByTenant === true && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderCurrencyField(
                  "پیش‌پرداخت اجاره",
                  "rentalAdvancePayment",
                )}
                {renderCurrencyField("اجاره ماهیانه", "monthlyRent")}
                {renderSelect(
                  "نوع اجاره‌نامه",
                  "leaseTypeCode",
                  toOptions(lookups.leaseTypes),
                )}
                {renderField("کد رهگیری اجاره", "leaseTrackingCode")}
                {renderField("شماره اجاره‌نامه", "leaseNumber")}
                {renderField("تاریخ اجاره‌نامه", "leaseDate")}
              </div>
            )}
          </div>

          {/* ── بخش ۱۱: مغازه و وضعیت فروش ── */}
          <div className={sectionClass}>
            <h4 className={sectionTitleClass}>مغازه و وضعیت فروش</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {renderCheckbox("دارای مغازه", "hasShop")}
              {renderCheckbox("سهل‌البیع", "isReadilyMarketable")}
              {renderCheckbox("تخلف مشهود", "hasVisibleViolation")}
            </div>
            {appraisal.hasShop === true && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField("تعداد مغازه", "shopCount", "number")}
                {renderField("متصرف مغازه", "shopOccupier")}
                {renderField("نوع کسب", "shopBusinessType")}
              </div>
            )}
            {appraisal.hasVisibleViolation === true &&
              renderTextarea("توضیحات تخلف", "visibleViolationDescription", 2)}
            {renderSelect(
              "مبنای قیمت‌گذاری",
              "valuationPriceBasisCode",
              toOptions(lookups.valuationPriceBasises),
            )}
            {renderTextarea(
              "توضیحات تکمیلی وثیقه",
              "additionalCollateralDescription",
              2,
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField("نام شعبه", "branchName")}
              {renderField("کد شعبه", "branchCode")}
            </div>
          </div>
          {/* بخش ۱۲: امضا کنندگان */}
          <div className={sectionClass}>
            <h4 className={sectionTitleClass}>امضا کنندگان</h4>
            <div className="space-y-3">
              {signatures && signatures.length > 0 ? (
                signatures.map(renderSignatureRow)
              ) : (
                <p className="text-sm text-gray-500">
                  هیچ امضاکننده‌ای ثبت نشده است.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    />
  );
}
