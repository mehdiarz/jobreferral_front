// src/Features/Users/CreateUserPage.tsx
import { useCallback, useMemo, useState } from "react";
import { FluidCol } from "../../baseComponents/FluidCol";
import { FluidGrid } from "../../baseComponents/FluidGrid";
import { MainLayout } from "../../baseComponents/MainLayout";
import { useForm } from "@tanstack/react-form";
import FormInput from "../../baseComponents/FormInput";
import FormButton from "../../baseComponents/FormButton";
import FormCheckbox from "../../baseComponents/FormCheckbox";
import PageTitle from "../../baseComponents/PageTitle";
import DataTable from "../../baseComponents/DataTable";
import SearchableCombo from "../../baseComponents/SearchableCombo";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { useToast } from "../../libs/toastContext";
import { queryKeys } from "../../libs/api";
import { getRoles } from "../../services/Roles/getRoles";
import { createUser } from "../../services/Users/createUser";
import { getAllUsers } from "../../services/Users/getAllUsers";
import { deleteUser } from "../../services/Users/deleteUser";
import { updateUser } from "../../services/Users/updateUser";
import type { UserItem } from "../../services/Users/getAllUsers";
import Modal from "../../baseComponents/Modal";
import { X } from "lucide-react";
import { required } from "../../libs/validations";

export default function CreateUserPage() {
    const { showToast } = useToast();
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [filters, setFilters] = useState<Array<{ key: string; value: string }>>([]);
    const [roleNames, setRoleNames] = useState<string[]>([]);
    const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [editFormState, setEditFormState] = useState<{
        userName: string;
        name: string;
        surname: string;
        isActive: boolean;
        roleNames: string[];
    } | null>(null);

    // دریافت لیست نقش‌ها جهت استفاده در Combo Box
    const rolesQuery = useQuery({
        queryKey: [...queryKeys.roles.all, "getRoles"],
        queryFn: getRoles,
    });

    const rolesList = rolesQuery.data ?? [];

    // دریافت کاربران همراه با فیلتر محلی یا سروری بر اساس نام کاربری
    const usersQuery = useQuery({
        queryKey: [...queryKeys.users.all, filters, pagination.pageSize],
        queryFn: getAllUsers,
        select: (data) => {
            const nameFilter = filters.find((f) => f.key === "userName")?.value?.toLowerCase() ?? "";
            const items = nameFilter
                ? data.items.filter(
                    (u) =>
                        (u.userName || "").toLowerCase().includes(nameFilter) ||
                        (u.fullName || "").toLowerCase().includes(nameFilter) ||
                        (u.emailAddress || "").toLowerCase().includes(nameFilter)
                )
                : data.items;
            return {
                listResult: items,
                total: items.length,
                totalPages: Math.max(1, Math.ceil(items.length / pagination.pageSize)),
            };
        },
    });

    // فرم ایجاد کاربر جدید
    const form = useForm({
        defaultValues: {
            userName: "",
            name: "",
            surname: "",
            isActive: true,
            roleNames: [] as string[],
        },
        onSubmit: async ({ value }) => {
            const emailAddress = value.userName ? `${value.userName}@${value.userName}.com` : "";
            createMutation.mutate({
                userName: value.userName,
                name: value.name,
                surname: value.surname,
                emailAddress,
                isActive: value.isActive,
                roleNames: value.roleNames,
                password: "123456", // رمز عبور پیش‌فرض پروژه
            });
        },
    });

    const createMutation = useMutation({
        mutationFn: createUser,
        onSuccess: (res) => {
            if (res?.success !== false) {
                showToast("کاربر با موفقیت ایجاد شد", "success");
                form.reset();
                setRoleNames([]);
                usersQuery.refetch();
            } else {
                const apiMsg = res?.error?.message ?? res?.error?.details;
                showToast("خطا در ایجاد کاربر", "error", 5000, apiMsg ?? undefined);
            }
        },
        onError: (error) => {
            const apiMsg = error instanceof Error ? error.message : undefined;
            showToast("عملیات با خطا مواجه شد", "error", 5000, apiMsg);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteUser,
        onSuccess: (res) => {
            if (res?.success !== false) {
                showToast("کاربر با موفقیت حذف شد", "success");
                setUserToDelete(null);
                usersQuery.refetch();
            } else {
                const apiMsg = res?.error?.message ?? res?.error?.details;
                showToast("خطا در حذف کاربر", "error", 5000, apiMsg ?? undefined);
            }
        },
        onError: (error) => {
            const apiMsg = error instanceof Error ? error.message : undefined;
            showToast("عملیات با خطا مواجه شد", "error", 5000, apiMsg);
        },
    });

    const updateMutation = useMutation({
        mutationFn: updateUser,
        onSuccess: (res) => {
            if (res?.success !== false) {
                showToast("کاربر با موفقیت ویرایش شد", "success");
                setEditingUser(null);
                setEditFormState(null);
                usersQuery.refetch();
            } else {
                const apiMsg = res?.error?.message ?? res?.error?.details;
                showToast("خطا در ویرایش کاربر", "error", 5000, apiMsg ?? undefined);
            }
        },
        onError: (error) => {
            const apiMsg = error instanceof Error ? error.message : undefined;
            showToast("عملیات با خطا مواجه شد", "error", 5000, apiMsg);
        },
    });

    // توابع کمکی برای Combo Box ایجاد کاربر
    const selectedForCombo = roleNames;
    const fetchRoleOptions = useCallback(
        async (search: string): Promise<{ value: string; label: string }[]> => {
            const term = (search || "").trim().toLowerCase();
            const filtered = rolesList
                .filter((r) => {
                    if (selectedForCombo.includes(r.name)) return false;
                    if (!term) return true;
                    const name = (r.name || "").toLowerCase();
                    const displayName = (r.displayName || r.name || "").toLowerCase();
                    return name.includes(term) || displayName.includes(term);
                })
                .map((r) => ({ value: r.name, label: r.displayName || r.name }));
            return filtered;
        },
        [rolesList, selectedForCombo]
    );

    // توابع کمکی برای Combo Box ویرایش کاربر
    const editSelectedRoles = editFormState?.roleNames ?? [];
    const fetchEditRoleOptions = useCallback(
        async (search: string): Promise<{ value: string; label: string }[]> => {
            const term = (search || "").trim().toLowerCase();
            const filtered = rolesList
                .filter((r) => {
                    if (editSelectedRoles.includes(r.name)) return false;
                    if (!term) return true;
                    const name = (r.name || "").toLowerCase();
                    const displayName = (r.displayName || r.name || "").toLowerCase();
                    return name.includes(term) || displayName.includes(term);
                })
                .map((r) => ({ value: r.name, label: r.displayName || r.name }));
            return filtered;
        },
        [rolesList, editSelectedRoles]
    );

    const addRole = useCallback((name: string) => {
        if (!name) return;
        setRoleNames((prev) => {
            if (prev.includes(name)) return prev;
            const next = [...prev, name];
            form.setFieldValue("roleNames", next);
            return next;
        });
    }, [form]);

    const removeRole = useCallback(
        (name: string) => {
            setRoleNames((prev) => {
                const next = prev.filter((r) => r !== name);
                form.setFieldValue("roleNames", next);
                return next;
            });
        },
        [form]
    );

    const openEditModal = useCallback((user: UserItem) => {
        setEditingUser(user);
        setEditFormState({
            userName: user.userName,
            name: user.name,
            surname: user.surname,
            isActive: user.isActive,
            roleNames: user.roleNames ?? [],
        });
    }, []);

    const addEditRole = useCallback((name: string) => {
        if (!name) return;
        setEditFormState((prev) => {
            if (!prev || prev.roleNames.includes(name)) return prev;
            return { ...prev, roleNames: [...prev.roleNames, name] };
        });
    }, []);

    const removeEditRole = useCallback((name: string) => {
        setEditFormState((prev) =>
            prev ? { ...prev, roleNames: prev.roleNames.filter((r) => r !== name) } : null
        );
    }, []);

    const handleEditSubmit = useCallback(() => {
        if (!editingUser || !editFormState) return;
        const emailAddress = editFormState.userName ? `${editFormState.userName}@${editFormState.userName}.com` : "";
        updateMutation.mutate({
            id: editingUser.id,
            userName: editFormState.userName,
            name: editFormState.name,
            surname: editFormState.surname,
            emailAddress,
            isActive: editFormState.isActive,
            fullName: [editFormState.name, editFormState.surname].filter(Boolean).join(" ").trim() || editFormState.userName,
            lastLoginTime: editingUser.lastLoginTime,
            creationTime: editingUser.creationTime,
            roleNames: editFormState.roleNames,
            roles: editFormState.roleNames.map((r) => `${editingUser.id}:${r}`),
        });
    }, [editingUser, editFormState, updateMutation]);

    const columnHelper = createColumnHelper<UserItem>();
    const columns = useMemo<ColumnDef<UserItem, any>[]>(
        () => [
            columnHelper.accessor("userName", {
                header: () => "نام کاربری",
                cell: (c) => c.getValue(),
            }),
            columnHelper.accessor("name", {
                header: () => "نام",
                cell: (c) => c.getValue(),
            }),
            columnHelper.accessor("surname", {
                header: () => "نام خانوادگی",
                cell: (c) => c.getValue(),
            }),
            columnHelper.accessor("isActive", {
                header: () => "وضعیت فعال",
                cell: (c) => (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        c.getValue() ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
            {c.getValue() ? "فعال" : "غیرفعال"}
          </span>
                ),
            }),
            columnHelper.accessor("roleNames", {
                header: () => "نقش‌ها",
                cell: (c) => {
                    const arr = c.getValue() as string[] | undefined;
                    if (!arr?.length) return "—";
                    return arr.length <= 3 ? arr.join(", ") : `${arr.length} نقش`;
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
                            onClick={() => setUserToDelete(row.original)}
                        />
                    </div>
                ),
            }),
        ],
        [columnHelper, openEditModal]
    );

    return (
        <MainLayout.Main maxWidth="screen-xl" className="h-full">
            <PageTitle title="مدیریت کاربران" subtitle="ایجاد و ویرایش کاربران سیستم" />

            <FluidGrid className="pb-6">
                <FluidCol colSpan="col-span-12">
                    <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mb-6 shadow-sm">
                        <h3 className="text-base font-bold text-slate-850 dark:text-white mb-4">ایجاد کاربر جدید</h3>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                void form.handleSubmit();
                            }}
                            className="space-y-4"
                        >
                            <FluidGrid>
                                <FluidCol colSpan="col-span-12 md:col-span-4">
                                    <form.Field name="name">
                                        {(field) => (
                                            <FormInput
                                                id="user-name"
                                                name="name"
                                                value={field.state.value}
                                                onChange={field.handleChange}
                                                label="نام"
                                                error={field.state.meta.errors?.[0]}
                                                dir="rtl"
                                            />
                                        )}
                                    </form.Field>
                                </FluidCol>
                                <FluidCol colSpan="col-span-12 md:col-span-4">
                                    <form.Field name="surname">
                                        {(field) => (
                                            <FormInput
                                                id="user-surname"
                                                name="surname"
                                                value={field.state.value}
                                                onChange={field.handleChange}
                                                label="نام خانوادگی"
                                                error={field.state.meta.errors?.[0]}
                                                dir="rtl"
                                            />
                                        )}
                                    </form.Field>
                                </FluidCol>
                                <FluidCol colSpan="col-span-12 md:col-span-4">
                                    <form.Field name="userName" validators={{ onChange: required() }}>
                                        {(field) => (
                                            <FormInput
                                                id="user-userName"
                                                name="userName"
                                                value={field.state.value}
                                                onChange={field.handleChange}
                                                label="نام کاربری"
                                                error={field.state.meta.errors?.[0]}
                                                dir="ltr"
                                                required
                                            />
                                        )}
                                    </form.Field>
                                </FluidCol>
                                <FluidCol colSpan="col-span-12">
                                    <form.Field name="isActive">
                                        {(field) => (
                                            <div className="pt-2">
                                                <FormCheckbox
                                                    id="user-isActive"
                                                    label="کاربر فعال باشد"
                                                    checked={field.state.value}
                                                    onChange={field.handleChange}
                                                />
                                            </div>
                                        )}
                                    </form.Field>
                                </FluidCol>
                                <FluidCol colSpan="col-span-12">
                                    <div className="space-y-2 mt-2">
                                        <label className="block text-sm font-medium text-slate-750 dark:text-slate-300">
                                            انتخاب نقش‌های کاربر
                                        </label>
                                        {roleNames.length > 0 && (
                                            <div className="flex flex-wrap gap-2 py-2">
                                                {roleNames.map((r) => {
                                                    const label = rolesList.find((x) => x.name === r)?.displayName ?? r;
                                                    return (
                                                        <span
                                                            key={r}
                                                            className="inline-flex items-center gap-1.5 pl-1.5 pr-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800"
                                                        >
                              {label}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeRole(r)}
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
                                            id="user-roles-combo"
                                            name="rolesAdd"
                                            label="افزودن نقش"
                                            value=""
                                            onChange={(value) => {
                                                if (value) addRole(value);
                                            }}
                                            fetchOptions={fetchRoleOptions}
                                            minSearchLength={0}
                                            openOnlyOnFocusWhenMinLengthZero
                                            placeholder="برای انتخاب نقش کلیک کنید..."
                                            dir="rtl"
                                        />
                                    </div>
                                </FluidCol>
                                <FluidCol colSpan="col-span-12 flex justify-end gap-2 mt-4">
                                    <FormButton
                                        type="submit"
                                        title="ایجاد کاربر"
                                        variant="success"
                                        isLoading={createMutation.isPending}
                                        allowedPermissions={["Pages.Users"]}
                                    />
                                </FluidCol>
                            </FluidGrid>
                        </form>
                    </div>
                </FluidCol>

                <FluidCol colSpan="col-span-12">
                    <DataTable
                        query={usersQuery}
                        onPaginationChange={setPagination}
                        onFiltersChange={setFilters}
                        pagination={pagination}
                        filters={filters}
                        columns={columns}
                        filterFields={[{ field: "userName", label: "جستجو (نام کاربری / نام خانوادگی / ایمیل)", placeholder: "متن مورد نظر را وارد کنید..." }]}
                        skeletonColumns={6}
                        emptyStateDescription="کاربری در سیستم یافت نشد."
                    />
                </FluidCol>
            </FluidGrid>

            {/* مودال حذف کاربر */}
            <Modal
                isOpen={!!userToDelete}
                isRTL
                header="تایید حذف کاربر"
                onClose={() => setUserToDelete(null)}
                overlayLock={deleteMutation.isPending}
                footerButtons={
                    <div className="flex gap-2 justify-end">
                        <FormButton title="انصراف" variant="secondary" onClick={() => setUserToDelete(null)} disabled={deleteMutation.isPending} />
                        <FormButton
                            title="تایید و حذف"
                            variant="danger"
                            onClick={() => userToDelete && deleteMutation.mutate(userToDelete.id)}
                            isLoading={deleteMutation.isPending}
                        />
                    </div>
                }
                renderContent={() =>
                    userToDelete ? (
                        <p className="text-sm text-gray-700 dark:text-slate-350">
                            آیا از حذف کاربر «{userToDelete.fullName}» ({userToDelete.userName}) اطمینان دارید؟ این عملیات غیرقابل بازگشت است.
                        </p>
                    ) : null
                }
            />

            {/* مودال ویرایش کاربر */}
            <Modal
                isOpen={!!editingUser && !!editFormState}
                isRTL
                header="ویرایش اطلاعات کاربر"
                onClose={() => {
                    setEditingUser(null);
                    setEditFormState(null);
                }}
                overlayLock={updateMutation.isPending}
                footerButtons={
                    <div className="flex gap-2 justify-end">
                        <FormButton
                            title="انصراف"
                            variant="secondary"
                            onClick={() => {
                                setEditingUser(null);
                                setEditFormState(null);
                            }}
                            disabled={updateMutation.isPending}
                        />
                        <FormButton
                            title="ذخیره تغییرات"
                            variant="success"
                            onClick={handleEditSubmit}
                            isLoading={updateMutation.isPending}
                            disabled={!editFormState?.userName?.trim()}
                        />
                    </div>
                }
                renderContent={() =>
                    editFormState && (
                        <div className="space-y-4">
                            <FluidGrid>
                                <FluidCol colSpan="col-span-12 md:col-span-4">
                                    <FormInput
                                        id="edit-user-name"
                                        name="name"
                                        value={editFormState.name}
                                        onChange={(v) => setEditFormState((p) => (p ? { ...p, name: v } : null))}
                                        label="نام"
                                        dir="rtl"
                                    />
                                </FluidCol>
                                <FluidCol colSpan="col-span-12 md:col-span-4">
                                    <FormInput
                                        id="edit-user-surname"
                                        name="surname"
                                        value={editFormState.surname}
                                        onChange={(v) => setEditFormState((p) => (p ? { ...p, surname: v } : null))}
                                        label="نام خانوادگی"
                                        dir="rtl"
                                    />
                                </FluidCol>
                                <FluidCol colSpan="col-span-12 md:col-span-4">
                                    <FormInput
                                        id="edit-user-userName"
                                        name="userName"
                                        value={editFormState.userName}
                                        onChange={(v) => setEditFormState((p) => (p ? { ...p, userName: v } : null))}
                                        label="نام کاربری"
                                        dir="ltr"
                                    />
                                </FluidCol>
                                <FluidCol colSpan="col-span-12">
                                    <div className="pt-2">
                                        <FormCheckbox
                                            id="edit-user-isActive"
                                            label="کاربر فعال باشد"
                                            checked={editFormState.isActive}
                                            onChange={(v) => setEditFormState((p) => (p ? { ...p, isActive: v } : null))}
                                        />
                                    </div>
                                </FluidCol>
                                <FluidCol colSpan="col-span-12">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-350 mb-2">نقش‌ها</label>
                                    {editFormState.roleNames.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {editFormState.roleNames.map((r) => {
                                                const label = rolesList.find((x) => x.name === r)?.displayName ?? r;
                                                return (
                                                    <span
                                                        key={r}
                                                        className="inline-flex items-center gap-1.5 pl-1.5 pr-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800"
                                                    >
                            {label}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeEditRole(r)}
                                                            className="rounded-full p-0.5 hover:bg-blue-100 dark:hover:bg-blue-800"
                                                        >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                    <SearchableCombo
                                        id="edit-user-roles-combo"
                                        name="editRolesAdd"
                                        label="افزودن نقش جدید"
                                        value=""
                                        onChange={(value) => value && addEditRole(value)}
                                        fetchOptions={fetchEditRoleOptions}
                                        minSearchLength={0}
                                        openOnlyOnFocusWhenMinLengthZero
                                        placeholder="جستجو یا انتخاب نقش..."
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
