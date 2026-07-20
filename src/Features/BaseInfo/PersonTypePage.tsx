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

import { createPersonalType } from "../../services/PersonalTypeCrud/create";
import { getAllPersonalTypes } from "../../services/PersonalTypeCrud/getAll";
import { editPersonalType } from "../../services/PersonalTypeCrud/update";
import { deletePersonalType } from "../../services/PersonalTypeCrud/delete";
import type {
  PersonalTypeItem,
  CreatePersonalTypeBody,
  EditPersonalTypeBody,
} from "../../services/PersonalTypeCrud/types";

type PersonTypeForm = {
  code: string;
  title: string;
  creditScore: string;
  creditWeight: string;
  description: string;
};

type TableFilter = {
  key: string;
  value: string;
};

type PersonalTypesApiResponse = {
  items?: PersonalTypeItem[];
  result?: { items?: PersonalTypeItem[] };
  listResult?: PersonalTypeItem[];
  data?: PersonalTypeItem[];
};

type PersonalTypesQueryData = {
  listResult: PersonalTypeItem[];
  total: number;
  totalPages: number;
};

const emptyForm: PersonTypeForm = {
  code: "",
  title: "",
  creditScore: "",
  creditWeight: "",
  description: "",
};

export default function PersonTypePage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formData, setFormData] = useState<PersonTypeForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [itemToDelete, setItemToDelete] = useState<PersonalTypeItem | null>(
    null,
  );

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [filters, setFilters] = useState<TableFilter[]>([]);

  const personalTypesQuery = useQuery({
    queryKey: [
      "personal-types",
      filters,
      pagination.pageIndex,
      pagination.pageSize,
    ],
    queryFn: () => getAllPersonalTypes(),
    select: (data): PersonalTypesQueryData => {
      const apiData = data as PersonalTypesApiResponse;
      const allItems: PersonalTypeItem[] =
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
    mutationFn: (body: CreatePersonalTypeBody) => createPersonalType(body),
    onSuccess: () => {
      showToast("نوع شخص با موفقیت ثبت شد", "success");
      closeFormModal();
      setPagination((p) => ({ ...p, pageIndex: 0 }));
      queryClient.invalidateQueries({ queryKey: ["personal-types"] });
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
    mutationFn: (body: EditPersonalTypeBody) => editPersonalType(body),
    onSuccess: () => {
      showToast("تغییرات با موفقیت اعمال شد", "success");
      closeFormModal();
      queryClient.invalidateQueries({ queryKey: ["personal-types"] });
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
    mutationFn: (id: number) => deletePersonalType(id),
    onSuccess: () => {
      showToast("نوع شخص با موفقیت حذف شد", "success");
      setItemToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["personal-types"] });
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

  const handleOpenEditModal = useCallback((item: PersonalTypeItem) => {
    setFormMode("edit");
    setFormData({
      code: item.code ?? "",
      title: item.title ?? "",
      creditScore: item.creditScore?.toString() ?? "",
      creditWeight: item.creditWeight?.toString() ?? "",
      description: item.description ?? "",
    });
    setEditingId(item.id);
    setIsFormModalOpen(true);
  }, []);

  const closeFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setFormData(emptyForm);
    setEditingId(null);
  }, []);

  const handleDeleteClick = useCallback((item: PersonalTypeItem) => {
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
      creditScore: formData.creditScore
        ? parseFloat(formData.creditScore)
        : undefined,
      creditWeight: formData.creditWeight
        ? parseFloat(formData.creditWeight)
        : undefined,
      description: formData.description.trim() || undefined,
    };

    if (formMode === "create") {
      createMutation.mutate(body as CreatePersonalTypeBody);
    } else if (formMode === "edit" && editingId !== null) {
      updateMutation.mutate({ id: editingId, ...body } as EditPersonalTypeBody);
    }
  };

  const columns = useMemo<ColumnDef<PersonalTypeItem, unknown>[]>(
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
        accessorKey: "creditScore",
        header: "امتیاز اعتباری",
        cell: ({ row }) =>
          row.original.creditScore != null
            ? Number(row.original.creditScore).toLocaleString("fa-IR")
            : "-",
      },
      {
        accessorKey: "creditWeight",
        header: "وزن اعتباری",
        cell: ({ row }) =>
          row.original.creditWeight != null
            ? Number(row.original.creditWeight).toLocaleString("fa-IR")
            : "-",
      },
      {
        id: "description",
        header: "توضیحات",
        cell: ({ row }) => String(row.original.description ?? "-"),
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
    const rows = personalTypesQuery.data?.listResult ?? [];
    if (!rows.length) {
      alert("داده‌ای برای خروجی وجود ندارد");
      return;
    }

    const headers = ["عنوان", "کد", "امتیاز اعتباری", "وزن اعتباری", "توضیحات"];
    const csvRows = rows.map((item) => [
      item.title ?? "",
      item.code ?? "",
      item.creditScore ?? "",
      item.creditWeight ?? "",
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
    link.download = "person-types.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const rows = personalTypesQuery.data?.listResult ?? [];
    if (!rows.length) {
      alert("داده‌ای برای خروجی وجود ندارد");
      return;
    }

    const tableRows = rows
      .map(
        (item) => `<tr>
                <td>${item.title ?? ""}</td><td>${item.code ?? ""}</td>
                <td>${item.creditScore ?? ""}</td><td>${item.creditWeight ?? ""}</td>
                <td>${item.description ?? ""}</td></tr>`,
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
        <body><h2>لیست انواع شخص</h2><table><thead><tr>
        <th>عنوان</th><th>کد</th><th>امتیاز اعتباری</th><th>وزن اعتباری</th><th>توضیحات</th></tr></thead>
        <tbody>${tableRows}</tbody></table><script>window.onload=function(){window.print()}</script></body></html>`);
    printWindow.document.close();
  };

  const submitButtonTitle = formMode === "create" ? "ثبت" : "ثبت تغییرات";
  const isSubmitting =
    formMode === "create" ? createMutation.isPending : updateMutation.isPending;

  return (
    <MainLayout.Main maxWidth="screen-xl">
      <PageTitle title="انواع شخص" />

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

        <DataTable<PersonalTypeItem>
          query={personalTypesQuery}
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
              field: "title",
              label: "عنوان",
              placeholder: "جست‌وجو بر اساس عنوان",
            },
            { field: "code", label: "کد", placeholder: "جست‌وجو بر اساس کد" },
          ]}
          skeletonColumns={6}
          emptyStateMessage="هیچ نوع شخصی یافت نشد"
          emptyStateDescription="موردی برای نمایش وجود ندارد."
        />
      </div>

      {/* مودال افزودن/ویرایش */}
      <Modal
        isOpen={isFormModalOpen}
        isRTL
        header={formMode === "create" ? "افزودن نوع شخص" : "ویرایش نوع شخص"}
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
              <FormInput
                id="modal-creditScore"
                name="modal-creditScore"
                label="امتیاز اعتباری"
                value={formData.creditScore}
                onChange={(v) => setFormData((p) => ({ ...p, creditScore: v }))}
                dir="ltr"
                type="number"
              />
            </FluidCol>
            <FluidCol colSpan={12}>
              <FormInput
                id="modal-creditWeight"
                name="modal-creditWeight"
                label="وزن اعتباری"
                value={formData.creditWeight}
                onChange={(v) =>
                  setFormData((p) => ({ ...p, creditWeight: v }))
                }
                dir="ltr"
                type="number"
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
        header="تأیید حذف نوع شخص"
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
