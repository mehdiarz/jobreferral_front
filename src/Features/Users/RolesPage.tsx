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

  const permissionsQuery = useQuery({
    queryKey: queryKeys.roles.permissions,
    queryFn: getAllPermissions,
  });

  const permissionsList = permissionsQuery.data ?? [];

  const rolesQuery = useQuery({
    queryKey: [...queryKeys.roles.all, filters],
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
        normalizedName: value.normalizedName,
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

  const selectedForCombo = grantedPermissions;
  const fetchPermissionOptions = useCallback(
    async (search: string): Promise<{ value: string; label: string }[]> => {
      const term = (search || "").trim().toLowerCase();
      const filtered = permissionsList
        .filter((p) => {
          if (selectedForCombo.includes(p.name)) return false;
          if (!term) return true;
          const name = (p.name || "").toLowerCase();
          const displayName = (p.displayName || p.name || "").toLowerCase();
          return name.includes(term) || displayName.includes(term);
        })
        .map((p) => ({ value: p.name, label: p.displayName || p.name }));
      return filtered;
    },
    [permissionsList, selectedForCombo]
  );

  const editSelectedPermissions = editFormState?.grantedPermissions ?? [];
  const fetchEditPermissionOptions = useCallback(
    async (search: string): Promise<{ value: string; label: string }[]> => {
      const term = (search || "").trim().toLowerCase();
      const filtered = permissionsList
        .filter((p) => {
          if (editSelectedPermissions.includes(p.name)) return false;
          if (!term) return true;
          const name = (p.name || "").toLowerCase();
          const displayName = (p.displayName || p.name || "").toLowerCase();
          return name.includes(term) || displayName.includes(term);
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
      normalizedName: editFormState.normalizedName,
      description: editFormState.description,
      grantedPermissions: editFormState.grantedPermissions,
    });
  }, [editingRole, editFormState, updateMutation]);

  const columnHelper = createColumnHelper<any>();
  const columns = useMemo<ColumnDef<any, any>[]>(
    () => [
      columnHelper.accessor("name", {
        header: () => "نام",
        cell: (c) => c.getValue(),
      }),
      columnHelper.accessor("displayName", {
        header: () => "نام نمایشی",
        cell: (c) => c.getValue(),
      }),
      columnHelper.accessor("normalizedName", {
        header: () => "نام نرمال",
        cell: (c) => c.getValue(),
      }),
      columnHelper.accessor("description", {
        header: () => "توضیحات",
        cell: (c) => c.getValue() ?? "—",
      }),
      columnHelper.accessor("grantedPermissions", {
        header: () => "دسترسی‌ها",
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
          <div className="flex gap-1">
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
      <PageTitle title="نقش ها" subtitle="مدیریت نقش‌ها و دسترسی‌ها" />

      <FluidGrid className="pb-6">
        <FluidCol colSpan="col-span-12">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-white mb-3">ایجاد نقش</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit();
            }}
            className="space-y-4 p-4 bg-blue-50 dark:bg-slate-800 rounded-lg mb-6"
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
                      label="نام"
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
                      label="نام نرمال"
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
                      label="توضیحات"
                      dir="rtl"
                      rows={3}
                    />
                  )}
                </form.Field>
              </FluidCol>
              <FluidCol colSpan="col-span-12">
                <div className="space-y-2">
                  <label className="block text-sm text-gray-500 dark:text-slate-400 mb-4">دسترسی‌ها (یک نقش می‌تواند چند دسترسی داشته باشد)</label>
                  {grantedPermissions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {grantedPermissions.map((p) => {
                        const label = permissionsList.find((x) => x.name === p)?.displayName ?? p;
                        return (
                          <span
                            key={p}
                            className="inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-blue-100 dark:bg-slate-600 text-blue-900 dark:text-white text-sm border border-blue-200 dark:border-slate-500"
                          >
                            {label}
                            <button
                              type="button"
                              onClick={() => removePermission(p)}
                              className="rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-slate-500 focus:outline-none"
                              aria-label="حذف"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <SearchableCombo
                    id="role-permissions-combo"
                    name="permissionsAdd"
                    label="افزودن دسترسی"
                    value=""
                    onChange={(value) => {
                      if (value) addPermission(value);
                    }}
                    fetchOptions={fetchPermissionOptions}
                    minSearchLength={0}
                    openOnlyOnFocusWhenMinLengthZero
                    placeholder="کلیک کنید و دسترسی انتخاب کنید..."
                    dir="rtl"
                  />
                </div>
              </FluidCol>
              <FluidCol colSpan="col-span-12 flex justify-end">
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
        </FluidCol>

        <FluidCol colSpan="col-span-12">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-white mb-3">لیست نقش‌ها</h3>
          <DataTable
            query={rolesQuery}
            onPaginationChange={setPagination}
            onFiltersChange={setFilters}
            pagination={pagination}
            filters={filters}
            columns={columns}
            filterFields={[{ field: "name", label: "نام", placeholder: "" }]}
            skeletonColumns={5}
            emptyStateDescription="هنوز نقشی ثبت نشده است."
          />
        </FluidCol>
      </FluidGrid>

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
              title="حذف"
              variant="danger"
              onClick={() => roleToDelete && deleteMutation.mutate(roleToDelete.id)}
              isLoading={deleteMutation.isPending}
              disabled={deleteMutation.isPending}
            />
          </div>
        }
        renderContent={() =>
          roleToDelete ? (
            <p className="text-sm text-gray-700 dark:text-slate-300">
              آیا از حذف نقش «{roleToDelete.displayName}» ({roleToDelete.name}) مطمئن هستید؟
            </p>
          ) : null
        }
      />

      <Modal
        isOpen={!!editingRole && !!editFormState}
        isRTL
        header="ویرایش نقش"
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
              title="ذخیره"
              variant="success"
              onClick={handleEditSubmit}
              isLoading={updateMutation.isPending}
              disabled={updateMutation.isPending || !editFormState?.name?.trim() || !editFormState?.displayName?.trim()}
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
                    label="نام"
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
                    label="توضیحات"
                    dir="rtl"
                    rows={3}
                  />
                </FluidCol>
                <FluidCol colSpan="col-span-12">
                  <label className="block text-sm text-gray-500 dark:text-slate-400 mb-4">دسترسی‌ها</label>
                  {editFormState.grantedPermissions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {editFormState.grantedPermissions.map((p) => {
                        const label = permissionsList.find((x) => x.name === p)?.displayName ?? p;
                        return (
                          <span
                            key={p}
                            className="inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-blue-100 dark:bg-slate-600 text-blue-900 dark:text-white text-sm border border-blue-200 dark:border-slate-500"
                          >
                            {label}
                            <button
                              type="button"
                              onClick={() => removeEditPermission(p)}
                              className="rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-slate-500"
                              aria-label="حذف"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <SearchableCombo
                    id="edit-role-permissions-combo"
                    name="editPermissionsAdd"
                    label="افزودن دسترسی"
                    value=""
                    onChange={(value) => value && addEditPermission(value)}
                    fetchOptions={fetchEditPermissionOptions}
                    minSearchLength={0}
                    openOnlyOnFocusWhenMinLengthZero
                    placeholder="جستجو یا انتخاب..."
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
