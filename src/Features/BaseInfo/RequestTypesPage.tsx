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

import { createRequestType } from "../../services/RequestTypeCrud/create";
import { getAllRequestTypes } from "../../services/RequestTypeCrud/getAll";
import { editRequestType } from "../../services/RequestTypeCrud/update";
import { deleteRequestType } from "../../services/RequestTypeCrud/delete";
import type {
    RequestTypeItem,
    CreateRequestTypeBody,
    EditRequestTypeBody,
} from "../../services/RequestTypeCrud/types";

type RequestTypeForm = {
    code: string;
    title: string;
    description: string;
};

type TableFilter = {
    key: string;
    value: string;
};

type RequestTypesApiResponse = {
    items?: RequestTypeItem[];
    result?: {
        items?: RequestTypeItem[];
    };
    listResult?: RequestTypeItem[];
    data?: RequestTypeItem[];
};

type RequestTypesQueryData = {
    listResult: RequestTypeItem[];
    total: number;
    totalPages: number;
};

const emptyForm: RequestTypeForm = {
    code: "",
    title: "",
    description: "",
};

export default function RequestTypesPage() {
    const { showToast } = useToast();
    const queryClient = useQueryClient();

    const [createForm, setCreateForm] = useState<RequestTypeForm>(emptyForm);
    const [editForm, setEditForm] = useState<RequestTypeForm>(emptyForm);
    const [editingItem, setEditingItem] = useState<RequestTypeItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<RequestTypeItem | null>(null);

    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });

    const [filters, setFilters] = useState<TableFilter[]>([]);

    const requestTypesQuery = useQuery({
        queryKey: [
            "request-types",
            filters,
            pagination.pageIndex,
            pagination.pageSize,
        ],
        queryFn: () => getAllRequestTypes(),
        select: (data): RequestTypesQueryData => {
            const apiData = data as RequestTypesApiResponse;

            const allItems: RequestTypeItem[] =
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
        mutationFn: (body: CreateRequestTypeBody) =>
            createRequestType(body),

        onSuccess: () => {
            showToast(
                "نوع درخواست با موفقیت ثبت شد",
                "success"
            );

            setCreateForm(emptyForm);

            setPagination((previous) => ({
                ...previous,
                pageIndex: 0,
            }));

            queryClient.invalidateQueries({
                queryKey: ["request-types"],
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
        mutationFn: (body: EditRequestTypeBody) =>
            editRequestType(body),

        onSuccess: () => {
            showToast(
                "تغییرات با موفقیت اعمال شد",
                "success"
            );

            setEditingItem(null);
            setEditForm(emptyForm);

            queryClient.invalidateQueries({
                queryKey: ["request-types"],
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
        mutationFn: (id: number) => deleteRequestType(id),

        onSuccess: () => {
            showToast(
                "نوع درخواست با موفقیت حذف شد",
                "success"
            );

            setItemToDelete(null);

            queryClient.invalidateQueries({
                queryKey: ["request-types"],
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

    const handleEditClick = useCallback((item: RequestTypeItem) => {
        setEditingItem(item);
        setEditForm({
            code: item.code ?? "",
            title: item.title ?? "",
            description: item.description ?? "",
        });
    }, []);

    const handleDeleteClick = useCallback((item: RequestTypeItem) => {
        setItemToDelete(item);
    }, []);

    const handleCancelEdit = useCallback(() => {
        setEditingItem(null);
        setEditForm(emptyForm);
    }, []);

    const columns = useMemo<ColumnDef<RequestTypeItem, unknown>[]>(
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
                                onClick={() => handleEditClick(item)}
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
            deleteMutation.isPending,
            deleteMutation.variables,
            handleEditClick,
            handleDeleteClick,
        ]
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
            code,
            title,
            description: description || undefined,
        });
    };

    const handleUpdate = () => {
        if (!editingItem) return;

        const code = editForm.code.trim();
        const title = editForm.title.trim();

        if (!code) {
            showToast("کد نمی‌تواند خالی باشد", "error");
            return;
        }

        if (!title) {
            showToast("عنوان نمی‌تواند خالی باشد", "error");
            return;
        }

        updateMutation.mutate({
            id: editingItem.id,
            code,
            title,
            description: editForm.description.trim() || undefined,
        });
    };

    const handleExportExcel = () => {
        const rows = requestTypesQuery.data?.listResult ?? [];

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
        link.download = "request-types.csv";
        link.click();

        URL.revokeObjectURL(url);
    };

    const handleExportPdf = () => {
        const rows = requestTypesQuery.data?.listResult ?? [];

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
                <h2>لیست انواع درخواست</h2>

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
            <PageTitle title="انواع درخواست" />

            {/* فرم ثبت - فیلدها زیر هم colSpan={12} */}
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

            {/* بخش ویرایش */}
            {editingItem && (
                <div className="mb-6 rounded-lg bg-blue-50 p-4 shadow-sm border border-blue-200">
                    <h3 className="mb-4 font-bold text-lg">
                        ویرایش نوع درخواست
                    </h3>

                    <FluidGrid className="gap-4">
                        <FluidCol colSpan={12}>
                            <FormInput
                                id="edit-code"
                                name="edit-code"
                                label="کد"
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
                                label="عنوان"
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
                                rows={3}
                                dir="rtl"
                            />
                        </FluidCol>

                        <FluidCol colSpan={12}>
                            <div className="flex gap-2">
                                <FormButton
                                    title="ثبت تغییرات"
                                    variant="primary"
                                    onClick={handleUpdate}
                                    isLoading={updateMutation.isPending}
                                    disabled={updateMutation.isPending}
                                />

                                <FormButton
                                    title="انصراف"
                                    variant="secondary"
                                    onClick={handleCancelEdit}
                                    disabled={updateMutation.isPending}
                                />
                            </div>
                        </FluidCol>
                    </FluidGrid>
                </div>
            )}

            {/* جدول داده‌ها */}
            <div className="rounded-lg bg-white p-4 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
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

                <DataTable<RequestTypeItem>
                    query={requestTypesQuery}
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
                    emptyStateMessage="هیچ نوع درخواستی یافت نشد"
                    emptyStateDescription="موردی برای نمایش وجود ندارد."
                />
            </div>

            {/* مودال تأیید حذف */}
            <Modal
                isOpen={!!itemToDelete}
                isRTL
                header="تأیید حذف نوع درخواست"
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