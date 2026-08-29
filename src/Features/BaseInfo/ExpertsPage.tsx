import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, Loader2, FileDown, Check } from "lucide-react";

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
import { getAllExpertiseZones } from "../../services/ExpertiseZoneCrud/getAll";
import { getAllRegions } from "../../services/RegionCrud/getAll";
import { getAllBranches } from "../../services/BranchCrud/getAll";
import type { CreateExpertBody } from "../../services/JudicialExperts/types";
import { persianToISO, isoToPersian } from "../../utils/persianToISO";
import { getExpert } from "../../services/JudicialExperts/get.ts";
import {
  isValidIranianMobile,
  isValidIranianNationalCode,
  normalizeIranianMobile,
  onlyDigits,
  toEnglishDigits,
} from "../../utils/iranValidators.ts";

type ApiResponse = {
  items?: unknown[];
  result?: { items?: unknown[]; totalCount?: number };
  listResult?: unknown[];
  data?: unknown[];
  success?: boolean;
  error?: unknown;
};
type SelectOption = { id: string; title: string; code?: string };
type TableFilter = { key: string; value: string };
type ZoneItem = {
  id?: number | string;
  title?: string;
  name?: string;
  caption?: string;
};
type RegionItem = {
  id?: number | string;
  code?: number | string | null;
  title?: string;
  name?: string;
  caption?: string;
};
type BranchItem = {
  id?: number | string;
  branchCode?: number | string | null;
  branchName?: string | null;
  regionCode?: number | string | null;
};

type Expert = {
  id: number | string;
  firstName?: string;
  lastName?: string;
  code?: string;
  nationalCode?: string;
  rank?: number;
  expertiseZoneIds?: number[] | string[] | null;
  expertiseZones?: Array<{
    id?: number | string;
    title?: string;
    name?: string;
  }> | null;
  expertiseZoneTitle?: string;
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
  regions?: unknown[] | null;
};

type ExpertForm = {
  firstName: string;
  lastName: string;
  code: string;
  rank: string;
  expertiseZoneIds: string[];
  licenseNumber: string;
  licenseIssueDate: string;
  licenseExpirationDate: string;
  status: string;
  phoneNumber: string;
  mobileNumber: string;
  email: string;
  regions: RegionBranchSelection[];
};

type RegionBranchSelection = {
  regionId: string;
  regionCode: string;
  branchIds: string[];
  branchCodes: string[];
  allBranches: boolean;
  branchTitles?: string[];
};

const emptyForm: ExpertForm = {
  firstName: "",
  lastName: "",
  code: "",
  rank: "",
  expertiseZoneIds: [],
  licenseNumber: "",
  licenseIssueDate: "",
  licenseExpirationDate: "",
  status: "",
  phoneNumber: "",
  mobileNumber: "",
  email: "",
  regions: [],
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
  // ۱. اگر لیست آبجکت‌های حدود صلاحیت در خروجی بک‌اند بود (expertiseZones)
  if (Array.isArray(e.expertiseZones) && e.expertiseZones.length > 0) {
    const titles = e.expertiseZones
      .map((z) => safeText(z?.title || z?.name))
      .filter(Boolean);
    if (titles.length > 0) return titles.join(" - ");
  }

  // ۲. اگر آرایه‌ای از شناسه‌ها بود، با لیست گزینه‌ها (zoneOptions) تطبیق داده شود
  if (
    Array.isArray(e.expertiseZoneIds) &&
    e.expertiseZoneIds.length > 0 &&
    opts &&
    opts.length > 0
  ) {
    const titles = e.expertiseZoneIds
      .map((id) => opts.find((opt) => String(opt.id) === String(id))?.title)
      .filter(Boolean);
    if (titles.length > 0) return titles.join(" - ");
  }

  // ۳. اگر به صورت رشته تک‌عنوان یا پیش‌فرض بود
  return safeText(e.expertiseZoneTitle) || "-";
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
const getExpertRegionSelection = (expert: Expert): RegionBranchSelection[] => {
  const regions = Array.isArray(expert.regions) ? expert.regions : [];
  return regions.flatMap((region) => {
    if (!region || typeof region !== "object") return [];

    const value = region as Record<string, unknown>;
    const regionId = safeOptionId(value.regionId);
    if (!regionId) return [];

    // ✅ branchCodes
    const rawBranchCodes = value.branchCodes ?? value.branchIds ?? [];
    const branchCodes = Array.isArray(rawBranchCodes)
      ? rawBranchCodes.map((code) => safeOptionId(code)).filter(Boolean)
      : [];

    // ✅ branches برای گرفتن id و title
    const rawBranches = value.branches ?? [];
    const branchItems = Array.isArray(rawBranches) ? rawBranches : [];

    const branchIds = branchItems
      .map((branch) =>
        typeof branch === "object" && branch !== null
          ? safeOptionId(
              (branch as Record<string, unknown>).id ??
                (branch as Record<string, unknown>).branchId ??
                (branch as Record<string, unknown>).branchCode,
            )
          : "",
      )
      .filter(Boolean);

    const branchTitles = branchItems
      .map((branch) =>
        typeof branch === "object" && branch !== null
          ? safeText(
              (branch as Record<string, unknown>).branchName ??
                (branch as Record<string, unknown>).title ??
                (branch as Record<string, unknown>).name,
            )
          : "",
      )
      .filter(Boolean);

    return [
      {
        regionId,
        regionCode: safeOptionId(
          value.regionCode ??
            (value.region as Record<string, unknown>)?.code ??
            value.regionId,
        ),
        branchIds: branchIds.length > 0 ? branchIds : branchCodes,
        branchCodes: branchCodes.length > 0 ? branchCodes : branchIds,
        allBranches: branchCodes.length === 0 && branchIds.length === 0,
        branchTitles,
      },
    ];
  });
};

const makePayload = (form: ExpertForm): CreateExpertBody => {
  const expertiseZoneIds = form.expertiseZoneIds
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));

  const p: Record<string, unknown> = {
    firstName: form.firstName,
    lastName: form.lastName,
    code: form.code,
    rank: Number(form.rank ?? 0),
    expertiseZoneIds,
    licenseNumber: form.licenseNumber,
    phoneNumber: form.phoneNumber,
    mobileNumber: form.mobileNumber,
    email: form.email,
    regions: form.regions.map((region) => ({
      regionId: Number(region.regionId),
      branchCodes: region.allBranches ? [] : region.branchCodes.map(Number),
    })),
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
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchModalRegionId, setBranchModalRegionId] = useState("");
  const [branchModalBranchIds, setBranchModalBranchIds] = useState<string[]>(
    [],
  );
  const [branchModalAllBranches, setBranchModalAllBranches] = useState(false);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [zoneModalSelectedIds, setZoneModalSelectedIds] = useState<string[]>(
    [],
  );

  const zonesQuery = useQuery({
    queryKey: ["expertise-zones"],
    queryFn: () =>
      getAllExpertiseZones({
        skipCount: 0,
        maxResultCount: 10000,
      }),
  });
  const regionsQuery = useQuery({
    queryKey: ["regions"],
    queryFn: () =>
      getAllRegions({
        skipCount: 0,
        maxResultCount: 10000,
      }),
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

  const branchModalRegion = useMemo(
    () =>
      (getArrayData(regionsQuery.data) as RegionItem[]).find(
        (region) => safeOptionId(region.id) === branchModalRegionId,
      ) ?? null,
    [regionsQuery.data, branchModalRegionId],
  );
  const branchModalRegionCode = safeOptionId(
    branchModalRegion?.code ?? branchModalRegion?.id,
  );
  const branchesQuery = useQuery({
    queryKey: ["branches-by-region", branchModalRegionCode],
    queryFn: () =>
      getAllBranches({
        regionCode: Number(branchModalRegionCode),
        skipCount: 0,
        maxResultCount: 10000,
      }),
    enabled: Boolean(branchModalRegionCode && isBranchModalOpen),
  });
  const branchOptions: SelectOption[] = useMemo(
    () =>
      (branchesQuery.data?.items ?? [])
        .map((branch: BranchItem) => ({
          id: safeOptionId(branch.id),
          code: safeOptionId(branch.branchCode ?? branch.id), // ✅ اضافه کن
          title: safeText(
            branch.branchName ?? branch.branchCode ?? branch.id ?? "",
          ),
        }))
        .filter((option) => option.id && option.title),
    [branchesQuery.data],
  );

  const selectedZoneTitles = useMemo(() => {
    return zoneOptions
      .filter((zone) => formData.expertiseZoneIds.includes(zone.id))
      .map((zone) => zone.title);
  }, [zoneOptions, formData.expertiseZoneIds]);

  const statusOptions: SelectOption[] = [
    { id: "active", title: "فعال" },
    { id: "inactive", title: "غیرفعال" },
  ];

  const activeFilter = filters[0];

  const filterKey = activeFilter?.key ?? "";
  const filterValue = activeFilter?.value?.trim() ?? "";

  const expertsQuery = useQuery({
    queryKey: [
      "experts",
      pagination.pageIndex,
      pagination.pageSize,
      filterKey,
      filterValue,
    ],

    queryFn: () => {
      const skipCount = pagination.pageIndex * pagination.pageSize;

      return getAllExperts({
        skipCount,
        maxResultCount: pagination.pageSize,

        ...(filterKey === "fullName" && filterValue
          ? { firstName: filterValue }
          : {}),

        ...(filterKey === "code" && filterValue ? { code: filterValue } : {}),

        ...(filterKey === "expertiseZone" && filterValue
          ? { expertiseZoneTitle: filterValue }
          : {}),

        ...(filterKey === "licenseNumber" && filterValue
          ? { licenseNumber: filterValue }
          : {}),
      });
    },

    select: (data) => {
      const total = data.totalCount;

      return {
        listResult: data.items as Expert[],
        total,
        totalPages: Math.max(1, Math.ceil(total / pagination.pageSize)),
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
    onError: (error: Error) => {
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

    setZoneModalSelectedIds([]);
    setIsZoneModalOpen(false);

    setBranchModalRegionId("");
    setBranchModalBranchIds([]);
    setBranchModalAllBranches(false);
    setIsBranchModalOpen(false);

    setIsFormModalOpen(true);
  }, []);
  const handleOpenEditModal = useCallback(
    async (expert: Expert) => {
      setFormMode("edit");

      const id = Number(expert.id);
      setEditingId(id);
      setIsFormModalOpen(true);

      try {
        const expertDetail = await getExpert(id);

        console.log("📥 Expert detail:", expertDetail);

        // ✅ ابتدا به unknown و سپس به Expert تبدیل می‌کنیم
        const detail = expertDetail as unknown as Expert;

        // ✅ برای دسترسی داینامیک به فیلدهای احتمالی API
        const detailRecord = expertDetail as unknown as Record<string, unknown>;

        const regionSelections = getExpertRegionSelection(detail);

        let issueDate = safeText(detail.licenseIssueDate);

        try {
          if (issueDate.includes("-")) {
            issueDate = isoToPersian(issueDate);
          }
        } catch {
          issueDate = safeText(detail.licenseIssueDate);
        }

        const rawZoneIds = detailRecord.expertiseZoneIds;
        const rawZones = detailRecord.expertiseZones;

        const zoneIds: string[] =
          Array.isArray(rawZoneIds) && rawZoneIds.length > 0
            ? rawZoneIds.map((zoneId) => safeOptionId(zoneId)).filter(Boolean)
            : Array.isArray(rawZones)
              ? rawZones
                  .map((zone) => {
                    if (!zone || typeof zone !== "object") {
                      return "";
                    }

                    const zoneRecord = zone as Record<string, unknown>;

                    return safeOptionId(
                      zoneRecord.id ?? zoneRecord.expertiseZoneId,
                    );
                  })
                  .filter(Boolean)
              : [];
        setZoneModalSelectedIds(zoneIds);

        setFormData({
          firstName: safeText(detail.firstName),
          lastName: safeText(detail.lastName),
          code: getExpertCode(detail),
          rank: safeText(detail.rank),
          expertiseZoneIds: zoneIds,
          regions: regionSelections,
          status: detail.isActive ? "active" : "inactive",
          licenseNumber: safeText(detail.licenseNumber),
          licenseIssueDate: issueDate,
          licenseExpirationDate: getLicenseExpirationDate(detail),
          phoneNumber: safeText(detail.phoneNumber),
          mobileNumber: safeText(detail.mobileNumber),
          email: safeText(detail.email),
        });
      } catch (error) {
        console.error("❌ Error fetching expert:", error);
        showToast("خطا در دریافت اطلاعات کارشناس", "error");
      }
    },
    [showToast],
  );

  const closeFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setIsBranchModalOpen(false);
    setIsZoneModalOpen(false);

    setZoneModalSelectedIds([]);
    setBranchModalRegionId("");
    setBranchModalBranchIds([]);
    setBranchModalAllBranches(false);

    setFormData(emptyForm);
    setEditingId(null);
  }, []);
  const handleDeleteClick = useCallback(
    (item: Expert) => setItemToDelete(item),
    [],
  );

  const handleSubmitForm = () => {
    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const code = onlyDigits(formData.code);
    const mobileNumber = normalizeIranianMobile(formData.mobileNumber);
    const licenseNumber = formData.licenseNumber.trim();

    const expertiseZoneIds = (formData.expertiseZoneIds ?? [])
      .map(String)
      .filter(Boolean);

    const normalizedRankText = toEnglishDigits(
      String(formData.rank ?? "").trim(),
    );

    const rank = normalizedRankText === "" ? 1 : Number(normalizedRankText);

    if (
      !firstName ||
      !lastName ||
      !code ||
      !mobileNumber ||
      expertiseZoneIds.length === 0 ||
      !licenseNumber ||
      !Array.isArray(formData.regions) ||
      formData.regions.length === 0
    ) {
      showToast("لطفاً همه فیلدهای اجباری را تکمیل کنید", "error");
      return;
    }

    if (!isValidIranianNationalCode(code)) {
      showToast("کد ملی واردشده معتبر نیست", "error");
      return;
    }

    if (!isValidIranianMobile(mobileNumber)) {
      showToast(
        "شماره موبایل واردشده معتبر نیست؛ مثال صحیح: 09121234567",
        "error",
      );
      return;
    }

    if (!Number.isInteger(rank) || rank < 1 || rank > 10) {
      showToast("رتبه باید یک عدد صحیح بین ۱ تا ۱۰ باشد", "error");
      return;
    }

    const normalizedFormData: ExpertForm = {
      ...formData,
      firstName,
      lastName,
      code,
      mobileNumber,
      expertiseZoneIds,
      licenseNumber,
      rank: String(rank),
    };

    const payload = makePayload(normalizedFormData);

    if (formMode === "create") {
      createMutation.mutate(payload);
      return;
    }

    if (formMode === "edit" && editingId !== null) {
      const updatePayload = {
        id: editingId,
        ...payload,
      };

      console.log("📤 Update payload:", updatePayload);

      updateMutation.mutate(updatePayload);
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
        accessorKey: "rank", // 👈 اضافه کن
        header: "رتبه",
        cell: ({ row }) => safeText(row.original.rank),
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
      "رتبه",
      "حدود صلاحیت",
      "شماره پروانه",
      "تاریخ انقضا",
      "وضعیت",
    ];
    const csvRows = rows.map((item) => [
      getExpertFullName(item),
      getExpertCode(item),
      safeText(item.rank),
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
          `<tr><td>${getExpertFullName(item)}</td><td>${getExpertCode(item)}</td><td>${safeText(item.rank)}</td><td>${getExpertiseZoneTitle(item, zoneOptions)}</td><td>${safeText(item.licenseNumber)}</td><td>${getLicenseExpirationDate(item)}</td><td>${getStatusTitle(item)}</td></tr>`,
      )
      .join("");
    const pw = window.open("", "_blank");
    if (!pw) {
      alert("امکان باز کردن پنجره چاپ وجود ندارد");
      return;
    }
    pw.document.write(
      `<html dir="rtl" lang="fa"><head><title>PDF</title><style>body{font-family:Tahoma,Arial;direction:rtl;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:right}th{background:#f3f4f6}</style></head><body><h2>لیست کارشناسان دادگستری</h2><table><thead><tr><th>نام و نام خانوادگی</th><th>کدملی</th><th>رتبه</th><th>حدود صلاحیت</th><th>شماره پروانه</th><th>تاریخ انقضا</th><th>وضعیت</th></tr></thead><tbody>${trs}</tbody></table><script>window.onload=function(){window.print()}</script></body></html>`,
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
          skeletonColumns={8}
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
            <FormInput
              id="modal-rank" // 👈 اضافه کن
              name="rank"
              label="رتبه"
              value={formData.rank}
              onChange={(v) => setFormData((p) => ({ ...p, rank: v }))}
              dir="ltr"
              type="number"
              min={1}
              max={10}
            />
            <div className="md:col-span-2 space-y-2">
              <label
                htmlFor="modal-expertiseZoneButton"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                حدود صلاحیت <span className="text-red-500">*</span>
              </label>

              <button
                id="modal-expertiseZoneButton"
                type="button"
                onClick={() => {
                  // هنگام باز شدن، انتخاب‌های فعلی فرم را داخل مودال قرار بده
                  setZoneModalSelectedIds(formData.expertiseZoneIds);
                  setIsZoneModalOpen(true);
                }}
                className="flex min-h-[42px] w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-right text-sm text-gray-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <span
                  className={
                    formData.expertiseZoneIds.length > 0
                      ? "text-gray-800 dark:text-gray-100"
                      : "text-gray-400"
                  }
                >
                  {formData.expertiseZoneIds.length > 0
                    ? `${formData.expertiseZoneIds.length} حدود صلاحیت انتخاب شده`
                    : "برای انتخاب حدود صلاحیت کلیک کنید"}
                </span>

                <span className="text-gray-400">⌄</span>
              </button>

              {selectedZoneTitles.length > 0 && (
                <div className="flex flex-wrap gap-2 rounded-md border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900">
                  {selectedZoneTitles.map((title) => {
                    const zone = zoneOptions.find(
                      (item) => item.title === title,
                    );

                    if (!zone) return null;

                    return (
                      <span
                        key={zone.id}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                      >
                        {title}

                        <button
                          type="button"
                          className="font-bold text-red-600 hover:text-red-800"
                          onClick={() => {
                            setFormData((previous) => ({
                              ...previous,
                              expertiseZoneIds:
                                previous.expertiseZoneIds.filter(
                                  (id) => id !== zone.id,
                                ),
                            }));

                            setZoneModalSelectedIds((previous) =>
                              previous.filter((id) => id !== zone.id),
                            );
                          }}
                          aria-label={`حذف ${title}`}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {formData.expertiseZoneIds.length === 0 && (
                <p className="text-xs text-gray-500">
                  حداقل یک حدود صلاحیت انتخاب کنید.
                </p>
              )}
            </div>

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
              required
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
              value=""
              onChange={(regionId) => {
                if (!regionId) return;
                const existing = formData.regions.find(
                  (region) => region.regionId === regionId,
                );
                setBranchModalRegionId(regionId);
                setBranchModalBranchIds(existing?.branchIds ?? []);
                setBranchModalAllBranches(existing?.allBranches ?? false);
                setIsBranchModalOpen(true);
              }}
              options={regionOptions}
              required
            />
            <div className="hidden">
              <p className="mb-2 text-sm font-medium text-gray-700">
                شعبه‌های منطقه
              </p>
              {!branchModalRegionId ? (
                <p className="text-xs text-gray-500">
                  ابتدا منطقه را انتخاب کنید.
                </p>
              ) : branchesQuery.isLoading ? (
                <p className="text-xs text-gray-500">
                  در حال بارگذاری شعبه‌ها...
                </p>
              ) : branchesQuery.isError ? (
                <p className="text-xs text-red-500">
                  خطا در دریافت شعبه‌های منطقه.
                </p>
              ) : branchOptions.length === 0 ? (
                <p className="text-xs text-gray-500">
                  برای این منطقه شعبه‌ای پیدا نشد.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {branchOptions.map((branch) => {
                    const checked = branchModalBranchIds.includes(branch.id);
                    return (
                      <label
                        key={branch.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm ${
                          checked
                            ? "border-blue-400 bg-blue-50 text-blue-800"
                            : "border-gray-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setBranchModalBranchIds((previous) =>
                              checked
                                ? previous.filter((id) => id !== branch.id)
                                : [...previous, branch.id],
                            )
                          }
                        />
                        {checked && <Check className="h-4 w-4" />}
                        <span>{branch.title}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="md:col-span-2 rounded-md border border-gray-200 p-3">
              <p className="mb-2 text-sm font-medium text-gray-700">
                مناطق و شعبه‌های انتخاب‌شده
              </p>
              {formData.regions.length === 0 ? (
                <p className="text-xs text-gray-500">
                  هنوز منطقه‌ای انتخاب نشده است.
                </p>
              ) : (
                <div className="space-y-2">
                  {formData.regions.map((selection) => {
                    const region = regionOptions.find(
                      (option) => option.id === selection.regionId,
                    );
                    return (
                      <div
                        key={selection.regionId}
                        className="flex items-center justify-between gap-3 rounded-md border border-blue-100 bg-blue-50 p-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-blue-900">
                            {region?.title || selection.regionId}
                          </span>
                          <span className="text-blue-300">|</span>
                          <span className="text-xs text-blue-700">
                            {selection.allBranches
                              ? "همه شعبه‌ها"
                              : `${selection.branchTitles?.join("، ") || selection.branchIds.join("، ")} (${selection.branchIds.length} شعبه)`}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="rounded px-2 py-1 text-xs text-blue-700 hover:bg-blue-100"
                            onClick={() => {
                              setBranchModalRegionId(selection.regionId);
                              setBranchModalBranchIds(selection.branchIds);
                              setBranchModalAllBranches(selection.allBranches);
                              setIsBranchModalOpen(true);
                            }}
                          >
                            ویرایش
                          </button>
                          <button
                            type="button"
                            className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                            onClick={() =>
                              setFormData((previous) => ({
                                ...previous,
                                regions: previous.regions.filter(
                                  (item) =>
                                    item.regionId !== selection.regionId,
                                ),
                              }))
                            }
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      />

      <Modal
        isOpen={isBranchModalOpen}
        isRTL
        header={`شعبه‌های ${branchModalRegion?.title || "منطقه"}`}
        onClose={() => setIsBranchModalOpen(false)}
        overlayLock={branchesQuery.isLoading}
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title="تأیید انتخاب"
              variant="success"
              onClick={() => {
                if (
                  !branchModalAllBranches &&
                  branchModalBranchIds.length === 0 &&
                  branchOptions.length > 0
                ) {
                  showToast(
                    "حداقل یک شعبه را انتخاب کنید یا گزینه همه شعبه‌ها را بزنید",
                    "error",
                  );
                  return;
                }

                const branchTitles = branchOptions
                  .filter((branch) => branchModalBranchIds.includes(branch.id))
                  .map((branch) => branch.title);

                const branchCodes = branchOptions // ✅ اضافه کن
                  .filter((branch) => branchModalBranchIds.includes(branch.id))
                  .map((branch) => branch.code || branch.id);

                setFormData((previous) => {
                  const nextSelection: RegionBranchSelection = {
                    regionId: branchModalRegionId,
                    regionCode: branchModalRegionCode,
                    branchIds:
                      branchModalAllBranches || branchOptions.length === 0
                        ? []
                        : branchModalBranchIds,
                    // ✅ اضافه کن
                    branchCodes:
                      branchModalAllBranches || branchOptions.length === 0
                        ? []
                        : branchCodes,
                    allBranches:
                      branchModalAllBranches || branchOptions.length === 0,
                    branchTitles,
                  };
                  const exists = previous.regions.some(
                    (region) => region.regionId === branchModalRegionId,
                  );
                  return {
                    ...previous,
                    regions: exists
                      ? previous.regions.map((region) =>
                          region.regionId === branchModalRegionId
                            ? nextSelection
                            : region,
                        )
                      : [...previous.regions, nextSelection],
                  };
                });
                setIsBranchModalOpen(false);
              }}
            />
            <FormButton
              title="انصراف"
              variant="secondary"
              onClick={() => setIsBranchModalOpen(false)}
            />
          </div>
        }
        renderContent={() => (
          <div className="space-y-4">
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm">
              <input
                type="checkbox"
                checked={branchModalAllBranches}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setBranchModalAllBranches(checked);
                  if (checked) setBranchModalBranchIds([]);
                }}
              />
              <span className="font-medium text-blue-900">
                انتخاب همه شعبه‌ها
              </span>
            </label>

            {branchesQuery.isLoading ? (
              <p className="text-sm text-gray-500">
                در حال بارگذاری شعبه‌ها...
              </p>
            ) : branchesQuery.isError ? (
              <p className="text-sm text-red-500">
                خطا در دریافت شعبه‌های منطقه.
              </p>
            ) : branchOptions.length === 0 ? (
              <p className="text-sm text-gray-500">
                برای این منطقه شعبه‌ای پیدا نشد.
              </p>
            ) : (
              <div className="grid max-h-[50vh] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                {branchOptions.map((branch) => {
                  const checked = branchModalBranchIds.includes(branch.id);
                  return (
                    <label
                      key={branch.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm ${
                        checked
                          ? "border-blue-400 bg-blue-50 text-blue-800"
                          : "border-gray-200"
                      } ${branchModalAllBranches ? "opacity-50" : ""}`}
                    >
                      <input
                        type="checkbox"
                        disabled={branchModalAllBranches}
                        checked={checked}
                        onChange={() =>
                          setBranchModalBranchIds((previous) =>
                            checked
                              ? previous.filter((id) => id !== branch.id)
                              : [...previous, branch.id],
                          )
                        }
                      />
                      {checked && <Check className="h-4 w-4" />}
                      <span>{branch.title}</span>
                    </label>
                  );
                })}
              </div>
            )}
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

      <Modal
        isOpen={isZoneModalOpen}
        isRTL
        header="انتخاب حدود صلاحیت"
        onClose={() => setIsZoneModalOpen(false)}
        overlayLock={zonesQuery.isLoading}
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title="تأیید انتخاب"
              variant="success"
              onClick={() => {
                setFormData((previous) => ({
                  ...previous,
                  expertiseZoneIds: zoneModalSelectedIds,
                }));

                setIsZoneModalOpen(false);
              }}
            />

            <FormButton
              title="انصراف"
              variant="secondary"
              onClick={() => setIsZoneModalOpen(false)}
            />
          </div>
        }
        renderContent={() => (
          <div className="space-y-3">
            {zonesQuery.isLoading ? (
              <p className="text-sm text-gray-500">
                در حال بارگذاری حدود صلاحیت‌ها...
              </p>
            ) : zonesQuery.isError ? (
              <p className="text-sm text-red-500">
                خطا در دریافت حدود صلاحیت‌ها.
              </p>
            ) : zoneOptions.length === 0 ? (
              <p className="text-sm text-gray-500">حدود صلاحیتی یافت نشد.</p>
            ) : (
              <div className="grid max-h-[50vh] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                {zoneOptions.map((zone) => {
                  const checked = zoneModalSelectedIds.includes(zone.id);

                  return (
                    <label
                      key={zone.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm transition-colors ${
                        checked
                          ? "border-blue-400 bg-blue-50 text-blue-800"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setZoneModalSelectedIds((previous) =>
                            checked
                              ? previous.filter((id) => id !== zone.id)
                              : [...previous, zone.id],
                          );
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />

                      {checked && <Check className="h-4 w-4" />}

                      <span>{zone.title}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}
      />
    </MainLayout.Main>
  );
}
