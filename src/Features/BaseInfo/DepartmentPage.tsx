import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, Pencil, Trash2, FileDown } from "lucide-react";

import { MainLayout } from "../../baseComponents/MainLayout";
import { FluidGrid } from "../../baseComponents/FluidGrid";
import { FluidCol } from "../../baseComponents/FluidCol";
import FormInput from "../../baseComponents/FormInput";
import FormSelect from "../../baseComponents/FormSelect";
import FormTextarea from "../../baseComponents/FormTextarea";
import FormButton from "../../baseComponents/FormButton";
import PageTitle from "../../baseComponents/PageTitle";
import DataTable from "../../baseComponents/DataTable";
import Modal from "../../baseComponents/Modal";
import { useToast } from "../../libs/toastContext";

import { createDepartment } from "../../services/DepartmentCrud/create";
import { getAllDepartments } from "../../services/DepartmentCrud/getAll";
import { editDepartment } from "../../services/DepartmentCrud/update";
import { deleteDepartment } from "../../services/DepartmentCrud/delete";
import type {
  DepartmentItem,
  CreateDepartmentBody,
  EditDepartmentBody,
} from "../../services/DepartmentCrud/types";

import { getAllDepartmentGrades } from "../../services/DepartmentGradeCrud/getAll";
import type { DepartmentGradeItem } from "../../services/DepartmentGradeCrud/types";

import { getAllRegions } from "../../services/RegionCrud/getAll";
import type { RegionItem } from "../../services/RegionCrud/getAll";

import { getAllDocumentTypes } from "../../services/DocumentTypeCrud/getAll";
import type { DocumentTypeItem } from "../../services/DocumentTypeCrud/types";

type DepartmentForm = {
  code: string;
  title: string;
  departmentGradeId: string;
  parentId: string;
  regionId: string;
  documentTypeId: string;
  description: string;
  isActive: string;
};

type TableFilter = {
  key: string;
  value: string;
};

type DepartmentsApiResponse = {
  items?: DepartmentItem[];
  result?: { items?: DepartmentItem[] };
  listResult?: DepartmentItem[];
  data?: DepartmentItem[];
};

type DepartmentsQueryData = {
  listResult: DepartmentItem[];
  total: number;
  totalPages: number;
};

const emptyForm: DepartmentForm = {
  code: "",
  title: "",
  departmentGradeId: "",
  parentId: "",
  regionId: "",
  documentTypeId: "",
  description: "",
  isActive: "true",
};

const STATUS_OPTIONS = [
  { id: "true", title: "فعال" },
  { id: "false", title: "غیرفعال" },
];

export default function DepartmentPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formData, setFormData] = useState<DepartmentForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [itemToDelete, setItemToDelete] = useState<DepartmentItem | null>(null);

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [filters, setFilters] = useState<TableFilter[]>([]);

  // Query اصلی دپارتمان‌ها
  const departmentsQuery = useQuery({
    queryKey: [
      "departments",
      filters,
      pagination.pageIndex,
      pagination.pageSize,
    ],
    queryFn: () => getAllDepartments(),
    select: (data): DepartmentsQueryData => {
      const apiData = data as DepartmentsApiResponse;
      const allItems: DepartmentItem[] =
        apiData?.items ??
        apiData?.result?.items ??
        apiData?.listResult ??
        apiData?.data ??
        [];

      // استخراج همه فیلترها
      const titleFilter =
        filters
          .find((f) => f.key === "title")
          ?.value?.trim()
          .toLocaleLowerCase("fa") ?? "";

      const codeFilter =
        filters
          .find((f) => f.key === "code")
          ?.value?.trim()
          .toLocaleLowerCase("fa") ?? "";

      const departmentGradeFilter =
        filters.find((f) => f.key === "departmentGradeId")?.value?.trim() ?? "";

      const parentDepartmentFilter =
        filters.find((f) => f.key === "parentId")?.value?.trim() ?? "";

      const regionFilter =
        filters.find((f) => f.key === "regionId")?.value?.trim() ?? "";

      const documentTypeFilter =
        filters.find((f) => f.key === "documentTypeId")?.value?.trim() ?? "";

      const statusFilter =
        filters.find((f) => f.key === "isActive")?.value?.trim() ?? "";

      const filteredItems = allItems.filter((item) => {
        const itemTitle = String(item.title ?? "")
          .trim()
          .toLocaleLowerCase("fa");

        const itemCode = String(item.code ?? "")
          .trim()
          .toLocaleLowerCase("fa");

        // تطابق عنوان
        const titleMatches = !titleFilter || itemTitle.includes(titleFilter);

        // تطابق کد
        const codeMatches = !codeFilter || itemCode.includes(codeFilter);

        // تطابق رتبه دپارتمان (مقایسه id)
        const departmentGradeMatches =
          !departmentGradeFilter ||
          String(item.departmentGradeId ?? "") === departmentGradeFilter;

        // تطابق دپارتمان والد (مقایسه id)
        const parentDepartmentMatches =
          !parentDepartmentFilter ||
          (parentDepartmentFilter === "0"
            ? !item.parentId || item.parentId === 0
            : String(item.parentId ?? "") === parentDepartmentFilter);

        // تطابق منطقه استانی (مقایسه id)
        const regionMatches =
          !regionFilter || String(item.regionId ?? "") === regionFilter;

        // تطابق نوع مدارک پیوست (مقایسه id)
        const documentTypeMatches =
          !documentTypeFilter ||
          String(item.documentTypeId ?? "") === documentTypeFilter;

        // تطابق وضعیت
        let statusMatches = true;
        if (statusFilter === "true") {
          statusMatches = item.isActive === true;
        } else if (statusFilter === "false") {
          statusMatches = item.isActive === false;
        }

        return (
          titleMatches &&
          codeMatches &&
          departmentGradeMatches &&
          parentDepartmentMatches &&
          regionMatches &&
          documentTypeMatches &&
          statusMatches
        );
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

  // رتبه‌های دپارتمان
  const departmentGradesQuery = useQuery({
    queryKey: ["department-grades-all"],
    queryFn: () => getAllDepartmentGrades({ maxResultCount: 1000 }),
    select: (data) => data?.items ?? [],
  });

  // مناطق استانی
  const regionsQuery = useQuery({
    queryKey: ["regions-all"],
    queryFn: () => getAllRegions(),
    select: (data) => data?.items ?? [],
  });

  // انواع مدارک پیوست
  const documentTypesQuery = useQuery({
    queryKey: ["document-types-all"],
    queryFn: () => getAllDocumentTypes({ maxResultCount: 1000 }),
    select: (data) => data?.items ?? [],
  });

  // گزینه‌های رتبه دپارتمان برای select
  const departmentGradeOptions = useMemo(
    () =>
      (departmentGradesQuery.data ?? []).map((item: DepartmentGradeItem) => ({
        id: String(item.id),
        title: item.title ?? "",
      })),
    [departmentGradesQuery.data],
  );

  // گزینه‌های منطقه استانی برای select
  const regionOptions = useMemo(
    () =>
      (regionsQuery.data ?? []).map((item: RegionItem) => ({
        id: String(item.id),
        title: item.title ?? "",
      })),
    [regionsQuery.data],
  );

  // گزینه‌های نوع مدارک پیوست برای select
  const documentTypeOptions = useMemo(
    () =>
      (documentTypesQuery.data ?? []).map((item: DocumentTypeItem) => ({
        id: String(item.id),
        title: item.title ?? "",
      })),
    [documentTypesQuery.data],
  );

  // گزینه‌های دپارتمان والد (از لیست فعلی دپارتمان‌ها)
  const parentDepartmentOptions = useMemo(
    () => [
      { id: "0", title: "بدون والد" },
      ...(departmentsQuery.data?.listResult ?? []).map(
        (item: DepartmentItem) => ({
          id: String(item.id),
          title: item.title ?? "",
        }),
      ),
    ],
    [departmentsQuery.data],
  );

  const createMutation = useMutation({
    mutationFn: (body: CreateDepartmentBody) => createDepartment(body),
    onSuccess: () => {
      showToast("دپارتمان با موفقیت ثبت شد", "success");
      closeFormModal();
      setPagination((p) => ({ ...p, pageIndex: 0 }));
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "خطا در ثبت اطلاعات",
        "error",
        5000,
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: (body: EditDepartmentBody) => editDepartment(body),
    onSuccess: () => {
      showToast("تغییرات با موفقیت اعمال شد", "success");
      closeFormModal();
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "خطا در ویرایش اطلاعات",
        "error",
        5000,
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteDepartment(id),
    onSuccess: () => {
      showToast("دپارتمان با موفقیت حذف شد", "success");
      setItemToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "خطا در حذف",
        "error",
        5000,
      );
    },
  });

  const handleOpenCreateModal = useCallback(() => {
    setFormMode("create");
    setFormData(emptyForm);
    setEditingId(null);
    setIsFormModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((item: DepartmentItem) => {
    setFormMode("edit");
    setFormData({
      code: item.code ?? "",
      title: item.title ?? "",
      departmentGradeId: item.departmentGradeId?.toString() ?? "",
      parentId: item.parentId?.toString() ?? "",
      regionId: item.regionId?.toString() ?? "",
      documentTypeId: item.documentTypeId?.toString() ?? "",
      description: item.description ?? "",
      isActive: item.isActive?.toString() ?? "true",
    });
    setEditingId(item.id);
    setIsFormModalOpen(true);
  }, []);

  const closeFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setFormData(emptyForm);
    setEditingId(null);
  }, []);

  const handleDeleteClick = useCallback((item: DepartmentItem) => {
    setItemToDelete(item);
  }, []);

  const handleSubmitForm = () => {
    const code = formData.code.trim();
    const title = formData.title.trim();

    if (!code) {
      showToast("وارد کردن کد الزامی است", "error");
      return;
    }
    if (!title) {
      showToast("وارد کردن عنوان الزامی است", "error");
      return;
    }

    const body = {
      code,
      title,
      departmentGradeId: formData.departmentGradeId
        ? Number(formData.departmentGradeId)
        : undefined,
      parentId: formData.parentId ? Number(formData.parentId) : 0,
      regionId: formData.regionId ? Number(formData.regionId) : undefined,
      documentTypeId: formData.documentTypeId
        ? Number(formData.documentTypeId)
        : undefined,
      description: formData.description.trim() || undefined,
      isActive: formData.isActive === "true",
    };

    if (formMode === "create") {
      createMutation.mutate(body as CreateDepartmentBody);
    } else if (formMode === "edit" && editingId !== null) {
      updateMutation.mutate({ id: editingId, ...body } as EditDepartmentBody);
    }
  };

  const columns = useMemo<ColumnDef<DepartmentItem, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "عنوان",
        cell: ({ row }) => String(row.original.title ?? "-"),
      },
      {
        accessorKey: "code",
        header: "کد",
        cell: ({ row }) => String(row.original.code ?? "-"),
      },
      {
        id: "departmentGrade",
        header: "رتبه دپارتمان",
        cell: ({ row }) => {
          const gradeId = row.original.departmentGradeId;
          const grade = (departmentGradesQuery.data ?? []).find(
            (g: DepartmentGradeItem) => g.id === gradeId,
          );
          return grade?.title ?? "-";
        },
      },
      {
        id: "parent",
        header: "دپارتمان والد",
        cell: ({ row }) => {
          const parentId = row.original.parentId;
          if (!parentId) return "-";
          const parent = (departmentsQuery.data?.listResult ?? []).find(
            (d: DepartmentItem) => d.id === parentId,
          );
          return parent?.title ?? "-";
        },
      },
      {
        id: "region",
        header: "منطقه استانی",
        cell: ({ row }) => {
          const regionId = row.original.regionId;
          const region = (regionsQuery.data ?? []).find(
            (r: RegionItem) => r.id === regionId,
          );
          return region?.title ?? "-";
        },
      },
      {
        id: "documentType",
        header: "نوع مدارک پیوست",
        cell: ({ row }) => {
          const docId = row.original.documentTypeId;
          const doc = (documentTypesQuery.data ?? []).find(
            (d: DocumentTypeItem) => d.id === docId,
          );
          return doc?.title ?? "-";
        },
      },
      {
        id: "description",
        header: "توضیحات",
        cell: ({ row }) => String(row.original.description ?? "-"),
      },
      {
        id: "status",
        header: "وضعیت",
        cell: ({ row }) => (row.original.isActive ? "فعال" : "غیرفعال"),
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
      departmentGradesQuery.data,
      departmentsQuery.data,
      regionsQuery.data,
      documentTypesQuery.data,
      deleteMutation.isPending,
      deleteMutation.variables,
      handleOpenEditModal,
      handleDeleteClick,
    ],
  );

  const handleExportExcel = () => {
    const rows = departmentsQuery.data?.listResult ?? [];
    if (!rows.length) {
      alert("داده‌ای برای خروجی وجود ندارد");
      return;
    }

    const headers = [
      "عنوان",
      "کد",
      "رتبه دپارتمان",
      "دپارتمان والد",
      "منطقه استانی",
      "نوع مدارک پیوست",
      "توضیحات",
      "وضعیت",
    ];

    const csvRows = rows.map((item) => {
      const grade = (departmentGradesQuery.data ?? []).find(
        (g: DepartmentGradeItem) => g.id === item.departmentGradeId,
      );
      const parent = (departmentsQuery.data?.listResult ?? []).find(
        (d: DepartmentItem) => d.id === item.parentId,
      );
      const region = (regionsQuery.data ?? []).find(
        (r: RegionItem) => r.id === item.regionId,
      );
      const doc = (documentTypesQuery.data ?? []).find(
        (d: DocumentTypeItem) => d.id === item.documentTypeId,
      );
      return [
        item.title ?? "",
        item.code ?? "",
        grade?.title ?? "",
        parent?.title ?? "",
        region?.title ?? "",
        doc?.title ?? "",
        item.description ?? "",
        item.isActive ? "فعال" : "غیرفعال",
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
    link.download = "departments.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const rows = departmentsQuery.data?.listResult ?? [];
    if (!rows.length) {
      alert("داده‌ای برای خروجی وجود ندارد");
      return;
    }

    const tableRows = rows
      .map((item) => {
        const grade = (departmentGradesQuery.data ?? []).find(
          (g: DepartmentGradeItem) => g.id === item.departmentGradeId,
        );
        const parent = (departmentsQuery.data?.listResult ?? []).find(
          (d: DepartmentItem) => d.id === item.parentId,
        );
        const region = (regionsQuery.data ?? []).find(
          (r: RegionItem) => r.id === item.regionId,
        );
        const doc = (documentTypesQuery.data ?? []).find(
          (d: DocumentTypeItem) => d.id === item.documentTypeId,
        );
        return `<tr>
                <td>${item.title ?? ""}</td><td>${item.code ?? ""}</td><td>${grade?.title ?? ""}</td>
                <td>${parent?.title ?? ""}</td><td>${region?.title ?? ""}</td><td>${doc?.title ?? ""}</td>
                <td>${item.description ?? ""}</td><td>${item.isActive ? "فعال" : "غیرفعال"}</td></tr>`;
      })
      .join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("امکان باز کردن پنجره چاپ وجود ندارد");
      return;
    }
    printWindow.document
      .write(`<html dir="rtl" lang="fa"><head><title>PDF</title>
        <style>body{font-family:Tahoma, Arial, sans-serif;direction:rtl;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:right}th{background:#f3f4f6}</style></head>
        <body><h2>لیست دپارتمان‌ها</h2><table><thead><tr>
        <th>عنوان</th><th>کد</th><th>رتبه دپارتمان</th><th>دپارتمان والد</th>
        <th>منطقه استانی</th><th>نوع مدارک پیوست</th><th>توضیحات</th><th>وضعیت</th></tr></thead>
        <tbody>${tableRows}</tbody></table><script>window.onload=function(){window.print()}</script></body></html>`);
    printWindow.document.close();
  };

  const submitButtonTitle = formMode === "create" ? "ثبت" : "ثبت تغییرات";
  const isSubmitting =
    formMode === "create" ? createMutation.isPending : updateMutation.isPending;

  return (
    <MainLayout.Main maxWidth="screen-xl">
      <PageTitle title="دپارتمان‌ها" />

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

        <DataTable<DepartmentItem>
          query={departmentsQuery}
          columns={columns}
          pagination={pagination}
          onPaginationChange={setPagination}
          filters={filters}
          onFiltersChange={(newFilters) => {
            setFilters(newFilters);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
          filterFields={[
            {
              field: "title",
              label: "عنوان",
              placeholder: "جست‌وجو بر اساس عنوان",
            },
            {
              field: "code",
              label: "کد",
              placeholder: "جست‌وجو بر اساس کد",
            },
            {
              field: "departmentGradeId",
              label: "رتبه دپارتمان",
              type: "select",
              options: [
                ...departmentGradeOptions.map((opt) => ({
                  value: opt.id,
                  label: opt.title,
                })),
              ],
            },
            {
              field: "parentId",
              label: "دپارتمان والد",
              type: "select",
              options: [
                ...parentDepartmentOptions.map((opt) => ({
                  value: opt.id,
                  label: opt.title,
                })),
              ],
            },
            {
              field: "regionId",
              label: "منطقه استانی",
              type: "select",
              options: [
                ...regionOptions.map((opt) => ({
                  value: opt.id,
                  label: opt.title,
                })),
              ],
            },
            {
              field: "documentTypeId",
              label: "نوع مدارک پیوست",
              type: "select",
              options: [
                ...documentTypeOptions.map((opt) => ({
                  value: opt.id,
                  label: opt.title,
                })),
              ],
            },
            {
              field: "isActive",
              label: "وضعیت",
              type: "select",
              options: [
                { value: "true", label: "فعال" },
                { value: "false", label: "غیرفعال" },
              ],
            },
          ]}
          searchMode="onEnter"
          skeletonColumns={8}
          emptyStateMessage="هیچ دپارتمانی یافت نشد"
          emptyStateDescription="موردی برای نمایش وجود ندارد."
        />
      </div>

      {/* مودال افزودن/ویرایش */}
      <Modal
        isOpen={isFormModalOpen}
        isRTL
        header={formMode === "create" ? "افزودن دپارتمان" : "ویرایش دپارتمان"}
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
              <FormInput
                id="modal-title"
                name="modal-title"
                label="عنوان"
                value={formData.title}
                onChange={(v) => setFormData((p) => ({ ...p, title: v }))}
                dir="rtl"
                required
              />
            </FluidCol>
            <FluidCol colSpan={12}>
              <FormInput
                id="modal-code"
                name="modal-code"
                label="کد"
                value={formData.code}
                onChange={(v) => setFormData((p) => ({ ...p, code: v }))}
                dir="ltr"
                required
              />
            </FluidCol>
            <FluidCol colSpan={12}>
              <FormSelect
                id="modal-departmentGradeId"
                name="modal-departmentGradeId"
                label="رتبه دپارتمان"
                value={formData.departmentGradeId}
                onChange={(v) =>
                  setFormData((p) => ({ ...p, departmentGradeId: v }))
                }
                options={departmentGradeOptions}
              />
            </FluidCol>
            <FluidCol colSpan={12}>
              <FormSelect
                id="modal-parentId"
                name="modal-parentId"
                label="دپارتمان والد"
                value={formData.parentId}
                onChange={(v) => setFormData((p) => ({ ...p, parentId: v }))}
                options={parentDepartmentOptions}
              />
            </FluidCol>
            <FluidCol colSpan={12}>
              <FormSelect
                id="modal-regionId"
                name="modal-regionId"
                label="منطقه استانی"
                value={formData.regionId}
                onChange={(v) => setFormData((p) => ({ ...p, regionId: v }))}
                options={regionOptions}
              />
            </FluidCol>
            <FluidCol colSpan={12}>
              <FormSelect
                id="modal-documentTypeId"
                name="modal-documentTypeId"
                label="نوع مدارک پیوست"
                value={formData.documentTypeId}
                onChange={(v) =>
                  setFormData((p) => ({ ...p, documentTypeId: v }))
                }
                options={documentTypeOptions}
              />
            </FluidCol>
            <FluidCol colSpan={12}>
              <FormTextarea
                id="modal-description"
                name="modal-description"
                label="توضیحات"
                value={formData.description}
                onChange={(v) => setFormData((p) => ({ ...p, description: v }))}
                rows={3}
                dir="rtl"
              />
            </FluidCol>
            <FluidCol colSpan={12}>
              <FormSelect
                id="modal-isActive"
                name="modal-isActive"
                label="وضعیت"
                value={formData.isActive}
                onChange={(v) => setFormData((p) => ({ ...p, isActive: v }))}
                options={STATUS_OPTIONS}
                required
              />
            </FluidCol>
          </FluidGrid>
        )}
      />

      {/* مودال حذف */}
      <Modal
        isOpen={!!itemToDelete}
        isRTL
        header="تأیید حذف دپارتمان"
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
        renderContent={() => (
          <p>
            آیا از حذف{" "}
            <strong>{itemToDelete ? (itemToDelete.title ?? "") : ""}</strong>{" "}
            اطمینان دارید؟
          </p>
        )}
      />
    </MainLayout.Main>
  );
}
