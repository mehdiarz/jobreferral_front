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

import { getAllDepartments } from "../../services/DepartmentCrud/getAll";
import type { DepartmentItem } from "../../services/DepartmentCrud/types";

type CreditLimitAuthorityForm = {
    personType: string;
    collateralTypeId: number | null;
    departmentId: number | null;
    minAmount: string;
    maxAmount: string;
};

type TableFilter = {
    key: string;
    value: string;
};

type CreditLimitAuthoritiesApiResponse = {
    items?: CreditLimitAuthorityItem[];
    result?: {
        items?: CreditLimitAuthorityItem[];
    };
    listResult?: CreditLimitAuthorityItem[];
    data?: CreditLimitAuthorityItem[];
};

type CreditLimitAuthoritiesQueryData = {
    listResult: CreditLimitAuthorityItem[];
    total: number;
    totalPages: number;
};

const emptyForm: CreditLimitAuthorityForm = {
    personType: "",
    collateralTypeId: null,
    departmentId: null,
    minAmount: "",
    maxAmount: "",
};

// نوع شخص hard code - فقط حقیقی و حقوقی
const PERSON_TYPES = [
    { id: "حقیقی" as const, title: "حقیقی" },
    { id: "حقوقی" as const, title: "حقوقی" },
];

export default function CreditLimitAuthoritiesPage() {
    const { showToast } = useToast();
    const queryClient = useQueryClient();

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [formData, setFormData] = useState<CreditLimitAuthorityForm>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [itemToDelete, setItemToDelete] = useState<CreditLimitAuthorityItem | null>(null);

    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });

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

            // دریافت فیلترها
            const personTypeFilter =
                filters
                    .find((filter) => filter.key === "personType")
                    ?.value?.trim() ?? "";

            const collateralTypeFilter =
                filters
                    .find((filter) => filter.key === "collateralType")
                    ?.value?.trim()
                    .toLocaleLowerCase("fa") ?? "";

            const departmentFilter =
                filters
                    .find((filter) => filter.key === "department")
                    ?.value?.trim()
                    .toLocaleLowerCase("fa") ?? "";

            const minAmountFilter =
                filters
                    .find((filter) => filter.key === "minAmount")
                    ?.value?.trim() ?? "";

            const maxAmountFilter =
                filters
                    .find((filter) => filter.key === "maxAmount")
                    ?.value?.trim() ?? "";

            // اعمال فیلترها
            const filteredItems = allItems.filter((item) => {
                // فیلتر نوع شخص
                if (personTypeFilter && item.personType !== personTypeFilter) {
                    return false;
                }

                // فیلتر نوع وثیقه
                if (collateralTypeFilter) {
                    const type = (collateralTypesQuery.data ?? []).find(
                        (t: CollatralTypeItem) => t.id === item.collateralTypeId
                    );
                    const typeTitle = String(type?.title ?? "").toLocaleLowerCase("fa");
                    if (!typeTitle.includes(collateralTypeFilter)) {
                        return false;
                    }
                }

                // فیلتر دپارتمان
                if (departmentFilter) {
                    const dept = (departmentsQuery.data ?? []).find(
                        (d: DepartmentItem) => d.id === item.departmentId
                    );
                    const deptTitle = String(dept?.title ?? "").toLocaleLowerCase("fa");
                    if (!deptTitle.includes(departmentFilter)) {
                        return false;
                    }
                }

                // فیلتر حداقل مبلغ
                if (minAmountFilter) {
                    const minAmount = item.minAmount?.toString() ?? "";
                    if (!minAmount.includes(minAmountFilter)) {
                        return false;
                    }
                }

                // فیلتر حداکثر مبلغ
                if (maxAmountFilter) {
                    const maxAmount = item.maxAmount?.toString() ?? "";
                    if (!maxAmount.includes(maxAmountFilter)) {
                        return false;
                    }
                }

                return true;
            });

            const total = filteredItems.length;

            const totalPages = Math.max(
                1,
                Math.ceil(total / pagination.pageSize)
            );

            const startIndex = pagination.pageIndex * pagination.pageSize;

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

    const collateralTypesQuery = useQuery({
        queryKey: ["collateral-types-all"],
        queryFn: () => getAllCollatralTypes({ maxResultCount: 1000 }),
        select: (data) => data?.items ?? [],
    });

    const departmentsQuery = useQuery({
        queryKey: ["departments-all"],
        queryFn: () => getAllDepartments({ maxResultCount: 1000 }),
        select: (data) => data?.items ?? [],
    });

    const createMutation = useMutation({
        mutationFn: (body: CreateCreditLimitAuthorityBody) =>
            createCreditLimitAuthority(body),

        onSuccess: () => {
            showToast("رکن اعتباری با موفقیت ثبت شد", "success");
            closeFormModal();
            setPagination((previous) => ({ ...previous, pageIndex: 0 }));
            queryClient.invalidateQueries({ queryKey: ["credit-limit-authorities"] });
        },

        onError: (error) => {
            const apiMessage = error instanceof Error ? error.message : undefined;
            showToast("خطا در ثبت اطلاعات", "error", 5000, apiMessage);
        },
    });

    const updateMutation = useMutation({
        mutationFn: (body: EditCreditLimitAuthorityBody) =>
            editCreditLimitAuthority(body),

        onSuccess: () => {
            showToast("تغییرات با موفقیت اعمال شد", "success");
            closeFormModal();
            queryClient.invalidateQueries({ queryKey: ["credit-limit-authorities"] });
        },

        onError: (error) => {
            const apiMessage = error instanceof Error ? error.message : undefined;
            showToast("خطا در ویرایش اطلاعات", "error", 5000, apiMessage);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => deleteCreditLimitAuthority(id),

        onSuccess: () => {
            showToast("رکن اعتباری با موفقیت حذف شد", "success");
            setItemToDelete(null);
            queryClient.invalidateQueries({ queryKey: ["credit-limit-authorities"] });
        },

        onError: (error) => {
            const apiMessage = error instanceof Error ? error.message : undefined;
            showToast("عملیات حذف با خطا مواجه شد", "error", 5000, apiMessage);
        },
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
            personType: item.personType ?? "",
            collateralTypeId: item.collateralTypeId ?? null,
            departmentId: item.departmentId ?? null,
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

    const handleDeleteClick = useCallback((item: CreditLimitAuthorityItem) => {
        setItemToDelete(item);
    }, []);

    const handleSubmitForm = () => {
        if (!formData.personType) {
            showToast("انتخاب نوع شخص الزامی است", "error");
            return;
        }

        if (!formData.collateralTypeId) {
            showToast("انتخاب نوع وثیقه الزامی است", "error");
            return;
        }

        if (!formData.departmentId) {
            showToast("انتخاب دپارتمان الزامی است", "error");
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
            personType: formData.personType,
            collateralTypeId: formData.collateralTypeId,
            departmentId: formData.departmentId,
            minAmount: parseFloat(formData.minAmount),
            maxAmount: parseFloat(formData.maxAmount),
        };

        if (formMode === "create") {
            createMutation.mutate(body as CreateCreditLimitAuthorityBody);
        } else if (formMode === "edit" && editingId !== null) {
            updateMutation.mutate({ id: editingId, ...body } as EditCreditLimitAuthorityBody);
        }
    };

    const collateralTypeOptions = useMemo(
        () =>
            (collateralTypesQuery.data ?? []).map((item: CollatralTypeItem) => ({
                id: item.id,
                title: item.title ?? "",
            })),
        [collateralTypesQuery.data]
    );

    const departmentOptions = useMemo(
        () =>
            (departmentsQuery.data ?? []).map((item: DepartmentItem) => ({
                id: item.id,
                title: item.title ?? "",
            })),
        [departmentsQuery.data]
    );

    const columns = useMemo<ColumnDef<CreditLimitAuthorityItem, unknown>[]>(
        () => [
            {
                accessorKey: "personType",
                header: "نوع شخص",
                cell: ({ row }) => String(row.original.personType ?? "-"),
            },
            {
                id: "collateralType",
                header: "نوع وثیقه",
                cell: ({ row }) => {
                    const typeId = row.original.collateralTypeId;
                    const type = (collateralTypesQuery.data ?? []).find(
                        (t: CollatralTypeItem) => t.id === typeId
                    );
                    return type?.title ?? "-";
                },
            },
            {
                id: "department",
                header: "دپارتمان",
                cell: ({ row }) => {
                    const deptId = row.original.departmentId;
                    const dept = (departmentsQuery.data ?? []).find(
                        (d: DepartmentItem) => d.id === deptId
                    );
                    return dept?.title ?? "-";
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
                    const item = row.original;
                    const isDeleting =
                        deleteMutation.isPending && deleteMutation.variables === item.id;

                    return (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handleOpenEditModal(item)}
                                disabled={deleteMutation.isPending}
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
            collateralTypesQuery.data,
            departmentsQuery.data,
            deleteMutation.isPending,
            deleteMutation.variables,
            handleOpenEditModal,
            handleDeleteClick,
        ]
    );

    const handleExportExcel = () => {
        const rows = creditLimitAuthoritiesQuery.data?.listResult ?? [];
        if (!rows.length) {
            alert("داده‌ای برای خروجی وجود ندارد");
            return;
        }

        const headers = ["نوع شخص", "نوع وثیقه", "دپارتمان", "حداقل مبلغ", "حداکثر مبلغ"];

        const csvRows = rows.map((item) => {
            const type = (collateralTypesQuery.data ?? []).find(
                (t: CollatralTypeItem) => t.id === item.collateralTypeId
            );
            const dept = (departmentsQuery.data ?? []).find(
                (d: DepartmentItem) => d.id === item.departmentId
            );
            return [
                item.personType ?? "",
                type?.title ?? "",
                dept?.title ?? "",
                item.minAmount ?? "",
                item.maxAmount ?? "",
            ];
        });

        const csvContent = [
            headers.join(","),
            ...csvRows.map((row) =>
                row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
            ),
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
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
                const type = (collateralTypesQuery.data ?? []).find(
                    (t: CollatralTypeItem) => t.id === item.collateralTypeId
                );
                const dept = (departmentsQuery.data ?? []).find(
                    (d: DepartmentItem) => d.id === item.departmentId
                );
                return `
                <tr>
                    <td>${item.personType ?? ""}</td>
                    <td>${type?.title ?? ""}</td>
                    <td>${dept?.title ?? ""}</td>
                    <td>${item.minAmount ?? ""}</td>
                    <td>${item.maxAmount ?? ""}</td>
                </tr>`;
            })
            .join("");

        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            alert("امکان باز کردن پنجره چاپ وجود ندارد");
            return;
        }

        printWindow.document.write(`
        <html dir="rtl" lang="fa">
            <head><title>PDF</title>
            <style>body{font-family:Arial;direction:rtl;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:right}th{background:#f3f4f6}</style></head>
            <body><h2>لیست حدود اختیار رکن اعتباری تسهیلات ریالی</h2>
            <table><thead><tr><th>نوع شخص</th><th>نوع وثیقه</th><th>دپارتمان</th><th>حداقل مبلغ</th><th>حداکثر مبلغ</th></tr></thead>
            <tbody>${tableRows}</tbody></table>
            <script>window.onload=function(){window.print()}</script></body></html>`);
        printWindow.document.close();
    };

    const submitButtonTitle = formMode === "create" ? "ثبت" : "ثبت تغییرات";
    const isSubmitting = formMode === "create" ? createMutation.isPending : updateMutation.isPending;

    return (
        <MainLayout.Main maxWidth="screen-xl">
            <PageTitle title="حدود اختیار رکن اعتباری تسهیلات ریالی" />

            <div className="rounded-lg bg-white p-4 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <FormButton title="+ افزودن" variant="success" onClick={handleOpenCreateModal} />
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
                        const latestFilter = newFilters.at(-1);
                        setFilters(latestFilter ? [latestFilter] : []);
                        setPagination((previous) => ({ ...previous, pageIndex: 0 }));
                    }}
                    filterFields={[
                        { field: "personType", label: "نوع شخص", placeholder: "جست‌وجو بر اساس نوع شخص" },
                        { field: "collateralType", label: "نوع وثیقه", placeholder: "جست‌وجو بر اساس نوع وثیقه" },
                        { field: "department", label: "دپارتمان", placeholder: "جست‌وجو بر اساس دپارتمان" },
                        { field: "minAmount", label: "حداقل مبلغ", placeholder: "جست‌وجو بر اساس حداقل مبلغ" },
                        { field: "maxAmount", label: "حداکثر مبلغ", placeholder: "جست‌وجو بر اساس حداکثر مبلغ" },
                    ]}
                    skeletonColumns={6}
                    emptyStateMessage="هیچ رکن اعتباری یافت نشد"
                    emptyStateDescription="موردی برای نمایش وجود ندارد."
                />
            </div>

            <Modal
                isOpen={isFormModalOpen}
                isRTL
                header={formMode === "create" ? "ثبت حد اختیار رکن اعتباری تسهیلات ریالی" : "ویرایش حد اختیار رکن اعتباری تسهیلات ریالی"}
                onClose={closeFormModal}
                overlayLock={isSubmitting}
                footerButtons={
                    <div className="flex gap-2">
                        <FormButton title={submitButtonTitle} variant="success" onClick={handleSubmitForm} isLoading={isSubmitting} disabled={isSubmitting} />
                        <FormButton title="انصراف" variant="secondary" onClick={closeFormModal} disabled={isSubmitting} />
                    </div>
                }
                renderContent={() => (
                    <FluidGrid className="gap-4">
                        <FluidCol colSpan={12}>
                            <FormSelect
                                id="modal-personType"
                                name="modal-personType"
                                label="نوع شخص"
                                value={formData.personType}
                                onChange={(value) => setFormData((prev) => ({ ...prev, personType: value }))}
                                options={PERSON_TYPES}
                                required
                            />
                        </FluidCol>
                        <FluidCol colSpan={12}>
                            <FormSelect<number>
                                id="modal-collateralType"
                                name="modal-collateralType"
                                label="نوع وثیقه"
                                value={formData.collateralTypeId ?? ""}
                                onChange={(value) => setFormData((prev) => ({ ...prev, collateralTypeId: value ? Number(value) : null }))}
                                options={collateralTypeOptions}
                                required
                            />
                        </FluidCol>
                        <FluidCol colSpan={12}>
                            <FormSelect<number>
                                id="modal-department"
                                name="modal-department"
                                label="دپارتمان"
                                value={formData.departmentId ?? ""}
                                onChange={(value) => setFormData((prev) => ({ ...prev, departmentId: value ? Number(value) : null }))}
                                options={departmentOptions}
                                required
                            />
                        </FluidCol>
                        <FluidCol colSpan={12}>
                            <FormInput
                                id="modal-minAmount"
                                name="modal-minAmount"
                                label="حداقل مبلغ (ریال)"
                                value={formData.minAmount}
                                onChange={(value) => setFormData((prev) => ({ ...prev, minAmount: value }))}
                                type="number"
                                dir="ltr"
                                required
                            />
                        </FluidCol>
                        <FluidCol colSpan={12}>
                            <FormInput
                                id="modal-maxAmount"
                                name="modal-maxAmount"
                                label="حداکثر مبلغ (ریال)"
                                value={formData.maxAmount}
                                onChange={(value) => setFormData((prev) => ({ ...prev, maxAmount: value }))}
                                type="number"
                                dir="ltr"
                                required
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
                        <FormButton title="حذف" variant="danger" isLoading={deleteMutation.isPending} onClick={() => { if (itemToDelete) deleteMutation.mutate(itemToDelete.id); }} />
                        <FormButton title="انصراف" variant="secondary" disabled={deleteMutation.isPending} onClick={() => setItemToDelete(null)} />
                    </div>
                }
                renderContent={() => <p>آیا از حذف این رکن اعتباری اطمینان دارید؟</p>}
            />
        </MainLayout.Main>
    );
}