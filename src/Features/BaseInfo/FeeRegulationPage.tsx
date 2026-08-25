// src/Features/BaseInfo/FeeRegulationPage.tsx

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
  return num.toLocaleString("fa-IR");
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

// ─── Main Component ──────────────────────────────────────────────
export default function FeeRegulationPage() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"settings" | "slabs">("settings");

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
      value: String(item.value),
      descriptionFa: item.descriptionFa || "",
    });
    setIsSettingModalOpen(true);
  }, []);

  const handleSaveSetting = useCallback(async () => {
    if (!editingSetting) return;
    setIsSavingSetting(true);
    try {
      const body: UpdateFeeSettingBody = {
        id: editingSetting.id,
        titleFa: settingForm.titleFa.trim(),
        value: Number(settingForm.value),
        unitFa: editingSetting.unitFa || "ریال",
        descriptionFa: settingForm.descriptionFa?.trim() || null,
        displayOrder: editingSetting.displayOrder,
        isActive: editingSetting.isActive,
      };
      await updateFeeSetting(body);
      showToast("پارامتر با موفقیت ویرایش شد", "success");
      setIsSettingModalOpen(false);
      settingsQuery.refetch();
    } catch (error: unknown) {
      showToast(getErrorMessage(error, "خطا در ذخیره"), "error");
    } finally {
      setIsSavingSetting(false);
    }
  }, [editingSetting, settingForm, settingsQuery, showToast]);

  const handleEditSlab = useCallback((item: FeeSlabItem) => {
    setEditingSlab(item);
    setSlabForm({
      titleFa: item.titleFa || "",
      fromAmount: String(item.fromAmount),
      toAmount: item.toAmount !== null ? String(item.toAmount) : "",
      rate: String(item.rate),
      fixedAmount: item.fixedAmount !== null ? String(item.fixedAmount) : "",
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
        fromAmount: Number(slabForm.fromAmount),
        toAmount: slabForm.toAmount ? Number(slabForm.toAmount) : null,
        rate: Number(slabForm.rate),
        fixedAmount: slabForm.fixedAmount ? Number(slabForm.fixedAmount) : null,
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
                value={settingForm.value}
                onChange={(v) => setSettingForm((p) => ({ ...p, value: v }))}
                dir="ltr"
                type="number"
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
                onChange={(v) => setSlabForm((p) => ({ ...p, fromAmount: v }))}
                dir="ltr"
                type="number"
              />
              <FormInput
                id="slab-to"
                name="slab-to"
                label="تا مبلغ (ریال - خالی = بدون سقف)"
                value={slabForm.toAmount}
                onChange={(v) => setSlabForm((p) => ({ ...p, toAmount: v }))}
                dir="ltr"
                type="number"
              />
              <FormInput
                id="slab-rate"
                name="slab-rate"
                label="نرخ اعمالی"
                value={slabForm.rate}
                onChange={(v) => setSlabForm((p) => ({ ...p, rate: v }))}
                dir="ltr"
                type="number"
              />
              <FormInput
                id="slab-fixed"
                name="slab-fixed"
                label="مبلغ ثابت (ریال)"
                value={slabForm.fixedAmount}
                onChange={(v) => setSlabForm((p) => ({ ...p, fixedAmount: v }))}
                dir="ltr"
                type="number"
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
    </MainLayout.Main>
  );
}
