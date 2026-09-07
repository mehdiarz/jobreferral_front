import Modal from "./Modal";
import FormButton from "./FormButton";
import type {
  PropertyAppraisalInputDto,
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

// ─── Helper: Options ─────────────────────────────────────────────
function toOptions(items?: LookupValueDto[] | null) {
  return (items ?? []).map((item) => ({
    value: item.code,
    label: item.title,
  }));
}

// ─── Checkbox ────────────────────────────────────────────────────
function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <label className="text-sm text-gray-700">{label}</label>
    </div>
  );
}

// ─── Formatters ──────────────────────────────────────────────────
const formatNumber = (val?: string | number | null) => {
  if (val === undefined || val === null || val === "") return "";
  // حذف کاراکترهای اضافی به جز رقم
  const clean = String(val).replace(/[^0-9]/g, "");
  if (!clean) return "";
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const parseFormattedNumber = (val: string) => {
  // تبدیل ارقام فارسی و عربی به انگلیسی و حذف کاماها
  const persianToEng = val
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));

  const clean = persianToEng.replace(/[^0-9]/g, "");
  return clean === "" ? "" : Number(clean);
};

// ─── Price Row ───────────────────────────────────────────────────
function PriceRow({
  title,
  areaField,
  unitPriceField,
  totalPriceField,
  form,
  onChange,
  validationErrors,
  onClearError,
}: {
  title: string;
  areaField: keyof PropertyAppraisalInputDto;
  unitPriceField: keyof PropertyAppraisalInputDto;
  totalPriceField: keyof PropertyAppraisalInputDto;
  form: PropertyAppraisalInputDto;
  onChange: (
    field: keyof PropertyAppraisalInputDto,
    value: string | boolean | number,
  ) => void;
  validationErrors?: Record<string, string>;
  onClearError?: (field: string) => void;
}) {
  const areaError = validationErrors?.[String(areaField)];
  const unitPriceError = validationErrors?.[String(unitPriceField)];
  const totalPriceError = validationErrors?.[String(totalPriceField)];

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <p className="text-xs font-bold text-gray-700 mb-2">{title}</p>
      <div className="grid grid-cols-3 gap-3">
        <div data-field={String(areaField)}>
          <label className={labelClass}>
            مساحت <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            type="number"
            className={`${inputClass} ${
              areaError
                ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500"
                : ""
            }`}
            value={String(form[areaField] ?? "")}
            onChange={(e) => {
              onChange(areaField, Number(e.target.value));
              if (areaError && onClearError) {
                onClearError(String(areaField));
              }
            }}
          />
          {areaError && (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
              <span className="inline-block h-1 w-1 rounded-full bg-red-600"></span>
              {areaError}
            </p>
          )}
        </div>
        <div data-field={String(unitPriceField)}>
          <label className={labelClass}>
            بهای واحد (ریال) <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            type="text"
            className={`${inputClass} ${
              unitPriceError
                ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500"
                : ""
            }`}
            value={formatNumber(form[unitPriceField] as string | number)}
            onChange={(e) => {
              onChange(unitPriceField, parseFormattedNumber(e.target.value));
              if (unitPriceError && onClearError) {
                onClearError(String(unitPriceField));
              }
            }}
          />
          {unitPriceError && (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
              <span className="inline-block h-1 w-1 rounded-full bg-red-600"></span>
              {unitPriceError}
            </p>
          )}
        </div>
        <div data-field={String(totalPriceField)}>
          <label className={labelClass}>
            مبلغ کل (ریال) <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            type="text"
            className={`${inputClass} ${
              totalPriceError
                ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500"
                : ""
            }`}
            value={formatNumber(form[totalPriceField] as string | number)}
            onChange={(e) => {
              onChange(totalPriceField, parseFormattedNumber(e.target.value));
              if (totalPriceError && onClearError) {
                onClearError(String(totalPriceField));
              }
            }}
          />
          {totalPriceError && (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
              <span className="inline-block h-1 w-1 rounded-full bg-red-600"></span>
              {totalPriceError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
// ─── Main Export ─────────────────────────────────────────────────
export default function PropertyAppraisalFormModal({
  isOpen,
  form,
  lookups,
  isSaving,
  isGeneratingPdf = false,
  signatures = [],
  validationErrors = {},
  onChange,
  onSave,
  onGeneratePdf,
  onClearError,
  onClose,
}: {
  isOpen: boolean;
  form: PropertyAppraisalInputDto;
  lookups: PropertyAppraisalLookupsDto;
  isSaving: boolean;
  isGeneratingPdf?: boolean;
  signatures?: RequestSignatureOutputDto[];
  validationErrors?: Record<string, string>;
  onChange: (
    field: keyof PropertyAppraisalInputDto,
    value: string | boolean | number,
  ) => void;
  onSave: () => void;
  onGeneratePdf?: () => void;
  onClearError?: (field: string) => void;
  onClose: () => void;
}) {
  const renderField = (
    label: string,
    field: keyof PropertyAppraisalInputDto,
    type: "text" | "number" = "text",
    span:
      | "col-span-1"
      | "md:col-span-2"
      | "md:col-span-3"
      | "md:col-span-4" = "col-span-1",
    required = false,
  ) => {
    const error = validationErrors?.[String(field)];
    return (
      <div className={span} data-field={String(field)}>
        <label className={labelClass}>
          {label}
          {required && <span className="text-red-500 mr-1 font-bold">*</span>}
        </label>
        <input
          type={type}
          className={`${inputClass} ${
            error
              ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500"
              : ""
          }`}
          value={String(form[field] ?? "")}
          onChange={(e) => {
            onChange(
              field,
              type === "number" ? Number(e.target.value) : e.target.value,
            );
            if (error && onClearError) {
              onClearError(String(field));
            }
          }}
        />
        {error && (
          <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
            <span className="inline-block h-1 w-1 rounded-full bg-red-600"></span>
            {error}
          </p>
        )}
      </div>
    );
  };

  const renderCurrencyField = (
    label: string,
    field: keyof PropertyAppraisalInputDto,
    span:
      | "col-span-1"
      | "md:col-span-2"
      | "md:col-span-3"
      | "md:col-span-4" = "col-span-1",
    required = false,
  ) => {
    const error = validationErrors?.[String(field)];
    return (
      <div className={span} data-field={String(field)}>
        <label className={labelClass}>
          {`${label} (ریال)`}
          {required && <span className="text-red-500 mr-1 font-bold">*</span>}
        </label>
        <input
          type="text"
          className={`${inputClass} ${
            error
              ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500"
              : ""
          }`}
          value={formatNumber(form[field] as string | number)}
          onChange={(e) => {
            onChange(field, parseFormattedNumber(e.target.value));
            if (error && onClearError) {
              onClearError(String(field));
            }
          }}
        />
        {error && (
          <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
            <span className="inline-block h-1 w-1 rounded-full bg-red-600"></span>
            {error}
          </p>
        )}
      </div>
    );
  };

  const renderSelect = (
    label: string,
    field: keyof PropertyAppraisalInputDto,
    options: { value: string; label: string }[],
    span:
      | "col-span-1"
      | "md:col-span-2"
      | "md:col-span-3"
      | "md:col-span-4" = "col-span-1",
    required = false,
  ) => {
    const error = validationErrors?.[String(field)];
    return (
      <div className={span} data-field={String(field)}>
        <label className={labelClass}>
          {label}
          {required && <span className="text-red-500 mr-1 font-bold">*</span>}
        </label>
        <select
          className={`${inputClass} ${
            error
              ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500"
              : ""
          }`}
          value={String(form[field] ?? "")}
          onChange={(e) => {
            onChange(field, e.target.value);
            if (error && onClearError) {
              onClearError(String(field));
            }
          }}
        >
          <option value="">انتخاب کنید...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
            <span className="inline-block h-1 w-1 rounded-full bg-red-600"></span>
            {error}
          </p>
        )}
      </div>
    );
  };

  const renderTextarea = (
    label: string,
    field: keyof PropertyAppraisalInputDto,
    rows = 2,
    span:
      | "col-span-1"
      | "md:col-span-2"
      | "md:col-span-3"
      | "md:col-span-4" = "md:col-span-2",
    required = false,
  ) => {
    const error = validationErrors?.[String(field)];
    return (
      <div className={span} data-field={String(field)}>
        <label className={labelClass}>
          {label}
          {required && <span className="text-red-500 mr-1 font-bold">*</span>}
        </label>
        <textarea
          className={`${inputClass} ${
            error
              ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500"
              : ""
          }`}
          rows={rows}
          value={String(form[field] ?? "")}
          onChange={(e) => {
            onChange(field, e.target.value);
            if (error && onClearError) {
              onClearError(String(field));
            }
          }}
        />
        {error && (
          <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
            <span className="inline-block h-1 w-1 rounded-full bg-red-600"></span>
            {error}
          </p>
        )}
      </div>
    );
  };

  const renderSelectBoolean = (
    label: string,
    field: keyof PropertyAppraisalInputDto,
    required = false,
  ) => {
    const error = validationErrors?.[String(field)];
    return (
      <div data-field={String(field)}>
        <label className={labelClass}>
          {label}
          {required && <span className="text-red-500 mr-1 font-bold">*</span>}
        </label>
        <select
          className={`${inputClass} ${
            error
              ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500"
              : ""
          }`}
          value={
            form[field] === true ? "true" : form[field] === false ? "false" : ""
          }
          onChange={(e) => {
            onChange(
              field,
              e.target.value === "true"
                ? true
                : e.target.value === "false"
                  ? false
                  : "",
            );
            if (error && onClearError) {
              onClearError(String(field));
            }
          }}
        >
          <option value="">انتخاب کنید...</option>
          <option value="true">دارد</option>
          <option value="false">ندارد</option>
        </select>
        {error && (
          <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
            <span className="inline-block h-1 w-1 rounded-full bg-red-600"></span>
            {error}
          </p>
        )}
      </div>
    );
  };

  const renderCheckbox = (
    label: string,
    field: keyof PropertyAppraisalInputDto,
  ) => {
    const error = validationErrors?.[String(field)];
    return (
      <div data-field={String(field)}>
        <CheckboxField
          label={label}
          checked={Boolean(form[field])}
          onChange={(checked) => {
            onChange(field, checked);
            if (error && onClearError) {
              onClearError(String(field));
            }
          }}
        />
        {error && (
          <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
            <span className="inline-block h-1 w-1 rounded-full bg-red-600"></span>
            {error}
          </p>
        )}
      </div>
    );
  };

  // const renderCheckbox = (
  //   label: string,
  //   field: keyof PropertyAppraisalInputDto,
  // ) => (
  //   <CheckboxField
  //     label={label}
  //     checked={Boolean(form[field])}
  //     onChange={(checked) => onChange(field, checked)}
  //   />
  // );

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
      overlayLock={isSaving}
      footerButtons={
        <div className="flex gap-2">
          {onGeneratePdf && (
            <FormButton
              title="دانلود گزارش PDF"
              variant="secondary"
              onClick={onGeneratePdf}
              isLoading={isGeneratingPdf}
              disabled={isGeneratingPdf}
            />
          )}
          <FormButton
            title="ذخیره"
            variant="primary"
            onClick={onSave}
            isLoading={isSaving}
            disabled={isSaving}
          />
          <FormButton title="بستن" variant="secondary" onClick={onClose} />
        </div>
      }
      renderContent={() => (
        <div
          className="space-y-6 text-right max-h-[70vh] overflow-y-auto px-1"
          dir="rtl"
        >
          {/* بخش ۱: مشخصات ملک و متقاضی */}
          <div className={sectionClass}>
            <h4 className={sectionTitleClass}>مشخصات ملک و متقاضی</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderField(
                "نام متقاضی",
                "applicantName",
                "text",
                "col-span-1",
                true,
              )}
              {renderField(
                "نوع تسهیلات",
                "loanType",
                "text",
                "col-span-1",
                true,
              )}
              {renderCurrencyField(
                "میزان تسهیلات",
                "loanAmount",
                "col-span-1",
                true,
              )}
              {renderField("نام مالک", "ownerName", "text", "col-span-1", true)}
              {renderField(
                "نشانی ملک",
                "ownerAddress",
                "text",
                "md:col-span-2",
                true,
              )}
              {renderSelect(
                "متصرف ملک",
                "propertyOccupierCode",
                toOptions(lookups.propertyOccupiers),
                "col-span-1",
                true,
              )}
              {renderTextarea(
                "توضیحات متصرف",
                "propertyOccupierDescription",
                2,
                "md:col-span-2",
                true,
              )}
            </div>
          </div>

          {/* بخش ۲: اطلاعات ثبتی */}
          <div className={sectionClass}>
            <h4 className={sectionTitleClass}>اطلاعات ثبتی و سند</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {renderField(
                "شماره ملک",
                "propertyNumber",
                "text",
                "col-span-1",
                true,
              )}
              {renderField(
                "مفروز و مجزی از",
                "seperatedFrom",
                "text",
                "col-span-1",
                true,
              )}
              {renderField(
                "قطعه تفکیکی",
                "separationPiece",
                "text",
                "col-span-1",
                true,
              )}
              {renderField("شماره ثبت", "registrationNumber")}
              {renderField("صفحه", "page")}
              {renderField("شماره دفتر", "officeNumber")}
              {renderField("بخش", "part", "text", "col-span-1", true)}
              {renderField("شهر", "city", "text", "col-span-1", true)}
            </div>
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderSelectBoolean(
                  "پلاک فوق سند قطعی مالکیت",
                  "hasDefinitiveOwnershipDocument",
                  true,
                )}
                {renderField(
                  "شماره ورقه مالکیت",
                  "titleDeedNumber",
                  "text",
                  "col-span-1",
                  true,
                )}
                {renderField("کدپستی", "postalCode")}
              </div>
              {form.hasDefinitiveOwnershipDocument === true && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-dashed pt-4">
                  {renderSelect(
                    "نوع سند",
                    "definitiveOwnershipDocumentTypeCode",
                    toOptions(lookups.definitiveOwnershipDocumentTypes),
                    "col-span-1",
                    true,
                  )}
                  {renderField(
                    "تعداد جلد/برگه",
                    "pageCount",
                    "number",
                    "col-span-1",
                    true,
                  )}
                  {renderField(
                    "تعداد دانگ",
                    "dong",
                    "number",
                    "col-span-1",
                    true,
                  )}
                </div>
              )}
            </div>
          </div>

          {/* بخش ۳: مشخصات ملک و کاربری */}
          <div className={sectionClass}>
            <h4 className={sectionTitleClass}>مشخصات ملک و کاربری</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderField(
                "منطقه شهرداری",
                "municipalArea",
                "text",
                "col-span-1",
                true,
              )}
              {renderField("تلفن ملک", "ownerPhone")}
              {renderField(
                "نوع ملک",
                "propertyType",
                "text",
                "col-span-1",
                true,
              )}
              {renderField(
                "کاربری طبق پایان کار",
                "useAccordingToTheCompletionOfTheWork",
                "text",
                "col-span-1",
                true,
              )}
              {renderSelect(
                "نوع پایان کار",
                "typeOfWorkCompletionCode",
                toOptions(lookups.typeOfWorkCompletions),
                "col-span-1",
                true,
              )}
              {renderField(
                "نوع استفاده از ملک",
                "typeOfUseOfTheProperty",
                "text",
                "col-span-1",
                true,
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
              {renderSelectBoolean(
                "مطابقت مساحت با سند",
                "hasMatchingTheAreaWithTheDocument",
                true,
              )}
              {form.hasMatchingTheAreaWithTheDocument === false &&
                renderTextarea(
                  "توضیحات عدم مطابقت",
                  "explanationInCaseOfDisagreement",
                  3,
                  "md:col-span-2",
                  true,
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
                "col-span-1",
                true,
              )}
            </div>
          </div>

          {/* بخش ۴: جدول ارزیابی */}
          <div className={sectionClass}>
            <h4 className={sectionTitleClass}>جدول ارزیابی</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PriceRow
                title="عرصه کل"
                areaField="landArea"
                unitPriceField="landUnitPrice"
                totalPriceField="landTotalPrice"
                form={form}
                onChange={onChange}
                validationErrors={validationErrors}
                onClearError={onClearError}
              />
              <PriceRow
                title="قدرالسهم"
                areaField="landShareArea"
                unitPriceField="landShareUnitPrice"
                totalPriceField="landShareTotalPrice"
                form={form}
                onChange={onChange}
                validationErrors={validationErrors}
                onClearError={onClearError}
              />
              <PriceRow
                title="زیرزمین"
                areaField="basementArea"
                unitPriceField="basementUnitPrice"
                totalPriceField="basementTotalPrice"
                form={form}
                onChange={onChange}
                validationErrors={validationErrors}
                onClearError={onClearError}
              />
              <PriceRow
                title="همکف"
                areaField="groundFloorArea"
                unitPriceField="groundFloorUnitPrice"
                totalPriceField="groundFloorTotalPrice"
                form={form}
                onChange={onChange}
                validationErrors={validationErrors}
                onClearError={onClearError}
              />
              <PriceRow
                title="نیم‌طبقه"
                areaField="mezzanineArea"
                unitPriceField="mezzanineUnitPrice"
                totalPriceField="mezzanineTotalPrice"
                form={form}
                onChange={onChange}
                validationErrors={validationErrors}
                onClearError={onClearError}
              />
              <PriceRow
                title="طبقه اول"
                areaField="floor1Area"
                unitPriceField="floor1UnitPrice"
                totalPriceField="floor1TotalPrice"
                form={form}
                onChange={onChange}
                validationErrors={validationErrors}
                onClearError={onClearError}
              />
              <PriceRow
                title="طبقه دوم"
                areaField="floor2Area"
                unitPriceField="floor2UnitPrice"
                totalPriceField="floor2TotalPrice"
                form={form}
                onChange={onChange}
                validationErrors={validationErrors}
                onClearError={onClearError}
              />
              <PriceRow
                title="طبقه سوم"
                areaField="floor3Area"
                unitPriceField="floor3UnitPrice"
                totalPriceField="floor3TotalPrice"
                form={form}
                onChange={onChange}
                validationErrors={validationErrors}
                onClearError={onClearError}
              />
              <PriceRow
                title="طبقه چهارم"
                areaField="floor4Area"
                unitPriceField="floor4UnitPrice"
                totalPriceField="floor4TotalPrice"
                form={form}
                onChange={onChange}
                validationErrors={validationErrors}
                onClearError={onClearError}
              />
              <PriceRow
                title="طبقه پنجم"
                areaField="floor5Area"
                unitPriceField="floor5UnitPrice"
                totalPriceField="floor5TotalPrice"
                form={form}
                onChange={onChange}
                validationErrors={validationErrors}
                onClearError={onClearError}
              />
              <PriceRow
                title="سایر طبقات"
                areaField="otherFloorsArea"
                unitPriceField="otherFloorsUnitPrice"
                totalPriceField="otherFloorsTotalPrice"
                form={form}
                onChange={onChange}
                validationErrors={validationErrors}
                onClearError={onClearError}
              />
              <PriceRow
                title="محوطه‌سازی"
                areaField="landscapingArea"
                unitPriceField="landscapingUnitPrice"
                totalPriceField="landscapingTotalPrice"
                form={form}
                onChange={onChange}
                validationErrors={validationErrors}
                onClearError={onClearError}
              />
              <PriceRow
                title="تأسیسات"
                areaField="facilitiesArea"
                unitPriceField="facilitiesUnitPrice"
                totalPriceField="facilitiesTotalPrice"
                form={form}
                onChange={onChange}
                validationErrors={validationErrors}
                onClearError={onClearError}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 border-t pt-4">
              {renderField(
                "جمع کل مساحت",
                "totalArea",
                "number",
                "col-span-1",
                true,
              )}
              {renderCurrencyField(
                "بهای کل",
                "totalUnitPrice",
                "col-span-1",
                true,
              )}
              {renderCurrencyField(
                "جمع کل مبلغ",
                "totalPrice",
                "col-span-1",
                true,
              )}
              {renderCurrencyField(
                "سرقفلی",
                "goodwillAdjustment",
                "col-span-1",
                true,
              )}
              {renderCurrencyField(
                "مبلغ نهایی (عدد)",
                "finalPrice",
                "col-span-1",
                true,
              )}
              {renderField(
                "مبلغ نهایی (حروف)",
                "finalPriceInWords",
                "text",
                "md:col-span-2",
                true,
              )}
            </div>
          </div>

          {/* بخش ۵: توضیحات تکمیلی */}
          <div className={sectionClass}>
            <h4 className={sectionTitleClass}>توضیحات تکمیلی ملک</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderField(
                "تعداد طبقات",
                "totalFloors",
                "number",
                "col-span-1",
                true,
              )}
              {renderField(
                "تعداد واحدها به تفکیک کاربری",
                "usageBreakdown",
                "text",
                "col-span-1",
                true,
              )}
              {renderSelect(
                "نوع سازه",
                "structureTypeCode",
                toOptions(lookups.structureTypes),
              )}
              {renderField("سایر (نوع سازه)", "structureTypeOther")}
              {renderField("نماسازی", "facadeType", "text", "col-span-1", true)}
              {renderField(
                "نحوه محاسبه قدمت بنا",
                "buildingAgeCalculation",
                "text",
                "col-span-1",
                true,
              )}
              {renderField("سیستم گرمایشی", "heatingSystem")}
              {renderField("سیستم سرمایشی", "coolingSystem")}
            </div>
          </div>
          {/* بخش ۶: انشعابات */}
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

          {/* بخش ۷: وضعیت مالکیت */}
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

          {/* بخش ۸: امکانات */}
          <div className={sectionClass}>
            <h4 className={sectionTitleClass}>امکانات و مشاعات</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {renderCheckbox("پارکینگ", "hasParking")}
              {renderCheckbox("پارکینگ مشاعی", "hasSharedParking")}
              {renderCheckbox("انباری", "hasStorage")}
              {renderCheckbox("آسانسور", "hasElevator")}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {renderField(
                "تعداد پارکینگ",
                "parkingCount",
                "number",
                "col-span-1",
                true,
              )}
              {renderField(
                "تعداد انباری",
                "storageCount",
                "number",
                "col-span-1",
                true,
              )}
              {renderField(
                "مساحت انباری",
                "storageArea",
                "number",
                "col-span-1",
                true,
              )}
              {renderField(
                "تعداد آسانسور",
                "elevatorCount",
                "number",
                "col-span-1",
                true,
              )}
            </div>
            {renderTextarea(
              "امتیازات مشاعی/اختصاصی دیگر",
              "otherPrivileges",
              2,
              "md:col-span-2",
              true,
            )}
          </div>

          {/* بخش ۹: اسناد */}
          <div className={sectionClass}>
            <h4 className={sectionTitleClass}>اسناد و تعهدات</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {renderCheckbox("دارای گواهی", "hasCertificate")}
              {renderCheckbox("در رهن یا بازداشت", "isMortgagedOrSeized")}
            </div>
            {form.hasCertificate === true && (
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
            {form.isMortgagedOrSeized === true &&
              renderField("ذینفع رهن یا بازداشت", "mortgageBeneficiary")}
          </div>

          {/* بخش ۱۰: منافع */}
          <div className={sectionClass}>
            <h4 className={sectionTitleClass}>منافع و اجاره</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {renderCheckbox(
                "منافع به غیر واگذار شده",
                "hasTransferredBenefits",
              )}
              {renderCheckbox("در اختیار مستاجر", "isOccupiedByTenant")}
            </div>
            {form.hasTransferredBenefits === true &&
              renderTextarea(
                "توضیحات واگذاری منافع",
                "benefitsTransferDescription",
                2,
              )}
            {form.isOccupiedByTenant === true && (
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

          {/* بخش ۱۱: مغازه */}
          <div className={sectionClass}>
            <h4 className={sectionTitleClass}>مغازه و وضعیت فروش</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {renderCheckbox("دارای مغازه", "hasShop")}
              {renderCheckbox("سهل‌البیع", "isReadilyMarketable")}
              {renderCheckbox("تخلف مشهود", "hasVisibleViolation")}
            </div>
            {form.hasShop === true && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField("تعداد مغازه", "shopCount", "number")}
                {renderField("متصرف مغازه", "shopOccupier")}
                {renderField("نوع کسب", "shopBusinessType")}
              </div>
            )}
            {form.hasVisibleViolation === true &&
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
