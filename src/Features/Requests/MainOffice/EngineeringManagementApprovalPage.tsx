import { useMemo, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardList, MessageSquareText } from "lucide-react";

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
import { userAction } from "../../../services/RequestCrud/userAction";
import { createRequestComment } from "../../../services/RequestCommentCrud/create";
import { getUserById } from "../../../services/Users/getUserById";
import { getPropertyAppraisalLookups } from "../../../services/PropertyAppraisalCrud/getLookups";
import { getPropertyAppraisalByRequestId } from "../../../services/PropertyAppraisalCrud/getByRequestId";

import type { RequestItem } from "../../../services/RequestCrud/types";
import type {
  PropertyAppraisalOutputDto,
  PropertyAppraisalLookupsDto,
} from "../../../services/PropertyAppraisalCrud/types";
import { isoToPersianDateTime } from "../../../utils/persianToISO";
import { persianToISO } from "../../../utils/persianToISO";
import {
  REQUEST_DEPARTMENT_TYPES,
  type RequestDepartmentTypeConfig,
} from "../requestDepartmentTypes";

import { getAllRequestStatus } from "../../../services/RequestStatusCrud/getAll";
import {
  REQUEST_STATUS_CODES,
  resolveRequestStatusTitle,
} from "../requestStatuses";

// ─── Types ───────────────────────────────────────────────────────
type TableFilter = { key: string; value: string };
type SelectedRequest = RequestItem & {
  requesterFullName?: string | null;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

// ─── Read-Only Property Appraisal Modal ─────────────────────────
import PropertyAppraisalReadOnlyModal from "../../../baseComponents/PropertyAppraisalReadOnlyModal";

// ─── Main Component ──────────────────────────────────────────────
interface EngineeringManagementApprovalPageProps {
  departmentType: RequestDepartmentTypeConfig;
}

export function DepartmentEngineeringManagementApprovalPage({
  departmentType,
}: EngineeringManagementApprovalPageProps) {
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

  // فرم ارزیابی - فقط نمایش readonly
  const [isAppraisalReadOnlyOpen, setIsAppraisalReadOnlyOpen] = useState(false);

  // تمام فرم‌های ارزیابی موجود برای درخواست
  const [appraisals, setAppraisals] = useState<PropertyAppraisalOutputDto[]>(
    [],
  );

  // فرمی که کاربر برای مشاهده انتخاب کرده است
  const [selectedAppraisal, setSelectedAppraisal] =
    useState<PropertyAppraisalOutputDto | null>(null);

  const userCacheRef = useRef<Map<number, { name: string; role: string }>>(
    new Map(),
  );

  // Query برای دریافت status ها
  const statusQuery = useQuery({
    queryKey: ["request-statuses"],
    queryFn: () => getAllRequestStatus({ maxResultCount: 100 }),
    staleTime: 10 * 60 * 1000,
  });

  const statuses = statusQuery.data?.items;

  // Query برای lookup ها (برای نمایش فرم readonly)
  const lookupsQuery = useQuery({
    queryKey: ["property-appraisal-lookups"],
    queryFn: getPropertyAppraisalLookups,
    staleTime: 10 * 60 * 1000,
  });

  const lookups = useMemo(
    () => (lookupsQuery.data ?? {}) as PropertyAppraisalLookupsDto,
    [lookupsQuery.data],
  );

  // ─── Queries ───────────────────────────────────────────────────
  const requestsQuery = useQuery({
    queryKey: [
      "requests-engineering-management-approval",
      departmentType.id,
      pagination.pageIndex,
      pagination.pageSize,
      filters,
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
          r.requestStatusCode ===
          REQUEST_STATUS_CODES.engineeringManagementApproval,
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

  // ─── Helpers ───────────────────────────────────────────────────
  const getUserCacheData = useCallback((userId: number) => {
    return (
      userCacheRef.current.get(userId) || { name: `کاربر ${userId}`, role: "-" }
    );
  }, []);

  const handleView = useCallback(
    async (req: RequestItem) => {
      setSelectedRequest(null);
      setComment("");

      // پاک‌سازی اطلاعات درخواست قبلی
      setAppraisals([]);
      setSelectedAppraisal(null);
      setIsAppraisalReadOnlyOpen(false);
      setIsDetailOpen(true);

      try {
        await viewRequest(req.id);

        const detail = await getRequest(req.id);
        setSelectedRequest(detail);

        try {
          /*
           * خروجی سرویس اکنون آرایه است:
           * [
           *   { id: 8, creatorDepartmentId: 3, ... },
           *   { id: 9, creatorDepartmentId: 4, ... }
           * ]
           *
           * در این صفحه تمام فرم‌ها صرفاً قابل مشاهده هستند.
           */
          const existingAppraisals = await getPropertyAppraisalByRequestId(
            req.id,
          );

          setAppraisals(existingAppraisals ?? []);
        } catch (error) {
          console.error("Error loading property appraisals:", error);
          setAppraisals([]);
        }

        const ids = new Set<number>();

        detail.requestHistoryOutputDtos?.forEach((history) => {
          if (history.reviewerUserId) {
            ids.add(history.reviewerUserId);
          }
        });

        detail.requestCommentOutputDtos?.forEach((requestComment) => {
          if (requestComment.userId) {
            ids.add(requestComment.userId);
          }
        });

        for (const id of ids) {
          if (!userCacheRef.current.has(id)) {
            const u = await getUserById(id);

            userCacheRef.current.set(id, {
              name:
                u?.fullName ||
                `${u?.name ?? ""} ${u?.surname ?? ""}`.trim() ||
                `کاربر ${id}`,
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
      setIsSubmitting(true);
      try {
        if (comment.trim()) {
          await createRequestComment({
            requestId: selectedRequest.id,
            userId: Number(user?.id || 0),
            description: comment.trim(),
          });
        }
        await userAction({ requestId: selectedRequest.id, accepted });
        showToast(accepted ? "درخواست تأیید شد" : "درخواست رد شد", "success");
        setIsDetailOpen(false);
        requestsQuery.refetch();
      } catch (error: unknown) {
        console.error("Error in action:", error);
        showToast(getErrorMessage(error, "خطا در انجام عملیات"), "error");
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedRequest, comment, user, requestsQuery, showToast],
  );

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
        cell: ({ row }) => row.original.actorUserRoleName || "-",
      },
      {
        id: "date",
        header: "تاریخ و زمان",
        cell: ({ row }) =>
          row.original.creationTime
            ? isoToPersianDateTime(row.original.creationTime)
            : "-",
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
      <PageTitle title={`بررسی و امضا توسط ${departmentType.name}`} />
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

      <Modal
        isOpen={isDetailOpen}
        isRTL
        header="بررسی و امضا توسط مدیریت مهندسی و پشتیبانی"
        onClose={() => setIsDetailOpen(false)}
        overlayLock={isSubmitting}
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title="رد درخواست"
              variant="danger"
              onClick={() => handleAction(false)}
              isLoading={isSubmitting}
            />
            <FormButton
              title="تأیید و امضا"
              variant="success"
              onClick={() => handleAction(true)}
              isLoading={isSubmitting}
            />
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
              {appraisals.length > 0 && (
                <RequestDetailSection
                  icon={<ClipboardList className="w-5 h-5" />}
                  title="فرم‌های ارزیابی ملک"
                  tone="blue"
                >
                  <div className="space-y-3">
                    {appraisals.map((appraisal, index) => {
                      const isMainOfficeForm =
                        Number(appraisal.creatorDepartmentId) ===
                        Number(REQUEST_DEPARTMENT_TYPES.mainOffice.id);

                      return (
                        <div
                          key={
                            appraisal.id ??
                            `${appraisal.creatorDepartmentId}-${index}`
                          }
                          className={[
                            "flex items-center justify-between gap-4 rounded-xl border p-4",
                            isMainOfficeForm
                              ? "border-blue-100 bg-blue-50"
                              : "border-amber-200 bg-amber-50",
                          ].join(" ")}
                        >
                          <div className="min-w-0">
                            <div
                              className={[
                                "text-sm font-medium",
                                isMainOfficeForm
                                  ? "text-blue-800"
                                  : "text-amber-800",
                              ].join(" ")}
                            >
                              {isMainOfficeForm
                                ? "فرم ارزیابی ثبت‌شده توسط ستاد"
                                : "فرم ارزیابی ثبت‌شده توسط واحد دیگر"}
                            </div>

                            <div
                              className={[
                                "mt-1 text-xs",
                                isMainOfficeForm
                                  ? "text-blue-600"
                                  : "text-amber-700",
                              ].join(" ")}
                            >
                              شناسه فرم: {appraisal.id ?? "-"} | شناسه واحد
                              ثبت‌کننده: {appraisal.creatorDepartmentId ?? "-"}
                            </div>
                          </div>

                          <FormButton
                            title="مشاهده فرم ارزیابی"
                            variant={isMainOfficeForm ? "primary" : "secondary"}
                            size="sm"
                            onClick={() => {
                              setSelectedAppraisal(appraisal);
                              setIsAppraisalReadOnlyOpen(true);
                            }}
                          />
                        </div>
                      );
                    })}
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

      {/* مودال نمایش فرم ارزیابی - فقط خواندنی */}
      <PropertyAppraisalReadOnlyModal
        isOpen={isAppraisalReadOnlyOpen}
        appraisal={selectedAppraisal}
        lookups={lookups}
        onClose={() => setIsAppraisalReadOnlyOpen(false)}
      />
    </MainLayout.Main>
  );
}

export default function EngineeringManagementApprovalPage() {
  return (
    <DepartmentEngineeringManagementApprovalPage
      departmentType={REQUEST_DEPARTMENT_TYPES.mainOffice}
    />
  );
}
