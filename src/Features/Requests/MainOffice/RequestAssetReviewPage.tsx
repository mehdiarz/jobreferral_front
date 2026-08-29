import { useMemo, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ClipboardList,
  MessageSquareText,
  Search,
  Check,
  Eye,
  Loader2,
  Phone,
  MapPin,
  Award,
  FileText,
  Building2,
} from "lucide-react";

import { MainLayout } from "../../../baseComponents/MainLayout";
import FormButton from "../../../baseComponents/FormButton";
import FormTextarea from "../../../baseComponents/FormTextarea";
import PageTitle from "../../../baseComponents/PageTitle";
import DataTable from "../../../baseComponents/DataTable";
import Modal from "../../../baseComponents/Modal";
import RequestDetailsPanel, {
  RequestDetailSection,
  ViewDetailsButton,
} from "../../../baseComponents/RequestDetailsPanel";
import { useToast } from "../../../libs/toastContext";
import { useAuthStore } from "../../../libs/store";

import { getAllRequests } from "../../../services/RequestCrud/getAll";
import { getRequest } from "../../../services/RequestCrud/get";
import { viewRequest } from "../../../services/RequestCrud/viewRequest";
import {
  getUserActionSuccessMessage,
  userAction,
} from "../../../services/RequestCrud/userAction";
import { createRequestComment } from "../../../services/RequestCommentCrud/create";
import { getUserById } from "../../../services/Users/getUserById";
import { getAllExperts } from "../../../services/JudicialExperts/getAllExperts";
import { getExpert } from "../../../services/JudicialExperts/get";
import { getAllExpertiseZones } from "../../../services/ExpertiseZoneCrud/getAll";
import type { ExpertItem } from "../../../services/JudicialExperts/types";

import type { RequestItem } from "../../../services/RequestCrud/types";
import {
  isoToPersian,
  isoToPersianDateTime,
} from "../../../utils/persianToISO";
import { persianToISO } from "../../../utils/persianToISO";
import {
  REQUEST_DEPARTMENT_TYPES,
  type RequestDepartmentTypeConfig,
} from "../requestDepartmentTypes";
import { getAllRequestStatus } from "../../../services/RequestStatusCrud/getAll";
import {
  REQUEST_STATUS_TITLES,
  resolveRequestStatusCode,
  resolveRequestStatusTitle,
} from "../requestStatuses";

import PropertyAppraisalReadOnlyModal from "../../../baseComponents/PropertyAppraisalReadOnlyModal";
import { getPropertyAppraisalLookups } from "../../../services/PropertyAppraisalCrud/getLookups";
import { getPropertyAppraisalByRequestId } from "../../../services/PropertyAppraisalCrud/getByRequestId";
import type {
  PropertyAppraisalOutputDto,
  PropertyAppraisalLookupsDto,
} from "../../../services/PropertyAppraisalCrud/types";

// ─── Types ───────────────────────────────────────────────────────
type TableFilter = { key: string; value: string };
type SelectedRequest = RequestItem & {
  requesterFullName?: string | null;
};

type JudicialExpert = Partial<ExpertItem> & {
  id: number;
  nationalCode?: string;
};

type ExpertRegion = NonNullable<ExpertItem["regions"]>[number];

// ─── Helper Functions ────────────────────────────────────────────
function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function safeText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function getExpertFullName(e: JudicialExpert | ExpertItem): string {
  return `${safeText(e.firstName)} ${safeText(e.lastName)}`.trim();
}

function getExpertCode(e: JudicialExpert | ExpertItem): string {
  return safeText(e.code || ("nationalCode" in e ? e.nationalCode : ""));
}

function getRegionTitle(region: ExpertRegion): string {
  const value = region?.region as { title?: string } | null | undefined;
  return safeText(value?.title || region?.regionId) || "-";
}

function getBranchTitles(region: ExpertRegion): string[] {
  return (region?.branches ?? []).map((branch) => {
    const value = branch as {
      branchName?: string;
      title?: string;
      id?: number;
    };
    return safeText(value.branchName || value.title || value.id) || "-";
  });
}

function getBranchCodes(region: ExpertRegion): string[] {
  const value = region as any;
  if (Array.isArray(value?.branchCodes)) {
    return value.branchCodes.map((code: unknown) => safeText(code));
  }
  if (Array.isArray(value?.branches)) {
    return value.branches.map((branch: any) =>
      safeText(branch?.branchCode || branch?.code || branch?.id || ""),
    );
  }
  return [];
}

// ─── Main Component ──────────────────────────────────────────────
interface MainOfficeRequestAssetReviewPageProps {
  departmentType: RequestDepartmentTypeConfig;
}

export function DepartmentMainOfficeRequestAssetReviewPage({
  departmentType,
}: MainOfficeRequestAssetReviewPageProps) {
  const { showToast } = useToast();
  const { user } = useAuthStore();

  // ─── State ─────────────────────────────────────────────────────
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [filters, setFilters] = useState<TableFilter[]>([]);
  const [selectedRequest, setSelectedRequest] =
    useState<SelectedRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Referral mode
  const [referralMode, setReferralMode] = useState<"automatic" | "manual" | "">(
    "",
  );
  const [selectedExperts, setSelectedExperts] = useState<JudicialExpert[]>([]);

  // Experts modal
  const [isExpertModalOpen, setIsExpertModalOpen] = useState(false);
  const [expertSearch, setExpertSearch] = useState("");
  const [expertModalSelectedIds, setExpertModalSelectedIds] = useState<
    number[]
  >([]);

  // Expert detail modal
  const [isExpertDetailOpen, setIsExpertDetailOpen] = useState(false);
  const [selectedExpertDetail, setSelectedExpertDetail] =
    useState<JudicialExpert | null>(null);
  const [expertDetailLoading, setExpertDetailLoading] = useState(false);
  const [fullExpertDetail, setFullExpertDetail] = useState<ExpertItem | null>(
    null,
  );
  const [expertDetailError, setExpertDetailError] = useState<string | null>(
    null,
  );

  // Appraisals
  const [appraisals, setAppraisals] = useState<PropertyAppraisalOutputDto[]>(
    [],
  );
  const [isAppraisalReadOnlyOpen, setIsAppraisalReadOnlyOpen] = useState(false);
  const [selectedReadonlyAppraisal, setSelectedReadonlyAppraisal] =
    useState<PropertyAppraisalOutputDto | null>(null);

  const [expandedRegions, setExpandedRegions] = useState<Set<number>>(
    new Set(),
  );

  const userCacheRef = useRef<Map<number, { name: string; role: string }>>(
    new Map(),
  );

  // ─── Queries ───────────────────────────────────────────────────
  const statusQuery = useQuery({
    queryKey: ["request-statuses"],
    queryFn: () => getAllRequestStatus({ maxResultCount: 100 }),
    staleTime: 10 * 60 * 1000,
  });

  const statuses = statusQuery.data?.items;

  const assetReviewStatusCodes = useMemo(
    () => ({
      propertyReview: resolveRequestStatusCode(
        statuses,
        REQUEST_STATUS_TITLES.propertyReview,
      ),
      propertyRejected: resolveRequestStatusCode(
        statuses,
        REQUEST_STATUS_TITLES.propertyRejected,
      ),
    }),
    [statuses],
  );

  const requestsQuery = useQuery({
    queryKey: [
      "requests-asset-review-main-office",
      departmentType.id,
      pagination.pageIndex,
      pagination.pageSize,
      filters,
      assetReviewStatusCodes.propertyReview,
      assetReviewStatusCodes.propertyRejected,
    ],
    queryFn: async () => {
      const apiFilters = Object.fromEntries(
        filters
          .filter((f) => f.value.trim())
          .map((f) => [
            f.key,
            f.key === "creationTime"
              ? persianToISO(f.value.trim()) || f.value.trim()
              : f.value.trim(),
          ]),
      );
      const response = await getAllRequests({
        ...apiFilters,
        currentDepartmentTypeName: departmentType.name,
        skipCount: pagination.pageIndex * pagination.pageSize,
        maxResultCount: pagination.pageSize,
        sorting: "creationTime desc",
      });
      return response;
    },
    select: (data) => {
      const items = ((data?.items ?? []) as RequestItem[]).filter(
        (r) =>
          r.requestStatusCode === assetReviewStatusCodes.propertyReview ||
          r.requestStatusCode === assetReviewStatusCodes.propertyRejected,
      );
      return {
        listResult: items,
        total: data.totalCount ?? items.length,
        totalPages: Math.max(
          1,
          Math.ceil((data.totalCount ?? items.length) / pagination.pageSize),
        ),
      };
    },
    enabled: statusQuery.isSuccess,
  });

  const expertsQuery = useQuery({
    queryKey: ["judicial-experts-capital"],
    queryFn: () =>
      getAllExperts({
        skipCount: 0,
        maxResultCount: 1000,
        IsCapital: true,
      }),
    staleTime: 10 * 60 * 1000,
  });

  const expertiseZonesQuery = useQuery({
    queryKey: ["expertise-zones"],
    queryFn: () => getAllExpertiseZones({ maxResultCount: 1000 }),
    staleTime: 10 * 60 * 1000,
    select: (data) => (data?.items ?? []) as { id: number; title: string }[],
  });

  const lookupsQuery = useQuery({
    queryKey: ["property-appraisal-lookups"],
    queryFn: getPropertyAppraisalLookups,
    staleTime: 10 * 60 * 1000,
  });

  const lookups = useMemo(
    () => (lookupsQuery.data ?? {}) as PropertyAppraisalLookupsDto,
    [lookupsQuery.data],
  );

  const isStatusFive =
    selectedRequest?.requestStatusCode ===
    assetReviewStatusCodes.propertyRejected;

  // ─── Helpers ───────────────────────────────────────────────────
  const getUserCacheData = useCallback((userId: number) => {
    return (
      userCacheRef.current.get(userId) || { name: `کاربر ${userId}`, role: "-" }
    );
  }, []);

  const getDepartmentName = (id: number | null | undefined): string => {
    switch (id) {
      case REQUEST_DEPARTMENT_TYPES.branch.id:
        return REQUEST_DEPARTMENT_TYPES.branch.name;
      case REQUEST_DEPARTMENT_TYPES.independentBranch.id:
        return REQUEST_DEPARTMENT_TYPES.independentBranch.name;
      case REQUEST_DEPARTMENT_TYPES.region.id:
        return REQUEST_DEPARTMENT_TYPES.region.name;
      case REQUEST_DEPARTMENT_TYPES.mainOffice.id:
        return REQUEST_DEPARTMENT_TYPES.mainOffice.name;
      default:
        return "نامشخص";
    }
  };

  const handleView = useCallback(
    async (req: RequestItem) => {
      setSelectedRequest(null);
      setComment("");
      setAppraisals([]);
      setSelectedReadonlyAppraisal(null);
      setIsAppraisalReadOnlyOpen(false);
      setReferralMode("");
      setSelectedExperts([]);
      setExpertModalSelectedIds([]);
      setIsDetailOpen(true);

      try {
        const existingAppraisals = await getPropertyAppraisalByRequestId(
          req.id,
        );
        setAppraisals(existingAppraisals ?? []);
      } catch {
        setAppraisals([]);
      }

      try {
        await viewRequest(req.id);
        const detail = await getRequest(req.id);
        setSelectedRequest(detail);

        const ids = new Set<number>();
        detail.requestHistoryOutputDtos?.forEach(
          (h) => h.reviewerUserId && ids.add(h.reviewerUserId),
        );
        detail.requestCommentOutputDtos?.forEach(
          (c) => c.userId && ids.add(c.userId),
        );

        for (const id of ids) {
          if (!userCacheRef.current.has(id)) {
            const u = await getUserById(id);
            userCacheRef.current.set(id, {
              name: u?.fullName || `${u?.name} ${u?.surname}` || `کاربر ${id}`,
              role: u?.roleNames?.[0] || "-",
            });
          }
        }
      } catch (error) {
        console.error("Error in handleView:", error);
        showToast("خطا در بارگذاری اطلاعات", "error");
      }
    },
    [showToast],
  );

  const handleAction = useCallback(
    async (accepted: boolean) => {
      if (!selectedRequest) return;

      if (accepted) {
        if (!referralMode) {
          showToast("لطفاً روش ارجاع را انتخاب کنید", "error");
          return;
        }

        if (referralMode === "manual" && selectedExperts.length === 0) {
          showToast("حداقل یک کارشناس را انتخاب کنید", "error");
          return;
        }
      }

      setIsSubmitting(true);
      try {
        if (comment.trim()) {
          await createRequestComment({
            requestId: selectedRequest.id,
            userId: Number(user?.id || 0),
            description: comment.trim(),
          });
        }

        const actionResult = await userAction({
          requestId: selectedRequest.id,
          accepted,
          judicialExpertIds:
            referralMode === "manual" ? selectedExperts.map((e) => e.id) : null,
        });

        showToast(
          getUserActionSuccessMessage(
            actionResult,
            accepted ? "درخواست با موفقیت تأیید شد" : "درخواست با موفقیت رد شد",
          ),
          "success",
        );
        setIsDetailOpen(false);
        await requestsQuery.refetch();
      } catch (error: unknown) {
        console.error("Error in action:", error);
        showToast(getErrorMessage(error, "خطا در انجام عملیات"), "error");
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      selectedRequest,
      comment,
      user,
      referralMode,
      selectedExperts,
      requestsQuery,
      showToast,
    ],
  );

  // ─── Expert Selection ──────────────────────────────────────────
  const filteredExperts = useMemo(() => {
    const allExperts = (expertsQuery.data?.items ?? []) as JudicialExpert[];
    if (!expertSearch.trim()) return allExperts;
    const search = expertSearch.trim().toLowerCase();
    return allExperts.filter(
      (e) =>
        getExpertFullName(e).toLowerCase().includes(search) ||
        getExpertCode(e).toLowerCase().includes(search) ||
        safeText(e.licenseNumber).toLowerCase().includes(search),
    );
  }, [expertsQuery.data, expertSearch]);

  const handleOpenExpertModal = useCallback(() => {
    setExpertModalSelectedIds(selectedExperts.map((e) => e.id));
    setExpertSearch("");
    setIsExpertModalOpen(true);
  }, [selectedExperts]);

  const handleConfirmExpertSelection = useCallback(() => {
    if (expertModalSelectedIds.length > 2) {
      showToast("حداکثر ۲ کارشناس می‌توانید انتخاب کنید", "error");
      return;
    }
    const allExperts = (expertsQuery.data?.items ?? []) as JudicialExpert[];
    const selected = allExperts.filter((e) =>
      expertModalSelectedIds.includes(e.id),
    );
    setSelectedExperts(selected);
    setIsExpertModalOpen(false);
  }, [expertModalSelectedIds, expertsQuery.data, showToast]);

  const handleRemoveExpert = useCallback((expertId: number) => {
    setSelectedExperts((prev) => prev.filter((e) => e.id !== expertId));
  }, []);

  const handleViewExpertDetail = useCallback(async (expert: JudicialExpert) => {
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
  }, []);

  const resolveExpertiseZoneTitles = useCallback(
    (expert: ExpertItem | JudicialExpert | null): string[] => {
      if (!expert) return [];
      const zones = expert.expertiseZones;
      if (zones && zones.length > 0) {
        return zones.map((z) => z.title ?? "").filter(Boolean);
      }
      const zoneIds = expert.expertiseZoneIds ?? [];
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

  // ─── Columns ───────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<RequestItem, unknown>[]>(
    () => [
      {
        id: "status",
        header: "مرحله فرآیند",
        cell: ({ row }) =>
          resolveRequestStatusTitle(
            statuses,
            row.original.requestStatusCode,
            row.original.requestStatusTitle,
          ),
      },
      {
        id: "user",
        header: "کاربر اقدام کننده",
        cell: ({ row }) => row.original.actorUserFullName || "-",
      },
      {
        id: "role",
        header: "نقش سازمانی",
        cell: ({ row }) => row.original.actorUserRoleNames?.join("-") || "-",
      },
      {
        id: "date",
        header: "تاریخ و زمان",
        cell: ({ row }) =>
          row.original.creationTime ? (
            <span dir="ltr" className="inline-block whitespace-nowrap">
              {isoToPersianDateTime(row.original.creationTime)}
            </span>
          ) : (
            "-"
          ),
      },
      {
        id: "title",
        header: "عنوان",
        cell: ({ row }) => row.original.title || "-",
      },
      {
        id: "detail",
        header: "عملیات",
        cell: ({ row }) => (
          <ViewDetailsButton onClick={() => handleView(row.original)} />
        ),
      },
    ],
    [handleView, statuses],
  );

  // ─── Render ──────────────────────────────────────────────────
  return (
    <MainLayout.Main maxWidth="screen-xl">
      <PageTitle
        title={`بررسی و بازنگری اطلاعات ملک توسط ${departmentType.name}`}
      />
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <DataTable<RequestItem>
          query={requestsQuery}
          columns={columns}
          pagination={pagination}
          onPaginationChange={setPagination}
          filters={filters}
          onFiltersChange={(nf) => {
            setFilters(nf.length ? [nf[nf.length - 1]] : []);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
          filterFields={[
            { field: "requestStatusTitle", label: "مرحله فرآیند" },
            { field: "actorUserFullName", label: "نام کاربر اقدام کننده" },
            {
              field: "creationTime",
              label: "تاریخ",
              placeholder: "مثال: 1405-05-11",
            },
          ]}
          searchMode="onEnter"
          emptyStateMessage="درخواستی یافت نشد"
        />
      </div>

      {/* مودال جزئیات درخواست */}
      <Modal
        isOpen={isDetailOpen}
        isRTL
        header="جزئیات و بررسی ارزیابی"
        onClose={() => setIsDetailOpen(false)}
        overlayLock={isSubmitting}
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title={isStatusFive ? "مختومه" : "سهل البیع نیست"}
              variant="danger"
              onClick={() => handleAction(false)}
              isLoading={isSubmitting}
            />
            {!isStatusFive && (
              <FormButton
                title="تأیید درخواست"
                variant="success"
                onClick={() => handleAction(true)}
                isLoading={isSubmitting}
              />
            )}
          </div>
        }
        renderContent={() => {
          if (!selectedRequest)
            return (
              <div className="p-10 text-center text-gray-400">
                در حال بارگذاری...
              </div>
            );
          return (
            <RequestDetailsPanel
              request={selectedRequest}
              documents={[]}
              getUserData={getUserCacheData}
            >
              {/* ارجاع به کارشناس دادگستری */}
              {!isStatusFive && (
                <RequestDetailSection
                  icon={<ClipboardList className="w-5 h-5" />}
                  title="ارجاع به کارشناس دادگستری"
                  tone="blue"
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <label
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border p-4 transition-all ${
                          referralMode === "automatic"
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : "border-slate-200 hover:border-blue-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="referral-mode"
                          checked={referralMode === "automatic"}
                          onChange={() => {
                            setReferralMode("automatic");
                            setSelectedExperts([]);
                          }}
                          className="text-blue-600"
                        />
                        <span className="font-medium">ارجاع خودکار</span>
                      </label>

                      <label
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border p-4 transition-all ${
                          referralMode === "manual"
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : "border-slate-200 hover:border-blue-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="referral-mode"
                          checked={referralMode === "manual"}
                          onChange={() => setReferralMode("manual")}
                          className="text-blue-600"
                        />
                        <span className="font-medium">ارجاع دستی</span>
                      </label>
                    </div>

                    {referralMode === "manual" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-700">
                            کارشناسان انتخاب‌شده ({selectedExperts.length}/2)
                          </p>
                          <FormButton
                            title="انتخاب کارشناس"
                            variant="secondary"
                            size="sm"
                            onClick={handleOpenExpertModal}
                          />
                        </div>

                        {selectedExperts.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
                            هنوز کارشناسی انتخاب نشده است
                          </div>
                        ) : (
                          selectedExperts.map((expert) => {
                            const zones = resolveExpertiseZoneTitles(expert);

                            return (
                              <div
                                key={expert.id}
                                className="flex items-start justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-800">
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
                                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                                    <span>کد ملی: {getExpertCode(expert)}</span>
                                    <span className="text-slate-300">|</span>
                                    <span>رتبه: {safeText(expert.rank)}</span>
                                    <span className="text-slate-300">|</span>
                                    <span>
                                      پروانه: {safeText(expert.licenseNumber)}
                                    </span>
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
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleViewExpertDetail(expert)
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
                                    title="مشاهده جزئیات کامل"
                                  >
                                    <Eye className="h-3 w-3" />
                                    جزئیات
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveExpert(expert.id)
                                    }
                                    className="rounded-lg p-1 text-red-500 hover:bg-red-50 hover:text-red-700"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </RequestDetailSection>
              )}

              {/* فرم‌های ارزیابی */}
              {appraisals.length > 0 && (
                <RequestDetailSection
                  icon={<ClipboardList className="w-5 h-5" />}
                  title="فرم‌های ارزیابی ملک"
                  count={`${appraisals.length} فرم`}
                  tone="blue"
                >
                  <div className="space-y-3">
                    {appraisals.map((appraisal, index) => (
                      <div
                        key={appraisal.id ?? index}
                        className="flex items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4"
                      >
                        <div>
                          <p className="text-sm font-medium text-blue-800">
                            فرم ارزیابی ملک {index + 1}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            ثبت شده توسط:{" "}
                            {getDepartmentName(appraisal.creatorDepartmentId)}
                          </p>
                        </div>
                        <FormButton
                          title="مشاهده فرم"
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedReadonlyAppraisal(appraisal);
                            setIsAppraisalReadOnlyOpen(true);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </RequestDetailSection>
              )}

              <RequestDetailSection
                icon={<MessageSquareText className="w-5 h-5" />}
                title="توضیحات تکمیلی"
                tone="amber"
              >
                <FormTextarea
                  id="cmt"
                  name="cmt"
                  label="توضیحات کارشناس"
                  value={comment}
                  onChange={setComment}
                  rows={3}
                />
              </RequestDetailSection>
            </RequestDetailsPanel>
          );
        }}
      />

      {/* مودال انتخاب کارشناس */}
      <Modal
        isOpen={isExpertModalOpen}
        isRTL
        header="انتخاب کارشناس دادگستری"
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
                  در حال دریافت فهرست کارشناسان دادگستری...
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
                  const disabled =
                    !checked && expertModalSelectedIds.length >= 2;
                  const zones = resolveExpertiseZoneTitles(expert);

                  return (
                    <div
                      key={expert.id}
                      className={`flex items-start gap-3 rounded-xl border p-4 transition ${
                        checked
                          ? "border-blue-400 bg-blue-50 shadow-sm"
                          : "border-gray-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                      } ${disabled ? "opacity-50" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => {
                          setExpertModalSelectedIds((prev) =>
                            checked
                              ? prev.filter((id) => id !== expert.id)
                              : [...prev, expert.id],
                          );
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

      {/* مودال جزئیات کامل کارشناس */}
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

          const expert: ExpertItem | JudicialExpert =
            fullExpertDetail ?? selectedExpertDetail!;
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
                      {isoToPersian(expert.licenseIssueDate || "") || "-"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">تاریخ انقضا</p>
                    <p className="mt-1 font-medium text-slate-800">
                      {isoToPersian(expert.licenseExpireDate || "") || "-"}
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
                      {safeText(expert.email) || "-"}
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
                {expert.regions && expert.regions.length > 0 ? (
                  <div className="space-y-3">
                    {expert.regions.map((region, index) => {
                      const regionTitle = getRegionTitle(region);
                      const branches = getBranchTitles(region);
                      const branchCodes = getBranchCodes(region);
                      const isExpanded = expandedRegions.has(index);

                      // نمایش حداکثر 3 شعبه اول
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
                                  {isExpanded ? (
                                    <>
                                      <span>بستن</span>
                                      <svg
                                        className="h-3 w-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M5 15l7-7 7 7"
                                        />
                                      </svg>
                                    </>
                                  ) : (
                                    <>
                                      <span>نمایش همه</span>
                                      <svg
                                        className="h-3 w-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 9l-7 7-7-7"
                                        />
                                      </svg>
                                    </>
                                  )}
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
                                    {branchCodes[
                                      isExpanded ? branchIndex : branchIndex
                                    ] && (
                                      <span
                                        className="text-slate-400"
                                        dir="ltr"
                                      >
                                        {
                                          branchCodes[
                                            isExpanded
                                              ? branchIndex
                                              : branchIndex
                                          ]
                                        }
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
                    })}
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

      <PropertyAppraisalReadOnlyModal
        isOpen={isAppraisalReadOnlyOpen}
        appraisal={selectedReadonlyAppraisal}
        lookups={lookups}
        onClose={() => {
          setIsAppraisalReadOnlyOpen(false);
          setSelectedReadonlyAppraisal(null);
        }}
      />
    </MainLayout.Main>
  );
}

export default function MainOfficeRequestAssetReviewPage() {
  return (
    <DepartmentMainOfficeRequestAssetReviewPage
      departmentType={REQUEST_DEPARTMENT_TYPES.mainOffice}
    />
  );
}
