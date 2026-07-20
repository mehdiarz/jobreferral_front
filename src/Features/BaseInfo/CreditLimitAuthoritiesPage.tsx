import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, Pencil, Trash2, FileDown } from "lucide-react";

import { MainLayout } from "../../baseComponents/MainLayout";
import { FluidGrid } from "../../baseComponents/FluidGrid";
import { FluidCol } from "../../baseComponents/FluidCol";
import FormInput from "../../baseComponents/FormInput";
import FormSelect from "../../baseComponents/FormSelect";
import FormButton from "../../baseComponents/FormButton";
import PageTitle from "../../baseComponents/PageTitle";
import DataTable from "../../baseComponents/DataTable";
import Modal from "../../baseComponents/Modal";
import { useToast } from "../../libs/toastContext";

import { createCreditLimitAuthority } from "../../services/CreditLimitAuthorityCrud/create";
import { getAllCreditLimitAuthorities } from "../../services/CreditLimitAuthorityCrud/getAll";
import { editCreditLimitAuthority } from "../../services/CreditLimitAuthorityCrud/update";
import { deleteCreditLimitAuthority } from "../../services/CreditLimitAuthorityCrud/delete";
import type {
  CreditLimitAuthorityItem,
  CreateCreditLimitAuthorityBody,
  EditCreditLimitAuthorityBody,
} from "../../services/CreditLimitAuthorityCrud/types";

import { getAllCollatralTypes } from "../../services/CollatralTypeCrud/getAll";
import type { CollatralTypeItem } from "../../services/CollatralTypeCrud/types";

import { getAllRegions } from "../../services/RegionCrud/getAll";
import type { RegionItem } from "../../services/RegionCrud/getAll";

import { getAllPersonalTypes } from "../../services/PersonalTypeCrud/getAll";
import type { PersonalTypeItem } from "../../services/PersonalTypeCrud/types";

import { getAllDepartmentGrades } from "../../services/DepartmentGradeCrud/getAll";
import type { DepartmentGradeItem } from "../../services/DepartmentGradeCrud/types";

type CreditLimitAuthorityForm = {
  personalTypeId: number | null;
  collateralTypeId: number | null;
  regionId: number | null;
  departmentGradeId: number | null;
  minAmount: string;
  maxAmount: string;
};

type TableFilter = {
  key: string;
  value: string;
};

type CreditLimitAuthoritiesApiResponse = {
  items?: CreditLimitAuthorityItem[];
  result?: { items?: CreditLimitAuthorityItem[] };
  listResult?: CreditLimitAuthorityItem[];
  data?: CreditLimitAuthorityItem[];
};

type CreditLimitAuthoritiesQueryData = {
  listResult: CreditLimitAuthorityItem[];
  total: number;
  totalPages: number;
};

const emptyForm: CreditLimitAuthorityForm = {
  personalTypeId: null,
  collateralTypeId: null,
  regionId: null,
  departmentGradeId: null,
  minAmount: "",
  maxAmount: "",
};

export default function CreditLimitAuthoritiesPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formData, setFormData] = useState<CreditLimitAuthorityForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [itemToDelete, setItemToDelete] =
    useState<CreditLimitAuthorityItem | null>(null);

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [filters, setFilters] = useState<TableFilter[]>([]);

  const creditLimitAuthoritiesQuery = useQuery({
    queryKey: [
      "credit-limit-authorities",
      filters,
      pagination.pageIndex,
      pagination.pageSize,
    ],
    queryFn: () => getAllCreditLimitAuthorities(),
    select: (data): CreditLimitAuthoritiesQueryData => {
      const apiData = data as CreditLimitAuthoritiesApiResponse;
      const allItems: CreditLimitAuthorityItem[] =
        apiData?.items ??
        apiData?.result?.items ??
        apiData?.listResult ??
        apiData?.data ??
        [];

      const personalTypeFilter =
        filters.find((f) => f.key === "personalTypeId")?.value?.trim() ?? "";
      const collateralTypeFilter =
        filters.find((f) => f.key === "collateralTypeId")?.value?.trim() ?? "";
      const regionFilter =
        filters.find((f) => f.key === "regionId")?.value?.trim() ?? "";
      const departmentGradeFilter =
        filters.find((f) => f.key === "departmentGradeId")?.value?.trim() ?? "";

      const filteredItems = allItems.filter((item) => {
        if (
          personalTypeFilter &&
          String(item.personalTypeId ?? "") !== personalTypeFilter
        )
          return false;
        if (
          collateralTypeFilter &&
          String(item.collatralTypeId ?? "") !== collateralTypeFilter
        )
          return false;
        if (regionFilter && String(item.regionId ?? "") !== regionFilter)
          return false;
        if (
          departmentGradeFilter &&
          String(item.departmentGradeId ?? "") !== departmentGradeFilter
        )
          return false;
        return true;
      });

      const total = filteredItems.length;
      const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));
      const startIndex = pagination.pageIndex * pagination.pageSize;

      return {
        listResult: filteredItems.slice(
          startIndex,
          startIndex + pagination.pageSize,
        ),
        total,
        totalPages,
      };
    },
  });

  const collateralTypesQuery = useQuery({
    queryKey: ["collateral-types-all"],
    queryFn: () => getAllCollatralTypes({ maxResultCount: 1000 }),
    select: (data) => data?.items ?? [],
  });

  const regionsQuery = useQuery({
    queryKey: ["regions-all"],
    queryFn: () => getAllRegions(),
    select: (data) => data?.items ?? [],
  });

  const personalTypesQuery = useQuery({
    queryKey: ["personal-types-all"],
    queryFn: () => getAllPersonalTypes({ maxResultCount: 1000 }),
    select: (data) => data?.items ?? [],
  });

  const departmentGradesQuery = useQuery({
    queryKey: ["department-grades-all"],
    queryFn: () => getAllDepartmentGrades({ maxResultCount: 1000 }),
    select: (data) => data?.items ?? [],
  });

  const collateralTypeOptions = useMemo(
    () =>
      (collateralTypesQuery.data ?? []).map((item: CollatralTypeItem) => ({
        id: item.id,
        title: item.title ?? "",
      })),
    [collateralTypesQuery.data],
  );

  const regionOptions = useMemo(
    () =>
      (regionsQuery.data ?? []).map((item: RegionItem) => ({
        id: item.id,
        title: item.title ?? "",
      })),
    [regionsQuery.data],
  );

  const personalTypeOptions = useMemo(
    () =>
      (personalTypesQuery.data ?? []).map((item: PersonalTypeItem) => ({
        id: item.id,
        title: item.title ?? "",
      })),
    [personalTypesQuery.data],
  );

  const departmentGradeOptions = useMemo(
    () =>
      (departmentGradesQuery.data ?? []).map((item: DepartmentGradeItem) => ({
        id: item.id,
        title: item.title ?? "",
      })),
    [departmentGradesQuery.data],
  );

  const createMutation = useMutation({
    mutationFn: (body: CreateCreditLimitAuthorityBody) =>
      createCreditLimitAuthority(body),
    onSuccess: () => {
      showToast("رکن اعتباری با موفقیت ثبت شد", "success");
      closeFormModal();
      setPagination((p) => ({ ...p, pageIndex: 0 }));
      queryClient.invalidateQueries({ queryKey: ["credit-limit-authorities"] });
    },
    onError: (error) =>
      showToast(error instanceof Error ? error.message : "خطا", "error", 5000),
  });

  const updateMutation = useMutation({
    mutationFn: (body: EditCreditLimitAuthorityBody) =>
      editCreditLimitAuthority(body),
    onSuccess: () => {
      showToast("تغییرات با موفقیت اعمال شد", "success");
      closeFormModal();
      queryClient.invalidateQueries({ queryKey: ["credit-limit-authorities"] });
    },
    onError: (error) =>
      showToast(error instanceof Error ? error.message : "خطا", "error", 5000),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCreditLimitAuthority(id),
    onSuccess: () => {
      showToast("رکن اعتباری با موفقیت حذف شد", "success");
      setItemToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["credit-limit-authorities"] });
    },
    onError: (error) =>
      showToast(error instanceof Error ? error.message : "خطا", "error", 5000),
  });

  const handleOpenCreateModal = useCallback(() => {
    setFormMode("create");
    setFormData(emptyForm);
    setEditingId(null);
    setIsFormModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((item: CreditLimitAuthorityItem) => {
    setFormMode("edit");
    setFormData({
      personalTypeId: item.personalTypeId ?? null,
      collateralTypeId: item.collatralTypeId ?? null,
      regionId: item.regionId ?? null,
      departmentGradeId: item.departmentGradeId ?? null,
      minAmount: item.minAmount?.toString() ?? "",
      maxAmount: item.maxAmount?.toString() ?? "",
    });
    setEditingId(item.id);
    setIsFormModalOpen(true);
  }, []);

  const closeFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setFormData(emptyForm);
    setEditingId(null);
  }, []);

  const handleDeleteClick = useCallback(
    (item: CreditLimitAuthorityItem) => setItemToDelete(item),
    [],
  );

  const handleSubmitForm = () => {
    if (!formData.personalTypeId) {
      showToast("انتخاب نوع شخص الزامی است", "error");
      return;
    }
    if (!formData.collateralTypeId) {
      showToast("انتخاب نوع وثیقه الزامی است", "error");
      return;
    }
    if (!formData.regionId) {
      showToast("انتخاب منطقه الزامی است", "error");
      return;
    }
    if (!formData.departmentGradeId) {
      showToast("انتخاب رتبه دپارتمان الزامی است", "error");
      return;
    }
    if (!formData.minAmount || parseFloat(formData.minAmount) < 0) {
      showToast("حداقل مبلغ نامعتبر است", "error");
      return;
    }
    if (!formData.maxAmount || parseFloat(formData.maxAmount) < 0) {
      showToast("حداکثر مبلغ نامعتبر است", "error");
      return;
    }
    if (parseFloat(formData.minAmount) > parseFloat(formData.maxAmount)) {
      showToast("حداقل مبلغ نمی‌تواند بیشتر از حداکثر مبلغ باشد", "error");
      return;
    }

    const body = {
      personalTypeId: formData.personalTypeId,
      collatralTypeId: formData.collateralTypeId,
      regionId: formData.regionId,
      departmentGradeId: formData.departmentGradeId,
      minAmount: parseFloat(formData.minAmount),
      maxAmount: parseFloat(formData.maxAmount),
    };

    if (formMode === "create") {
      createMutation.mutate(body as CreateCreditLimitAuthorityBody);
    } else if (formMode === "edit" && editingId !== null) {
      updateMutation.mutate({
        id: editingId,
        ...body,
      } as EditCreditLimitAuthorityBody);
    }
  };

  const columns = useMemo<ColumnDef<CreditLimitAuthorityItem, unknown>[]>(
    () => [
      {
        id: "personalType",
        header: "نوع شخص",
        cell: ({ row }) => {
          const id = row.original.personalTypeId;
          const item = (personalTypesQuery.data ?? []).find(
            (p: PersonalTypeItem) => p.id === id,
          );
          return item?.title ?? "-";
        },
      },
      {
        id: "collateralType",
        header: "نوع وثیقه",
        cell: ({ row }) => {
          const id = row.original.collatralTypeId;
          const item = (collateralTypesQuery.data ?? []).find(
            (t: CollatralTypeItem) => t.id === id,
          );
          return item?.title ?? "-";
        },
      },
      {
        id: "region",
        header: "منطقه استانی",
        cell: ({ row }) => {
          const id = row.original.regionId;
          const item = (regionsQuery.data ?? []).find(
            (r: RegionItem) => r.id === id,
          );
          return item?.title ?? "-";
        },
      },
      {
        id: "departmentGrade",
        header: "رتبه دپارتمان",
        cell: ({ row }) => {
          const id = row.original.departmentGradeId;
          const item = (departmentGradesQuery.data ?? []).find(
            (g: DepartmentGradeItem) => g.id === id,
          );
          return item?.title ?? "-";
        },
      },
      {
        accessorKey: "minAmount",
        header: "حداقل مبلغ",
        cell: ({ row }) =>
          row.original.minAmount != null
            ? Number(row.original.minAmount).toLocaleString("fa-IR")
            : "-",
      },
      {
        accessorKey: "maxAmount",
        header: "حداکثر مبلغ",
        cell: ({ row }) =>
          row.original.maxAmount != null
            ? Number(row.original.maxAmount).toLocaleString("fa-IR")
            : "-",
      },
      {
        id: "actions",
        header: "عملیات",
        enableSorting: false,
        cell: ({ row }) => {
          const isDeleting =
            deleteMutation.isPending &&
            deleteMutation.variables === row.original.id;
          return (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleOpenEditModal(row.original)}
                disabled={deleteMutation.isPending}
                className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                title="ویرایش"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteClick(row.original)}
                disabled={deleteMutation.isPending}
                className="p-1.5 rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                title="حذف"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          );
        },
      },
    ],
    [
      collateralTypesQuery.data,
      regionsQuery.data,
      personalTypesQuery.data,
      departmentGradesQuery.data,
      deleteMutation.isPending,
      deleteMutation.variables,
      handleOpenEditModal,
      handleDeleteClick,
    ],
  );

  const handleExportExcel = () => {
    const rows = creditLimitAuthoritiesQuery.data?.listResult ?? [];
    if (!rows.length) {
      alert("داده‌ای برای خروجی وجود ندارد");
      return;
    }
    const headers = [
      "نوع شخص",
      "نوع وثیقه",
      "منطقه استانی",
      "رتبه دپارتمان",
      "حداقل مبلغ",
      "حداکثر مبلغ",
    ];
    const csvRows = rows.map((item) => {
      const pt = (personalTypesQuery.data ?? []).find(
        (p: PersonalTypeItem) => p.id === item.personalTypeId,
      );
      const ct = (collateralTypesQuery.data ?? []).find(
        (t: CollatralTypeItem) => t.id === item.collatralTypeId,
      );
      const r = (regionsQuery.data ?? []).find(
        (r: RegionItem) => r.id === item.regionId,
      );
      const dg = (departmentGradesQuery.data ?? []).find(
        (g: DepartmentGradeItem) => g.id === item.departmentGradeId,
      );
      return [
        pt?.title ?? "",
        ct?.title ?? "",
        r?.title ?? "",
        dg?.title ?? "",
        item.minAmount ?? "",
        item.maxAmount ?? "",
      ];
    });
    const csvContent = [
      headers.join(","),
      ...csvRows.map((r) =>
        r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "credit-limit-authorities.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const rows = creditLimitAuthoritiesQuery.data?.listResult ?? [];
    if (!rows.length) {
      alert("داده‌ای برای خروجی وجود ندارد");
      return;
    }
    const tableRows = rows
      .map((item) => {
        const pt = (personalTypesQuery.data ?? []).find(
          (p: PersonalTypeItem) => p.id === item.personalTypeId,
        );
        const ct = (collateralTypesQuery.data ?? []).find(
          (t: CollatralTypeItem) => t.id === item.collatralTypeId,
        );
        const r = (regionsQuery.data ?? []).find(
          (r: RegionItem) => r.id === item.regionId,
        );
        const dg = (departmentGradesQuery.data ?? []).find(
          (g: DepartmentGradeItem) => g.id === item.departmentGradeId,
        );
        return `<tr><td>${pt?.title ?? ""}</td><td>${ct?.title ?? ""}</td><td>${r?.title ?? ""}</td><td>${dg?.title ?? ""}</td><td>${item.minAmount ?? ""}</td><td>${item.maxAmount ?? ""}</td></tr>`;
      })
      .join("");
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("امکان باز کردن پنجره چاپ وجود ندارد");
      return;
    }
    printWindow.document
      .write(`<html dir="rtl" lang="fa"><head><title>PDF</title>
    <style>body{font-family:Tahoma,Arial;direction:rtl;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:right}th{background:#f3f4f6}</style></head>
    <body><h2>حدود اختیار رکن اعتباری</h2><table><thead><tr><th>نوع شخص</th><th>نوع وثیقه</th><th>منطقه</th><th>رتبه دپارتمان</th><th>حداقل مبلغ</th><th>حداکثر مبلغ</th></tr></thead>
    <tbody>${tableRows}</tbody></table><script>window.onload=function(){window.print()}</script></body></html>`);
    printWindow.document.close();
  };

  const submitButtonTitle = formMode === "create" ? "ثبت" : "ثبت تغییرات";
  const isSubmitting =
    formMode === "create" ? createMutation.isPending : updateMutation.isPending;

  return (
    <MainLayout.Main maxWidth="screen-xl">
      <PageTitle title="حدود اختیار رکن اعتباری تسهیلات ریالی" />

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FormButton
              title="+ افزودن"
              variant="success"
              onClick={handleOpenCreateModal}
            />
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 transition-colors cursor-pointer text-sm font-medium"
              title="خروجی اکسل"
            >
              <FileDown className="w-4 h-4" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors cursor-pointer text-sm font-medium"
              title="خروجی PDF"
            >
              <FileDown className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        <DataTable<CreditLimitAuthorityItem>
          query={creditLimitAuthoritiesQuery}
          columns={columns}
          pagination={pagination}
          onPaginationChange={setPagination}
          filters={filters}
          onFiltersChange={(newFilters) => {
            const latest = newFilters.at(-1);
            setFilters(latest ? [latest] : []);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
          filterFields={[
            {
              field: "personalTypeId",
              label: "نوع شخص",
              type: "select",
              options: personalTypeOptions.map((o) => ({
                value: String(o.id),
                label: o.title,
              })),
            },
            {
              field: "collateralTypeId",
              label: "نوع وثیقه",
              type: "select",
              options: collateralTypeOptions.map((o) => ({
                value: String(o.id),
                label: o.title,
              })),
            },
            {
              field: "regionId",
              label: "منطقه استانی",
              type: "select",
              options: regionOptions.map((o) => ({
                value: String(o.id),
                label: o.title,
              })),
            },
            {
              field: "departmentGradeId",
              label: "رتبه دپارتمان",
              type: "select",
              options: departmentGradeOptions.map((o) => ({
                value: String(o.id),
                label: o.title,
              })),
            },
          ]}
          skeletonColumns={7}
          emptyStateMessage="هیچ رکن اعتباری یافت نشد"
          emptyStateDescription="موردی برای نمایش وجود ندارد."
        />
      </div>

      <Modal
        isOpen={isFormModalOpen}
        isRTL
        header={
          formMode === "create"
            ? "ثبت حد اختیار رکن اعتباری"
            : "ویرایش حد اختیار رکن اعتباری"
        }
        onClose={closeFormModal}
        overlayLock={isSubmitting}
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title={submitButtonTitle}
              variant="success"
              onClick={handleSubmitForm}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            />
            <FormButton
              title="انصراف"
              variant="secondary"
              onClick={closeFormModal}
              disabled={isSubmitting}
            />
          </div>
        }
        renderContent={() => (
          <FluidGrid className="gap-4">
            <FluidCol colSpan={12}>
              <FormSelect<number>
                id="modal-personalTypeId"
                name="modal-personalTypeId"
                label="نوع شخص"
                value={formData.personalTypeId ?? ""}
                required
                onChange={(v) =>
                  setFormData((p) => ({
                    ...p,
                    personalTypeId: v ? Number(v) : null,
                  }))
                }
                options={personalTypeOptions}
              />
            </FluidCol>
            <FluidCol colSpan={12}>
              <FormSelect<number>
                id="modal-collateralTypeId"
                name="modal-collateralTypeId"
                label="نوع وثیقه"
                value={formData.collateralTypeId ?? ""}
                required
                onChange={(v) =>
                  setFormData((p) => ({
                    ...p,
                    collateralTypeId: v ? Number(v) : null,
                  }))
                }
                options={collateralTypeOptions}
              />
            </FluidCol>
            <FluidCol colSpan={12}>
              <FormSelect<number>
                id="modal-regionId"
                name="modal-regionId"
                label="منطقه استانی"
                value={formData.regionId ?? ""}
                required
                onChange={(v) =>
                  setFormData((p) => ({ ...p, regionId: v ? Number(v) : null }))
                }
                options={regionOptions}
              />
            </FluidCol>
            <FluidCol colSpan={12}>
              <FormSelect<number>
                id="modal-departmentGradeId"
                name="modal-departmentGradeId"
                label="رتبه دپارتمان"
                value={formData.departmentGradeId ?? ""}
                required
                onChange={(v) =>
                  setFormData((p) => ({
                    ...p,
                    departmentGradeId: v ? Number(v) : null,
                  }))
                }
                options={departmentGradeOptions}
              />
            </FluidCol>
            <FluidCol colSpan={12}>
              <FormInput
                id="modal-minAmount"
                name="modal-minAmount"
                label="حداقل مبلغ (ریال)"
                value={formData.minAmount}
                type="number"
                dir="ltr"
                required
                onChange={(v) => setFormData((p) => ({ ...p, minAmount: v }))}
              />
            </FluidCol>
            <FluidCol colSpan={12}>
              <FormInput
                id="modal-maxAmount"
                name="modal-maxAmount"
                label="حداکثر مبلغ (ریال)"
                value={formData.maxAmount}
                type="number"
                dir="ltr"
                required
                onChange={(v) => setFormData((p) => ({ ...p, maxAmount: v }))}
              />
            </FluidCol>
          </FluidGrid>
        )}
      />

      <Modal
        isOpen={!!itemToDelete}
        isRTL
        header="تأیید حذف رکن اعتباری"
        onClose={() => setItemToDelete(null)}
        overlayLock={deleteMutation.isPending}
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title="حذف"
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => {
                if (itemToDelete) deleteMutation.mutate(itemToDelete.id);
              }}
            />
            <FormButton
              title="انصراف"
              variant="secondary"
              disabled={deleteMutation.isPending}
              onClick={() => setItemToDelete(null)}
            />
          </div>
        }
        renderContent={() => <p>آیا از حذف این رکن اعتباری اطمینان دارید؟</p>}
      />
    </MainLayout.Main>
  );
}
