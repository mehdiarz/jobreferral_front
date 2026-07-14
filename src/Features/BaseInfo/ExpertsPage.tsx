import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

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

import { getAllExperts } from "../../services/JudicialExperts/getAllExperts";
import { createExpert } from "../../services/JudicialExperts/createExpert";
import { updateExpert } from "../../services/JudicialExperts/updateExpert";
import { deleteExpert } from "../../services/JudicialExperts/deleteExpert";
import { getAllExpertiseZones } from "../../services/JudicialExperts/getAllExpertiseZones";
import { getAllRegions } from "../../services/JudicialExperts/getAllRegions";
import type { CreateExpertBody } from "../../services/JudicialExperts/createExpert";
import { persianToISO, isoToPersian } from "../../utils/persianToISO";

type ApiResponse = {
    items?: unknown[];
    result?: { items?: unknown[]; totalCount?: number };
    listResult?: unknown[];
    data?: unknown[];
    success?: boolean;
    error?: unknown;
};

type SelectOption = { id: string; title: string };

type Expert = {
    id: number | string;
    firstName?: string;
    lastName?: string;
    code?: string;
    nationalCode?: string;
    expertiseZoneId?: number | string;
    expertiseZoneTitle?: string;
    expertiseZone?: { title?: string; name?: string };
    regionId?: number | string;
    regionTitle?: string;
    region?: { title?: string; name?: string };
    licenseNumber?: string;
    licenseIssueDate?: string;
    licenseExpirationDate?: string;
    licenseExpireDate?: string;
    expirationDate?: string;
    status?: string;
    isActive?: boolean;
    phoneNumber?: string;
    mobileNumber?: string;
    email?: string;
};

type ExpertForm = {
    firstName: string;
    lastName: string;
    code: string;
    expertiseZoneId: string;
    regionId: string;
    licenseNumber: string;
    licenseIssueDate: string;
    licenseExpirationDate: string;
    status: string;
    phoneNumber: string;
    mobileNumber: string;
    email: string;
};

type TableFilter = { key: string; value: string };
type ZoneItem = { id?: number | string; title?: string; name?: string; caption?: string };
type RegionItem = { id?: number | string; title?: string; name?: string; caption?: string };

const emptyForm: ExpertForm = {
    firstName: "", lastName: "", code: "", expertiseZoneId: "", regionId: "",
    licenseNumber: "", licenseIssueDate: "", licenseExpirationDate: "",
    status: "", phoneNumber: "", mobileNumber: "", email: "",
};

const safeText = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return value ? "فعال" : "غیرفعال";
    return "";
};

const safeOptionId = (value: unknown): string =>
    typeof value === "string" || typeof value === "number" ? String(value) : "";

const getArrayData = (data: unknown): unknown[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    const response = data as ApiResponse;
    if (response.result?.items && Array.isArray(response.result.items)) return response.result.items;
    if (response.items && Array.isArray(response.items)) return response.items;
    if (response.listResult && Array.isArray(response.listResult)) return response.listResult;
    if (response.data && Array.isArray(response.data)) return response.data;
    return [];
};

const getExpertCode = (expert: Expert): string => safeText(expert.code || expert.nationalCode);
const getExpertFullName = (expert: Expert): string =>
    `${safeText(expert.firstName)} ${safeText(expert.lastName)}`.trim();

const getExpertiseZoneTitle = (expert: Expert, zoneOptionsList?: SelectOption[]): string => {
    const directTitle = safeText(expert.expertiseZoneTitle || expert.expertiseZone?.title || expert.expertiseZone?.name);
    if (directTitle) return directTitle;
    if (zoneOptionsList && expert.expertiseZoneId) {
        const zone = zoneOptionsList.find((z) => z.id === String(expert.expertiseZoneId));
        if (zone) return zone.title;
    }
    return "-";
};

const getLicenseExpirationDate = (expert: Expert): string => {
    const rawDate = expert.licenseExpirationDate || expert.licenseExpireDate || expert.expirationDate;
    if (!rawDate) return "-";
    try {
        if (rawDate.includes("-")) return isoToPersian(rawDate);
        return rawDate;
    } catch { return safeText(rawDate); }
};

const getStatusTitle = (expert: Expert): string => {
    if (typeof expert.isActive === "boolean") return expert.isActive ? "فعال" : "غیرفعال";
    if (expert.status === "active") return "فعال";
    if (expert.status === "inactive") return "غیرفعال";
    if (expert.status) return safeText(expert.status);
    return "فعال";
};

const makePayload = (form: ExpertForm): CreateExpertBody => {
    const payload: Record<string, unknown> = {
        ...form,
        expertiseZoneId: Number(form.expertiseZoneId ?? 0),
        regionId: Number(form.regionId ?? 0),
    };
    if (form.licenseIssueDate?.trim()) {
        const isoDate = persianToISO(form.licenseIssueDate);
        if (isoDate) payload.licenseIssueDate = isoDate;
    }
    if (form.licenseExpirationDate?.trim()) {
        const isoDate = persianToISO(form.licenseExpirationDate);
        if (isoDate) payload.licenseExpireDate = isoDate;
    }
    return payload as unknown as CreateExpertBody;
};

export default function ExpertsPage() {
    const { showToast } = useToast();
    const queryClient = useQueryClient();

    const [createForm, setCreateForm] = useState<ExpertForm>(emptyForm);
    const [editForm, setEditForm] = useState<ExpertForm>(emptyForm);
    const [editingExpert, setEditingExpert] = useState<Expert | null>(null);
    const [expertToDelete, setExpertToDelete] = useState<Expert | null>(null);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [filters, setFilters] = useState<TableFilter[]>([]);

    const zoneOptionsRef = useRef<SelectOption[]>([]);

    const expertsQuery = useQuery({
        queryKey: ["experts", filters, pagination.pageIndex, pagination.pageSize],
        queryFn: getAllExperts,
        select: (data) => {
            const items = getArrayData(data) as Expert[];
            const activeFilter = filters[0];
            const filterKey = activeFilter?.key ?? "";
            const filterValue = activeFilter?.value?.trim() ?? "";

            const filteredItems = filterValue
                ? items.filter((expert) => {
                    switch (filterKey) {
                        case "fullName":
                            return getExpertFullName(expert).toLocaleLowerCase("fa").includes(filterValue.toLocaleLowerCase("fa"));
                        case "code":
                            return getExpertCode(expert).toLocaleLowerCase("fa").includes(filterValue.toLocaleLowerCase("fa"));
                        case "expertiseZone":
                            return getExpertiseZoneTitle(expert, zoneOptionsRef.current).toLocaleLowerCase("fa").includes(filterValue.toLocaleLowerCase("fa"));
                        case "licenseNumber":
                            return safeText(expert.licenseNumber).toLocaleLowerCase("fa").includes(filterValue.toLocaleLowerCase("fa"));
                        default:
                            const searchText = `${getExpertFullName(expert)} ${getExpertCode(expert)} ${safeText(expert.licenseNumber)}`.toLocaleLowerCase("fa");
                            return searchText.includes(filterValue.toLocaleLowerCase("fa"));
                    }
                })
                : items;

            const total = filteredItems.length;
            const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));
            const startIndex = pagination.pageIndex * pagination.pageSize;
            return {
                listResult: filteredItems.slice(startIndex, startIndex + pagination.pageSize),
                total,
                totalPages,
            };
        },
    });

    const zonesQuery = useQuery({ queryKey: ["expertise-zones"], queryFn: getAllExpertiseZones });
    const regionsQuery = useQuery({ queryKey: ["regions"], queryFn: getAllRegions });

    const zoneOptions: SelectOption[] = useMemo(() => {
        if (!zonesQuery.data) return zoneOptionsRef.current;
        const zones = getArrayData(zonesQuery.data);
        const result: SelectOption[] = [];
        for (const zone of zones) {
            const id = safeOptionId((zone as ZoneItem)?.id);
            const title = safeText((zone as ZoneItem)?.title ?? (zone as ZoneItem)?.name ?? (zone as ZoneItem)?.caption ?? "");
            if (id && title) result.push({ id, title });
        }
        zoneOptionsRef.current = result;
        return result;
    }, [zonesQuery.data]);

    const regionOptions: SelectOption[] = useMemo(() => {
        if (!regionsQuery.data) return [];
        return (getArrayData(regionsQuery.data) as RegionItem[])
            .map((r) => ({ id: safeOptionId(r?.id), title: safeText(r?.title ?? r?.name ?? r?.caption ?? "") }))
            .filter((o) => o.id && o.title);
    }, [regionsQuery.data]);

    const statusOptions: SelectOption[] = [
        { id: "active", title: "فعال" },
        { id: "inactive", title: "غیرفعال" },
    ];

    const createMutation = useMutation({
        mutationFn: createExpert,
        onSuccess: () => {
            showToast("کارشناس با موفقیت ثبت شد", "success");
            setCreateForm(emptyForm);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
            queryClient.invalidateQueries({ queryKey: ["experts"] });
        },
        onError: (error: Error) => showToast(error?.message || "خطا در ثبت کارشناس", "error"),
    });

    const updateMutation = useMutation({
        mutationFn: updateExpert,
        onSuccess: () => {
            showToast("کارشناس با موفقیت ویرایش شد", "success");
            setEditingExpert(null);
            setEditForm(emptyForm);
            queryClient.invalidateQueries({ queryKey: ["experts"] });
        },
        onError: (error: Error) => showToast(error?.message || "خطا در ویرایش کارشناس", "error"),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteExpert,
        onSuccess: () => {
            showToast("کارشناس با موفقیت حذف شد", "success");
            setExpertToDelete(null);
            queryClient.invalidateQueries({ queryKey: ["experts"] });
        },
        onError: (error: Error) => showToast(error?.message || "خطا در حذف کارشناس", "error"),
    });

    const handleEditClick = useCallback((expert: Expert) => {
        setEditingExpert(expert);
        let issueDate = safeText(expert.licenseIssueDate);
        try { if (issueDate?.includes("-")) issueDate = isoToPersian(issueDate); } catch {}
        setEditForm({
            firstName: safeText(expert.firstName),
            lastName: safeText(expert.lastName),
            code: getExpertCode(expert),
            expertiseZoneId: safeOptionId(expert.expertiseZoneId),
            regionId: safeOptionId(expert.regionId),
            licenseNumber: safeText(expert.licenseNumber),
            licenseIssueDate: issueDate,
            licenseExpirationDate: getLicenseExpirationDate(expert),
            status: safeText(expert.status || (expert.isActive ? "active" : "inactive")),
            phoneNumber: safeText(expert.phoneNumber),
            mobileNumber: safeText(expert.mobileNumber),
            email: safeText(expert.email),
        });
    }, []);

    const handleCancelEdit = useCallback(() => { setEditingExpert(null); setEditForm(emptyForm); }, []);

    const handleCreate = () => {
        if (!createForm.firstName || !createForm.lastName || !createForm.code || !createForm.expertiseZoneId || !createForm.licenseNumber) {
            showToast("لطفاً فیلدهای اجباری را تکمیل کنید", "error"); return;
        }
        createMutation.mutate(makePayload(createForm));
    };

    const handleUpdate = () => {
        if (!editingExpert || !editForm.firstName || !editForm.lastName || !editForm.code || !editForm.expertiseZoneId || !editForm.licenseNumber) {
            showToast("لطفاً فیلدهای اجباری را تکمیل کنید", "error"); return;
        }
        updateMutation.mutate({ id: Number(editingExpert.id), ...makePayload(editForm) });
    };

    const columns = useMemo<ColumnDef<Expert, unknown>[]>(() => [
        { id: "fullName", header: "نام و نام خانوادگی", cell: ({ row }) => getExpertFullName(row.original) },
        { accessorKey: "code", header: "کدملی", cell: ({ row }) => getExpertCode(row.original) },
        { id: "expertiseZone", header: "حدود صلاحیت", cell: ({ row }) => getExpertiseZoneTitle(row.original, zoneOptionsRef.current) },
        { accessorKey: "licenseNumber", header: "شماره پروانه کارشناسی", cell: ({ row }) => safeText(row.original.licenseNumber) },
        { id: "licenseExpirationDate", header: "تاریخ انقضا پروانه", cell: ({ row }) => getLicenseExpirationDate(row.original) },
        { id: "status", header: "وضعیت", cell: ({ row }) => getStatusTitle(row.original) },
        { id: "actions", header: "عملیات", enableSorting: false,
            cell: ({ row }) => {
                const isDeleting = deleteMutation.isPending && deleteMutation.variables === row.original.id;
                return (
                    <div className="flex flex-wrap items-center gap-2">
                        <FormButton title="ویرایش" size="sm" variant="primary" onClick={() => handleEditClick(row.original)} disabled={deleteMutation.isPending} />
                        <FormButton title="حذف" size="sm" variant="danger" onClick={() => setExpertToDelete(row.original)} isLoading={isDeleting} disabled={deleteMutation.isPending} />
                    </div>
                );
            },
        },
    ], [deleteMutation.isPending, deleteMutation.variables, handleEditClick]);

    const handleExportExcel = () => {
        const rows = expertsQuery.data?.listResult ?? [];
        if (!rows.length) { alert("داده‌ای برای خروجی وجود ندارد"); return; }
        const headers = ["نام و نام خانوادگی", "کدملی", "حدود صلاحیت", "شماره پروانه", "تاریخ انقضا", "وضعیت"];
        const csvRows = rows.map((item) => [
            getExpertFullName(item), getExpertCode(item), getExpertiseZoneTitle(item, zoneOptionsRef.current),
            safeText(item.licenseNumber), getLicenseExpirationDate(item), getStatusTitle(item),
        ]);
        const csvContent = [headers.join(","), ...csvRows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url; link.download = "experts.csv"; link.click();
        URL.revokeObjectURL(url);
    };

    const handleExportPdf = () => {
        const rows = expertsQuery.data?.listResult ?? [];
        if (!rows.length) { alert("داده‌ای برای خروجی وجود ندارد"); return; }
        const tableRows = rows.map((item) => `
            <tr><td>${getExpertFullName(item)}</td><td>${getExpertCode(item)}</td><td>${getExpertiseZoneTitle(item, zoneOptionsRef.current)}</td>
            <td>${safeText(item.licenseNumber)}</td><td>${getLicenseExpirationDate(item)}</td><td>${getStatusTitle(item)}</td></tr>`).join("");
        const printWindow = window.open("", "_blank");
        if (!printWindow) { alert("امکان باز کردن پنجره چاپ وجود ندارد"); return; }
        printWindow.document.write(`<html dir="rtl" lang="fa"><head><title>PDF</title>
        <style>body{font-family:Arial;direction:rtl;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:right}th{background:#f3f4f6}</style></head>
        <body><h2>لیست کارشناسان دادگستری</h2><table><thead><tr><th>نام و نام خانوادگی</th><th>کدملی</th><th>حدود صلاحیت</th><th>شماره پروانه</th><th>تاریخ انقضا</th><th>وضعیت</th></tr></thead>
        <tbody>${tableRows}</tbody></table><script>window.onload=function(){window.print()}</script></body></html>`);
        printWindow.document.close();
    };

    return (
        <MainLayout.Main maxWidth="screen-xl">
            <PageTitle title="ثبت کارشناسان دادگستری" />
            <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
                <FluidGrid className="gap-4">
                    <FluidCol colSpan={12}><FormInput id="firstName" name="firstName" label="نام" value={createForm.firstName} onChange={(v) => setCreateForm((p) => ({ ...p, firstName: v }))} dir="rtl" required /></FluidCol>
                    <FluidCol colSpan={12}><FormInput id="lastName" name="lastName" label="نام خانوادگی" value={createForm.lastName} onChange={(v) => setCreateForm((p) => ({ ...p, lastName: v }))} dir="rtl" required /></FluidCol>
                    <FluidCol colSpan={12}><FormInput id="code" name="code" label="کد ملی" value={createForm.code} onChange={(v) => setCreateForm((p) => ({ ...p, code: v }))} dir="ltr" maxLength={10} required /></FluidCol>
                    <FluidCol colSpan={12}><FormSelect<string> id="expertiseZoneId" name="expertiseZoneId" label="حدود صلاحیت" value={createForm.expertiseZoneId} onChange={(v) => setCreateForm((p) => ({ ...p, expertiseZoneId: v }))} options={zoneOptions} required /></FluidCol>
                    <FluidCol colSpan={12}><FormInput id="licenseNumber" name="licenseNumber" label="شماره پروانه کارشناسی" value={createForm.licenseNumber} onChange={(v) => setCreateForm((p) => ({ ...p, licenseNumber: v }))} dir="ltr" required /></FluidCol>
                    <FluidCol colSpan={12}><FormInput id="licenseIssueDate" name="licenseIssueDate" label="تاریخ صدور پروانه" value={createForm.licenseIssueDate} onChange={(v) => setCreateForm((p) => ({ ...p, licenseIssueDate: v }))} dir="ltr" placeholder="1405-01-01" /></FluidCol>
                    <FluidCol colSpan={12}><FormInput id="licenseExpirationDate" name="licenseExpirationDate" label="تاریخ انقضا پروانه" value={createForm.licenseExpirationDate} onChange={(v) => setCreateForm((p) => ({ ...p, licenseExpirationDate: v }))} dir="ltr" placeholder="1405-01-01" /></FluidCol>
                    <FluidCol colSpan={12}><FormSelect<string> id="status" name="status" label="وضعیت" value={createForm.status} onChange={(v) => setCreateForm((p) => ({ ...p, status: v }))} options={statusOptions} /></FluidCol>
                    <FluidCol colSpan={12}><FormInput id="mobileNumber" name="mobileNumber" label="موبایل" value={createForm.mobileNumber} onChange={(v) => setCreateForm((p) => ({ ...p, mobileNumber: v }))} dir="ltr" maxLength={11} /></FluidCol>
                    <FluidCol colSpan={12}><FormInput id="phoneNumber" name="phoneNumber" label="تلفن" value={createForm.phoneNumber} onChange={(v) => setCreateForm((p) => ({ ...p, phoneNumber: v }))} dir="ltr" /></FluidCol>
                    <FluidCol colSpan={12}><FormInput id="email" name="email" label="ایمیل" value={createForm.email} onChange={(v) => setCreateForm((p) => ({ ...p, email: v }))} dir="ltr" /></FluidCol>
                    <FluidCol colSpan={12}><FormSelect<string> id="regionId" name="regionId" label="منطقه" value={createForm.regionId} onChange={(v) => setCreateForm((p) => ({ ...p, regionId: v }))} options={regionOptions} /></FluidCol>
                    <FluidCol colSpan={12}><FormButton title="ذخیره" variant="success" onClick={handleCreate} isLoading={createMutation.isPending} disabled={createMutation.isPending} /></FluidCol>
                </FluidGrid>
            </div>
            {editingExpert && (
                <div className="mb-6 rounded-lg bg-blue-50 p-4 shadow-sm border border-blue-200">
                    <h3 className="mb-4 font-bold text-lg">ویرایش کارشناس</h3>
                    <FluidGrid className="gap-4">
                        <FluidCol colSpan={12}><FormInput id="edit-firstName" name="firstName" label="نام" value={editForm.firstName} onChange={(v) => setEditForm((p) => ({ ...p, firstName: v }))} dir="rtl" required /></FluidCol>
                        <FluidCol colSpan={12}><FormInput id="edit-lastName" name="lastName" label="نام خانوادگی" value={editForm.lastName} onChange={(v) => setEditForm((p) => ({ ...p, lastName: v }))} dir="rtl" required /></FluidCol>
                        <FluidCol colSpan={12}><FormInput id="edit-code" name="code" label="کد ملی" value={editForm.code} onChange={(v) => setEditForm((p) => ({ ...p, code: v }))} dir="ltr" maxLength={10} required /></FluidCol>
                        <FluidCol colSpan={12}><FormSelect<string> id="edit-expertiseZoneId" name="expertiseZoneId" label="حدود صلاحیت" value={editForm.expertiseZoneId} onChange={(v) => setEditForm((p) => ({ ...p, expertiseZoneId: v }))} options={zoneOptions} required /></FluidCol>
                        <FluidCol colSpan={12}><FormInput id="edit-licenseNumber" name="licenseNumber" label="شماره پروانه" value={editForm.licenseNumber} onChange={(v) => setEditForm((p) => ({ ...p, licenseNumber: v }))} dir="ltr" required /></FluidCol>
                        <FluidCol colSpan={12}><FormInput id="edit-licenseIssueDate" name="licenseIssueDate" label="تاریخ صدور" value={editForm.licenseIssueDate} onChange={(v) => setEditForm((p) => ({ ...p, licenseIssueDate: v }))} dir="ltr" placeholder="1403/01/01" /></FluidCol>
                        <FluidCol colSpan={12}><FormInput id="edit-licenseExpirationDate" name="licenseExpirationDate" label="تاریخ انقضا" value={editForm.licenseExpirationDate} onChange={(v) => setEditForm((p) => ({ ...p, licenseExpirationDate: v }))} dir="ltr" placeholder="1403/01/01" /></FluidCol>
                        <FluidCol colSpan={12}><FormSelect<string> id="edit-status" name="status" label="وضعیت" value={editForm.status} onChange={(v) => setEditForm((p) => ({ ...p, status: v }))} options={statusOptions} /></FluidCol>
                        <FluidCol colSpan={12}><FormInput id="edit-mobileNumber" name="mobileNumber" label="موبایل" value={editForm.mobileNumber} onChange={(v) => setEditForm((p) => ({ ...p, mobileNumber: v }))} dir="ltr" maxLength={11} /></FluidCol>
                        <FluidCol colSpan={12}><FormInput id="edit-phoneNumber" name="phoneNumber" label="تلفن" value={editForm.phoneNumber} onChange={(v) => setEditForm((p) => ({ ...p, phoneNumber: v }))} dir="ltr" /></FluidCol>
                        <FluidCol colSpan={12}><FormInput id="edit-email" name="email" label="ایمیل" value={editForm.email} onChange={(v) => setEditForm((p) => ({ ...p, email: v }))} dir="ltr" /></FluidCol>
                        <FluidCol colSpan={12}><FormSelect<string> id="edit-regionId" name="regionId" label="منطقه" value={editForm.regionId} onChange={(v) => setEditForm((p) => ({ ...p, regionId: v }))} options={regionOptions} /></FluidCol>
                        <FluidCol colSpan={12}><div className="flex gap-2">
                            <FormButton title="ثبت تغییرات" variant="primary" onClick={handleUpdate} isLoading={updateMutation.isPending} disabled={updateMutation.isPending} />
                            <FormButton title="انصراف" variant="secondary" onClick={handleCancelEdit} disabled={updateMutation.isPending} />
                        </div></FluidCol>
                    </FluidGrid>
                </div>
            )}
            <div className="rounded-lg bg-white p-4 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <FormButton title="خروجی اکسل" variant="secondary" onClick={handleExportExcel} />
                        <FormButton title="PDF" variant="secondary" onClick={handleExportPdf} />
                    </div>
                </div>
                <DataTable<Expert>
                    query={expertsQuery} columns={columns} pagination={pagination}
                    onPaginationChange={setPagination} filters={filters}
                    onFiltersChange={(newFilters) => {
                        const latest = newFilters.at(-1);
                        setFilters(latest ? [latest] : []);
                        setPagination((p) => ({ ...p, pageIndex: 0 }));
                    }}
                    filterFields={[
                        { field: "fullName", label: "نام و نام خانوادگی", placeholder: "جست‌وجو بر اساس نام" },
                        { field: "code", label: "کدملی", placeholder: "جست‌وجو بر اساس کدملی" },
                        { field: "expertiseZone", label: "حدود صلاحیت", placeholder: "جست‌وجو بر اساس حدود صلاحیت" },
                        { field: "licenseNumber", label: "شماره پروانه", placeholder: "جست‌وجو بر اساس شماره پروانه" },
                    ]}
                    skeletonColumns={7}
                    emptyStateMessage="هیچ کارشناسی یافت نشد"
                    emptyStateDescription="موردی برای نمایش وجود ندارد."
                />
            </div>
            <Modal isOpen={!!expertToDelete} isRTL header="تأیید حذف کارشناس" onClose={() => setExpertToDelete(null)} overlayLock={deleteMutation.isPending}
                   footerButtons={
                       <div className="flex gap-2">
                           <FormButton title="حذف" variant="danger" isLoading={deleteMutation.isPending} onClick={() => { if (expertToDelete) deleteMutation.mutate(Number(expertToDelete.id)); }} />
                           <FormButton title="انصراف" variant="secondary" disabled={deleteMutation.isPending} onClick={() => setExpertToDelete(null)} />
                       </div>
                   }
                   renderContent={() => <p>آیا از حذف کارشناس <strong>{expertToDelete ? getExpertFullName(expertToDelete) : ""}</strong> مطمئن هستید؟</p>}
            />
        </MainLayout.Main>
    );
}