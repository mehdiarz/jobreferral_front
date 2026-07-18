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
// import FormSelect from "../../baseComponents/FormSelect";
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

// type RegionProvinceCity = {
//   id: number;
//   provinceId: string;
//   provinceName: string;
//   cityId: string;
//   cityName: string;
// };

// type ProvinceCityDraft = {
//   provinceId: string;
//   cityId: string;
// };

type TableFilter = {
  key: string;
  value: string;
};

type RegionsApiResponse = {
  items?: RegionItem[];
  result?: {
    items?: RegionItem[];
  };
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

// const emptyProvinceCityDraft: ProvinceCityDraft = {
//   provinceId: "",
//   cityId: "",
// };

// تعریف type برای Option مطابق با FormSelect
// type SelectOption = {
//   id: string;
//   title: string;
// };

// اصلاح provinceOptions
// const provinceOptions: SelectOption[] = [
//   {
//     id: "1",
//     title: "تهران",
//   },
//   {
//     id: "2",
//     title: "اصفهان",
//   },
//   {
//     id: "3",
//     title: "فارس",
//   },
// ];

// اصلاح cityOptionsByProvince
// const cityOptionsByProvince: Record<string, SelectOption[]> = {
//   "1": [
//     {
//       id: "1",
//       title: "تهران",
//     },
//     {
//       id: "2",
//       title: "شهریار",
//     },
//     {
//       id: "3",
//       title: "ری",
//     },
//   ],
//   "2": [
//     {
//       id: "4",
//       title: "اصفهان",
//     },
//     {
//       id: "5",
//       title: "کاشان",
//     },
//   ],
//   "3": [
//     {
//       id: "6",
//       title: "شیراز",
//     },
//     {
//       id: "7",
//       title: "مرودشت",
//     },
//   ],
// };

export default function RegionsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [createForm, setCreateForm] = useState<RegionForm>(emptyForm);
  const [editForm, setEditForm] = useState<RegionForm>(emptyForm);
  const [editingRegion, setEditingRegion] = useState<RegionItem | null>(null);
  const [regionToDelete, setRegionToDelete] = useState<RegionItem | null>(null);

  // const [provinceCities, setProvinceCities] = useState<RegionProvinceCity[]>([
  //   {
  //     id: 1,
  //     provinceId: "1",
  //     provinceName: "تهران",
  //     cityId: "1",
  //     cityName: "تهران",
  //   },
  //   {
  //     id: 2,
  //     provinceId: "1",
  //     provinceName: "تهران",
  //     cityId: "2",
  //     cityName: "شهریار",
  //   },
  // ]);

  // const [provinceCityDraft, setProvinceCityDraft] = useState<ProvinceCityDraft>(
  //   emptyProvinceCityDraft,
  // );

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const [filters, setFilters] = useState<TableFilter[]>([]);

  // const cityOptions = useMemo(() => {
  //   return cityOptionsByProvince[provinceCityDraft.provinceId] ?? [];
  // }, [provinceCityDraft.provinceId]);

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
    mutationFn: (body: CreateRegionBody) => createRegion(body),

    onSuccess: (response) => {
      if (response?.success === false) {
        const apiMessage = response?.error?.message ?? response?.error?.details;

        showToast("خطا در ثبت منطقه استانی", "error", 5000, apiMessage);

        return;
      }

      showToast("منطقه استانی با موفقیت ثبت شد", "success");

      setCreateForm(emptyForm);
      // setProvinceCities([]);
      // setProvinceCityDraft(emptyProvinceCityDraft);

      setPagination((previous) => ({
        ...previous,
        pageIndex: 0,
      }));

      queryClient.invalidateQueries({
        queryKey: ["regions"],
      });
    },

    onError: (error) => {
      const apiMessage = error instanceof Error ? error.message : undefined;

      showToast("خطا در ثبت اطلاعات", "error", 5000, apiMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (body: UpdateRegionBody) => updateRegion(body),

    onSuccess: (response) => {
      if (response?.success === false) {
        const apiMessage = response?.error?.message ?? response?.error?.details;

        showToast("خطا در ویرایش منطقه استانی", "error", 5000, apiMessage);

        return;
      }

      showToast("منطقه استانی با موفقیت ویرایش شد", "success");

      setEditingRegion(null);
      setEditForm(emptyForm);

      queryClient.invalidateQueries({
        queryKey: ["regions"],
      });
    },

    onError: (error) => {
      const apiMessage = error instanceof Error ? error.message : undefined;

      showToast("عملیات ویرایش با خطا مواجه شد", "error", 5000, apiMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteRegion(id),

    onSuccess: (response) => {
      if (response?.success === false) {
        const apiMessage = response?.error?.message ?? response?.error?.details;

        showToast("خطا در حذف منطقه استانی", "error", 5000, apiMessage);

        return;
      }

      showToast("منطقه استانی با موفقیت حذف شد", "success");

      setRegionToDelete(null);

      queryClient.invalidateQueries({
        queryKey: ["regions"],
      });
    },

    onError: (error) => {
      const apiMessage = error instanceof Error ? error.message : undefined;

      showToast("عملیات حذف با خطا مواجه شد", "error", 5000, apiMessage);
    },
  });

  // const handleAddProvinceCity = () => {
  //   if (!provinceCityDraft.provinceId) {
  //     showToast("انتخاب استان الزامی است", "error");
  //     return;
  //   }
  //
  //   if (!provinceCityDraft.cityId) {
  //     showToast("انتخاب شهر الزامی است", "error");
  //     return;
  //   }
  //
  //   const province = provinceOptions.find(
  //     (item) => item.id === provinceCityDraft.provinceId,
  //   );
  //
  //   const city = cityOptions.find(
  //     (item) => item.id === provinceCityDraft.cityId,
  //   );
  //
  //   if (!province || !city) return;
  //
  //   const isDuplicate = provinceCities.some(
  //     (item) =>
  //       item.provinceId === provinceCityDraft.provinceId &&
  //       item.cityId === provinceCityDraft.cityId,
  //   );
  //
  //   if (isDuplicate) {
  //     showToast("این استان و شهر قبلا اضافه شده است", "error");
  //     return;
  //   }
  //
  //   setProvinceCities((previous) => [
  //     ...previous,
  //     {
  //       id: Date.now(),
  //       provinceId: province.id,
  //       provinceName: province.title,
  //       cityId: city.id,
  //       cityName: city.title,
  //     },
  //   ]);
  //
  //   setProvinceCityDraft(emptyProvinceCityDraft);
  // };

  // const handleRemoveProvinceCity = (id: number) => {
  //   setProvinceCities((previous) => previous.filter((item) => item.id !== id));
  // };

  const handleCreate = () => {
    const code = createForm.code.trim();
    const title = createForm.title.trim();
    const description = createForm.description.trim();

    if (!title) {
      showToast("وارد کردن نام منطقه الزامی است", "error");
      return;
    }

    if (!code) {
      showToast("وارد کردن کد منطقه الزامی است", "error");
      return;
    }

    createMutation.mutate({
      id: 0,
      code,
      title,
      description: description || undefined,
    });
  };

  const handleOpenEdit = useCallback((item: RegionItem) => {
    setEditingRegion(item);

    setEditForm({
      code: String(item.code ?? ""),
      title: String(item.title ?? ""),
      description: String(item.description ?? ""),
    });
  }, []);

  const handleUpdate = () => {
    if (!editingRegion) return;

    const code = editForm.code.trim();
    const title = editForm.title.trim();
    const description = editForm.description.trim();

    if (!title) {
      showToast("وارد کردن نام منطقه الزامی است", "error");
      return;
    }

    if (!code) {
      showToast("وارد کردن کد منطقه الزامی است", "error");
      return;
    }

    updateMutation.mutate({
      id: editingRegion.id,
      code,
      title,
      description: description || undefined,
    });
  };

  const handleDeleteClick = useCallback((item: RegionItem) => {
    setRegionToDelete(item);
  }, []);

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
        (item) => `
                <tr>
                    <td>${item.code ?? ""}</td>
                    <td>${item.title ?? ""}</td>
                    <td>${item.description ?? ""}</td>
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
                <h2>لیست مناطق استانی</h2>

                <table>
                    <thead>
                        <tr>
                            <th>کد منطقه</th>
                            <th>نام منطقه</th>
                            <th>توضیحات</th>
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
          const item = row.original;
          const isDeleting =
            deleteMutation.isPending && deleteMutation.variables === item.id;

          return (
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => handleOpenEdit(item)}
                disabled={deleteMutation.isPending || updateMutation.isPending}
                className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                title="ویرایش"
              >
                <Pencil className="w-4 h-4" />
              </button>
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
    [
      deleteMutation.isPending,
      deleteMutation.variables,
      updateMutation.isPending,
      handleDeleteClick,
      handleOpenEdit,
    ],
  );

  return (
    <MainLayout.Main maxWidth="screen-xl">
      <PageTitle title="ثبت منطقه استانی" />

      <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
        <FluidGrid className="gap-4">
          <FluidCol colSpan={12}>
            <FormInput
              id="code"
              name="code"
              label="کد منطقه"
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
              label="نام منطقه"
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
              rows={4}
              dir="rtl"
            />
          </FluidCol>

          {/*<FluidCol colSpan={12}>*/}
          {/*  <div className="overflow-x-auto rounded-lg border border-slate-200">*/}
          {/*    <table className="w-full min-w-[700px] border-collapse text-center text-sm">*/}
          {/*      <thead className="bg-slate-100">*/}
          {/*        <tr>*/}
          {/*          <th className="border border-slate-200 px-3 py-2">ردیف</th>*/}
          {/*          <th className="border border-slate-200 px-3 py-2">استان</th>*/}
          {/*          <th className="border border-slate-200 px-3 py-2">شهر</th>*/}
          {/*          <th className="border border-slate-200 px-3 py-2">*/}
          {/*            عملیات*/}
          {/*          </th>*/}
          {/*        </tr>*/}
          {/*      </thead>*/}

          {/*      <tbody>*/}
          {/*        {provinceCities.map((item, index) => (*/}
          {/*          <tr key={item.id}>*/}
          {/*            <td className="border border-slate-200 px-3 py-2">*/}
          {/*              {index + 1}*/}
          {/*            </td>*/}
          {/*            <td className="border border-slate-200 px-3 py-2">*/}
          {/*              {item.provinceName}*/}
          {/*            </td>*/}
          {/*            <td className="border border-slate-200 px-3 py-2">*/}
          {/*              {item.cityName}*/}
          {/*            </td>*/}
          {/*            <td className="border border-slate-200 px-3 py-2">*/}
          {/*              <FormButton*/}
          {/*                title="حذف"*/}
          {/*                variant="danger"*/}
          {/*                size="sm"*/}
          {/*                onClick={() => handleRemoveProvinceCity(item.id)}*/}
          {/*              />*/}
          {/*            </td>*/}
          {/*          </tr>*/}
          {/*        ))}*/}

          {/*        <tr>*/}
          {/*          <td className="border border-slate-200 px-3 py-2">*/}
          {/*            {provinceCities.length + 1}*/}
          {/*          </td>*/}

          {/*          <td className="border border-slate-200 px-3 py-2">*/}
          {/*            <FormSelect*/}
          {/*              id="provinceId"*/}
          {/*              name="provinceId"*/}
          {/*              label=""*/}
          {/*              value={provinceCityDraft.provinceId}*/}
          {/*              options={provinceOptions}*/}
          {/*              onChange={(value) =>*/}
          {/*                setProvinceCityDraft({*/}
          {/*                  provinceId: value,*/}
          {/*                  cityId: "",*/}
          {/*                })*/}
          {/*              }*/}
          {/*            />*/}
          {/*          </td>*/}

          {/*          <td className="border border-slate-200 px-3 py-2">*/}
          {/*            <FormSelect*/}
          {/*              id="cityId"*/}
          {/*              name="cityId"*/}
          {/*              label=""*/}
          {/*              value={provinceCityDraft.cityId}*/}
          {/*              options={cityOptions}*/}
          {/*              onChange={(value) =>*/}
          {/*                setProvinceCityDraft((previous) => ({*/}
          {/*                  ...previous,*/}
          {/*                  cityId: value,*/}
          {/*                }))*/}
          {/*              }*/}
          {/*              disabled={!provinceCityDraft.provinceId}*/}
          {/*            />*/}
          {/*          </td>*/}

          {/*          <td className="border border-slate-200 px-3 py-2">*/}
          {/*            <FormButton*/}
          {/*              title="افزودن"*/}
          {/*              variant="primary"*/}
          {/*              size="sm"*/}
          {/*              onClick={handleAddProvinceCity}*/}
          {/*            />*/}
          {/*          </td>*/}
          {/*        </tr>*/}
          {/*      </tbody>*/}
          {/*    </table>*/}
          {/*  </div>*/}
          {/*</FluidCol>*/}

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

      {editingRegion && (
        <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
          <div className="mb-4 text-sm font-bold text-slate-700">
            ویرایش منطقه استانی
          </div>

          <FluidGrid className="gap-4">
            <FluidCol colSpan={12}>
              <FormInput
                id="edit-code"
                name="edit-code"
                label="کد منطقه"
                value={editForm.code}
                onChange={(value) =>
                  setEditForm((previous) => ({
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
                id="edit-title"
                name="edit-title"
                label="نام منطقه"
                value={editForm.title}
                onChange={(value) =>
                  setEditForm((previous) => ({
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
                id="edit-description"
                name="edit-description"
                label="توضیحات"
                value={editForm.description}
                onChange={(value) =>
                  setEditForm((previous) => ({
                    ...previous,
                    description: value,
                  }))
                }
                rows={4}
                dir="rtl"
              />
            </FluidCol>

            <FluidCol colSpan={12}>
              <div className="flex flex-wrap items-center gap-2">
                <FormButton
                  title="ثبت تغییرات"
                  variant="success"
                  onClick={handleUpdate}
                  isLoading={updateMutation.isPending}
                  disabled={updateMutation.isPending}
                />

                <FormButton
                  title="انصراف"
                  variant="secondary"
                  onClick={() => {
                    setEditingRegion(null);
                    setEditForm(emptyForm);
                  }}
                  disabled={updateMutation.isPending}
                />
              </div>
            </FluidCol>
          </FluidGrid>
        </div>
      )}

      <div className="mb-4 border-t border-slate-300" />

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

        <DataTable<RegionItem>
          query={regionsQuery}
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

      <Modal
        isOpen={!!regionToDelete}
        isRTL
        header="تأیید حذف منطقه استانی"
        onClose={() => setRegionToDelete(null)}
        overlayLock={deleteMutation.isPending}
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title="حذف"
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => {
                if (regionToDelete) {
                  deleteMutation.mutate(regionToDelete.id);
                }
              }}
            />

            <FormButton
              title="انصراف"
              variant="secondary"
              disabled={deleteMutation.isPending}
              onClick={() => setRegionToDelete(null)}
            />
          </div>
        }
        renderContent={() => (
          <p>
            آیا از حذف{" "}
            <strong>
              {regionToDelete ? (regionToDelete.title ?? "") : ""}
            </strong>{" "}
            اطمینان دارید؟
          </p>
        )}
      />
    </MainLayout.Main>
  );
}
