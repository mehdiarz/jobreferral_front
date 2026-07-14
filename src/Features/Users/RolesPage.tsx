import { useCallback, useMemo, useState } from "react";
import { FluidCol } from "../../baseComponents/FluidCol";
import { FluidGrid } from "../../baseComponents/FluidGrid";
import { MainLayout } from "../../baseComponents/MainLayout";
import { useForm } from "@tanstack/react-form";
import FormInput from "../../baseComponents/FormInput";
import FormTextarea from "../../baseComponents/FormTextarea";
import FormButton from "../../baseComponents/FormButton";
import PageTitle from "../../baseComponents/PageTitle";
import DataTable from "../../baseComponents/DataTable";
import SearchableCombo from "../../baseComponents/SearchableCombo";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { useToast } from "../../libs/toastContext";
import { queryKeys } from "../../libs/api";
import { getAllPermissions } from "../../services/Roles/getAllPermissions";
import { createRole } from "../../services/Roles/createRole";
import { getAllRoles } from "../../services/Roles/getAllRoles";
import { deleteRole } from "../../services/Roles/deleteRole";
import { updateRole } from "../../services/Roles/updateRole";
import type { RoleItem } from "../../services/Roles/getAllRoles";
import Modal from "../../baseComponents/Modal";
import { X } from "lucide-react";
import { required } from "../../libs/validations";

export default function RolesPage() {
    const { showToast } = useToast();
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [filters, setFilters] = useState<Array<{ key: string; value: string }>>([]);
    const [grantedPermissions, setGrantedPermissions] = useState<string[]>([]);
    const [roleToDelete, setRoleToDelete] = useState<RoleItem | null>(null);
    const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
    const [editFormState, setEditFormState] = useState<{
        name: string;
        displayName: string;
        normalizedName: string;
        description: string;
        grantedPermissions: string[];
    } | null>(null);

    // دریافت دسترسی‌ها
    const permissionsQuery = useQuery({
        queryKey: queryKeys.roles.permissions,
        queryFn: getAllPermissions,
    });

    const permissionsList = permissionsQuery.data ?? [];

    // دریافت و فیلتر نقش‌ها
    const rolesQuery = useQuery({
        queryKey: [...queryKeys.roles.all, filters, pagination.pageSize],
        queryFn: getAllRoles,
        select: (data) => {
            const nameFilter = filters.find((f) => f.key === "name")?.value?.toLowerCase() ?? "";
            const items = nameFilter
                ? data.items.filter(
                    (r) =>
                        (r.name || "").toLowerCase().includes(nameFilter) ||
                        (r.displayName || "").toLowerCase().includes(nameFilter)
                )
                : data.items;
            return {
                listResult: items,
                total: items.length,
                totalPages: Math.max(1, Math.ceil(items.length / pagination.pageSize)),
            };
        },
    });

    // فرم ایجاد نقش
    const form = useForm({
        defaultValues: {
            name: "",
            displayName: "",
            normalizedName: "",
            description: "",
            grantedPermissions: [] as string[],
        },
        onSubmit: async ({ value }) => {
            createMutation.mutate({
                name: value.name,
                displayName: value.displayName,
                normalizedName: value.normalizedName || value.name.toUpperCase(),
                description: value.description,
                grantedPermissions: value.grantedPermissions,
            });
        },
    });

    const createMutation = useMutation({
        mutationFn: createRole,
        onSuccess: (res) => {
            if (res?.success !== false) {
                showToast("نقش با موفقیت ایجاد شد", "success");
                form.reset();
                setGrantedPermissions([]);
                rolesQuery.refetch();
            } else {
                const apiMsg = res?.error?.message ?? res?.error?.details;
                showToast("خطا در ایجاد نقش", "error", 5000, apiMsg ?? undefined);
            }
        },
        onError: (error) => {
            const apiMsg = error instanceof Error ? error.message : undefined;
            showToast("عملیات با خطا مواجه شد", "error", 5000, apiMsg);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteRole,
        onSuccess: (res) => {
            if (res?.success !== false) {
                showToast("نقش با موفقیت حذف شد", "success");
                setRoleToDelete(null);
                rolesQuery.refetch();
            } else {
                const apiMsg = res?.error?.message ?? res?.error?.details;
                showToast("خطا در حذف نقش", "error", 5000, apiMsg ?? undefined);
            }
        },
        onError: (error) => {
            const apiMsg = error instanceof Error ? error.message : undefined;
            showToast("عملیات با خطا مواجه شد", "error", 5000, apiMsg);
        },
    });

    const updateMutation = useMutation({
        mutationFn: updateRole,
        onSuccess: (res) => {
            if (res?.success !== false) {
                showToast("نقش با موفقیت ویرایش شد", "success");
                setEditingRole(null);
                setEditFormState(null);
                rolesQuery.refetch();
            } else {
                const apiMsg = res?.error?.message ?? res?.error?.details;
                showToast("خطا در ویرایش نقش", "error", 5000, apiMsg ?? undefined);
            }
        },
        onError: (error) => {
            const apiMsg = error instanceof Error ? error.message : undefined;
            showToast("عملیات با خطا مواجه شد", "error", 5000, apiMsg);
        },
    });

    // توابع کمکی Combo Box برای ایجاد نقش
    const selectedForCombo = grantedPermissions;
    const fetchPermissionOptions = useCallback(
        async (search: string): Promise<{ value: string; label: string }[]> => {
            const term = (search || "").trim().toLowerCase();
            const filtered = permissionsList
                .filter((p) => {
                    if (selectedForCombo.includes(p.name)) return false;
                    if (!term) return true;
                    return (
                        (p.name || "").toLowerCase().includes(term) ||
                        (p.displayName || "").toLowerCase().includes(term)
                    );
                })
                .map((p) => ({ value: p.name, label: p.displayName || p.name }));
            return filtered;
        },
        [permissionsList, selectedForCombo]
    );

    // توابع کمکی Combo Box برای ویرایش نقش
    const editSelectedPermissions = editFormState?.grantedPermissions ?? [];
    const fetchEditPermissionOptions = useCallback(
        async (search: string): Promise<{ value: string; label: string }[]> => {
            const term = (search || "").trim().toLowerCase();
            const filtered = permissionsList
                .filter((p) => {
                    if (editSelectedPermissions.includes(p.name)) return false;
                    if (!term) return true;
                    return (
                        (p.name || "").toLowerCase().includes(term) ||
                        (p.displayName || "").toLowerCase().includes(term)
                    );
                })
                .map((p) => ({ value: p.name, label: p.displayName || p.name }));
            return filtered;
        },
        [permissionsList, editSelectedPermissions]
    );

    const addPermission = useCallback((name: string) => {
        if (!name) return;
        setGrantedPermissions((prev) => {
            if (prev.includes(name)) return prev;
            const next = [...prev, name];
            form.setFieldValue("grantedPermissions", next);
            return next;
        });
    }, [form]);

    const removePermission = useCallback(
        (name: string) => {
            setGrantedPermissions((prev) => {
                const next = prev.filter((p) => p !== name);
                form.setFieldValue("grantedPermissions", next);
                return next;
            });
        },
        [form]
    );

    const openEditModal = useCallback((role: RoleItem) => {
        setEditingRole(role);
        setEditFormState({
            name: role.name,
            displayName: role.displayName,
            normalizedName: role.normalizedName,
            description: role.description ?? "",
            grantedPermissions: role.grantedPermissions ?? [],
        });
    }, []);

    const addEditPermission = useCallback((name: string) => {
        if (!name) return;
        setEditFormState((prev) => {
            if (!prev || prev.grantedPermissions.includes(name)) return prev;
            return { ...prev, grantedPermissions: [...prev.grantedPermissions, name] };
        });
    }, []);

    const removeEditPermission = useCallback((name: string) => {
        setEditFormState((prev) =>
            prev
                ? { ...prev, grantedPermissions: prev.grantedPermissions.filter((p) => p !== name) }
                : null
        );
    }, []);

    const handleEditSubmit = useCallback(() => {
        if (!editingRole || !editFormState) return;
        updateMutation.mutate({
            id: editingRole.id,
            name: editFormState.name,
            displayName: editFormState.displayName,
            normalizedName: editFormState.normalizedName || editFormState.name.toUpperCase(),
            description: editFormState.description,
            grantedPermissions: editFormState.grantedPermissions,
        });
    }, [editingRole, editFormState, updateMutation]);

    const columnHelper = createColumnHelper<RoleItem>();
    const columns = useMemo<ColumnDef<RoleItem, any>[]>(
        () => [
            columnHelper.accessor("name", {
                header: () => "نام نقش",
                cell: (c) => c.getValue(),
            }),
            columnHelper.accessor("displayName", {
                header: () => "نام نمایشی",
                cell: (c) => c.getValue(),
            }),
            columnHelper.accessor("description", {
                header: () => "توضیحات",
                cell: (c) => c.getValue() ?? "—",
            }),
            columnHelper.accessor("grantedPermissions", {
                header: () => "تعداد دسترسی‌ها",
                cell: (c) => {
                    const arr = c.getValue() as string[] | undefined;
                    if (!arr?.length) return "—";
                    return arr.length <= 3 ? arr.join(", ") : `${arr.length} دسترسی`;
                },
            }),
            columnHelper.display({
                id: "actions",
                header: () => "عملیات",
                cell: ({ row }) => (
                    <div className="flex gap-1.5">
                        <FormButton
                            title="ویرایش"
                            variant="primary"
                            size="sm"
                            onClick={() => openEditModal(row.original)}
                        />
                        <FormButton
                            title="حذف"
                            variant="danger"
                            size="sm"
                            onClick={() => setRoleToDelete(row.original)}
                        />
                    </div>
                ),
            }),
        ],
        [columnHelper, openEditModal]
    );

    return (
        <MainLayout.Main maxWidth="screen-xl" className="h-full">
            <PageTitle title="مدیریت نقش‌ها" subtitle="تعریف نقش‌ها و تخصیص دسترسی‌های سیستم" />

            <FluidGrid className="pb-6">
                <FluidCol colSpan="col-span-12">
                    <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mb-6 shadow-sm">
                        <h3 className="text-base font-bold text-slate-850 dark:text-white mb-4">ایجاد نقش جدید</h3>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                void form.handleSubmit();
                            }}
                            className="space-y-4"
                        >
                            <FluidGrid>
                                <FluidCol colSpan="col-span-12 md:col-span-4">
                                    <form.Field name="name" validators={{ onChange: required() }}>
                                        {(field) => (
                                            <FormInput
                                                id="role-name"
                                                name="name"
                                                value={field.state.value}
                                                onChange={field.handleChange}
                                                label="نام نقش (انگلیسی)"
                                                error={field.state.meta.errors?.[0]}
                                                dir="ltr"
                                                required
                                            />
                                        )}
                                    </form.Field>
                                </FluidCol>
                                <FluidCol colSpan="col-span-12 md:col-span-4">
                                    <form.Field name="displayName" validators={{ onChange: required() }}>
                                        {(field) => (
                                            <FormInput
                                                id="role-displayName"
                                                name="displayName"
                                                value={field.state.value}
                                                onChange={field.handleChange}
                                                label="نام نمایشی"
                                                error={field.state.meta.errors?.[0]}
                                                dir="rtl"
                                                required
                                            />
                                        )}
                                    </form.Field>
                                </FluidCol>
                                <FluidCol colSpan="col-span-12 md:col-span-4">
                                    <form.Field name="normalizedName">
                                        {(field) => (
                                            <FormInput
                                                id="role-normalizedName"
                                                name="normalizedName"
                                                value={field.state.value}
                                                onChange={field.handleChange}
                                                label="نام نرمال (اختیاری)"
                                                dir="ltr"
                                            />
                                        )}
                                    </form.Field>
                                </FluidCol>
                                <FluidCol colSpan="col-span-12">
                                    <form.Field name="description">
                                        {(field) => (
                                            <FormTextarea
                                                id="role-description"
                                                name="description"
                                                value={field.state.value}
                                                onChange={field.handleChange}
                                                label="توضیحات نقش"
                                                dir="rtl"
                                                rows={2}
                                            />
                                        )}
                                    </form.Field>
                                </FluidCol>
                                <FluidCol colSpan="col-span-12">
                                    <div className="space-y-2 mt-2">
                                        <label className="block text-sm font-medium text-slate-750 dark:text-slate-300">
                                            دسترسی‌های نقش
                                        </label>
                                        {grantedPermissions.length > 0 && (
                                            <div className="flex flex-wrap gap-2 py-2">
                                                {grantedPermissions.map((p) => {
                                                    const label = permissionsList.find((x) => x.name === p)?.displayName ?? p;
                                                    return (
                                                        <span
                                                            key={p}
                                                            className="inline-flex items-center gap-1.5 pl-1.5 pr-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-850"
                                                        >
                              {label}
                                                            <button
                                                                type="button"
                                                                onClick={() => removePermission(p)}
                                                                className="rounded-full p-0.5 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 focus:outline-none"
                                                            >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        <SearchableCombo
                                            id="role-permissions-combo"
                                            name="permissionsAdd"
                                            label="افزودن دسترسی جدید"
                                            value=""
                                            onChange={(value) => {
                                                if (value) addPermission(value);
                                            }}
                                            fetchOptions={fetchPermissionOptions}
                                            minSearchLength={0}
                                            openOnlyOnFocusWhenMinLengthZero
                                            placeholder="برای انتخاب دسترسی کلیک کنید..."
                                            dir="rtl"
                                        />
                                    </div>
                                </FluidCol>
                                <FluidCol colSpan="col-span-12 flex justify-end gap-2 mt-4">
                                    <FormButton
                                        type="submit"
                                        title="ایجاد نقش"
                                        variant="success"
                                        isLoading={createMutation.isPending}
                                        allowedPermissions={["Pages.Roles"]}
                                    />
                                </FluidCol>
                            </FluidGrid>
                        </form>
                    </div>
                </FluidCol>

                <FluidCol colSpan="col-span-12">
                    <DataTable
                        query={rolesQuery}
                        onPaginationChange={setPagination}
                        onFiltersChange={setFilters}
                        pagination={pagination}
                        filters={filters}
                        columns={columns}
                        filterFields={[{ field: "name", label: "جستجو در نقش‌ها (نام / نام نمایشی)", placeholder: "متن جستجو..." }]}
                        skeletonColumns={5}
                        emptyStateDescription="نقشی در سیستم ثبت نشده است."
                    />
                </FluidCol>
            </FluidGrid>

            {/* مودال حذف نقش */}
            <Modal
                isOpen={!!roleToDelete}
                isRTL
                header="تایید حذف نقش"
                onClose={() => setRoleToDelete(null)}
                overlayLock={deleteMutation.isPending}
                footerButtons={
                    <div className="flex gap-2 justify-end">
                        <FormButton title="انصراف" variant="secondary" onClick={() => setRoleToDelete(null)} disabled={deleteMutation.isPending} />
                        <FormButton
                            title="تایید و حذف"
                            variant="danger"
                            onClick={() => roleToDelete && deleteMutation.mutate(roleToDelete.id)}
                            isLoading={deleteMutation.isPending}
                        />
                    </div>
                }
                renderContent={() =>
                    roleToDelete ? (
                        <p className="text-sm text-gray-700 dark:text-slate-350">
                            آیا از حذف نقش «{roleToDelete.displayName}» ({roleToDelete.name}) اطمینان دارید؟ این عملیات غیرقابل بازگشت است.
                        </p>
                    ) : null
                }
            />

            {/* مودال ویرایش نقش */}
            <Modal
                isOpen={!!editingRole && !!editFormState}
                isRTL
                header="ویرایش نقش سیستم"
                onClose={() => {
                    setEditingRole(null);
                    setEditFormState(null);
                }}
                overlayLock={updateMutation.isPending}
                footerButtons={
                    <div className="flex gap-2 justify-end">
                        <FormButton
                            title="انصراف"
                            variant="secondary"
                            onClick={() => {
                                setEditingRole(null);
                                setEditFormState(null);
                            }}
                            disabled={updateMutation.isPending}
                        />
                        <FormButton
                            title="ذخیره تغییرات"
                            variant="success"
                            onClick={handleEditSubmit}
                            isLoading={updateMutation.isPending}
                            disabled={!editFormState?.name?.trim() || !editFormState?.displayName?.trim()}
                        />
                    </div>
                }
                renderContent={() =>
                    editFormState && (
                        <div className="space-y-4">
                            <FluidGrid>
                                <FluidCol colSpan="col-span-12 md:col-span-4">
                                    <FormInput
                                        id="edit-role-name"
                                        name="name"
                                        value={editFormState.name}
                                        onChange={(v) => setEditFormState((p) => (p ? { ...p, name: v } : null))}
                                        label="نام نقش (انگلیسی)"
                                        dir="ltr"
                                    />
                                </FluidCol>
                                <FluidCol colSpan="col-span-12 md:col-span-4">
                                    <FormInput
                                        id="edit-role-displayName"
                                        name="displayName"
                                        value={editFormState.displayName}
                                        onChange={(v) => setEditFormState((p) => (p ? { ...p, displayName: v } : null))}
                                        label="نام نمایشی"
                                        dir="rtl"
                                    />
                                </FluidCol>
                                <FluidCol colSpan="col-span-12 md:col-span-4">
                                    <FormInput
                                        id="edit-role-normalizedName"
                                        name="normalizedName"
                                        value={editFormState.normalizedName}
                                        onChange={(v) => setEditFormState((p) => (p ? { ...p, normalizedName: v } : null))}
                                        label="نام نرمال"
                                        dir="ltr"
                                    />
                                </FluidCol>
                                <FluidCol colSpan="col-span-12">
                                    <FormTextarea
                                        id="edit-role-description"
                                        name="description"
                                        value={editFormState.description}
                                        onChange={(v) => setEditFormState((p) => (p ? { ...p, description: v } : null))}
                                        label="توضیحات نقش"
                                        dir="rtl"
                                        rows={2}
                                    />
                                </FluidCol>
                                <FluidCol colSpan="col-span-12">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-350 mb-2">دسترسی‌ها</label>
                                    {editFormState.grantedPermissions.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {editFormState.grantedPermissions.map((p) => {
                                                const label = permissionsList.find((x) => x.name === p)?.displayName ?? p;
                                                return (
                                                    <span
                                                        key={p}
                                                        className="inline-flex items-center gap-1.5 pl-1.5 pr-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800"
                                                    >
                            {label}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeEditPermission(p)}
                                                            className="rounded-full p-0.5 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 focus:outline-none"
                                                        >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                    <SearchableCombo
                                        id="edit-role-permissions-combo"
                                        name="editPermissionsAdd"
                                        label="افزودن دسترسی جدید"
                                        value=""
                                        onChange={(value) => value && addEditPermission(value)}
                                        fetchOptions={fetchEditPermissionOptions}
                                        minSearchLength={0}
                                        openOnlyOnFocusWhenMinLengthZero
                                        placeholder="جستجو یا انتخاب دسترسی..."
                                        dir="rtl"
                                    />
                                </FluidCol>
                            </FluidGrid>
                        </div>
                    )
                }
            />
        </MainLayout.Main>
    );
}
