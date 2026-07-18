import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2, Loader2, FileDown } from "lucide-react";

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
  createExpertiseZone,
  type CreateExpertiseZoneBody,
} from "../../services/ExpertiseZoneCrud/create";

import {
  getAllExpertiseZones,
  type ExpertiseZoneItem,
} from "../../services/ExpertiseZoneCrud/getAll";

import { deleteExpertiseZone } from "../../services/ExpertiseZoneCrud/delete";

type ZoneForm = {
  code: string;
  title: string;
  description: string;
};

type TableFilter = {
  key: string;
  value: string;
};

type ExpertiseZonesApiResponse = {
  items?: ExpertiseZoneItem[];
  result?: {
    items?: ExpertiseZoneItem[];
  };
  listResult?: ExpertiseZoneItem[];
  data?: ExpertiseZoneItem[];
};

type ExpertiseZonesQueryData = {
  listResult: ExpertiseZoneItem[];
  total: number;
  totalPages: number;
};

const emptyForm: ZoneForm = {
  code: "",
  title: "",
  description: "",
};

export default function ExpertiseZonesPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [createForm, setCreateForm] = useState<ZoneForm>(emptyForm);
  const [zoneToDelete, setZoneToDelete] = useState<ExpertiseZoneItem | null>(
    null,
  );

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [filters, setFilters] = useState<TableFilter[]>([]);

  const expertiseZonesQuery = useQuery({
    queryKey: [
      "expertise-zones",
      filters,
      pagination.pageIndex,
      pagination.pageSize,
    ],
    queryFn: () => getAllExpertiseZones(),
    select: (data): ExpertiseZonesQueryData => {
      const apiData = data as ExpertiseZonesApiResponse;

      const allItems: ExpertiseZoneItem[] =
        apiData?.items ??
        apiData?.result?.items ??
        apiData?.listResult ??
        apiData?.data ??
        [];

      const titleFilter =
        filters
          .find((filter) => filter.key === "title")
          ?.value?.trim()
          .toLocaleLowerCase("fa") ?? "";

      const codeFilter =
        filters
          .find((filter) => filter.key === "code")
          ?.value?.trim()
          .toLocaleLowerCase("fa") ?? "";

      const filteredItems = allItems.filter((item) => {
        const itemTitle = String(item.title ?? "")
          .trim()
          .toLocaleLowerCase("fa");

        const itemCode = String(item.code ?? "")
          .trim()
          .toLocaleLowerCase("fa");

        const titleMatches = !titleFilter || itemTitle.includes(titleFilter);

        const codeMatches = !codeFilter || itemCode.includes(codeFilter);

        return titleMatches && codeMatches;
      });

      const total = filteredItems.length;

      const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));

      const startIndex = pagination.pageIndex * pagination.pageSize;

      const paginatedItems = filteredItems.slice(
        startIndex,
        startIndex + pagination.pageSize,
      );

      return {
        listResult: paginatedItems,
        total,
        totalPages,
      };
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: CreateExpertiseZoneBody) => createExpertiseZone(body),

    onSuccess: (response) => {
      if (response?.success === false) {
        const apiMessage = response?.error?.message ?? response?.error?.details;

        showToast("خطا در ثبت حدود صلاحیت", "error", 5000, apiMessage);

        return;
      }

      showToast("حدود صلاحیت با موفقیت ثبت شد", "success");

      setCreateForm(emptyForm);

      setPagination((previous) => ({
        ...previous,
        pageIndex: 0,
      }));

      queryClient.invalidateQueries({
        queryKey: ["expertise-zones"],
      });
    },

    onError: (error) => {
      const apiMessage = error instanceof Error ? error.message : undefined;

      showToast("خطا در ثبت اطلاعات", "error", 5000, apiMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteExpertiseZone(id),

    onSuccess: (response) => {
      if (response?.success === false) {
        const apiMessage = response?.error?.message ?? response?.error?.details;

        showToast("خطا در حذف حدود صلاحیت", "error", 5000, apiMessage);

        return;
      }

      showToast("حدود صلاحیت با موفقیت حذف شد", "success");

      setZoneToDelete(null);

      queryClient.invalidateQueries({
        queryKey: ["expertise-zones"],
      });
    },

    onError: (error) => {
      const apiMessage = error instanceof Error ? error.message : undefined;

      showToast("عملیات حذف با خطا مواجه شد", "error", 5000, apiMessage);
    },
  });

  const handleDeleteClick = useCallback((item: ExpertiseZoneItem) => {
    setZoneToDelete(item);
  }, []);

  const columns = useMemo<ColumnDef<ExpertiseZoneItem, unknown>[]>(
    () => [
      {
        accessorKey: "code",
        header: "کد",
        cell: ({ row }) => String(row.original.code ?? "-"),
      },
      {
        accessorKey: "title",
        header: "عنوان",
        cell: ({ row }) => String(row.original.title ?? "-"),
      },
      {
        id: "actions",
        header: "عملیات",
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          const isDeleting =
            deleteMutation.isPending && deleteMutation.variables === item.id;

          return (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleDeleteClick(item)}
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
    [deleteMutation.isPending, deleteMutation.variables, handleDeleteClick],
  );

  const handleCreate = () => {
    const code = createForm.code.trim();
    const title = createForm.title.trim();
    const description = createForm.description.trim();

    if (!code) {
      showToast("وارد کردن کد الزامی است", "error");
      return;
    }

    if (!title) {
      showToast("وارد کردن عنوان الزامی است", "error");
      return;
    }

    createMutation.mutate({
      id: 0,
      code,
      title,
      description: description || undefined,
    } as CreateExpertiseZoneBody);
  };

  const handleExportExcel = () => {
    const rows = expertiseZonesQuery.data?.listResult ?? [];

    if (!rows.length) {
      alert("داده‌ای برای خروجی وجود ندارد");
      return;
    }

    const headers = ["کد", "عنوان"];

    const csvRows = rows.map((item) => [item.code ?? "", item.title ?? ""]);

    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "expertise-zones.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const rows = expertiseZonesQuery.data?.listResult ?? [];

    if (!rows.length) {
      alert("داده‌ای برای خروجی وجود ندارد");
      return;
    }

    const tableRows = rows
      .map(
        (item) => `
                <tr>
                    <td>${item.code ?? ""}</td>
                    <td>${item.title ?? ""}</td>
                </tr>
            `,
      )
      .join("");

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("امکان باز کردن پنجره چاپ وجود ندارد");
      return;
    }

    printWindow.document.write(`
        <html dir="rtl" lang="fa">
            <head>
                <title>PDF</title>
                <style>
                    body {
                        font-family: Tahoma, Arial, sans-serif;
                        direction: rtl;
                        padding: 24px;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }

                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: right;
                    }

                    th {
                        background: #f3f4f6;
                    }
                </style>
            </head>

            <body>
                <h2>لیست حد صلاحیت</h2>

                <table>
                    <thead>
                        <tr>
                            <th>کد</th>
                            <th>عنوان</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>

                <script>
                    window.onload = function () {
                        window.print();
                    };
                </script>
            </body>
        </html>
    `);

    printWindow.document.close();
  };

  return (
    <MainLayout.Main maxWidth="screen-xl">
      <PageTitle title="حدود صلاحیت کارشناسان دادگستری" />

      <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
        <FluidGrid className="gap-4">
          <FluidCol colSpan={12}>
            <FormInput
              id="code"
              name="code"
              label="کد"
              value={createForm.code}
              onChange={(value) =>
                setCreateForm((previous) => ({
                  ...previous,
                  code: value,
                }))
              }
              dir="ltr"
              required
            />
          </FluidCol>

          <FluidCol colSpan={12}>
            <FormInput
              id="title"
              name="title"
              label="عنوان"
              value={createForm.title}
              onChange={(value) =>
                setCreateForm((previous) => ({
                  ...previous,
                  title: value,
                }))
              }
              dir="rtl"
              required
            />
          </FluidCol>

          <FluidCol colSpan={12}>
            <FormTextarea
              id="description"
              name="description"
              label="توضیحات"
              value={createForm.description}
              onChange={(value) =>
                setCreateForm((previous) => ({
                  ...previous,
                  description: value,
                }))
              }
              rows={3}
              dir="rtl"
            />
          </FluidCol>

          <FluidCol colSpan={12}>
            <FormButton
              title="ذخیره"
              variant="success"
              onClick={handleCreate}
              isLoading={createMutation.isPending}
              disabled={createMutation.isPending}
            />
          </FluidCol>
        </FluidGrid>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
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

        <DataTable<ExpertiseZoneItem>
          query={expertiseZonesQuery}
          columns={columns}
          pagination={pagination}
          onPaginationChange={setPagination}
          filters={filters}
          onFiltersChange={(newFilters) => {
            const latestFilter = newFilters.at(-1);

            setFilters(latestFilter ? [latestFilter] : []);

            setPagination((previous) => ({
              ...previous,
              pageIndex: 0,
            }));
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
          ]}
          searchMode="onEnter"
          skeletonColumns={3}
          emptyStateMessage="هیچ حد صلاحیتی یافت نشد"
          emptyStateDescription="موردی برای نمایش وجود ندارد."
        />
      </div>

      <Modal
        isOpen={!!zoneToDelete}
        isRTL
        header="تأیید حذف حدود صلاحیت"
        onClose={() => setZoneToDelete(null)}
        overlayLock={deleteMutation.isPending}
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title="حذف"
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => {
                if (zoneToDelete) {
                  deleteMutation.mutate(zoneToDelete.id);
                }
              }}
            />

            <FormButton
              title="انصراف"
              variant="secondary"
              disabled={deleteMutation.isPending}
              onClick={() => setZoneToDelete(null)}
            />
          </div>
        }
        renderContent={() => (
          <p>
            آیا از حذف{" "}
            <strong>{zoneToDelete ? (zoneToDelete.title ?? "") : ""}</strong>{" "}
            اطمینان دارید؟
          </p>
        )}
      />
    </MainLayout.Main>
  );
}
