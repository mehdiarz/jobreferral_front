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
import { getPropertyAppraisalByRequestId } from "../../../services/PropertyAppraisalCrud/getByRequestId";
import { createPropertyAppraisal } from "../../../services/PropertyAppraisalCrud/create";
import { updatePropertyAppraisal } from "../../../services/PropertyAppraisalCrud/update";

import PropertyAppraisalReadOnlyModal from "../../../baseComponents/PropertyAppraisalReadOnlyModal";
import PropertyAppraisalFormModal from "../../../baseComponents/PropertyAppraisalFormModal";

import type { RequestItem } from "../../../services/RequestCrud/types";
import type {
  PropertyAppraisalInputDto,
  PropertyAppraisalLookupsDto,
  PropertyAppraisalOutputDto,
  LookupValueDto,
} from "../../../services/PropertyAppraisalCrud/types";
import { isoToPersianDateTime } from "../../../utils/persianToISO";
import { persianToISO } from "../../../utils/persianToISO";
import {
  REQUEST_DEPARTMENT_TYPES,
  type RequestDepartmentTypeConfig,
} from "../requestDepartmentTypes";

import { getAllRequestStatus } from "../../../services/RequestStatusCrud/getAll";
import {
  REQUEST_STATUS_CODES,
  resolveRequestStatusTitle,
} from "../requestStatuses";

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
  onChange,
  onSave,
  onClose,
}: {
  isOpen: boolean;
  form: PropertyAppraisalInputDto;
  lookups: PropertyAppraisalLookupsDto;
  isSaving: boolean;
  onChange: (
    field: keyof PropertyAppraisalInputDto,
    value: string | boolean | number,
  ) => void;
  onSave: () => void;
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
    <Modal
      isOpen={isOpen}
      isRTL
      header="فرم ارزیابی ملک"
      onClose={onClose}
      className="min-w-[1100px]"
      overlayLock={isSaving}
      footerButtons={
        <div className="flex gap-2">
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

          {/* بخش ۲: اطلاعات ثبتی */}
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

          {/* بخش ۳: مشخصات ملک و کاربری */}
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

          {/* بخش ۵ تا ۱۱ مثل قبل */}
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
        </div>
      )}
    />
  );
}

// ─── Main Component ──────────────────────────────────────────────
interface RealEstateCircleHeadReviewPageProps {
  departmentType: RequestDepartmentTypeConfig;
}

export function DepartmentRealEstateCircleHeadReviewPage({
  departmentType,
}: RealEstateCircleHeadReviewPageProps) {
  const { showToast } = useToast();
  const { user } = useAuthStore();

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

  // فقط فرم ارزیابی متعلق به ستاد؛ قابل ایجاد/ویرایش
  const [mainOfficeAppraisal, setMainOfficeAppraisal] =
    useState<PropertyAppraisalOutputDto | null>(null);

  // فرم ایجادشده توسط شعبه، شعبه مستقل یا منطقه؛ فقط قابل مشاهده
  const [externalAppraisal, setExternalAppraisal] =
    useState<PropertyAppraisalOutputDto | null>(null);

  const [isAppraisalReadOnlyOpen, setIsAppraisalReadOnlyOpen] = useState(false);

  const userCacheRef = useRef<Map<number, { name: string; role: string }>>(
    new Map(),
  );

  const statusQuery = useQuery({
    queryKey: ["request-statuses"],
    queryFn: () => getAllRequestStatus({ maxResultCount: 100 }),
    staleTime: 10 * 60 * 1000,
  });

  const statuses = statusQuery.data?.items;

  const lookupsQuery = useQuery({
    queryKey: ["property-appraisal-lookups"],
    queryFn: getPropertyAppraisalLookups,
    staleTime: 10 * 60 * 1000,
  });

  const lookups = useMemo(
    () => (lookupsQuery.data ?? {}) as PropertyAppraisalLookupsDto,
    [lookupsQuery.data],
  );

  const requestsQuery = useQuery({
    queryKey: [
      "requests-real-estate-circle-head-review",
      departmentType.id,
      pagination.pageIndex,
      pagination.pageSize,
      filters,
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
          r.requestStatusCode ===
            REQUEST_STATUS_CODES.realEstateCircleHeadReview ||
          r.requestStatusCode ===
            REQUEST_STATUS_CODES.realEstateCircleHeadReturned,
      );
      return {
        listResult: items,
        total: data.totalCount ?? items.length,
        totalPages: Math.max(
          1,
          Math.ceil((data.totalCount ?? items.length) / pagination.pageSize),
        ),
      };
    },
    enabled: statusQuery.isSuccess,
  });

  const getUserCacheData = useCallback((userId: number) => {
    return (
      userCacheRef.current.get(userId) || { name: `کاربر ${userId}`, role: "-" }
    );
  }, []);

  const handleView = useCallback(
    async (req: RequestItem) => {
      setSelectedRequest(null);
      setComment("");

      setMainOfficeAppraisal(null);
      setExternalAppraisal(null);
      setAssetForm({});

      setIsAssetModalOpen(false);
      setIsAppraisalReadOnlyOpen(false);
      setIsDetailOpen(true);

      try {
        await viewRequest(req.id);

        const detail = await getRequest(req.id);
        setSelectedRequest(detail);

        try {
          const appraisals = await getPropertyAppraisalByRequestId(req.id);

          console.log("appraisals after service:", appraisals);

          const mainOfficeDepartmentId = REQUEST_DEPARTMENT_TYPES.mainOffice.id;

          console.log("mainOfficeDepartmentId:", mainOfficeDepartmentId);

          const mainOfficeForm =
            appraisals.find(
              (appraisal) =>
                Number(appraisal.creatorDepartmentId) ===
                Number(mainOfficeDepartmentId),
            ) ?? null;

          const externalForm =
            appraisals.find(
              (appraisal) =>
                Number(appraisal.creatorDepartmentId) !==
                Number(mainOfficeDepartmentId),
            ) ?? null;

          console.log("mainOfficeForm:", mainOfficeForm);
          console.log("externalForm:", externalForm);

          setMainOfficeAppraisal(mainOfficeForm);
          setExternalAppraisal(externalForm);
          setAssetForm(mainOfficeForm ?? {});
        } catch (error) {
          console.error("Error loading property appraisals:", error);

          setMainOfficeAppraisal(null);
          setExternalAppraisal(null);
          setAssetForm({});
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
            const u = await getUserById(id);

            userCacheRef.current.set(id, {
              name:
                u?.fullName ||
                `${u?.name ?? ""} ${u?.surname ?? ""}`.trim() ||
                `کاربر ${id}`,
              role: u?.roleNames?.[0] || "-",
            });
          }
        }
      } catch (error) {
        console.error("Error in handleView:", error);
        showToast("خطا در بارگذاری اطلاعات", "error");
      }
    },
    [showToast],
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
        showToast(accepted ? "درخواست تأیید شد" : "درخواست رد شد", "success");
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
    if (mainOfficeAppraisal) {
      // فرم ستاد قبلاً ثبت شده و قابل ویرایش است
      setAssetForm(mainOfficeAppraisal);
    } else {
      // حتی اگر externalAppraisal وجود دارد، ستاد مجاز به ساخت فرم خودش است
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
      });
    }

    setIsAssetModalOpen(true);
  }, [mainOfficeAppraisal, selectedRequest, user]);

  const handleSaveAppraisal = useCallback(async () => {
    if (!selectedRequest?.id) {
      showToast("شناسه درخواست نامعتبر است.", "error");
      return;
    }

    setIsSavingAppraisal(true);

    try {
      const mainOfficeDepartmentId = REQUEST_DEPARTMENT_TYPES.mainOffice.id;

      const cleanBody: PropertyAppraisalInputDto = {
        ...assetForm,
        requestId: selectedRequest.id,
        creatorDepartmentId: mainOfficeDepartmentId,
      };

      /*
       * حذف مقادیر خالی، null و undefined.
       * مقدار false حذف نمی‌شود تا checkboxهای false به backend ارسال شوند.
       */
      (Object.keys(cleanBody) as (keyof PropertyAppraisalInputDto)[]).forEach(
        (key) => {
          const value = cleanBody[key];

          if (value === null || value === undefined || value === "") {
            delete cleanBody[key];
          }
        },
      );

      let saved: PropertyAppraisalOutputDto;

      if (mainOfficeAppraisal?.id) {
        /*
         * فرم ستاد در state پیدا شده است؛
         * همان فرم update می‌شود.
         */
        saved = await updatePropertyAppraisal({
          ...cleanBody,
          id: mainOfficeAppraisal.id,
        });

        showToast("فرم ارزیابی ستاد با موفقیت ویرایش شد.", "success");
      } else {
        /*
         * بررسی نهایی API برای جلوگیری از ثبت تکراری
         * در شرایطی مانند stale state یا بازبودن هم‌زمان چند تب.
         */
        const latestAppraisals = await getPropertyAppraisalByRequestId(
          selectedRequest.id,
        );

        const existingMainOfficeAppraisal =
          latestAppraisals.find(
            (appraisal) =>
              appraisal.creatorDepartmentId === mainOfficeDepartmentId,
          ) ?? null;

        if (existingMainOfficeAppraisal?.id) {
          saved = await updatePropertyAppraisal({
            ...cleanBody,
            id: existingMainOfficeAppraisal.id,
          });

          showToast(
            "فرم ارزیابی ستاد از قبل وجود داشت و با موفقیت ویرایش شد.",
            "success",
          );
        } else {
          saved = await createPropertyAppraisal(cleanBody);

          showToast("فرم ارزیابی ستاد با موفقیت ثبت شد.", "success");
        }
      }

      setMainOfficeAppraisal(saved);
      setAssetForm(saved);
      setIsAssetModalOpen(false);
    } catch (error: unknown) {
      console.error("Error saving appraisal:", error);
      showToast(getErrorMessage(error, "خطا در ذخیره ارزیابی"), "error");
    } finally {
      setIsSavingAppraisal(false);
    }
  }, [assetForm, mainOfficeAppraisal, selectedRequest, showToast]);

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

  return (
    <MainLayout.Main maxWidth="screen-xl">
      <PageTitle title="بررسی و امضا توسط رئیس دایره املاک" />
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
        header="بررسی و امضا توسط رئیس دایره املاک"
        onClose={() => setIsDetailOpen(false)}
        overlayLock={isSubmitting}
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title="رد درخواست"
              variant="danger"
              onClick={() => handleAction(false)}
              isLoading={isSubmitting}
            />
            <FormButton
              title="تأیید و امضا"
              variant="success"
              onClick={() => handleAction(true)}
              isLoading={isSubmitting}
            />
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
              <RequestDetailSection
                icon={<ClipboardList className="w-5 h-5" />}
                title="فرم ارزیابی ملک"
                tone="blue"
              >
                <div className="space-y-3">
                  {/* ارزیابی ثبت‌شده توسط شعبه / شعبه مستقل / منطقه */}
                  {externalAppraisal && (
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <div className="text-sm text-amber-800">
                        فرم ارزیابی توسط واحد دیگری ثبت شده است و فقط قابل
                        مشاهده است.
                      </div>

                      <FormButton
                        title="مشاهده فرم ارزیابی واحد"
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsAppraisalReadOnlyOpen(true)}
                      />
                    </div>
                  )}

                  {/* ارزیابی ستاد */}
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <div className="text-sm text-blue-800">
                      {mainOfficeAppraisal
                        ? "فرم ارزیابی ستاد ثبت شده است و امکان ویرایش آن وجود دارد."
                        : "فرم ارزیابی ستاد ثبت نشده است. می‌توانید فرم جدید ایجاد کنید."}
                    </div>

                    <FormButton
                      title={
                        mainOfficeAppraisal
                          ? "ویرایش فرم ارزیابی ستاد"
                          : "ایجاد فرم ارزیابی ستاد"
                      }
                      variant="primary"
                      size="sm"
                      onClick={handleOpenAssetModal}
                    />
                  </div>
                </div>
              </RequestDetailSection>

              <RequestDetailSection
                icon={<MessageSquareText className="w-5 h-5" />}
                title="توضیحات تکمیلی"
                tone="amber"
              >
                <FormTextarea
                  id="cmt"
                  name="cmt"
                  label="توضیحات کارشناس"
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
        onChange={handleFormChange}
        onSave={handleSaveAppraisal}
        onClose={() => setIsAssetModalOpen(false)}
      />

      <PropertyAppraisalReadOnlyModal
        isOpen={isAppraisalReadOnlyOpen}
        appraisal={externalAppraisal}
        lookups={lookups}
        onClose={() => setIsAppraisalReadOnlyOpen(false)}
      />
    </MainLayout.Main>
  );
}

export default function RealEstateCircleHeadReviewPage() {
  return (
    <DepartmentRealEstateCircleHeadReviewPage
      departmentType={REQUEST_DEPARTMENT_TYPES.mainOffice}
    />
  );
}
