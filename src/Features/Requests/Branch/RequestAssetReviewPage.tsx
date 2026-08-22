import { useMemo, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardList, MessageSquareText } from "lucide-react";

import { MainLayout } from "../../../baseComponents/MainLayout";
import FormButton from "../../../baseComponents/FormButton";
import FormTextarea from "../../../baseComponents/FormTextarea";
import PageTitle from "../../../baseComponents/PageTitle";
import DataTable from "../../../baseComponents/DataTable";
import Modal from "../../../baseComponents/Modal";
import PropertyAppraisalFormModal from "../../../baseComponents/PropertyAppraisalFormModal";
import RequestDetailsPanel, {
  RequestDetailSection,
  ViewDetailsButton,
} from "../../../baseComponents/RequestDetailsPanel";
import { useToast } from "../../../libs/toastContext";
import { useAuthStore } from "../../../libs/store";

import { getAllRequests } from "../../../services/RequestCrud/getAll";
import { getRequest } from "../../../services/RequestCrud/get";
import { viewRequest } from "../../../services/RequestCrud/viewRequest";
import { userAction } from "../../../services/RequestCrud/userAction";
import { createRequestComment } from "../../../services/RequestCommentCrud/create";
import { getUserById } from "../../../services/Users/getUserById";
import { getPropertyAppraisalLookups } from "../../../services/PropertyAppraisalCrud/getLookups";
import { createPropertyAppraisal } from "../../../services/PropertyAppraisalCrud/create";
import { updatePropertyAppraisal } from "../../../services/PropertyAppraisalCrud/update";
import { getPropertyAppraisalByRequestId } from "../../../services/PropertyAppraisalCrud/getByRequestId";

import type { RequestItem } from "../../../services/RequestCrud/types";
import type {
  PropertyAppraisalInputDto,
  PropertyAppraisalLookupsDto,
  LookupValueDto,
  PropertyAppraisalOutputDto,
} from "../../../services/PropertyAppraisalCrud/types";
import {
  isoToPersian,
  isoToPersianDateTime,
} from "../../../utils/persianToISO";
import { persianToISO } from "../../../utils/persianToISO";
import {
  REQUEST_DEPARTMENT_TYPES,
  type RequestDepartmentTypeConfig,
} from "../requestDepartmentTypes";
import { generateAppraisalHtmlPDF } from "../../../utils/htmlPdfGenerator";

import { getAllRequestStatus } from "../../../services/RequestStatusCrud/getAll";
import {
  REQUEST_STATUS_TITLES,
  resolveRequestStatusCode,
  resolveRequestStatusTitle,
} from "../requestStatuses";
import PropertyAppraisalReadOnlyModal from "../../../baseComponents/PropertyAppraisalReadOnlyModal";

// ─── Types ───────────────────────────────────────────────────────
type TableFilter = { key: string; value: string };
type SelectedRequest = RequestItem & {
  requesterFullName?: string | null;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

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

// ─── Sub-Component: Checkbox ─────────────────────────────────────
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

// ─── Sub-Component: Price Row ────────────────────────────────────
function PriceRow({
  title,
  areaField,
  unitPriceField,
  totalPriceField,
  form,
  onChange,
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
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <p className="text-xs font-bold text-gray-700 mb-2">{title}</p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>مساحت</label>
          <input
            type="number"
            className={inputClass}
            value={String(form[areaField] ?? "")}
            onChange={(e) => onChange(areaField, Number(e.target.value))}
          />
        </div>
        <div>
          <label className={labelClass}>بهای واحد</label>
          <input
            type="number"
            className={inputClass}
            value={String(form[unitPriceField] ?? "")}
            onChange={(e) => onChange(unitPriceField, Number(e.target.value))}
          />
        </div>
        <div>
          <label className={labelClass}>مبلغ کل</label>
          <input
            type="number"
            className={inputClass}
            value={String(form[totalPriceField] ?? "")}
            onChange={(e) => onChange(totalPriceField, Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Sub-Component: Asset Review Form Modal ──────────────────────
export function LegacyAssetReviewModal({
  isOpen,
  form,
  lookups,
  isSaving,
  isGeneratingPdf,
  onChange,
  onSave,
  onGeneratePdf,
  onClose,
}: {
  isOpen: boolean;
  form: PropertyAppraisalInputDto;
  lookups: PropertyAppraisalLookupsDto;
  isSaving: boolean;
  isGeneratingPdf: boolean;
  onChange: (
    field: keyof PropertyAppraisalInputDto,
    value: string | boolean | number,
  ) => void;
  onSave: () => void;
  onGeneratePdf: () => void;
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
  ) => (
    <div className={span}>
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        className={inputClass}
        value={String(form[field] ?? "")}
        onChange={(e) =>
          onChange(
            field,
            type === "number" ? Number(e.target.value) : e.target.value,
          )
        }
      />
    </div>
  );

  const renderSelect = (
    label: string,
    field: keyof PropertyAppraisalInputDto,
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
        className={inputClass}
        value={String(form[field] ?? "")}
        onChange={(e) => onChange(field, e.target.value)}
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
    field: keyof PropertyAppraisalInputDto,
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
        value={String(form[field] ?? "")}
        onChange={(e) => onChange(field, e.target.value)}
      />
    </div>
  );

  const renderSelectBoolean = (
    label: string,
    field: keyof PropertyAppraisalInputDto,
  ) => (
    <div>
      <label className={labelClass}>{label}</label>
      <select
        className={inputClass}
        value={
          form[field] === true ? "true" : form[field] === false ? "false" : ""
        }
        onChange={(e) =>
          onChange(
            field,
            e.target.value === "true"
              ? true
              : e.target.value === "false"
                ? false
                : "",
          )
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
    field: keyof PropertyAppraisalInputDto,
  ) => (
    <CheckboxField
      label={label}
      checked={Boolean(form[field])}
      onChange={(checked) => onChange(field, checked)}
    />
  );

  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } #print-area { padding: 20px !important; } }`}</style>
      <Modal
        isOpen={isOpen}
        isRTL
        header="فرم ارزیابی ملک"
        onClose={onClose}
        className="min-w-[1100px]"
        overlayLock={isSaving}
        footerButtons={
          <div className="flex gap-2 no-print">
            <FormButton
              title="دانلود گزارش PDF"
              variant="secondary"
              onClick={onGeneratePdf}
              isLoading={isGeneratingPdf}
              disabled={isGeneratingPdf}
            />
            <FormButton
              title="ذخیره"
              variant="primary"
              onClick={onSave}
              isLoading={isSaving}
              disabled={isSaving}
            />
          </div>
        }
        renderContent={() => (
          <div
            id="print-area"
            className="space-y-6 text-right max-h-[70vh] overflow-y-auto px-1"
            dir="rtl"
          >
            {/* ── بخش ۱: مشخصات ملک و متقاضی ── */}
            <div className={sectionClass}>
              <h4 className={sectionTitleClass}>مشخصات ملک و متقاضی</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField("نام متقاضی", "applicantName")}
                {renderField("نوع تسهیلات", "loanType")}
                {renderField("میزان تسهیلات", "loanAmount", "number")}
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

                {form.hasDefinitiveOwnershipDocument === true && (
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
                {form.hasMatchingTheAreaWithTheDocument === false &&
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
                <PriceRow
                  title="عرصه کل"
                  areaField="landArea"
                  unitPriceField="landUnitPrice"
                  totalPriceField="landTotalPrice"
                  form={form}
                  onChange={onChange}
                />
                <PriceRow
                  title="قدرالسهم"
                  areaField="landShareArea"
                  unitPriceField="landShareUnitPrice"
                  totalPriceField="landShareTotalPrice"
                  form={form}
                  onChange={onChange}
                />
                <PriceRow
                  title="زیرزمین"
                  areaField="basementArea"
                  unitPriceField="basementUnitPrice"
                  totalPriceField="basementTotalPrice"
                  form={form}
                  onChange={onChange}
                />
                <PriceRow
                  title="همکف"
                  areaField="groundFloorArea"
                  unitPriceField="groundFloorUnitPrice"
                  totalPriceField="groundFloorTotalPrice"
                  form={form}
                  onChange={onChange}
                />
                <PriceRow
                  title="نیم‌طبقه"
                  areaField="mezzanineArea"
                  unitPriceField="mezzanineUnitPrice"
                  totalPriceField="mezzanineTotalPrice"
                  form={form}
                  onChange={onChange}
                />
                <PriceRow
                  title="طبقه اول"
                  areaField="floor1Area"
                  unitPriceField="floor1UnitPrice"
                  totalPriceField="floor1TotalPrice"
                  form={form}
                  onChange={onChange}
                />
                <PriceRow
                  title="طبقه دوم"
                  areaField="floor2Area"
                  unitPriceField="floor2UnitPrice"
                  totalPriceField="floor2TotalPrice"
                  form={form}
                  onChange={onChange}
                />
                <PriceRow
                  title="طبقه سوم"
                  areaField="floor3Area"
                  unitPriceField="floor3UnitPrice"
                  totalPriceField="floor3TotalPrice"
                  form={form}
                  onChange={onChange}
                />
                <PriceRow
                  title="طبقه چهارم"
                  areaField="floor4Area"
                  unitPriceField="floor4UnitPrice"
                  totalPriceField="floor4TotalPrice"
                  form={form}
                  onChange={onChange}
                />
                <PriceRow
                  title="طبقه پنجم"
                  areaField="floor5Area"
                  unitPriceField="floor5UnitPrice"
                  totalPriceField="floor5TotalPrice"
                  form={form}
                  onChange={onChange}
                />
                <PriceRow
                  title="سایر طبقات"
                  areaField="otherFloorsArea"
                  unitPriceField="otherFloorsUnitPrice"
                  totalPriceField="otherFloorsTotalPrice"
                  form={form}
                  onChange={onChange}
                />
                <PriceRow
                  title="محوطه‌سازی"
                  areaField="landscapingArea"
                  unitPriceField="landscapingUnitPrice"
                  totalPriceField="landscapingTotalPrice"
                  form={form}
                  onChange={onChange}
                />
                <PriceRow
                  title="تأسیسات"
                  areaField="facilitiesArea"
                  unitPriceField="facilitiesUnitPrice"
                  totalPriceField="facilitiesTotalPrice"
                  form={form}
                  onChange={onChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 border-t pt-4">
                {renderField("جمع کل مساحت", "totalArea", "number")}
                {renderField("بهای کل", "totalUnitPrice", "number")}
                {renderField("جمع کل مبلغ", "totalPrice", "number")}
                {renderField("سرقفلی", "goodwillAdjustment", "number")}
                {renderField("مبلغ نهایی (عدد)", "finalPrice", "number")}
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
              <h4 className={sectionTitleClass}>
                وضعیت مالکیت و کیفیت ساختمان
              </h4>
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
              {form.hasTransferredBenefits === true &&
                renderTextarea(
                  "توضیحات واگذاری منافع",
                  "benefitsTransferDescription",
                  2,
                )}
              {form.isOccupiedByTenant === true && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {renderField(
                    "پیش‌پرداخت اجاره",
                    "rentalAdvancePayment",
                    "number",
                  )}
                  {renderField("اجاره ماهیانه", "monthlyRent", "number")}
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
              {form.hasShop === true && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {renderField("تعداد مغازه", "shopCount", "number")}
                  {renderField("متصرف مغازه", "shopOccupier")}
                  {renderField("نوع کسب", "shopBusinessType")}
                </div>
              )}
              {form.hasVisibleViolation === true &&
                renderTextarea(
                  "توضیحات تخلف",
                  "visibleViolationDescription",
                  2,
                )}
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
          </div>
        )}
      />
    </>
  );
}

// ─── Main Component ──────────────────────────────────────────────
interface RequestAssetReviewPageProps {
  departmentType: RequestDepartmentTypeConfig;
}

export function DepartmentRequestAssetReviewPage({
  departmentType,
}: RequestAssetReviewPageProps) {
  const { showToast } = useToast();
  const { user } = useAuthStore();

  // ─── State ─────────────────────────────────────────────────────
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [filters, setFilters] = useState<TableFilter[]>([]);
  const [selectedRequest, setSelectedRequest] =
    useState<SelectedRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // فرم ارزیابی
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetForm, setAssetForm] = useState<PropertyAppraisalInputDto>({});
  const [isSavingAppraisal, setIsSavingAppraisal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [regionAppraisal, setRegionAppraisal] =
    useState<PropertyAppraisalOutputDto | null>(null);

  const [otherAppraisals, setOtherAppraisals] = useState<
    PropertyAppraisalOutputDto[]
  >([]);

  const [isAppraisalReadOnlyOpen, setIsAppraisalReadOnlyOpen] = useState(false);

  const [selectedReadonlyAppraisal, setSelectedReadonlyAppraisal] =
    useState<PropertyAppraisalOutputDto | null>(null);

  const userCacheRef = useRef<Map<number, { name: string; role: string }>>(
    new Map(),
  );

  // Query برای دریافت status ها از سرویس
  const statusQuery = useQuery({
    queryKey: ["request-statuses"],
    queryFn: () => getAllRequestStatus({ maxResultCount: 100 }),
    staleTime: 10 * 60 * 1000,
  });

  const statuses = statusQuery.data?.items;

  // استخراج status code های مورد نیاز به صورت dynamic
  const assetReviewStatusCodes = useMemo(
    () => ({
      propertyReview: resolveRequestStatusCode(
        statuses,
        REQUEST_STATUS_TITLES.propertyReview,
      ),
      propertyRejected: resolveRequestStatusCode(
        statuses,
        REQUEST_STATUS_TITLES.propertyRejected,
      ),
    }),
    [statuses],
  );

  // ─── Queries ───────────────────────────────────────────────────
  const requestsQuery = useQuery({
    queryKey: [
      "requests-asset-review",
      departmentType.id,
      pagination.pageIndex,
      pagination.pageSize,
      filters,
      assetReviewStatusCodes.propertyReview,
      assetReviewStatusCodes.propertyRejected,
    ],
    queryFn: async () => {
      const apiFilters = Object.fromEntries(
        filters
          .filter((f) => f.value.trim())
          .map((f) => [
            f.key,
            f.key === "creationTime"
              ? persianToISO(f.value.trim()) || f.value.trim()
              : f.value.trim(),
          ]),
      );
      const response = await getAllRequests({
        ...apiFilters,
        currentDepartmentTypeName: departmentType.name,
        skipCount: pagination.pageIndex * pagination.pageSize,
        maxResultCount: pagination.pageSize,
        sorting: "creationTime desc",
      });
      return response;
    },
    select: (data) => {
      const items = ((data?.items ?? []) as RequestItem[]).filter(
        (r) =>
          r.requestStatusCode === assetReviewStatusCodes.propertyReview ||
          r.requestStatusCode === assetReviewStatusCodes.propertyRejected,
      );
      const filteredItems = items;
      return {
        listResult: filteredItems,
        total: data.totalCount ?? filteredItems.length,
        totalPages: Math.max(
          1,
          Math.ceil(filteredItems.length / pagination.pageSize),
        ),
      };
    },
    enabled: statusQuery.isSuccess,
  });

  const lookupsQuery = useQuery({
    queryKey: ["property-appraisal-lookups"],
    queryFn: getPropertyAppraisalLookups,
    staleTime: 10 * 60 * 1000,
  });

  const lookups = useMemo(() => lookupsQuery.data ?? {}, [lookupsQuery.data]);

  const isStatusFive =
    selectedRequest?.requestStatusCode ===
    assetReviewStatusCodes.propertyRejected;
  // ─── Helpers ───────────────────────────────────────────────────
  const getUserCacheData = useCallback((userId: number) => {
    return (
      userCacheRef.current.get(userId) || { name: `کاربر ${userId}`, role: "-" }
    );
  }, []);

  const handleView = useCallback(
    async (req: RequestItem) => {
      setSelectedRequest(null);
      setComment("");

      // پاک‌سازی اطلاعات درخواست قبلی
      setRegionAppraisal(null);
      setOtherAppraisals([]);
      setSelectedReadonlyAppraisal(null);
      setIsAppraisalReadOnlyOpen(false);

      setAssetForm({});
      setIsAssetModalOpen(false);
      setIsDetailOpen(true);

      try {
        await viewRequest(req.id);

        const detail = await getRequest(req.id);
        setSelectedRequest(detail);

        try {
          const existingAppraisals = await getPropertyAppraisalByRequestId(
            req.id,
          );

          const appraisals = existingAppraisals ?? [];

          const currentDepartmentAppraisal =
            appraisals.find(
              (appraisal) =>
                appraisal.creatorDepartmentId === departmentType.id,
            ) ?? null;

          const appraisalsFromOtherDepartments = appraisals.filter(
            (appraisal) => appraisal.creatorDepartmentId !== departmentType.id,
          );

          setRegionAppraisal(currentDepartmentAppraisal);
          setOtherAppraisals(appraisalsFromOtherDepartments);

          if (currentDepartmentAppraisal) {
            setAssetForm(currentDepartmentAppraisal);
          }
        } catch (error) {
          console.error("Error loading property appraisals:", error);

          setRegionAppraisal(null);
          setOtherAppraisals([]);
          setSelectedReadonlyAppraisal(null);
        }

        const ids = new Set<number>();

        detail.requestHistoryOutputDtos?.forEach(
          (history) =>
            history.reviewerUserId && ids.add(history.reviewerUserId),
        );

        detail.requestCommentOutputDtos?.forEach(
          (requestComment) =>
            requestComment.userId && ids.add(requestComment.userId),
        );

        for (const id of ids) {
          if (!userCacheRef.current.has(id)) {
            const userData = await getUserById(id);

            userCacheRef.current.set(id, {
              name:
                userData?.fullName ||
                `${userData?.name ?? ""} ${userData?.surname ?? ""}`.trim() ||
                `کاربر ${id}`,
              role: userData?.roleNames?.[0] || "-",
            });
          }
        }
      } catch (error) {
        console.error("Error in handleView:", error);
        showToast("خطا در بارگذاری اطلاعات", "error");
      }
    },
    [departmentType.id, showToast],
  );

  const handleAction = useCallback(
    async (accepted: boolean) => {
      if (!selectedRequest) return;
      setIsSubmitting(true);
      try {
        if (comment.trim()) {
          await createRequestComment({
            requestId: selectedRequest.id,
            userId: Number(user?.id || 0),
            description: comment.trim(),
          });
        }
        await userAction({ requestId: selectedRequest.id, accepted });
        showToast(
          accepted ? "درخواست تأیید شد" : "عملیات با موفقیت انجام شد",
          "success",
        );
        setIsDetailOpen(false);
        requestsQuery.refetch();
      } catch (error: unknown) {
        console.error("Error in action:", error);
        showToast(getErrorMessage(error, "خطا در انجام عملیات"), "error");
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedRequest, comment, user, requestsQuery, showToast],
  );

  const handleFormChange = useCallback(
    (
      field: keyof PropertyAppraisalInputDto,
      value: string | boolean | number,
    ) => {
      setAssetForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleOpenAssetModal = useCallback(() => {
    if (regionAppraisal) {
      setAssetForm(regionAppraisal);
    } else {
      setAssetForm({
        applicantName:
          selectedRequest?.requesterFullName ||
          selectedRequest?.customerOutputDto?.name ||
          "",
        loanAmount: Number(selectedRequest?.amount) || 0,
        loanType: selectedRequest?.requestTypeOutputDto?.title || "",
        branchName: user?.branchName || "",
        branchCode: user?.bid || "",
        requestId: selectedRequest?.id,
        creatorDepartmentId: departmentType.id,
      });
    }

    setIsAssetModalOpen(true);
  }, [departmentType.id, regionAppraisal, selectedRequest, user]);

  const handleSaveAppraisal = useCallback(async () => {
    if (!selectedRequest?.id) {
      showToast("درخواست انتخاب نشده است", "error");
      return;
    }

    setIsSavingAppraisal(true);

    try {
      const cleanBody: PropertyAppraisalInputDto = { ...assetForm };

      (Object.keys(cleanBody) as (keyof PropertyAppraisalInputDto)[]).forEach(
        (key) => {
          const value = cleanBody[key];

          if (value === null || value === undefined || value === "") {
            delete cleanBody[key];
          }
        },
      );

      cleanBody.requestId = selectedRequest.id;
      cleanBody.creatorDepartmentId = departmentType.id;

      // دریافت آخرین وضعیت فرم‌ها برای جلوگیری از update روی فرم اشتباه
      const latestAppraisals = await getPropertyAppraisalByRequestId(
        selectedRequest.id,
      );

      const latestRegionAppraisal =
        (latestAppraisals ?? []).find(
          (appraisal) => appraisal.creatorDepartmentId === departmentType.id,
        ) ?? null;

      let saved: PropertyAppraisalOutputDto;

      if (latestRegionAppraisal?.id) {
        // فقط فرم متعلق به همین واحد قابل ویرایش است
        if (latestRegionAppraisal.creatorDepartmentId !== departmentType.id) {
          showToast("امکان ویرایش فرم ارزیابی واحد دیگر وجود ندارد", "error");
          return;
        }

        saved = await updatePropertyAppraisal({
          ...cleanBody,
          id: latestRegionAppraisal.id,
        });

        showToast("ارزیابی ملک با موفقیت ویرایش شد", "success");
      } else {
        saved = await createPropertyAppraisal(cleanBody);

        showToast("ارزیابی ملک با موفقیت ذخیره شد", "success");
      }

      setRegionAppraisal(saved);
      setAssetForm(saved);
      setIsAssetModalOpen(false);
    } catch (error: unknown) {
      console.error("Error saving appraisal:", error);
      showToast(getErrorMessage(error, "خطا در ذخیره ارزیابی"), "error");
    } finally {
      setIsSavingAppraisal(false);
    }
  }, [assetForm, departmentType.id, selectedRequest, showToast]);

  const handleGeneratePdf = useCallback(async () => {
    setIsGeneratingPdf(true);
    try {
      await generateAppraisalHtmlPDF(assetForm, lookups, {
        requestCode: selectedRequest?.requestCode,
        date: selectedRequest?.creationTime
          ? isoToPersian(selectedRequest.creationTime)
          : "",
      });
      showToast("گزارش PDF با موفقیت ایجاد شد", "success");
    } catch (error: unknown) {
      console.error("Error generating appraisal PDF:", error);
      showToast(getErrorMessage(error, "خطا در ایجاد فایل PDF"), "error");
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [assetForm, lookups, selectedRequest, showToast]);

  // ─── Columns ───────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<RequestItem, unknown>[]>(
    () => [
      {
        id: "status",
        header: "مرحله فرآیند",
        cell: ({ row }) =>
          resolveRequestStatusTitle(
            statuses,
            row.original.requestStatusCode,
            row.original.requestStatusTitle,
          ),
      },
      {
        id: "user",
        header: "کاربر اقدام کننده",
        cell: ({ row }) => row.original.actorUserFullName || "-",
      },
      {
        id: "role",
        header: "نقش سازمانی",
        cell: ({ row }) => row.original.actorUserRoleName || "-",
      },
      {
        id: "date",
        header: "تاریخ و زمان",
        cell: ({ row }) =>
          row.original.creationTime
            ? isoToPersianDateTime(row.original.creationTime)
            : "-",
      },
      {
        id: "title",
        header: "عنوان",
        cell: ({ row }) => row.original.title || "-",
      },
      {
        id: "detail",
        header: "عملیات",
        cell: ({ row }) => (
          <ViewDetailsButton onClick={() => handleView(row.original)} />
        ),
      },
    ],
    [handleView, statuses],
  );

  // ─── Render ──────────────────────────────────────────────────
  return (
    <MainLayout.Main maxWidth="screen-xl">
      <PageTitle
        title={`بررسی و بازنگری اطلاعات ملک توسط ${departmentType.name}`}
      />
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <DataTable<RequestItem>
          query={requestsQuery}
          columns={columns}
          pagination={pagination}
          onPaginationChange={setPagination}
          filters={filters}
          onFiltersChange={(nf) => {
            setFilters(nf.length ? [nf[nf.length - 1]] : []);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
          filterFields={[
            { field: "requestStatusTitle", label: "مرحله فرآیند" },
            { field: "actorUserFullName", label: "نام کاربر اقدام کننده" },
            {
              field: "creationTime",
              label: "تاریخ",
              placeholder: "مثال: 1405-05-11",
            },
          ]}
          searchMode="onEnter"
          emptyStateMessage="درخواستی یافت نشد"
        />
      </div>

      <Modal
        isOpen={isDetailOpen}
        isRTL
        header="جزئیات و بررسی ارزیابی"
        onClose={() => setIsDetailOpen(false)}
        overlayLock={isSubmitting}
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title={isStatusFive ? "مختومه" : "سهل البیع نیست"}
              variant="danger"
              onClick={() => handleAction(false)}
              isLoading={isSubmitting}
            />
            {!isStatusFive && (
              <FormButton
                title="تأیید نهایی"
                variant="success"
                onClick={() => handleAction(true)}
                isLoading={isSubmitting}
              />
            )}
          </div>
        }
        renderContent={() => {
          if (!selectedRequest)
            return (
              <div className="p-10 text-center text-gray-400">
                در حال بارگذاری...
              </div>
            );
          return (
            <RequestDetailsPanel
              request={selectedRequest}
              documents={[]}
              getUserData={getUserCacheData}
            >
              {!isStatusFive && (
                <>
                  <RequestDetailSection
                    icon={<ClipboardList className="w-5 h-5" />}
                    title={`ارزیابی ملک توسط ${departmentType.name}`}
                    tone="blue"
                  >
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <div className="text-sm text-blue-800">
                        {regionAppraisal
                          ? `فرم ارزیابی توسط ${departmentType.name} ثبت شده است و قابل ویرایش است.`
                          : "فرم ارزیابی توسط این واحد ثبت نشده است."}
                      </div>

                      <FormButton
                        title={
                          regionAppraisal
                            ? "ویرایش فرم ارزیابی"
                            : "ایجاد فرم ارزیابی"
                        }
                        variant="primary"
                        size="sm"
                        onClick={handleOpenAssetModal}
                      />
                    </div>
                  </RequestDetailSection>

                  {otherAppraisals.length > 0 && (
                    <RequestDetailSection
                      icon={<ClipboardList className="w-5 h-5" />}
                      title="فرم‌های ارزیابی سایر واحدها"
                      tone="amber"
                    >
                      <div className="space-y-3">
                        {otherAppraisals.map((appraisal, index) => (
                          <div
                            key={
                              appraisal.id ??
                              `${appraisal.creatorDepartmentId}-${index}`
                            }
                            className="flex items-center justify-between gap-4 rounded-xl border border-amber-100 bg-amber-50 p-4"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-amber-800">
                                فرم ارزیابی ملک
                                {otherAppraisals.length > 1
                                  ? ` شماره ${index + 1}`
                                  : ""}
                              </div>

                              <div className="mt-1 text-xs text-amber-700">
                                این فرم توسط واحد دیگری ثبت شده و فقط قابل
                                مشاهده است.
                              </div>
                            </div>

                            <FormButton
                              title="مشاهده فرم"
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setSelectedReadonlyAppraisal(appraisal);
                                setIsAppraisalReadOnlyOpen(true);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </RequestDetailSection>
                  )}
                </>
              )}

              <RequestDetailSection
                icon={<MessageSquareText className="w-5 h-5" />}
                title="توضیحات تکمیلی"
                tone="amber"
              >
                <FormTextarea
                  id="cmt"
                  name="cmt"
                  label="توضیحات کارشناس شعبه"
                  value={comment}
                  onChange={setComment}
                  rows={3}
                />
              </RequestDetailSection>
            </RequestDetailsPanel>
          );
        }}
      />

      <PropertyAppraisalFormModal
        isOpen={isAssetModalOpen}
        form={assetForm}
        lookups={lookups}
        isSaving={isSavingAppraisal}
        isGeneratingPdf={isGeneratingPdf}
        onChange={handleFormChange}
        onSave={handleSaveAppraisal}
        onGeneratePdf={handleGeneratePdf}
        onClose={() => setIsAssetModalOpen(false)}
      />

      <PropertyAppraisalReadOnlyModal
        isOpen={isAppraisalReadOnlyOpen}
        appraisal={selectedReadonlyAppraisal}
        lookups={lookups}
        onClose={() => {
          setIsAppraisalReadOnlyOpen(false);
          setSelectedReadonlyAppraisal(null);
        }}
      />
    </MainLayout.Main>
  );
}

export default function RequestAssetReviewPage() {
  return (
    <DepartmentRequestAssetReviewPage
      departmentType={REQUEST_DEPARTMENT_TYPES.branch}
    />
  );
}
