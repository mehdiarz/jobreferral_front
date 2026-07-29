import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, Loader2, FileDown } from "lucide-react";

import { MainLayout } from "../../baseComponents/MainLayout";
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
type TableFilter = { key: string; value: string };
type ZoneItem = {
  id?: number | string;
  title?: string;
  name?: string;
  caption?: string;
};
type RegionItem = {
  id?: number | string;
  title?: string;
  name?: string;
  caption?: string;
};

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

const emptyForm: ExpertForm = {
  firstName: "",
  lastName: "",
  code: "",
  expertiseZoneId: "",
  regionId: "",
  licenseNumber: "",
  licenseIssueDate: "",
  licenseExpirationDate: "",
  status: "",
  phoneNumber: "",
  mobileNumber: "",
  email: "",
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
  const r = data as ApiResponse;
  if (r.result?.items && Array.isArray(r.result.items)) return r.result.items;
  if (r.items && Array.isArray(r.items)) return r.items;
  if (r.listResult && Array.isArray(r.listResult)) return r.listResult;
  if (r.data && Array.isArray(r.data)) return r.data;
  return [];
};
const getExpertCode = (e: Expert): string => safeText(e.code || e.nationalCode);
const getExpertFullName = (e: Expert): string =>
  `${safeText(e.firstName)} ${safeText(e.lastName)}`.trim();
const getExpertiseZoneTitle = (e: Expert, opts?: SelectOption[]): string => {
  const d = safeText(
    e.expertiseZoneTitle || e.expertiseZone?.title || e.expertiseZone?.name,
  );
  if (d) return d;
  if (opts && e.expertiseZoneId) {
    const z = opts.find((x) => x.id === String(e.expertiseZoneId));
    if (z) return z.title;
  }
  return "-";
};
const getLicenseExpirationDate = (e: Expert): string => {
  const rd = e.licenseExpirationDate || e.licenseExpireDate || e.expirationDate;
  if (!rd) return "-";
  try {
    if (rd.includes("-")) return isoToPersian(rd);
    return rd;
  } catch {
    return safeText(rd);
  }
};
const getStatusTitle = (e: Expert): string => {
  if (typeof e.isActive === "boolean") return e.isActive ? "فعال" : "غیرفعال";
  if (e.status === "active") return "فعال";
  if (e.status === "inactive") return "غیرفعال";
  if (e.status) return safeText(e.status);
  return "فعال";
};
const makePayload = (form: ExpertForm): CreateExpertBody => {
  const p: Record<string, unknown> = {
    firstName: form.firstName,
    lastName: form.lastName,
    code: form.code,
    expertiseZoneId: Number(form.expertiseZoneId ?? 0),
    regionId: Number(form.regionId ?? 0),
    licenseNumber: form.licenseNumber,
    phoneNumber: form.phoneNumber,
    mobileNumber: form.mobileNumber,
    email: form.email,
    isActive: form.status === "active", // 👈 اضافه کن
  };
  console.log(form.licenseIssueDate, form.licenseExpirationDate);
  if (form.licenseIssueDate?.trim()) {
    const iso = persianToISO(form.licenseIssueDate);
    if (iso) p.licenseIssueDate = iso;
  }
  if (form.licenseExpirationDate?.trim()) {
    const iso = persianToISO(form.licenseExpirationDate);
    if (iso) p.licenseExpireDate = iso; // 👈 اسمش توی API هست licenseExpireDate
  }
  return p as unknown as CreateExpertBody;
};

export default function ExpertsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formData, setFormData] = useState<ExpertForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Expert | null>(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [filters, setFilters] = useState<TableFilter[]>([]);

  const zonesQuery = useQuery({
    queryKey: ["expertise-zones"],
    queryFn: getAllExpertiseZones,
  });
  const regionsQuery = useQuery({
    queryKey: ["regions"],
    queryFn: getAllRegions,
  });

  const zoneOptions: SelectOption[] = useMemo(() => {
    if (!zonesQuery.data) return [];
    const zones = getArrayData(zonesQuery.data);
    const r: SelectOption[] = [];
    for (const z of zones) {
      const id = safeOptionId((z as ZoneItem)?.id);
      const t = safeText(
        (z as ZoneItem)?.title ??
          (z as ZoneItem)?.name ??
          (z as ZoneItem)?.caption ??
          "",
      );
      if (id && t) r.push({ id, title: t });
    }
    return r;
  }, [zonesQuery.data]);

  const regionOptions: SelectOption[] = useMemo(() => {
    if (!regionsQuery.data) return [];
    return (getArrayData(regionsQuery.data) as RegionItem[])
      .map((r) => ({
        id: safeOptionId(r?.id),
        title: safeText(r?.title ?? r?.name ?? r?.caption ?? ""),
      }))
      .filter((o) => o.id && o.title);
  }, [regionsQuery.data]);

  const statusOptions: SelectOption[] = [
    { id: "active", title: "فعال" },
    { id: "inactive", title: "غیرفعال" },
  ];

  const expertsQuery = useQuery({
    queryKey: ["experts", filters, pagination.pageIndex, pagination.pageSize],
    queryFn: getAllExperts,
    select: (data) => {
      const items = getArrayData(data) as Expert[];
      const af = filters[0];
      const fk = af?.key ?? "";
      const fv = af?.value?.trim() ?? "";
      const filtered = fv
        ? items.filter((expert) => {
            switch (fk) {
              case "fullName":
                return getExpertFullName(expert)
                  .toLocaleLowerCase("fa")
                  .includes(fv.toLocaleLowerCase("fa"));
              case "code":
                return getExpertCode(expert)
                  .toLocaleLowerCase("fa")
                  .includes(fv.toLocaleLowerCase("fa"));
              case "expertiseZone":
                return getExpertiseZoneTitle(expert, zoneOptions)
                  .toLocaleLowerCase("fa")
                  .includes(fv.toLocaleLowerCase("fa"));
              case "licenseNumber":
                return safeText(expert.licenseNumber)
                  .toLocaleLowerCase("fa")
                  .includes(fv.toLocaleLowerCase("fa"));
              default:
                return `${getExpertFullName(expert)} ${getExpertCode(expert)} ${safeText(expert.licenseNumber)}`
                  .toLocaleLowerCase("fa")
                  .includes(fv.toLocaleLowerCase("fa"));
            }
          })
        : items;
      const total = filtered.length;
      const tp = Math.max(1, Math.ceil(total / pagination.pageSize));
      const si = pagination.pageIndex * pagination.pageSize;
      return {
        listResult: filtered.slice(si, si + pagination.pageSize),
        total,
        totalPages: tp,
      };
    },
  });

  const createMutation = useMutation({
    mutationFn: createExpert,
    onSuccess: () => {
      showToast("کارشناس با موفقیت ثبت شد", "success");
      closeFormModal();
      setPagination((p) => ({ ...p, pageIndex: 0 }));
      queryClient.invalidateQueries({ queryKey: ["experts"] });
    },
    onError: (error: Error) => showToast(error?.message || "خطا", "error"),
  });
  const updateMutation = useMutation({
    mutationFn: updateExpert,
    onSuccess: () => {
      showToast("کارشناس با موفقیت ویرایش شد", "success");
      closeFormModal();
      queryClient.invalidateQueries({ queryKey: ["experts"] });
    },
    onError: (error: any) => {
      console.error("❌ Update error:", error);
      showToast(error?.message || "خطا", "error");
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteExpert,
    onSuccess: () => {
      showToast("کارشناس با موفقیت حذف شد", "success");
      setItemToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["experts"] });
    },
    onError: (error: Error) => showToast(error?.message || "خطا", "error"),
  });

  const handleOpenCreateModal = useCallback(() => {
    setFormMode("create");
    setFormData(emptyForm);
    setEditingId(null);
    setIsFormModalOpen(true);
  }, []);
  const handleOpenEditModal = useCallback((expert: Expert) => {
    setFormMode("edit");
    setEditingId(Number(expert.id));
    let idate = safeText(expert.licenseIssueDate);
    try {
      if (idate?.includes("-")) idate = isoToPersian(idate);
    } catch {}
    setFormData({
      firstName: safeText(expert.firstName),
      lastName: safeText(expert.lastName),
      code: getExpertCode(expert),
      expertiseZoneId: safeOptionId(expert.expertiseZoneId),
      regionId: safeOptionId(expert.regionId),
      status: expert.isActive ? "active" : "inactive",
      licenseNumber: safeText(expert.licenseNumber),
      licenseIssueDate: idate,
      licenseExpirationDate: getLicenseExpirationDate(expert),
      phoneNumber: safeText(expert.phoneNumber),
      mobileNumber: safeText(expert.mobileNumber),
      email: safeText(expert.email),
    });
    setIsFormModalOpen(true);
  }, []);
  const closeFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setFormData(emptyForm);
    setEditingId(null);
  }, []);
  const handleDeleteClick = useCallback(
    (item: Expert) => setItemToDelete(item),
    [],
  );

  const handleSubmitForm = () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.code ||
      !formData.expertiseZoneId ||
      !formData.licenseNumber
    ) {
      showToast("لطفاً فیلدهای اجباری را تکمیل کنید", "error");
      return;
    }
    if (formMode === "create") {
      createMutation.mutate(makePayload(formData));
    } else if (editingId !== null) {
      const payload = { id: editingId, ...makePayload(formData) };
      console.log("📤 Update payload:", payload);
      updateMutation.mutate(payload);
    }
  };

  const columns = useMemo<ColumnDef<Expert, unknown>[]>(
    () => [
      {
        id: "fullName",
        header: "نام و نام خانوادگی",
        cell: ({ row }) => getExpertFullName(row.original),
      },
      {
        accessorKey: "code",
        header: "کدملی",
        cell: ({ row }) => getExpertCode(row.original),
      },
      {
        id: "expertiseZone",
        header: "حدود صلاحیت",
        cell: ({ row }) => getExpertiseZoneTitle(row.original, zoneOptions),
      },
      {
        accessorKey: "licenseNumber",
        header: "شماره پروانه کارشناسی",
        cell: ({ row }) => safeText(row.original.licenseNumber),
      },
      {
        id: "licenseExpirationDate",
        header: "تاریخ انقضا پروانه",
        cell: ({ row }) => getLicenseExpirationDate(row.original),
      },
      {
        id: "status",
        header: "وضعیت",
        cell: ({ row }) => getStatusTitle(row.original),
      },
      {
        id: "actions",
        header: "عملیات",
        enableSorting: false,
        cell: ({ row }) => {
          const isDel =
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
                {isDel ? (
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
      zoneOptions,
      deleteMutation.isPending,
      deleteMutation.variables,
      handleOpenEditModal,
      handleDeleteClick,
    ],
  );

  const handleExportExcel = () => {
    const rows = expertsQuery.data?.listResult ?? [];
    if (!rows.length) {
      alert("داده‌ای برای خروجی وجود ندارد");
      return;
    }
    const headers = [
      "نام و نام خانوادگی",
      "کدملی",
      "حدود صلاحیت",
      "شماره پروانه",
      "تاریخ انقضا",
      "وضعیت",
    ];
    const csvRows = rows.map((item) => [
      getExpertFullName(item),
      getExpertCode(item),
      getExpertiseZoneTitle(item, zoneOptions),
      safeText(item.licenseNumber),
      getLicenseExpirationDate(item),
      getStatusTitle(item),
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
    link.download = "experts.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const rows = expertsQuery.data?.listResult ?? [];
    if (!rows.length) {
      alert("داده‌ای برای خروجی وجود ندارد");
      return;
    }
    const trs = rows
      .map(
        (item) =>
          `<tr><td>${getExpertFullName(item)}</td><td>${getExpertCode(item)}</td><td>${getExpertiseZoneTitle(item, zoneOptions)}</td><td>${safeText(item.licenseNumber)}</td><td>${getLicenseExpirationDate(item)}</td><td>${getStatusTitle(item)}</td></tr>`,
      )
      .join("");
    const pw = window.open("", "_blank");
    if (!pw) {
      alert("امکان باز کردن پنجره چاپ وجود ندارد");
      return;
    }
    pw.document.write(
      `<html dir="rtl" lang="fa"><head><title>PDF</title><style>body{font-family:Tahoma,Arial;direction:rtl;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:right}th{background:#f3f4f6}</style></head><body><h2>لیست کارشناسان دادگستری</h2><table><thead><tr><th>نام و نام خانوادگی</th><th>کدملی</th><th>حدود صلاحیت</th><th>شماره پروانه</th><th>تاریخ انقضا</th><th>وضعیت</th></tr></thead><tbody>${trs}</tbody></table><script>window.onload=function(){window.print()}</script></body></html>`,
    );
    pw.document.close();
  };

  const submitTitle = formMode === "create" ? "ثبت" : "ثبت تغییرات";
  const isSubmitting =
    formMode === "create" ? createMutation.isPending : updateMutation.isPending;

  return (
    <MainLayout.Main maxWidth="screen-xl">
      <PageTitle title="ثبت کارشناسان دادگستری" />

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

        <DataTable<Expert>
          query={expertsQuery}
          columns={columns}
          pagination={pagination}
          onPaginationChange={setPagination}
          filters={filters}
          onFiltersChange={(nf) => {
            const l = nf.at(-1);
            setFilters(l ? [l] : []);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
          filterFields={[
            {
              field: "fullName",
              label: "نام و نام خانوادگی",
              placeholder: "جست‌وجو بر اساس نام",
            },
            {
              field: "code",
              label: "کدملی",
              placeholder: "جست‌وجو بر اساس کدملی",
            },
            {
              field: "expertiseZone",
              label: "حدود صلاحیت",
              placeholder: "جست‌وجو بر اساس حدود صلاحیت",
            },
            {
              field: "licenseNumber",
              label: "شماره پروانه",
              placeholder: "جست‌وجو بر اساس شماره پروانه",
            },
          ]}
          searchMode="onEnter"
          skeletonColumns={7}
          emptyStateMessage="هیچ کارشناسی یافت نشد"
          emptyStateDescription="موردی برای نمایش وجود ندارد."
        />
      </div>

      <Modal
        isOpen={isFormModalOpen}
        isRTL
        header={formMode === "create" ? "افزودن کارشناس" : "ویرایش کارشناس"}
        onClose={closeFormModal}
        overlayLock={isSubmitting}
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title={submitTitle}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              id="modal-firstName"
              name="firstName"
              label="نام"
              value={formData.firstName}
              onChange={(v) => setFormData((p) => ({ ...p, firstName: v }))}
              dir="rtl"
              required
            />
            <FormInput
              id="modal-lastName"
              name="lastName"
              label="نام خانوادگی"
              value={formData.lastName}
              onChange={(v) => setFormData((p) => ({ ...p, lastName: v }))}
              dir="rtl"
              required
            />
            <FormInput
              id="modal-code"
              name="code"
              label="کد ملی"
              value={formData.code}
              onChange={(v) => setFormData((p) => ({ ...p, code: v }))}
              dir="ltr"
              maxLength={10}
              required
            />
            <FormSelect<string>
              id="modal-expertiseZoneId"
              name="expertiseZoneId"
              label="حدود صلاحیت"
              value={formData.expertiseZoneId}
              onChange={(v) =>
                setFormData((p) => ({ ...p, expertiseZoneId: v }))
              }
              options={zoneOptions}
              required
            />
            <FormInput
              id="modal-licenseNumber"
              name="licenseNumber"
              label="شماره پروانه کارشناسی"
              value={formData.licenseNumber}
              onChange={(v) => setFormData((p) => ({ ...p, licenseNumber: v }))}
              dir="ltr"
              required
            />
            <FormInput
              id="modal-licenseIssueDate"
              name="licenseIssueDate"
              label="تاریخ صدور پروانه"
              value={formData.licenseIssueDate}
              onChange={(v) =>
                setFormData((p) => ({ ...p, licenseIssueDate: v }))
              }
              dir="ltr"
              placeholder="1405-01-01"
            />
            <FormInput
              id="modal-licenseExpirationDate"
              name="licenseExpirationDate"
              label="تاریخ انقضا پروانه"
              value={formData.licenseExpirationDate}
              onChange={(v) =>
                setFormData((p) => ({ ...p, licenseExpirationDate: v }))
              }
              dir="ltr"
              placeholder="1405-01-01"
            />
            <FormSelect<string>
              id="modal-status"
              name="status"
              label="وضعیت"
              value={formData.status}
              onChange={(v) => setFormData((p) => ({ ...p, status: v }))}
              options={statusOptions}
            />
            <FormInput
              id="modal-mobileNumber"
              name="mobileNumber"
              label="موبایل"
              value={formData.mobileNumber}
              onChange={(v) => setFormData((p) => ({ ...p, mobileNumber: v }))}
              dir="ltr"
              maxLength={11}
            />
            <FormInput
              id="modal-phoneNumber"
              name="phoneNumber"
              label="تلفن"
              value={formData.phoneNumber}
              onChange={(v) => setFormData((p) => ({ ...p, phoneNumber: v }))}
              dir="ltr"
            />
            <FormInput
              id="modal-email"
              name="email"
              label="ایمیل"
              value={formData.email}
              onChange={(v) => setFormData((p) => ({ ...p, email: v }))}
              dir="ltr"
            />
            <FormSelect<string>
              id="modal-regionId"
              name="regionId"
              label="منطقه"
              value={formData.regionId}
              onChange={(v) => setFormData((p) => ({ ...p, regionId: v }))}
              options={regionOptions}
            />
          </div>
        )}
      />

      <Modal
        isOpen={!!itemToDelete}
        isRTL
        header="تأیید حذف کارشناس"
        onClose={() => setItemToDelete(null)}
        overlayLock={deleteMutation.isPending}
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title="حذف"
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => {
                if (itemToDelete)
                  deleteMutation.mutate(Number(itemToDelete.id));
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
            آیا از حذف کارشناس{" "}
            <strong>
              {itemToDelete ? getExpertFullName(itemToDelete) : ""}
            </strong>{" "}
            مطمئن هستید؟
          </p>
        )}
      />
    </MainLayout.Main>
  );
}
