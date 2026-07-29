import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, Pencil, Trash2, FileDown } from "lucide-react";

import { MainLayout } from "../../baseComponents/MainLayout";
import { FluidGrid } from "../../baseComponents/FluidGrid";
import { FluidCol } from "../../baseComponents/FluidCol";
import FormInput from "../../baseComponents/FormInput";
import FormButton from "../../baseComponents/FormButton";
import PageTitle from "../../baseComponents/PageTitle";
import DataTable from "../../baseComponents/DataTable";
import Modal from "../../baseComponents/Modal";
import { useToast } from "../../libs/toastContext";

import { createDepartmentType } from "../../services/DepartmentTypeCrud/create";
import { getAllDepartmentTypes } from "../../services/DepartmentTypeCrud/getAll";
import { editDepartmentType } from "../../services/DepartmentTypeCrud/update";
import { deleteDepartmentType } from "../../services/DepartmentTypeCrud/delete";
import type {
  DepartmentTypeItem,
  CreateDepartmentTypeBody,
  EditDepartmentTypeBody,
} from "../../services/DepartmentTypeCrud/types";

type DepartmentTypeForm = { name: string };
type TableFilter = { key: string; value: string };
type ApiResponse = {
  items?: DepartmentTypeItem[];
  result?: { items?: DepartmentTypeItem[] };
  listResult?: DepartmentTypeItem[];
  data?: DepartmentTypeItem[];
};

const emptyForm: DepartmentTypeForm = { name: "" };

export default function DepartmentTypePage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formData, setFormData] = useState<DepartmentTypeForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [itemToDelete, setItemToDelete] = useState<DepartmentTypeItem | null>(
    null,
  );
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [filters, setFilters] = useState<TableFilter[]>([]);

  const query = useQuery({
    queryKey: [
      "department-types",
      filters,
      pagination.pageIndex,
      pagination.pageSize,
    ],
    queryFn: () => getAllDepartmentTypes(),
    select: (data) => {
      const apiData = data as ApiResponse;
      const items =
        apiData?.items ??
        apiData?.result?.items ??
        apiData?.listResult ??
        apiData?.data ??
        [];
      const nameFilter =
        filters
          .find((f) => f.key === "name")
          ?.value?.trim()
          .toLocaleLowerCase("fa") ?? "";
      const filtered = nameFilter
        ? items.filter((i) =>
            String(i.name ?? "")
              .toLocaleLowerCase("fa")
              .includes(nameFilter),
          )
        : items;
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));
      const start = pagination.pageIndex * pagination.pageSize;
      return {
        listResult: filtered.slice(start, start + pagination.pageSize),
        total,
        totalPages,
      };
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: CreateDepartmentTypeBody) => createDepartmentType(body),
    onSuccess: () => {
      showToast("نوع دپارتمان با موفقیت ثبت شد", "success");
      closeFormModal();
      setPagination((p) => ({ ...p, pageIndex: 0 }));
      queryClient.invalidateQueries({ queryKey: ["department-types"] });
    },
    onError: (error) =>
      showToast(error instanceof Error ? error.message : "خطا", "error", 5000),
  });

  const updateMutation = useMutation({
    mutationFn: (body: EditDepartmentTypeBody) => editDepartmentType(body),
    onSuccess: () => {
      showToast("تغییرات با موفقیت اعمال شد", "success");
      closeFormModal();
      queryClient.invalidateQueries({ queryKey: ["department-types"] });
    },
    onError: (error) =>
      showToast(error instanceof Error ? error.message : "خطا", "error", 5000),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteDepartmentType(id),
    onSuccess: () => {
      showToast("نوع دپارتمان با موفقیت حذف شد", "success");
      setItemToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["department-types"] });
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
  const handleOpenEditModal = useCallback((item: DepartmentTypeItem) => {
    setFormMode("edit");
    setFormData({ name: item.name ?? "" });
    setEditingId(item.id);
    setIsFormModalOpen(true);
  }, []);
  const closeFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setFormData(emptyForm);
    setEditingId(null);
  }, []);
  const handleDeleteClick = useCallback(
    (item: DepartmentTypeItem) => setItemToDelete(item),
    [],
  );

  const handleSubmitForm = () => {
    const name = formData.name.trim();
    if (!name) {
      showToast("وارد کردن نام الزامی است", "error");
      return;
    }
    if (formMode === "create") createMutation.mutate({ name });
    else if (editingId !== null) updateMutation.mutate({ id: editingId, name });
  };

  const columns = useMemo<ColumnDef<DepartmentTypeItem, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "نام",
        cell: ({ row }) => String(row.original.name ?? "-"),
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
      deleteMutation.isPending,
      deleteMutation.variables,
      handleOpenEditModal,
      handleDeleteClick,
    ],
  );

  const handleExportExcel = () => {
    const rows = query.data?.listResult ?? [];
    if (!rows.length) {
      alert("داده‌ای برای خروجی وجود ندارد");
      return;
    }
    const csvContent = [
      "نام",
      ...rows.map((i: DepartmentTypeItem) => `"${i.name ?? ""}"`),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "department-types.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const rows = query.data?.listResult ?? [];
    if (!rows.length) {
      alert("داده‌ای برای خروجی وجود ندارد");
      return;
    }
    const trs = rows
      .map((i: DepartmentTypeItem) => `<tr><td>${i.name ?? ""}</td></tr>`)
      .join("");
    const pw = window.open("", "_blank");
    if (!pw) {
      alert("امکان باز کردن پنجره چاپ وجود ندارد");
      return;
    }
    pw.document.write(
      `<html dir="rtl" lang="fa"><head><title>PDF</title><style>body{font-family:Tahoma,Arial;direction:rtl;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:right}th{background:#f3f4f6}</style></head><body><h2>لیست انواع دپارتمان</h2><table><thead><tr><th>نام</th></tr></thead><tbody>${trs}</tbody></table><script>window.onload=function(){window.print()}</script></body></html>`,
    );
    pw.document.close();
  };

  const submitTitle = formMode === "create" ? "ثبت" : "ثبت تغییرات";
  const isSubmitting =
    formMode === "create" ? createMutation.isPending : updateMutation.isPending;

  return (
    <MainLayout.Main maxWidth="screen-xl">
      <PageTitle title="انواع دپارتمان" />
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
        <DataTable<DepartmentTypeItem>
          query={query}
          columns={columns}
          pagination={pagination}
          onPaginationChange={setPagination}
          filters={filters}
          onFiltersChange={(nf) => {
            const l = nf.at(-1);
            setFilters(l ? [l] : []);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
          filterFields={[
            { field: "name", label: "نام", placeholder: "جست‌وجو بر اساس نام" },
          ]}
          searchMode="onEnter"
          skeletonColumns={2}
          emptyStateMessage="هیچ نوع دپارتمانی یافت نشد"
          emptyStateDescription="موردی برای نمایش وجود ندارد."
        />
      </div>
      <Modal
        isOpen={isFormModalOpen}
        isRTL
        header={
          formMode === "create" ? "افزودن نوع دپارتمان" : "ویرایش نوع دپارتمان"
        }
        onClose={closeFormModal}
        overlayLock={isSubmitting}
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title={submitTitle}
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
                id="modal-name"
                name="modal-name"
                label="نام"
                value={formData.name}
                onChange={(v) => setFormData((p) => ({ ...p, name: v }))}
                dir="rtl"
                required
              />
            </FluidCol>
          </FluidGrid>
        )}
      />
      <Modal
        isOpen={!!itemToDelete}
        isRTL
        header="تأیید حذف نوع دپارتمان"
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
            <strong>{itemToDelete ? (itemToDelete.name ?? "") : ""}</strong>{" "}
            اطمینان دارید؟
          </p>
        )}
      />
    </MainLayout.Main>
  );
}
