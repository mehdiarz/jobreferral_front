import { useMemo, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ClipboardList,
  UserX,
  Users,
  Phone,
  FileText,
  Award,
  AlertTriangle,
  Search,
  Check,
  Eye,
  Loader2,
  MapPin,
  Building2,
} from "lucide-react";

import { MainLayout } from "../../../baseComponents/MainLayout";
import FormButton from "../../../baseComponents/FormButton";
import FormTextarea from "../../../baseComponents/FormTextarea";
import PageTitle from "../../../baseComponents/PageTitle";
import DataTable from "../../../baseComponents/DataTable";
import Modal from "../../../baseComponents/Modal";
import { ViewDetailsButton } from "../../../baseComponents/RequestDetailsPanel";
import { useToast } from "../../../libs/toastContext";
import FormSection from "../../../baseComponents/FormSection";
import { FluidGrid } from "../../../baseComponents/FluidGrid";
import { FluidCol } from "../../../baseComponents/FluidCol";

import { getGroupedByRequest } from "../../../services/RequestAssignedJudicialExpertCrud/GetGroupedByRequest";
import { cancelAndReassign } from "../../../services/AssignCrud/cancelAndReassign";
import { getRequest } from "../../../services/RequestCrud/get";
import { viewRequest } from "../../../services/RequestCrud/viewRequest";
import { getAllExperts } from "../../../services/JudicialExperts/getAllExperts";
import { getExpert } from "../../../services/JudicialExperts/get";
import { getAllExpertiseZones } from "../../../services/ExpertiseZoneCrud/getAll";
import type {
  ExpertItem,
  JudicialExpertRegionOutputDto,
} from "../../../services/JudicialExperts/types";
import type {
  RequestWithJudicialExpertsItem,
  JudicialExpertItemDto,
  RequestSummaryDto,
} from "../../../services/RequestAssignedJudicialExpertCrud/types";
import type { RequestItem } from "../../../services/RequestCrud/types";

import {
  isoToPersianDateTime,
  isoToPersian,
} from "../../../utils/persianToISO";
import {
  REQUEST_DEPARTMENT_TYPES,
  type RequestDepartmentTypeConfig,
} from "../requestDepartmentTypes";

// ─── Types ───────────────────────────────────────────────────────
type TableFilter = { key: string; value: string };

interface ReferredToExpertPageProps {
  departmentType: RequestDepartmentTypeConfig;
}

type BranchInfo = {
  branchName?: unknown;
  title?: unknown;
  id?: unknown;
  branchCode?: unknown;
  code?: unknown;
};

type RegionInfo = {
  region?: unknown;
  regionId?: unknown;
  branchCodes?: unknown;
  branches?: unknown[] | null;
};

// ─── Helper Functions ────────────────────────────────────────────
function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function safeText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") return toPersianDigits(value);
  if (typeof value === "number") return toPersianDigits(value);
  return "";
}

function toPersianDigits(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  const str = String(value);
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return str.replace(/[0-9]/g, (w) => persianDigits[Number(w)]);
}

function getExpertFullName(
  expert?: JudicialExpertItemDto | ExpertItem | null,
): string {
  if (!expert) return "-";
  return (
    `${safeText(expert.firstName)} ${safeText(expert.lastName)}`.trim() || "-"
  );
}

function getExpertCode(
  expert?: JudicialExpertItemDto | ExpertItem | null,
): string {
  return safeText(expert?.code || expert?.id);
}

function getRegionTitle(region: RegionInfo): string {
  const regionValue =
    region.region && typeof region.region === "object"
      ? (region.region as { title?: unknown })
      : undefined;
  return safeText(regionValue?.title || region.regionId) || "-";
}

function getBranchTitles(region: RegionInfo): string[] {
  return (region.branches ?? []).map((rawBranch) => {
    const branch = (rawBranch ?? {}) as BranchInfo;
    return safeText(branch.branchName || branch.title || branch.id) || "-";
  });
}

function getBranchCodes(region: RegionInfo): string[] {
  if (Array.isArray(region.branchCodes)) {
    return region.branchCodes.map((code) => safeText(code));
  }
  if (Array.isArray(region.branches)) {
    return region.branches.map((rawBranch) => {
      const branch = (rawBranch ?? {}) as BranchInfo;
      return safeText(branch.branchCode || branch.code || branch.id || "");
    });
  }
  return [];
}

// ─── Main Component ──────────────────────────────────────────────
export function DepartmentReferredToExpertPage({
  departmentType,
}: ReferredToExpertPageProps) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // ─── State ─────────────────────────────────────────────────────
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [filters, setFilters] = useState<TableFilter[]>([]);
  const [selectedGroup, setSelectedGroup] =
    useState<RequestWithJudicialExpertsItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [requestDetail, setRequestDetail] = useState<RequestItem | null>(null);

  // Cancel modal states
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [expertToCancel, setExpertToCancel] =
    useState<JudicialExpertItemDto | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Replacement mode
  const [replacementMode, setReplacementMode] = useState<
    "automatic" | "manual" | ""
  >("");
  const [selectedReplacementExpert, setSelectedReplacementExpert] =
    useState<JudicialExpertItemDto | null>(null);

  // Expert selection modal
  const [isExpertModalOpen, setIsExpertModalOpen] = useState(false);
  const [expertSearch, setExpertSearch] = useState("");
  const [expertModalSelectedIds, setExpertModalSelectedIds] = useState<
    number[]
  >([]);

  // Expert detail modal
  const [isExpertDetailOpen, setIsExpertDetailOpen] = useState(false);
  const [selectedExpertDetail, setSelectedExpertDetail] =
    useState<JudicialExpertItemDto | null>(null);
  const [expertDetailLoading, setExpertDetailLoading] = useState(false);
  const [fullExpertDetail, setFullExpertDetail] = useState<ExpertItem | null>(
    null,
  );
  const [expertDetailError, setExpertDetailError] = useState<string | null>(
    null,
  );

  // Expanded regions state
  const [expandedRegions, setExpandedRegions] = useState<Set<number>>(
    new Set(),
  );

  // ─── Queries ───────────────────────────────────────────────────
  const groupedRequestsQuery = useQuery({
    queryKey: [
      "requests-assigned-to-experts",
      departmentType.id,
      pagination.pageIndex,
      pagination.pageSize,
      filters,
    ],
    queryFn: () => {
      return getGroupedByRequest({
        skipCount: pagination.pageIndex * pagination.pageSize,
        maxResultCount: pagination.pageSize,
        sorting: "creationTime desc",
      });
    },
    select: (data) => {
      const items = (data?.items ?? []) as RequestWithJudicialExpertsItem[];
      const totalCount = data?.totalCount ?? items.length;

      return {
        listResult: items,
        total: totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / pagination.pageSize)),
      };
    },
  });

  // Experts query for replacement
  const expertsQuery = useQuery({
    queryKey: ["judicial-experts-capital"],
    queryFn: () =>
      getAllExperts({
        skipCount: 0,
        maxResultCount: 1000,
         isCapital: true,
      }),
    staleTime: 10 * 60 * 1000,
    enabled: replacementMode === "manual",
  });

  const expertiseZonesQuery = useQuery({
    queryKey: ["expertise-zones"],
    queryFn: () => getAllExpertiseZones({ maxResultCount: 1000 }),
    staleTime: 10 * 60 * 1000,
    enabled: replacementMode === "manual",
    select: (data) => (data?.items ?? []) as { id: number; title: string }[],
  });

  // ─── Cancel Mutation ───────────────────────────────────────────
  const cancelMutation = useMutation({
    mutationFn: cancelAndReassign,
    onSuccess: () => {
      showToast("کارشناس با موفقیت لغو و جایگزین شد", "success");
      setIsCancelModalOpen(false);
      setCancelReason("");
      setExpertToCancel(null);
      setReplacementMode("");
      setSelectedReplacementExpert(null);
      setIsDetailOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["requests-assigned-to-experts"],
      });
    },
    onError: (error: Error) => {
      showToast(getErrorMessage(error, "خطا در لغو کارشناس"), "error");
    },
  });

  // ─── Handlers ──────────────────────────────────────────────────
  const handleViewRequest = useCallback(
    async (groupedItem: RequestWithJudicialExpertsItem) => {
      setSelectedGroup(groupedItem);
      setRequestDetail(null);
      setIsDetailOpen(true);

      const targetRequestId = groupedItem.request?.id || groupedItem.id;
      if (targetRequestId) {
        try {
          await viewRequest(targetRequestId);
          const detail = await getRequest(targetRequestId);
          setRequestDetail(detail);
        } catch (error) {
          console.error("Error loading request detail:", error);
          showToast("خطا در دریافت جزئیات تکمیلی درخواست", "error");
        }
      }
    },
    [showToast],
  );

  const handleOpenCancelModal = useCallback((expert: JudicialExpertItemDto) => {
    setExpertToCancel(expert);
    setCancelReason("");
    setReplacementMode("");
    setSelectedReplacementExpert(null);
    setIsCancelModalOpen(true);
  }, []);

  const handleConfirmCancel = useCallback(() => {
    const targetRequestId = selectedGroup?.request?.id || selectedGroup?.id;

    if (!expertToCancel?.id || !targetRequestId) {
      showToast("شناسه درخواست یا کارشناس یافت نشد", "error");
      return;
    }

    if (!cancelReason.trim()) {
      showToast("لطفاً دلیل لغو کارشناس را وارد کنید", "error");
      return;
    }

    if (!replacementMode) {
      showToast("لطفاً روش جایگزینی را انتخاب کنید", "error");
      return;
    }

    if (replacementMode === "manual" && !selectedReplacementExpert?.id) {
      showToast("لطفاً کارشناس جایگزین را انتخاب کنید", "error");
      return;
    }

    cancelMutation.mutate({
      reqId: targetRequestId,
      judicialExpertId: expertToCancel.id,
      cancellationReason: cancelReason.trim(),
      replacementJudicialExpertId:
        replacementMode === "manual"
          ? selectedReplacementExpert?.id
          : undefined,
    });
  }, [
    expertToCancel,
    selectedGroup,
    cancelReason,
    replacementMode,
    selectedReplacementExpert,
    cancelMutation,
    showToast,
  ]);

  // Filtered experts for replacement
  const filteredExperts = useMemo(() => {
    const allExperts = (expertsQuery.data?.items ??
      []) as JudicialExpertItemDto[];
    // حذف کارشناسان فعلی درخواست
    const currentExpertIds = new Set<number>();
    selectedGroup?.activeJudicials?.forEach((e) => currentExpertIds.add(e.id));
    if (expertToCancel) currentExpertIds.delete(expertToCancel.id); // کارشناسی که لغو میشه رو میتونیم دوباره انتخاب کنیم؟ نه
    currentExpertIds.add(expertToCancel?.id || 0); // کارشناس لغو شونده رو حذف کن

    const availableExperts = allExperts.filter(
      (e) => !currentExpertIds.has(e.id),
    );

    if (!expertSearch.trim()) return availableExperts;
    const search = expertSearch.trim().toLowerCase();
    return availableExperts.filter(
      (e) =>
        getExpertFullName(e).toLowerCase().includes(search) ||
        getExpertCode(e).toLowerCase().includes(search) ||
        safeText(e.licenseNumber).toLowerCase().includes(search),
    );
  }, [expertsQuery.data, expertSearch, selectedGroup, expertToCancel]);

  const handleOpenExpertModal = useCallback(() => {
    setExpertModalSelectedIds([]);
    setExpertSearch("");
    setIsExpertModalOpen(true);
  }, []);

  const handleConfirmExpertSelection = useCallback(() => {
    if (expertModalSelectedIds.length === 0) {
      showToast("لطفاً یک کارشناس انتخاب کنید", "error");
      return;
    }
    const selectedId = expertModalSelectedIds[0];
    const allExperts = (expertsQuery.data?.items ??
      []) as JudicialExpertItemDto[];
    const selected = allExperts.find((e) => e.id === selectedId);
    if (selected) {
      setSelectedReplacementExpert(selected);
      setIsExpertModalOpen(false);
    }
  }, [expertModalSelectedIds, expertsQuery.data, showToast]);

  const handleViewExpertDetail = useCallback(
    async (expert: JudicialExpertItemDto) => {
      setSelectedExpertDetail(expert);
      setFullExpertDetail(null);
      setExpertDetailError(null);
      setExpertDetailLoading(true);
      setIsExpertDetailOpen(true);

      try {
        const full = await getExpert(Number(expert.id));
        setFullExpertDetail(full as unknown as ExpertItem);
      } catch (err) {
        setExpertDetailError(
          err instanceof Error ? err.message : "خطا در دریافت اطلاعات کارشناس",
        );
      } finally {
        setExpertDetailLoading(false);
      }
    },
    [],
  );

  const resolveExpertiseZoneTitles = useCallback(
    (expert: ExpertItem | JudicialExpertItemDto | null): string[] => {
      if (!expert) return [];
      const zones = (expert as ExpertItem).expertiseZones;
      if (zones && zones.length > 0) {
        return zones.map((z) => z.title ?? "").filter(Boolean);
      }
      const zoneIds = (expert as ExpertItem).expertiseZoneIds ?? [];
      if (zoneIds.length === 0) return [];
      const zoneOptions = expertiseZonesQuery.data ?? [];
      return zoneIds
        .map((id) => {
          const zone = zoneOptions.find((z) => String(z.id) === String(id));
          return zone?.title ?? "";
        })
        .filter(Boolean);
    },
    [expertiseZonesQuery.data],
  );

  const toggleRegionExpansion = useCallback((regionIndex: number) => {
    setExpandedRegions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(regionIndex)) {
        newSet.delete(regionIndex);
      } else {
        newSet.add(regionIndex);
      }
      return newSet;
    });
  }, []);

  function getCustomerName(
    reqData?: RequestItem | RequestSummaryDto | null,
  ): string {
    if (!reqData) return "-";
    if ("customer" in reqData && reqData.customer?.name) {
      return safeText(reqData.customer.name);
    }
    if ("customerName" in reqData && reqData.customerName) {
      return safeText(reqData.customerName);
    }
    return "-";
  }

  // ─── Columns ───────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<RequestWithJudicialExpertsItem, unknown>[]>(
    () => [
      {
        id: "requestCode",
        header: "شماره درخواست",
        cell: ({ row }) => safeText(row.original.request?.requestCode) || "-",
      },
      {
        id: "title",
        header: "عنوان درخواست",
        cell: ({ row }) => safeText(row.original.request?.title) || "-",
      },
      {
        id: "customerName",
        header: "نام مشتری",
        cell: ({ row }) =>
          safeText(row.original.request?.customer?.name) || "-",
      },
      {
        id: "amount",
        header: "مبلغ (ریال)",
        cell: ({ row }) => {
          const amount = row.original.request?.amount;
          return amount ? Number(amount).toLocaleString("fa-IR") : "-";
        },
      },
      {
        id: "activeExperts",
        header: "کارشناسان فعال",
        cell: ({ row }) => {
          const activeList = row.original.activeJudicials ?? [];
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <Users className="h-3.5 w-3.5" />
              {activeList.length.toLocaleString("fa-IR")} کارشناس
            </span>
          );
        },
      },
      {
        id: "cancelledExperts",
        header: "کارشناسان لغو شده",
        cell: ({ row }) => {
          const canceledList = row.original.canceledJudicials ?? [];
          return canceledList.length > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
              <UserX className="h-3.5 w-3.5" />
              {canceledList.length.toLocaleString("fa-IR")} مورد
            </span>
          ) : (
            <span className="text-xs text-gray-400">-</span>
          );
        },
      },
      {
        id: "actions",
        header: "عملیات",
        cell: ({ row }) => (
          <ViewDetailsButton onClick={() => handleViewRequest(row.original)} />
        ),
      },
    ],
    [handleViewRequest],
  );

  const activeExperts = selectedGroup?.activeJudicials ?? [];
  const canceledExperts = selectedGroup?.canceledJudicials ?? [];
  const reqData = requestDetail ?? selectedGroup?.request;

  return (
    <MainLayout.Main maxWidth="screen-xl">
      <PageTitle
        title={`درخواست‌های ارجاعی به کارشناس‌های رسمی - ${departmentType.name}`}
      />

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <DataTable<RequestWithJudicialExpertsItem>
          query={groupedRequestsQuery}
          columns={columns}
          pagination={pagination}
          onPaginationChange={setPagination}
          filters={filters}
          onFiltersChange={(nf) => {
            setFilters(nf.length ? [nf[nf.length - 1]] : []);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
          filterFields={[
            { field: "requestCode", label: "شماره درخواست" },
            { field: "title", label: "عنوان" },
            { field: "customerName", label: "نام مشتری" },
          ]}
          searchMode="onEnter"
          emptyStateMessage="درخواست ارجاعی یافت نشد"
          emptyStateDescription="هیچ درخواستی با وضعیت کارشناس رسمی یافت نشد."
        />
      </div>

      {/* ─── مودال جزئیات درخواست ─── */}
      <Modal
        isOpen={isDetailOpen}
        isRTL
        header="جزئیات درخواست و کارشناسان ارجاعی"
        onClose={() => setIsDetailOpen(false)}
        overlayLock={cancelMutation.isPending}
        renderContent={() => {
          if (!selectedGroup) return null;

          return (
            <div className="space-y-6">
              {/* اطلاعات درخواست */}
              <FormSection
                title="اطلاعات درخواست"
                description="جزئیات اصلی درخواست ارجاع‌شده"
                icon={<ClipboardList className="h-5 w-5" />}
                contentClassName="p-4"
              >
                <FluidGrid className="gap-4">
                  <FluidCol colSpan="col-span-12 sm:col-span-6 lg:col-span-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">شماره درخواست</p>
                      <p className="mt-1 font-medium text-slate-800" dir="ltr">
                        {safeText(reqData?.requestCode) || "-"}
                      </p>
                    </div>
                  </FluidCol>
                  <FluidCol colSpan="col-span-12 sm:col-span-6 lg:col-span-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">عنوان</p>
                      <p className="mt-1 font-medium text-slate-800">
                        {safeText(reqData?.title) || "-"}
                      </p>
                    </div>
                  </FluidCol>
                  <FluidCol colSpan="col-span-12 sm:col-span-6 lg:col-span-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">مشتری</p>
                      <p className="mt-1 font-medium text-slate-800">
                        {getCustomerName(reqData)}
                      </p>
                    </div>
                  </FluidCol>
                  <FluidCol colSpan="col-span-12 sm:col-span-6 lg:col-span-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">مبلغ (ریال)</p>
                      <p className="mt-1 font-medium text-slate-800">
                        {reqData?.amount
                          ? Number(reqData.amount).toLocaleString("fa-IR")
                          : "-"}
                      </p>
                    </div>
                  </FluidCol>
                </FluidGrid>
              </FormSection>

              {/* کارشناسان فعال */}
              <FormSection
                title={`کارشناسان فعال (${activeExperts.length.toLocaleString("fa-IR")})`}
                icon={<Users className="h-5 w-5" />}
                contentClassName="p-4"
              >
                {activeExperts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
                    هیچ کارشناس فعالی برای این درخواست وجود ندارد
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeExperts.map((expert) => (
                      <div
                        key={expert.id}
                        className="flex flex-col justify-between gap-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 sm:flex-row sm:items-center"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white">
                              {getExpertFullName(expert).charAt(0) || "؟"}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">
                                {getExpertFullName(expert)}
                              </p>
                              <p className="text-xs text-slate-500">
                                کد: {getExpertCode(expert)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
                            <span className="inline-flex items-center gap-1">
                              <Award className="h-3.5 w-3.5 text-emerald-600" />
                              رتبه: {safeText(expert.rank)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5 text-emerald-600" />
                              پروانه: {safeText(expert.licenseNumber)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5 text-emerald-600" />
                              همراه:{" "}
                              <span dir="ltr">
                                {safeText(
                                  expert.mobileNumber || expert.phoneNumber,
                                )}
                              </span>
                            </span>
                          </div>
                        </div>

                        <FormButton
                          title="لغو کارشناس"
                          variant="danger"
                          size="sm"
                          onClick={() => handleOpenCancelModal(expert)}
                          disabled={cancelMutation.isPending}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </FormSection>

              {/* کارشناسان لغو شده */}
              {canceledExperts.length > 0 && (
                <FormSection
                  title={`کارشناسان لغو شده (${canceledExperts.length.toLocaleString("fa-IR")})`}
                  icon={<UserX className="h-5 w-5" />}
                  contentClassName="p-4"
                >
                  <div className="space-y-3">
                    {canceledExperts.map((item, idx) => {
                      const expert = item.judicialExpert;
                      return (
                        <div
                          key={`${expert?.id ?? idx}-${item.creationTime}`}
                          className="flex items-start gap-4 rounded-xl border border-red-100 bg-red-50/40 p-4"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-sm font-bold text-red-600">
                            {getExpertFullName(expert).charAt(0) || "؟"}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-700">
                                {getExpertFullName(expert)}
                              </p>
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                لغو شده
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              کد: {getExpertCode(expert)} | رتبه:{" "}
                              {safeText(expert?.rank)}
                            </p>
                            {item.cancellationReason && (
                              <p className="mt-2 text-xs text-slate-600">
                                <span className="font-medium text-slate-700">
                                  علت لغو:
                                </span>{" "}
                                {item.cancellationReason}
                              </p>
                            )}
                            {item.creationTime && (
                              <p className="mt-1 text-xs text-slate-400">
                                زمان لغو:{" "}
                                {isoToPersianDateTime(item.creationTime)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </FormSection>
              )}
            </div>
          );
        }}
      />

      {/* ─── مودال لغو کارشناس ─── */}
      <Modal
        isOpen={isCancelModalOpen}
        isRTL
        header="لغو کارشناس و جایگزینی"
        onClose={() => setIsCancelModalOpen(false)}
        overlayLock={cancelMutation.isPending}
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title="تأیید لغو و جایگزینی"
              variant="danger"
              onClick={handleConfirmCancel}
              isLoading={cancelMutation.isPending}
              disabled={cancelMutation.isPending}
            />
            <FormButton
              title="انصراف"
              variant="secondary"
              onClick={() => setIsCancelModalOpen(false)}
              disabled={cancelMutation.isPending}
            />
          </div>
        }
        renderContent={() => (
          <div className="space-y-4">
            {/* کارشناس در حال لغو */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <p className="text-sm font-medium text-amber-800">
                  در حال لغو کارشناس زیر هستید:
                </p>
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-white p-3 shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
                  {getExpertFullName(expertToCancel).charAt(0) || "؟"}
                </div>
                <div>
                  <p className="font-bold text-slate-800">
                    {getExpertFullName(expertToCancel)}
                  </p>
                  <p className="text-xs text-slate-500">
                    کد: {getExpertCode(expertToCancel)} | رتبه:{" "}
                    {safeText(expertToCancel?.rank)}
                  </p>
                </div>
              </div>
            </div>

            {/* روش جایگزینی */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">
                روش جایگزینی کارشناس:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border p-4 transition-all ${
                    replacementMode === "automatic"
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-slate-200 hover:border-blue-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="replacement-mode"
                    checked={replacementMode === "automatic"}
                    onChange={() => {
                      setReplacementMode("automatic");
                      setSelectedReplacementExpert(null);
                    }}
                    className="text-blue-600"
                  />
                  <span className="font-medium">جایگزینی خودکار</span>
                </label>

                <label
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border p-4 transition-all ${
                    replacementMode === "manual"
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-slate-200 hover:border-blue-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="replacement-mode"
                    checked={replacementMode === "manual"}
                    onChange={() => setReplacementMode("manual")}
                    className="text-blue-600"
                  />
                  <span className="font-medium">جایگزینی دستی</span>
                </label>
              </div>
            </div>

            {/* انتخاب دستی کارشناس جایگزین */}
            {replacementMode === "manual" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">
                    کارشناس جایگزین:
                  </p>
                  <FormButton
                    title="انتخاب کارشناس"
                    variant="secondary"
                    size="sm"
                    onClick={handleOpenExpertModal}
                  />
                </div>

                {selectedReplacementExpert && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <div className="flex-1">
                      <p className="font-bold text-slate-800">
                        {getExpertFullName(selectedReplacementExpert)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span>
                          کد: {getExpertCode(selectedReplacementExpert)}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span>
                          رتبه: {safeText(selectedReplacementExpert.rank)}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span>
                          پروانه:{" "}
                          {safeText(selectedReplacementExpert.licenseNumber)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleViewExpertDetail(selectedReplacementExpert)
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
                        title="مشاهده جزئیات"
                      >
                        <Eye className="h-3 w-3" />
                        جزئیات
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedReplacementExpert(null)}
                        className="rounded-lg p-1 text-red-500 hover:bg-red-50 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* دلیل لغو */}
            <FormTextarea
              id="cancel-reason"
              name="cancelReason"
              label="دلیل لغو کارشناس"
              value={cancelReason}
              onChange={setCancelReason}
              rows={4}
              dir="rtl"
              required
            />
          </div>
        )}
      />

      {/* ─── مودال انتخاب کارشناس جایگزین ─── */}
      <Modal
        isOpen={isExpertModalOpen}
        isRTL
        header="انتخاب کارشناس جایگزین"
        onClose={() => setIsExpertModalOpen(false)}
        overlayLock={false}
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title="تأیید انتخاب"
              variant="success"
              onClick={handleConfirmExpertSelection}
            />
            <FormButton
              title="انصراف"
              variant="secondary"
              onClick={() => setIsExpertModalOpen(false)}
            />
          </div>
        }
        renderContent={() => (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="جستجوی کارشناس (نام، کد ملی، شماره پروانه)..."
                value={expertSearch}
                onChange={(e) => setExpertSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>

            <div className="max-h-[50vh] space-y-2 overflow-y-auto">
              {expertsQuery.isLoading && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-6 text-center text-sm text-blue-700">
                  در حال دریافت فهرست کارشناسان...
                </div>
              )}
              {expertsQuery.isError && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-700">
                  دریافت فهرست کارشناسان با خطا مواجه شد.
                </div>
              )}
              {filteredExperts.length === 0 ? (
                <p className="text-center text-sm text-gray-500">
                  کارشناسی یافت نشد
                </p>
              ) : (
                filteredExperts.map((expert) => {
                  const checked = expertModalSelectedIds.includes(expert.id);
                  const zones = resolveExpertiseZoneTitles(expert);

                  return (
                    <div
                      key={expert.id}
                      className={`flex items-start gap-3 rounded-xl border p-4 transition ${
                        checked
                          ? "border-blue-400 bg-blue-50 shadow-sm"
                          : "border-gray-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="replacement-expert"
                        checked={checked}
                        onChange={() => {
                          setExpertModalSelectedIds([expert.id]);
                        }}
                        className="mt-1 text-blue-600"
                      />
                      {checked && (
                        <Check className="mt-1 h-4 w-4 text-blue-600" />
                      )}

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-slate-800">
                            {getExpertFullName(expert)}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              expert.isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {expert.isActive ? "فعال" : "غیرفعال"}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span>کد: {getExpertCode(expert)}</span>
                          <span className="text-slate-300">|</span>
                          <span>رتبه: {safeText(expert.rank)}</span>
                          <span className="text-slate-300">|</span>
                          <span>پروانه: {safeText(expert.licenseNumber)}</span>
                        </div>
                        {zones.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {zones.slice(0, 3).map((zone, index) => (
                              <span
                                key={index}
                                className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                              >
                                {zone}
                              </span>
                            ))}
                            {zones.length > 3 && (
                              <span className="text-xs text-slate-400">
                                +{zones.length - 3} مورد دیگر
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleViewExpertDetail(expert)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:border-blue-300"
                        title="مشاهده جزئیات کامل"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        جزئیات کامل
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      />

      {/* ─── مودال جزئیات کامل کارشناس ─── */}
      <Modal
        isOpen={isExpertDetailOpen}
        isRTL
        header="جزئیات کامل کارشناس دادگستری"
        onClose={() => setIsExpertDetailOpen(false)}
        overlayLock={expertDetailLoading}
        renderContent={() => {
          if (expertDetailLoading) {
            return (
              <div className="flex items-center justify-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            );
          }

          if (expertDetailError) {
            return (
              <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-700">
                {expertDetailError}
              </div>
            );
          }

          if (!fullExpertDetail && !selectedExpertDetail) return null;

          const expert = fullExpertDetail ?? selectedExpertDetail;
          if (!expert) return null;
          const zones = resolveExpertiseZoneTitles(expert);

          return (
            <div className="space-y-6">
              {/* هدر کارشناس */}
              <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-gradient-to-l from-blue-50 to-white p-5 shadow-sm">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white shadow-lg">
                  {getExpertFullName(expert).charAt(0) || "؟"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-blue-600">
                    کارشناس رسمی دادگستری
                  </p>
                  <h3 className="mt-1 truncate text-xl font-bold text-slate-800">
                    {getExpertFullName(expert) || "-"}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-500">
                      کد ملی:{" "}
                      <span dir="ltr" className="font-medium">
                        {getExpertCode(expert) || "-"}
                      </span>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        expert.isActive
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : "bg-red-50 text-red-700 ring-1 ring-red-200"
                      }`}
                    >
                      {expert.isActive ? "فعال" : "غیرفعال"}
                    </span>
                  </div>
                </div>
              </div>

              {/* اطلاعات پروانه */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h4 className="mb-4 flex items-center gap-2 border-r-4 border-blue-600 pr-2 text-sm font-bold text-slate-700">
                  <Award className="h-4 w-4 text-blue-600" />
                  اطلاعات پروانه کارشناسی
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">رتبه</p>
                    <p className="mt-1 text-lg font-bold text-slate-800">
                      {safeText(expert.rank) || "-"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">شماره پروانه</p>
                    <p
                      className="mt-1 text-lg font-bold text-slate-800"
                      dir="ltr"
                    >
                      {safeText(expert.licenseNumber) || "-"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">تاریخ صدور</p>
                    <p className="mt-1 font-medium text-slate-800">
                      {isoToPersian(
                        (expert as ExpertItem).licenseIssueDate || "",
                      ) || "-"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">تاریخ انقضا</p>
                    <p className="mt-1 font-medium text-slate-800">
                      {isoToPersian(
                        (expert as ExpertItem).licenseExpireDate || "",
                      ) || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* حدود صلاحیت */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h4 className="mb-4 flex items-center gap-2 border-r-4 border-blue-600 pr-2 text-sm font-bold text-slate-700">
                  <FileText className="h-4 w-4 text-blue-600" />
                  حدود صلاحیت
                </h4>
                {zones.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {zones.map((zone, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-blue-50 px-4 py-2 text-xs font-medium text-blue-800 ring-1 ring-blue-200"
                      >
                        {zone}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    حدود صلاحیتی ثبت نشده است.
                  </p>
                )}
              </div>

              {/* اطلاعات تماس */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h4 className="mb-4 flex items-center gap-2 border-r-4 border-blue-600 pr-2 text-sm font-bold text-slate-700">
                  <Phone className="h-4 w-4 text-blue-600" />
                  اطلاعات تماس
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">موبایل</p>
                    <p className="mt-1 font-medium text-slate-800" dir="ltr">
                      {safeText(expert.mobileNumber) || "-"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">تلفن</p>
                    <p className="mt-1 font-medium text-slate-800" dir="ltr">
                      {safeText(expert.phoneNumber) || "-"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 sm:col-span-2">
                    <p className="text-xs text-slate-400">ایمیل</p>
                    <p className="mt-1 font-medium text-slate-800" dir="ltr">
                      {safeText((expert as ExpertItem).email) || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* مناطق و شعبه‌ها */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h4 className="mb-4 flex items-center gap-2 border-r-4 border-blue-600 pr-2 text-sm font-bold text-slate-700">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  مناطق و شعبه‌ها
                </h4>
                {((expert as ExpertItem).regions?.length ?? 0) > 0 ? (
                  <div className="space-y-3">
                    {(expert as ExpertItem).regions!.map(
                      (region: JudicialExpertRegionOutputDto, index: number) => {
                        const regionTitle = getRegionTitle(region);
                        const branches = getBranchTitles(region);
                        const branchCodes = getBranchCodes(region);
                        const isExpanded = expandedRegions.has(index);
                        const visibleBranches = branches.slice(0, 3);
                        const hiddenBranchesCount =
                          branches.length - visibleBranches.length;

                        return (
                          <div
                            key={index}
                            className="rounded-xl border border-blue-100 bg-gradient-to-l from-blue-50 to-white p-4"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-blue-600" />
                                <p className="font-bold text-slate-700">
                                  {regionTitle}
                                </p>
                                <span className="text-xs text-slate-400">
                                  ({branches.length} شعبه)
                                </span>
                              </div>
                              {branches.length === 0 ? (
                                <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
                                  همه شعبه‌ها
                                </span>
                              ) : (
                                branches.length > 3 && (
                                  <button
                                    onClick={() => toggleRegionExpansion(index)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                                  >
                                    {isExpanded ? "بستن" : "نمایش همه"}
                                  </button>
                                )
                              )}
                            </div>

                            {branches.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {(isExpanded ? branches : visibleBranches).map(
                                  (branchTitle, branchIndex) => (
                                    <span
                                      key={branchIndex}
                                      className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm ring-1 ring-slate-200"
                                    >
                                      {branchTitle}
                                      {branchCodes[branchIndex] && (
                                        <span
                                          className="text-slate-400"
                                          dir="ltr"
                                        >
                                          {branchCodes[branchIndex]}
                                        </span>
                                      )}
                                    </span>
                                  ),
                                )}
                                {!isExpanded && hiddenBranchesCount > 0 && (
                                  <button
                                    onClick={() => toggleRegionExpansion(index)}
                                    className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                                  >
                                    +{hiddenBranchesCount} شعبه دیگر
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    منطقه‌ای ثبت نشده است.
                  </p>
                )}
              </div>
            </div>
          );
        }}
      />
    </MainLayout.Main>
  );
}

// ─── Main Office Export ──────────────────────────────────────────
export default function MainOfficeReferredToExpertPage() {
  return (
    <DepartmentReferredToExpertPage
      departmentType={REQUEST_DEPARTMENT_TYPES.mainOffice}
    />
  );
}
