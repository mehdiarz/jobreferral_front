import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, Pencil, Trash2, FileDown } from "lucide-react";

import { MainLayout } from "../../baseComponents/MainLayout";
import { FluidGrid } from "../../baseComponents/FluidGrid";
import { FluidCol } from "../../baseComponents/FluidCol";
import FormInput from "../../baseComponents/FormInput";
import FormTextarea from "../../baseComponents/FormTextarea";
import FormButton from "../../baseComponents/FormButton";
import PageTitle from "../../baseComponents/PageTitle";
import DataTable from "../../baseComponents/DataTable";
import Modal from "../../baseComponents/Modal";
import { useToast } from "../../libs/toastContext";

import {
  createRegion,
  type CreateRegionBody,
} from "../../services/RegionCrud/create";

import {
  getAllRegions,
  type RegionItem,
} from "../../services/RegionCrud/getAll";

import {
  updateRegion,
  type UpdateRegionBody,
} from "../../services/RegionCrud/update";

import { deleteRegion } from "../../services/RegionCrud/delete";

type RegionForm = {
  code: string;
  title: string;
  description: string;
};

type TableFilter = {
  key: string;
  value: string;
};

type RegionsApiResponse = {
  items?: RegionItem[];
  result?: { items?: RegionItem[] };
  listResult?: RegionItem[];
  data?: RegionItem[];
};

type RegionsQueryData = {
  listResult: RegionItem[];
  total: number;
  totalPages: number;
};

const emptyForm: RegionForm = {
  code: "",
  title: "",
  description: "",
};

export default function RegionsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formData, setFormData] = useState<RegionForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [itemToDelete, setItemToDelete] = useState<RegionItem | null>(null);

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [filters, setFilters] = useState<TableFilter[]>([]);

  const regionsQuery = useQuery({
    queryKey: ["regions", filters, pagination.pageIndex, pagination.pageSize],
    queryFn: () => getAllRegions(),
    select: (data): RegionsQueryData => {
      const apiData = data as RegionsApiResponse;
      const allItems: RegionItem[] =
        apiData?.items ??
        apiData?.result?.items ??
        apiData?.listResult ??
        apiData?.data ??
        [];

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

      const filteredItems = allItems.filter((item) => {
        const itemTitle = String(item.title ?? "")
          .trim()
          .toLocaleLowerCase("fa");
        const itemCode = String(item.code ?? "")
          .trim()
          .toLocaleLowerCase("fa");
        return (
          (!titleFilter || itemTitle.includes(titleFilter)) &&
          (!codeFilter || itemCode.includes(codeFilter))
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

  const createMutation = useMutation({
    mutationFn: (body: CreateRegionBody) => createRegion(body),
    onSuccess: () => {
      showToast("منطقه استانی با موفقیت ثبت شد", "success");
      closeFormModal();
      setPagination((p) => ({ ...p, pageIndex: 0 }));
      queryClient.invalidateQueries({ queryKey: ["regions"] });
    },
    onError: (error) =>
      showToast(error instanceof Error ? error.message : "خطا", "error", 5000),
  });

  const updateMutation = useMutation({
    mutationFn: (body: UpdateRegionBody) => updateRegion(body),
    onSuccess: () => {
      showToast("منطقه استانی با موفقیت ویرایش شد", "success");
      closeFormModal();
      queryClient.invalidateQueries({ queryKey: ["regions"] });
    },
    onError: (error) =>
      showToast(error instanceof Error ? error.message : "خطا", "error", 5000),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteRegion(id),
    onSuccess: () => {
      showToast("منطقه استانی با موفقیت حذف شد", "success");
      setItemToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["regions"] });
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

  const handleOpenEditModal = useCallback((item: RegionItem) => {
    setFormMode("edit");
    setFormData({
      code: String(item.code ?? ""),
      title: String(item.title ?? ""),
      description: String(item.description ?? ""),
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
    (item: RegionItem) => setItemToDelete(item),
    [],
  );

  const handleSubmitForm = () => {
    const code = formData.code.trim();
    const title = formData.title.trim();
    const description = formData.description.trim();

    if (!title) {
      showToast("وارد کردن نام منطقه الزامی است", "error");
      return;
    }
    if (!code) {
      showToast("وارد کردن کد منطقه الزامی است", "error");
      return;
    }

    if (formMode === "create") {
      createMutation.mutate({
        id: 0,
        code,
        title,
        description: description || undefined,
      });
    } else if (editingId !== null) {
      updateMutation.mutate({
        id: editingId,
        code,
        title,
        description: description || undefined,
      });
    }
  };

  const columns = useMemo<ColumnDef<RegionItem, unknown>[]>(
    () => [
      {
        accessorKey: "code",
        header: "کد منطقه",
        cell: ({ row }) => String(row.original.code ?? "-"),
      },
      {
        accessorKey: "title",
        header: "نام منطقه",
        cell: ({ row }) => String(row.original.title ?? "-"),
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
    const rows = regionsQuery.data?.listResult ?? [];
    if (!rows.length) {
      alert("داده‌ای برای خروجی وجود ندارد");
      return;
    }
    const headers = ["کد منطقه", "نام منطقه", "توضیحات"];
    const csvRows = rows.map((item) => [
      item.code ?? "",
      item.title ?? "",
      item.description ?? "",
    ]);
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
    link.download = "regions.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const rows = regionsQuery.data?.listResult ?? [];
    if (!rows.length) {
      alert("داده‌ای برای خروجی وجود ندارد");
      return;
    }
    const tableRows = rows
      .map(
        (item) =>
          `<tr><td>${item.code ?? ""}</td><td>${item.title ?? ""}</td><td>${item.description ?? ""}</td></tr>`,
      )
      .join("");
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("امکان باز کردن پنجره چاپ وجود ندارد");
      return;
    }
    printWindow.document
      .write(`<html dir="rtl" lang="fa"><head><title>PDF</title>
        <style>body{font-family:Tahoma,Arial;direction:rtl;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:right}th{background:#f3f4f6}</style></head>
        <body><h2>لیست مناطق استانی</h2><table><thead><tr><th>کد منطقه</th><th>نام منطقه</th><th>توضیحات</th></tr></thead>
        <tbody>${tableRows}</tbody></table><script>window.onload=function(){window.print()}</script></body></html>`);
    printWindow.document.close();
  };

  const submitButtonTitle = formMode === "create" ? "ثبت" : "ثبت تغییرات";
  const isSubmitting =
    formMode === "create" ? createMutation.isPending : updateMutation.isPending;

  return (
    <MainLayout.Main maxWidth="screen-xl">
      <PageTitle title="مناطق استانی" />

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

        <DataTable<RegionItem>
          query={regionsQuery}
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
              field: "code",
              label: "کد منطقه",
              placeholder: "جستجو بر اساس کد منطقه",
            },
            {
              field: "title",
              label: "نام منطقه",
              placeholder: "جستجو بر اساس نام منطقه",
            },
          ]}
          searchMode="onEnter"
          skeletonColumns={3}
          emptyStateMessage="هیچ منطقه استانی یافت نشد"
          emptyStateDescription="موردی برای نمایش وجود ندارد."
        />
      </div>

      {/* مودال افزودن/ویرایش */}
      <Modal
        isOpen={isFormModalOpen}
        isRTL
        header={
          formMode === "create" ? "افزودن منطقه استانی" : "ویرایش منطقه استانی"
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
              <FormInput
                id="modal-code"
                name="modal-code"
                label="کد منطقه"
                value={formData.code}
                onChange={(v) => setFormData((p) => ({ ...p, code: v }))}
                dir="ltr"
                required
              />
            </FluidCol>
            <FluidCol colSpan={12}>
              <FormInput
                id="modal-title"
                name="modal-title"
                label="نام منطقه"
                value={formData.title}
                onChange={(v) => setFormData((p) => ({ ...p, title: v }))}
                dir="rtl"
                required
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
          </FluidGrid>
        )}
      />

      {/* مودال حذف */}
      <Modal
        isOpen={!!itemToDelete}
        isRTL
        header="تأیید حذف منطقه استانی"
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
