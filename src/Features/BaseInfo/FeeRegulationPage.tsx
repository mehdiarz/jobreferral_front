import { useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Calculator, Layers, Pencil } from "lucide-react";

import { MainLayout } from "../../baseComponents/MainLayout";
import FormInput from "../../baseComponents/FormInput";
import FormTextarea from "../../baseComponents/FormTextarea";
import FormButton from "../../baseComponents/FormButton";
import PageTitle from "../../baseComponents/PageTitle";
import DataTable from "../../baseComponents/DataTable";
import Modal from "../../baseComponents/Modal";
import { useToast } from "../../libs/toastContext";

import { getAllFeeSettings } from "../../services/FeeSettingCrud/getAll";
import { updateFeeSetting } from "../../services/FeeSettingCrud/update";
import { getAllFeeSlabs } from "../../services/FeeSlabCrud/getAll";
import { updateFeeSlab } from "../../services/FeeSlabCrud/update";
import {
  calculateBankFee,
  calculateJudicialFee,
} from "../../services/FeeCalculationCrud/feeCalculation";
import type {
  CalculateBankFeeInput,
  CalculateJudicialFeeInput,
  FeeCalculationResultDto,
} from "../../services/FeeCalculationCrud/types";
import type {
  FeeSettingItem,
  UpdateFeeSettingBody,
} from "../../services/FeeSettingCrud/types";
import type {
  FeeSlabItem,
  UpdateFeeSlabBody,
} from "../../services/FeeSlabCrud/types";

// ─── Types ───────────────────────────────────────────────────────
type TableFilter = { key: string; value: string };

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return "-";
  return num.toLocaleString("fa-IR", {
    maximumFractionDigits: 6,
    useGrouping: true,
  });
}

function getUnitLabel(unit: string | null | undefined): string {
  switch (unit) {
    case "ریال":
      return "ریال";
    case "ضریب":
      return "ضریب";
    case "درصد":
      return "درصد";
    default:
      return unit || "ریال";
  }
}

function formatInputNumber(value: string): string {
  if (!value) return "";
  const parts = value.toString().replace(/,/g, "").split(".");
  // فقط ارقام در بخش صحیح
  parts[0] = parts[0].replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (parts.length > 1) {
    // جلوگیری از وارد کردن کاراکتر غیر عددی در بخش اعشار
    parts[1] = parts[1].replace(/\D/g, "");
    return `${parts[0]}.${parts[1]}`;
  }
  return parts[0];
}

function parseFormattedNumber(value: string): number {
  const clean = value.replace(/,/g, "");
  return clean === "" ? 0 : Number(clean);
}

// ─── Main Component ──────────────────────────────────────────────
export default function FeeRegulationPage() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"settings" | "slabs" | "test">(
    "settings",
  );

  // Settings
  const [settingsFilters, setSettingsFilters] = useState<TableFilter[]>([]);
  const [isSettingModalOpen, setIsSettingModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<FeeSettingItem | null>(
    null,
  );
  const [settingForm, setSettingForm] = useState({
    titleFa: "",
    value: "",
    descriptionFa: "",
    isActive: true,
  });
  const [isSavingSetting, setIsSavingSetting] = useState(false);

  // Slabs
  const [slabsFilters, setSlabsFilters] = useState<TableFilter[]>([]);
  const [isSlabModalOpen, setIsSlabModalOpen] = useState(false);
  const [editingSlab, setEditingSlab] = useState<FeeSlabItem | null>(null);
  const [slabForm, setSlabForm] = useState({
    titleFa: "",
    fromAmount: "",
    toAmount: "",
    rate: "",
    fixedAmount: "",
    descriptionFa: "",
  });
  const [isSavingSlab, setIsSavingSlab] = useState(false);

  const [testFacilityAmount, setTestFacilityAmount] = useState("");
  const [testPropertyValue, setTestPropertyValue] = useState("");
  const [testResult, setTestResult] = useState<{
    bank: FeeCalculationResultDto | null;
    judicial: FeeCalculationResultDto | null;
  }>({ bank: null, judicial: null });
  const [isTesting, setIsTesting] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  // ─── Queries ───────────────────────────────────────────────────
  const settingsQuery = useQuery({
    queryKey: ["fee-settings"],
    queryFn: () => getAllFeeSettings({ maxResultCount: 1000 }),
    staleTime: 5 * 60 * 1000,
  });

  const slabsQuery = useQuery({
    queryKey: ["fee-slabs"],
    queryFn: () => getAllFeeSlabs({}),
    staleTime: 5 * 60 * 1000,
  });

  // ─── Handlers ──────────────────────────────────────────────────
  const handleEditSetting = useCallback((item: FeeSettingItem) => {
    setEditingSetting(item);
    setSettingForm({
      titleFa: item.titleFa || "",
      value: formatInputNumber(String(item.value ?? "")),
      descriptionFa: item.descriptionFa || "",
      isActive: item.isActive ?? true, // <-- لود مقدار فعلی
    });
    setIsSettingModalOpen(true);
  }, []);

  const executeSaveSetting = async () => {
    if (!editingSetting) return;
    setIsSavingSetting(true);
    try {
      const body: UpdateFeeSettingBody = {
        id: editingSetting.id,
        titleFa: settingForm.titleFa.trim(),
        value: parseFormattedNumber(settingForm.value),
        unitFa: editingSetting.unitFa || "ریال",
        descriptionFa: settingForm.descriptionFa?.trim() || null,
        displayOrder: editingSetting.displayOrder,
        isActive: settingForm.isActive, // <-- ارسال وضعیت جدید
      };
      await updateFeeSetting(body);
      showToast("پارامتر با موفقیت ویرایش شد", "success");
      setIsSettingModalOpen(false);
      setConfirmModal((p) => ({ ...p, isOpen: false }));
      settingsQuery.refetch();
    } catch (error: unknown) {
      showToast(getErrorMessage(error, "خطا در ذخیره"), "error");
    } finally {
      setIsSavingSetting(false);
    }
  };

  const handleSaveSetting = () => {
    const isStatusChanged = editingSetting?.isActive !== settingForm.isActive;
    const sideEffectNotice =
      isStatusChanged && editingSetting?.isActiveSideEffect
        ? `\n\n⚠️ پیامد تغییر وضعیت:\n${editingSetting.isActiveSideEffect}`
        : "";

    setConfirmModal({
      isOpen: true,
      title: "تأیید ذخیره‌سازی پارامتر",
      description: `آیا از ذخیره تغییرات پارامتر «${settingForm.titleFa || editingSetting?.titleFa}» با وضعیت «${settingForm.isActive ? "فعال" : "غیرفعال"}» اطمینان دارید؟${sideEffectNotice}`,
      onConfirm: executeSaveSetting,
    });
  };

  const handleEditSlab = useCallback((item: FeeSlabItem) => {
    setEditingSlab(item);
    setSlabForm({
      titleFa: item.titleFa || "",
      fromAmount: formatInputNumber(String(item.fromAmount ?? "")),
      toAmount:
        item.toAmount !== null ? formatInputNumber(String(item.toAmount)) : "",
      rate: formatInputNumber(String(item.rate ?? "")),
      fixedAmount:
        item.fixedAmount !== null
          ? formatInputNumber(String(item.fixedAmount))
          : "",
      descriptionFa: item.descriptionFa || "",
    });
    setIsSlabModalOpen(true);
  }, []);

  const handleSaveSlab = useCallback(async () => {
    if (!editingSlab) return;
    setIsSavingSlab(true);
    try {
      const body: UpdateFeeSlabBody = {
        id: editingSlab.id,
        titleFa: slabForm.titleFa.trim(),
        fromAmount: parseFormattedNumber(slabForm.fromAmount),
        toAmount: slabForm.toAmount
          ? parseFormattedNumber(slabForm.toAmount)
          : null,
        rate: parseFormattedNumber(slabForm.rate),
        fixedAmount: slabForm.fixedAmount
          ? parseFormattedNumber(slabForm.fixedAmount)
          : null,

        order: editingSlab.order,
        descriptionFa: slabForm.descriptionFa?.trim() || null,
        isActive: editingSlab.isActive,
      };
      await updateFeeSlab(body);
      showToast("پله محاسباتی با موفقیت ویرایش شد", "success");
      setIsSlabModalOpen(false);
      slabsQuery.refetch();
    } catch (error: unknown) {
      showToast(getErrorMessage(error, "خطا در ذخیره"), "error");
    } finally {
      setIsSavingSlab(false);
    }
  }, [editingSlab, slabForm, slabsQuery, showToast]);

  const handleTestCalculation = useCallback(async () => {
    const facilityAmount = Number(testFacilityAmount.replace(/,/g, ""));
    const propertyValue = Number(testPropertyValue.replace(/,/g, ""));

    if (
      !facilityAmount ||
      !propertyValue ||
      facilityAmount <= 0 ||
      propertyValue <= 0
    ) {
      showToast("مبالغ وارد شده معتبر نیستند", "error");
      return;
    }

    setIsTesting(true);
    try {
      const bankInput: CalculateBankFeeInput = {
        facilityAmount,
        propertyValue,
      };
      const judicialInput: CalculateJudicialFeeInput = {
        facilityAmount,
        propertyValue,
      };

      const [bankResult, judicialResult] = await Promise.all([
        calculateBankFee(bankInput),
        calculateJudicialFee(judicialInput),
      ]);

      setTestResult({ bank: bankResult, judicial: judicialResult });
      showToast("محاسبه تستی انجام شد", "success");
    } catch (error: unknown) {
      showToast(getErrorMessage(error, "خطا در محاسبه تستی"), "error");
    } finally {
      setIsTesting(false);
    }
  }, [testFacilityAmount, testPropertyValue, showToast]);

  // ─── Columns ───────────────────────────────────────────────────
  const settingsColumns = useMemo<ColumnDef<FeeSettingItem, unknown>[]>(
    () => [
      {
        id: "index",
        header: "ردیف",
        cell: ({ row }) => String(row.index + 1),
      },
      {
        id: "titleFa",
        header: "عنوان پارامتر",
        cell: ({ row }) => row.original.titleFa || "-",
      },
      {
        id: "value",
        header: "مقدار",
        cell: ({ row }) => (
          <span className="font-bold" dir="rtl">
            {formatNumber(row.original.value)}
          </span>
        ),
      },
      {
        id: "unit",
        header: "واحد",
        cell: ({ row }) => (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
            {getUnitLabel(row.original.unitFa)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "عملیات",
        cell: ({ row }) => (
          <button
            onClick={() => handleEditSetting(row.original)}
            className="inline-flex cursor-pointer items-center rounded-lg border border-blue-100 bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
            title="ویرایش"
          >
            <Pencil className="h-4 w-4" />
          </button>
        ),
      },
      {
        id: "isActive",
        header: "وضعیت",
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              row.original.isActive
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            {row.original.isActive ? "فعال" : "غیرفعال"}
          </span>
        ),
      },
    ],
    [handleEditSetting],
  );

  const slabsColumns = useMemo<ColumnDef<FeeSlabItem, unknown>[]>(
    () => [
      {
        id: "order",
        header: "پله",
        cell: ({ row }) => `پله ${row.original.order}`,
      },
      {
        id: "titleFa",
        header: "عنوان بازه",
        cell: ({ row }) => row.original.titleFa || "-",
      },
      {
        id: "fromAmount",
        header: "از مبلغ (ریال)",
        cell: ({ row }) => (
          <span dir="rtl">{formatNumber(row.original.fromAmount)}</span>
        ),
      },
      {
        id: "toAmount",
        header: "تا مبلغ (ریال)",
        cell: ({ row }) =>
          row.original.toAmount ? (
            <span dir="ltr">{formatNumber(row.original.toAmount)}</span>
          ) : (
            "بدون سقف"
          ),
      },
      {
        id: "rate",
        header: "نرخ اعمالی",
        cell: ({ row }) => (
          <span className="font-bold text-blue-600" dir="rtl">
            {formatNumber(row.original.rate)}
          </span>
        ),
      },
      {
        id: "fixedAmount",
        header: "مبلغ ثابت (ریال)",
        cell: ({ row }) => (
          <span dir="ltr">{formatNumber(row.original.fixedAmount)}</span>
        ),
      },
      {
        id: "actions",
        header: "عملیات",
        cell: ({ row }) => (
          <button
            onClick={() => handleEditSlab(row.original)}
            className="inline-flex cursor-pointer items-center rounded-lg border border-blue-100 bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
            title="ویرایش"
          >
            <Pencil className="h-4 w-4" />
          </button>
        ),
      },
    ],
    [handleEditSlab],
  );

  // ─── Query Results ─────────────────────────────────────────────
  const settingsQueryResult = useMemo(
    () => ({
      data: {
        listResult: settingsQuery.data?.items ?? [],
        total: settingsQuery.data?.totalCount ?? 0,
        totalPages: 1,
      },
      isLoading: settingsQuery.isLoading,
      isError: settingsQuery.isError,
      isFetching: settingsQuery.isFetching,
    }),
    [settingsQuery],
  );

  const slabsQueryResult = useMemo(
    () => ({
      data: {
        listResult: slabsQuery.data?.items ?? [],
        total: slabsQuery.data?.totalCount ?? 0,
        totalPages: 1,
      },
      isLoading: slabsQuery.isLoading,
      isError: slabsQuery.isError,
      isFetching: slabsQuery.isFetching,
    }),
    [slabsQuery],
  );

  // ─── Render ──────────────────────────────────────────────────
  return (
    <MainLayout.Main maxWidth="screen-xl">
      <PageTitle
        title="بخشنامه حق‌الزحمه"
        subtitle="مشاهده و ویرایش مبالغ مبنا، ضرایب محاسباتی و پلکان‌های مصوب"
      />

      {/* تب‌ها */}
      <div className="mb-6 flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
            activeTab === "settings"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-blue-600"
          }`}
        >
          <Calculator className="h-4 w-4" />
          پارامترها و ضرایب پایه
        </button>
        <button
          onClick={() => setActiveTab("slabs")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
            activeTab === "slabs"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-blue-600"
          }`}
        >
          <Layers className="h-4 w-4" />
          جدول پلکان‌های کارمزد
        </button>
        <button
          onClick={() => setActiveTab("test")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
            activeTab === "test"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-blue-600"
          }`}
        >
          <Calculator className="h-4 w-4" />
          تست محاسبه
        </button>
      </div>

      {/* پارامترها */}
      {activeTab === "settings" && (
        <div className="pb-16">
          <DataTable<FeeSettingItem>
            query={settingsQueryResult}
            columns={settingsColumns}
            pagination={{ pageIndex: 0, pageSize: 20 }}
            onPaginationChange={() => {}}
            filters={settingsFilters}
            onFiltersChange={(nf) => {
              setSettingsFilters(nf.length ? [nf[nf.length - 1]] : []);
            }}
            filterFields={[
              { field: "titleFa", label: "عنوان" },
              { field: "descriptionFa", label: "توضیحات" },
            ]}
            searchMode="onEnter"
            emptyStateMessage="هیچ پارامتری یافت نشد"
          />
        </div>
      )}

      {activeTab === "test" && (
        <div className="pb-16">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                تست محاسبه کارمزد
              </h3>
              <p className="text-sm text-slate-500">
                این بخش فقط برای تست فرمول‌های محاسباتی است و نتیجه آن ذخیره
                نمی‌شود.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <FormInput
                id="test-facility"
                name="test-facility"
                label="مبلغ تسهیلات (ریال)"
                value={testFacilityAmount}
                onChange={(v) => {
                  setTestFacilityAmount(formatInputNumber(v));
                  setTestResult({ bank: null, judicial: null });
                }}
                dir="ltr"
                placeholder="مثال: 1,000,000,000"
              />
              <FormInput
                id="test-property"
                name="test-property"
                label="ارزش ملک (ریال)"
                value={testPropertyValue}
                onChange={(v) => {
                  setTestPropertyValue(formatInputNumber(v));
                  setTestResult({ bank: null, judicial: null });
                }}
                dir="ltr"
                placeholder="مثال: 2,000,000,000"
              />
            </div>

            <FormButton
              title="محاسبه تستی"
              variant="primary"
              onClick={handleTestCalculation}
              isLoading={isTesting}
              disabled={isTesting || !testFacilityAmount || !testPropertyValue}
            />

            {(testResult.bank || testResult.judicial) && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {testResult.bank && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <p className="font-bold text-blue-700 mb-3">کارمزد بانک</p>
                    <div className="space-y-2 text-sm">
                      <p className="text-slate-700">
                        مبلغ کارمزد:{" "}
                        <span dir="ltr" className="font-bold text-blue-700">
                          {formatNumber(testResult.bank.bankFee)} ریال
                        </span>
                      </p>
                      <p className="text-slate-600">
                        نوع کارشناسی:{" "}
                        <span className="font-bold">
                          {testResult.bank.isBoard ? "هیئتی" : "تک‌نفره"}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {testResult.judicial && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="font-bold text-emerald-700 mb-3">
                      حق‌الزحمه کارشناس دادگستری
                    </p>
                    <div className="space-y-2 text-sm">
                      <p className="text-slate-700">
                        مبلغ حق‌الزحمه:{" "}
                        <span dir="ltr" className="font-bold text-emerald-700">
                          {formatNumber(testResult.judicial.judicialFee)} ریال
                        </span>
                      </p>
                      <p className="text-slate-600">
                        نوع کارشناسی:{" "}
                        <span className="font-bold">
                          {testResult.judicial.isBoard ? "هیئتی" : "تک‌نفره"}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* پلکان‌ها */}
      {activeTab === "slabs" && (
        <div className="pb-16">
          <DataTable<FeeSlabItem>
            query={slabsQueryResult}
            columns={slabsColumns}
            pagination={{ pageIndex: 0, pageSize: 20 }}
            onPaginationChange={() => {}}
            filters={slabsFilters}
            onFiltersChange={(nf) => {
              setSlabsFilters(nf.length ? [nf[nf.length - 1]] : []);
            }}
            filterFields={[{ field: "titleFa", label: "عنوان بازه" }]}
            searchMode="onEnter"
            emptyStateMessage="هیچ پله‌ای یافت نشد"
          />
        </div>
      )}

      {/* مودال ویرایش پارامتر - واحد غیر قابل تغییر */}
      <Modal
        isOpen={isSettingModalOpen}
        isRTL
        header={`ویرایش پارامتر${editingSetting?.titleFa ? `: ${editingSetting.titleFa}` : ""}`}
        onClose={() => setIsSettingModalOpen(false)}
        overlayLock={isSavingSetting}
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title="ذخیره"
              variant="primary"
              onClick={handleSaveSetting}
              isLoading={isSavingSetting}
              disabled={isSavingSetting}
            />
            <FormButton
              title="انصراف"
              variant="secondary"
              onClick={() => setIsSettingModalOpen(false)}
            />
          </div>
        }
        renderContent={() => (
          <div className="space-y-4">
            <FormInput
              id="setting-title"
              name="setting-title"
              label="عنوان پارامتر"
              value={settingForm.titleFa}
              onChange={(v) => setSettingForm((p) => ({ ...p, titleFa: v }))}
              dir="rtl"
            />
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                id="setting-value"
                name="setting-value"
                label="مقدار عددی"
                type="text" // برای پشتیبانی از کاراکتر کاما
                value={settingForm.value}
                onChange={(v) =>
                  setSettingForm((p) => ({ ...p, value: formatInputNumber(v) }))
                }
                dir="ltr"
              />
              <FormInput
                id="setting-unit"
                name="setting-unit"
                label="واحد"
                value={getUnitLabel(editingSetting?.unitFa)}
                onChange={() => {}}
                dir="rtl"
                disabled
              />
            </div>

            {/* سوئیچ وضعیت isActive همراه با نمایش isActiveSideEffect */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    وضعیت پارامتر
                  </p>
                  <p className="text-xs text-slate-500">
                    فعال یا غیرفعال بودن این ضریب در محاسبات
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={settingForm.isActive}
                    onChange={(e) =>
                      setSettingForm((p) => ({
                        ...p,
                        isActive: e.target.checked,
                      }))
                    }
                  />
                  <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:top-[2px] after:start-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full"></div>
                  <span className="ms-2 text-xs font-semibold text-slate-700">
                    {settingForm.isActive ? "فعال" : "غیرفعال"}
                  </span>
                </label>
              </div>

              {/* نمایش پیام اثر جانبی */}
              {editingSetting?.isActiveSideEffect && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold text-amber-700 ml-1">توجه:</span>
                  {editingSetting.isActiveSideEffect}
                </div>
              )}
            </div>

            <FormTextarea
              id="setting-desc"
              name="setting-desc"
              label="توضیحات"
              value={settingForm.descriptionFa}
              onChange={(v) =>
                setSettingForm((p) => ({ ...p, descriptionFa: v }))
              }
              rows={3}
              dir="rtl"
            />
          </div>
        )}
      />

      {/* مودال ویرایش پله */}
      <Modal
        isOpen={isSlabModalOpen}
        isRTL
        header={`ویرایش پله محاسباتی${editingSlab?.titleFa ? `: ${editingSlab.titleFa}` : ""}`}
        onClose={() => setIsSlabModalOpen(false)}
        overlayLock={isSavingSlab}
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title="ذخیره"
              variant="primary"
              onClick={handleSaveSlab}
              isLoading={isSavingSlab}
              disabled={isSavingSlab}
            />
            <FormButton
              title="انصراف"
              variant="secondary"
              onClick={() => setIsSlabModalOpen(false)}
            />
          </div>
        }
        renderContent={() => (
          <div className="space-y-4">
            <FormInput
              id="slab-title"
              name="slab-title"
              label="عنوان پله"
              value={slabForm.titleFa}
              onChange={(v) => setSlabForm((p) => ({ ...p, titleFa: v }))}
              dir="rtl"
            />
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                id="slab-from"
                name="slab-from"
                label="از مبلغ (ریال)"
                value={slabForm.fromAmount}
                onChange={(v) =>
                  setSlabForm((p) => ({
                    ...p,
                    fromAmount: formatInputNumber(v),
                  }))
                }
                dir="ltr"
              />
              <FormInput
                id="slab-to"
                name="slab-to"
                label="تا مبلغ (ریال - خالی = بدون سقف)"
                value={slabForm.toAmount}
                onChange={(v) =>
                  setSlabForm((p) => ({ ...p, toAmount: formatInputNumber(v) }))
                }
                dir="ltr"
              />
              <FormInput
                id="slab-rate"
                name="slab-rate"
                label="نرخ اعمالی"
                value={slabForm.rate}
                onChange={(v) =>
                  setSlabForm((p) => ({ ...p, rate: formatInputNumber(v) }))
                }
                dir="ltr"
              />
              <FormInput
                id="slab-fixed"
                name="slab-fixed"
                label="مبلغ ثابت (ریال)"
                value={slabForm.fixedAmount}
                onChange={(v) =>
                  setSlabForm((p) => ({
                    ...p,
                    fixedAmount: formatInputNumber(v),
                  }))
                }
                dir="ltr"
              />
            </div>

            <FormTextarea
              id="slab-desc"
              name="slab-desc"
              label="توضیحات"
              value={slabForm.descriptionFa}
              onChange={(v) => setSlabForm((p) => ({ ...p, descriptionFa: v }))}
              rows={3}
              dir="rtl"
            />
          </div>
        )}
      />
      <Modal
        isOpen={confirmModal.isOpen}
        isRTL
        header={confirmModal.title}
        onClose={() => setConfirmModal((p) => ({ ...p, isOpen: false }))}
        overlayLock={isSavingSetting || isSavingSlab}
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title="بله، ذخیره شود"
              variant="primary"
              onClick={confirmModal.onConfirm}
              isLoading={isSavingSetting || isSavingSlab}
            />
            <FormButton
              title="انصراف"
              variant="secondary"
              onClick={() => setConfirmModal((p) => ({ ...p, isOpen: false }))}
            />
          </div>
        }
        renderContent={() => (
          <p className="text-sm text-slate-600 leading-relaxed py-2">
            {confirmModal.description}
          </p>
        )}
      />
    </MainLayout.Main>
  );
}
