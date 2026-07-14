import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

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

import { createCollatralType } from "../../services/CollatralTypeCrud/create";
import { getAllCollatralTypes } from "../../services/CollatralTypeCrud/getAll";
import { editCollatralType } from "../../services/CollatralTypeCrud/update";
import { deleteCollatralType } from "../../services/CollatralTypeCrud/delete";
import type {
    CollatralTypeItem,
    CreateCollatralTypeBody,
    EditCollatralTypeBody,
} from "../../services/CollatralTypeCrud/types";

type CollateralTypeForm = {
    code: string;
    title: string;
    description: string;
};

type TableFilter = {
    key: string;
    value: string;
};

type CollateralTypesApiResponse = {
    items?: CollatralTypeItem[];
    result?: {
        items?: CollatralTypeItem[];
    };
    listResult?: CollatralTypeItem[];
    data?: CollatralTypeItem[];
};

type CollateralTypesQueryData = {
    listResult: CollatralTypeItem[];
    total: number;
    totalPages: number;
};

const emptyForm: CollateralTypeForm = {
    code: "",
    title: "",
    description: "",
};

export default function CollateralTypesPage() {
    const { showToast } = useToast();
    const queryClient = useQueryClient();

    // state مدیریت مودال افزودن/ویرایش
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [formData, setFormData] = useState<CollateralTypeForm>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);

    // state حذف
    const [itemToDelete, setItemToDelete] = useState<CollatralTypeItem | null>(null);

    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });

    const [filters, setFilters] = useState<TableFilter[]>([]);

    const collateralTypesQuery = useQuery({
        queryKey: [
            "collateral-types",
            filters,
            pagination.pageIndex,
            pagination.pageSize,
        ],
        queryFn: () => getAllCollatralTypes(),
        select: (data): CollateralTypesQueryData => {
            const apiData = data as CollateralTypesApiResponse;

            const allItems: CollatralTypeItem[] =
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

                const titleMatches =
                    !titleFilter || itemTitle.includes(titleFilter);

                const codeMatches =
                    !codeFilter || itemCode.includes(codeFilter);

                return titleMatches && codeMatches;
            });

            const total = filteredItems.length;

            const totalPages = Math.max(
                1,
                Math.ceil(total / pagination.pageSize)
            );

            const startIndex =
                pagination.pageIndex * pagination.pageSize;

            const paginatedItems = filteredItems.slice(
                startIndex,
                startIndex + pagination.pageSize
            );

            return {
                listResult: paginatedItems,
                total,
                totalPages,
            };
        },
    });

    const createMutation = useMutation({
        mutationFn: (body: CreateCollatralTypeBody) =>
            createCollatralType(body),

        onSuccess: () => {
            showToast(
                "نوع وثیقه با موفقیت ثبت شد",
                "success"
            );

            closeFormModal();

            setPagination((previous) => ({
                ...previous,
                pageIndex: 0,
            }));

            queryClient.invalidateQueries({
                queryKey: ["collateral-types"],
            });
        },

        onError: (error) => {
            const apiMessage =
                error instanceof Error ? error.message : undefined;

            showToast(
                "خطا در ثبت اطلاعات",
                "error",
                5000,
                apiMessage
            );
        },
    });

    const updateMutation = useMutation({
        mutationFn: (body: EditCollatralTypeBody) =>
            editCollatralType(body),

        onSuccess: () => {
            showToast(
                "تغییرات با موفقیت اعمال شد",
                "success"
            );

            closeFormModal();

            queryClient.invalidateQueries({
                queryKey: ["collateral-types"],
            });
        },

        onError: (error) => {
            const apiMessage =
                error instanceof Error ? error.message : undefined;

            showToast(
                "خطا در ویرایش اطلاعات",
                "error",
                5000,
                apiMessage
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => deleteCollatralType(id),

        onSuccess: () => {
            showToast(
                "نوع وثیقه با موفقیت حذف شد",
                "success"
            );

            setItemToDelete(null);

            queryClient.invalidateQueries({
                queryKey: ["collateral-types"],
            });
        },

        onError: (error) => {
            const apiMessage =
                error instanceof Error ? error.message : undefined;

            showToast(
                "عملیات حذف با خطا مواجه شد",
                "error",
                5000,
                apiMessage
            );
        },
    });

    // باز کردن مودال برای افزودن
    const handleOpenCreateModal = useCallback(() => {
        setFormMode("create");
        setFormData(emptyForm);
        setEditingId(null);
        setIsFormModalOpen(true);
    }, []);

    // باز کردن مودال برای ویرایش
    const handleOpenEditModal = useCallback((item: CollatralTypeItem) => {
        setFormMode("edit");
        setFormData({
            code: item.code ?? "",
            title: item.title ?? "",
            description: item.description ?? "",
        });
        setEditingId(item.id);
        setIsFormModalOpen(true);
    }, []);

    // بستن مودال فرم
    const closeFormModal = useCallback(() => {
        setIsFormModalOpen(false);
        setFormData(emptyForm);
        setEditingId(null);
    }, []);

    // باز کردن مودال حذف
    const handleDeleteClick = useCallback((item: CollatralTypeItem) => {
        setItemToDelete(item);
    }, []);

    // ثبت فرم (افزودن یا ویرایش)
    const handleSubmitForm = () => {
        const code = formData.code.trim();
        const title = formData.title.trim();
        const description = formData.description.trim();

        if (!code) {
            showToast("وارد کردن کد الزامی است", "error");
            return;
        }

        if (!title) {
            showToast("وارد کردن عنوان الزامی است", "error");
            return;
        }

        if (formMode === "create") {
            createMutation.mutate({
                code,
                title,
                description: description || undefined,
            });
        } else if (formMode === "edit" && editingId !== null) {
            updateMutation.mutate({
                id: editingId,
                code,
                title,
                description: description || undefined,
            });
        }
    };

    const columns = useMemo<ColumnDef<CollatralTypeItem, unknown>[]>(
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
                header: "وضعیت",
                enableSorting: false,
                cell: ({ row }) => {
                    const item = row.original;

                    const isDeleting =
                        deleteMutation.isPending &&
                        deleteMutation.variables === item.id;

                    return (
                        <div className="flex flex-wrap items-center gap-2">
                            <FormButton
                                title="ویرایش"
                                variant="primary"
                                size="sm"
                                onClick={() => handleOpenEditModal(item)}
                                disabled={deleteMutation.isPending}
                            />
                            <FormButton
                                title="حذف"
                                variant="danger"
                                size="sm"
                                onClick={() => handleDeleteClick(item)}
                                isLoading={isDeleting}
                                disabled={deleteMutation.isPending}
                            />
                        </div>
                    );
                },
            },
        ],
        [
            pagination.pageIndex,
            pagination.pageSize,
            deleteMutation.isPending,
            deleteMutation.variables,
            handleOpenEditModal,
            handleDeleteClick,
        ]
    );

    const handleExportExcel = () => {
        const rows = collateralTypesQuery.data?.listResult ?? [];

        if (!rows.length) {
            alert("داده‌ای برای خروجی وجود ندارد");
            return;
        }

        const headers = ["کد", "عنوان"];

        const csvRows = rows.map((item) => [
            item.code ?? "",
            item.title ?? "",
        ]);

        const csvContent = [
            headers.join(","),
            ...csvRows.map((row) =>
                row
                    .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                    .join(",")
            ),
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "collateral-types.csv";
        link.click();

        URL.revokeObjectURL(url);
    };

    const handleExportPdf = () => {
        const rows = collateralTypesQuery.data?.listResult ?? [];

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
        `
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
                    font-family: Arial, sans-serif;
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
            <h2>لیست انواع وثیقه</h2>

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

    // متن دکمه ثبت/ویرایش در مودال
    const submitButtonTitle = formMode === "create" ? "ثبت" : "ثبت تغییرات";
    const isSubmitting =
        formMode === "create"
            ? createMutation.isPending
            : updateMutation.isPending;

    return (
        <MainLayout.Main maxWidth="screen-xl">
            <PageTitle title="انواع وثیقه" />

            {/* جدول داده‌ها */}
            <div className="rounded-lg bg-white p-4 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <FormButton
                            title="+ افزودن"
                            variant="success"
                            onClick={handleOpenCreateModal}
                        />

                        <FormButton
                            title="خروجی اکسل"
                            variant="secondary"
                            onClick={handleExportExcel}
                        />

                        <FormButton
                            title="PDF"
                            variant="secondary"
                            onClick={handleExportPdf}
                        />
                    </div>
                </div>

                <DataTable<CollatralTypeItem>
                    query={collateralTypesQuery}
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
                    skeletonColumns={3}
                    emptyStateMessage="هیچ نوع وثیقه‌ای یافت نشد"
                    emptyStateDescription="موردی برای نمایش وجود ندارد."
                />
            </div>

            {/* مودال افزودن/ویرایش */}
            <Modal
                isOpen={isFormModalOpen}
                isRTL
                header={formMode === "create" ? "افزودن نوع وثیقه" : "ویرایش نوع وثیقه"}
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
                                label="کد"
                                value={formData.code}
                                onChange={(value) =>
                                    setFormData((previous) => ({
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
                                id="modal-title"
                                name="modal-title"
                                label="عنوان"
                                value={formData.title}
                                onChange={(value) =>
                                    setFormData((previous) => ({
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
                                id="modal-description"
                                name="modal-description"
                                label="توضیحات"
                                value={formData.description}
                                onChange={(value) =>
                                    setFormData((previous) => ({
                                        ...previous,
                                        description: value,
                                    }))
                                }
                                rows={3}
                                dir="rtl"
                            />
                        </FluidCol>
                    </FluidGrid>
                )}
            />

            {/* مودال تأیید حذف */}
            <Modal
                isOpen={!!itemToDelete}
                isRTL
                header="تأیید حذف نوع وثیقه"
                onClose={() => setItemToDelete(null)}
                overlayLock={deleteMutation.isPending}
                footerButtons={
                    <div className="flex gap-2">
                        <FormButton
                            title="حذف"
                            variant="danger"
                            isLoading={deleteMutation.isPending}
                            onClick={() => {
                                if (itemToDelete) {
                                    deleteMutation.mutate(itemToDelete.id);
                                }
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
                        <strong>{itemToDelete ? itemToDelete.title ?? "" : ""}</strong>{" "}
                        اطمینان دارید؟
                    </p>
                )}
            />
        </MainLayout.Main>
    );
}