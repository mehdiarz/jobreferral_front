import { useMemo, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardList, MessageSquareText, CheckCircle2 } from "lucide-react";

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
import { getAllDocuments } from "../../../services/DocumentCrud/getAll";
import { getDocumentAllFiles } from "../../../services/FileService/GetDocumentAllFiles";
import { downloadFile } from "../../../services/FileService/download";
import type { DocumentItem } from "../../../services/DocumentCrud/types";
import type { DocumentFile } from "../../../services/FileService/GetDocumentAllFiles";
import {
  getUserActionSuccessMessage,
  userAction,
} from "../../../services/RequestCrud/userAction";
import { createRequestComment } from "../../../services/RequestCommentCrud/create";
import { getUserById } from "../../../services/Users/getUserById";

import type { RequestItem } from "../../../services/RequestCrud/types";
import { isoToPersianDateTime } from "../../../utils/persianToISO";
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
import { getAllRequestSignatures } from "../../../services/RequestSignatureCrud/getAll";
import type { RequestSignatureOutputDto } from "../../../services/RequestSignatureCrud/types";

// ─── Types ───────────────────────────────────────────────────────
type TableFilter = { key: string; value: string };
type SelectedRequest = RequestItem & {
  requesterFullName?: string | null;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

// ─── Main Component ──────────────────────────────────────────────
interface RequestAssetReviewPageProps {
  departmentType: RequestDepartmentTypeConfig;
}

export function DepartmentRequestAssetReviewPage({
  departmentType,
}: RequestAssetReviewPageProps) {
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

  const [appraisals, setAppraisals] = useState<PropertyAppraisalOutputDto[]>(
    [],
  );
  const [isAppraisalReadOnlyOpen, setIsAppraisalReadOnlyOpen] = useState(false);
  const [selectedReadonlyAppraisal, setSelectedReadonlyAppraisal] =
    useState<PropertyAppraisalOutputDto | null>(null);
  const [requestSignatures, setRequestSignatures] = useState<
    RequestSignatureOutputDto[]
  >([]);

  // type جدید برای مدارک
  interface DetailDocWithFiles {
    doc: DocumentItem;
    files: DocumentFile[];
  }

  // state های جدید در کامپوننت
  const [detailDocs, setDetailDocs] = useState<DetailDocWithFiles[]>([]);
  const [isEasyToSellConfirmed, setIsEasyToSellConfirmed] = useState(false);

  const userCacheRef = useRef<Map<number, { name: string; role: string }>>(
    new Map(),
  );

  // Query برای دریافت status ها از سرویس
  const statusQuery = useQuery({
    queryKey: ["request-statuses"],
    queryFn: () => getAllRequestStatus({ maxResultCount: 100 }),
    staleTime: 10 * 60 * 1000,
  });

  const statuses = statusQuery.data?.items;

  // استخراج status code های مورد نیاز به صورت dynamic
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

  // ─── Queries ───────────────────────────────────────────────────
  const requestsQuery = useQuery({
    queryKey: [
      "requests-asset-review",
      departmentType.id,
      pagination.pageIndex,
      pagination.pageSize,
      filters,
      assetReviewStatusCodes.propertyReview,
      assetReviewStatusCodes.propertyRejected,
    ],
    queryFn: async () => {
      const isBranchOrIndependent =
        departmentType.id === REQUEST_DEPARTMENT_TYPES.branch.id ||
        departmentType.id === REQUEST_DEPARTMENT_TYPES.independentBranch.id;
      const isRegion = departmentType.id === REQUEST_DEPARTMENT_TYPES.region.id;
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
        ...(isBranchOrIndependent
          ? { hasBidFilter: true }
          : isRegion
            ? { hasSidFilter: true }
            : {}),
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
      const filteredItems = items;
      return {
        listResult: filteredItems,
        total: data.totalCount ?? filteredItems.length,
        totalPages: Math.max(
          1,
          Math.ceil(filteredItems.length / pagination.pageSize),
        ),
      };
    },
    enabled: statusQuery.isSuccess,
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

  const handleView = useCallback(
    async (req: RequestItem) => {
      setSelectedRequest(null);
      setComment("");
      setDetailDocs([]);
      setAppraisals([]);
      setSelectedReadonlyAppraisal(null);
      setIsAppraisalReadOnlyOpen(false);
      setRequestSignatures([]);
      setIsEasyToSellConfirmed(false);
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

        try {
          const allDocs = await getAllDocuments({
            requestId: req.id,
            maxResultCount: 5000,
          });

          const reqDocs = allDocs.items ?? [];
          const docsWithFiles = await Promise.all(
            reqDocs.map(async (doc: DocumentItem) => ({
              doc,
              files: await getDocumentAllFiles(doc.id),
            })),
          );

          setDetailDocs(docsWithFiles);
        } catch (error) {
          console.error("Error loading documents:", error);
          setDetailDocs([]);
        }

        try {
          const signaturesResult = await getAllRequestSignatures({
            requestId: req.id,
            sorting: "creationTime asc",
            skipCount: 0,
            maxResultCount: 1000,
          });

          setRequestSignatures(signaturesResult.items);
        } catch (error) {
          console.error("Error loading request signatures:", error);
          setRequestSignatures([]);
        }

        const ids = new Set<number>();

        detail.requestHistoryOutputDtos?.forEach(
          (history) =>
            history.reviewerUserId && ids.add(history.reviewerUserId),
        );

        detail.requestCommentOutputDtos?.forEach(
          (requestComment) =>
            requestComment.userId && ids.add(requestComment.userId),
        );

        for (const id of ids) {
          if (!userCacheRef.current.has(id)) {
            const userData = await getUserById(id);

            userCacheRef.current.set(id, {
              name:
                userData?.fullName ||
                `${userData?.name ?? ""} ${userData?.surname ?? ""}`.trim() ||
                `کاربر ${id}`,
              role: userData?.roleNames?.[0] || "-",
            });
          }
        }
      } catch (error) {
        console.error("Error in handleView:", error);
        showToast("خطا در بارگذاری اطلاعات", "error");
      }
    },
    [departmentType.id, showToast],
  );

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
        const actionResult = await userAction({
          requestId: selectedRequest.id,
          accepted,
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
                disabled={!isEasyToSellConfirmed}
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
              documents={detailDocs}
              getUserData={getUserCacheData}
              onDownloadFile={(file) =>
                downloadFile(file.filePath, file.documentId)
              }
            >
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

              {/* سکشن وضعیت سهل‌البیع بودن ملک */}
              {!isStatusFive && (
                <RequestDetailSection
                  icon={<CheckCircle2 className="w-5 h-5" />}
                  title="بررسی وضعیت سهل‌البیع بودن ملک"
                  tone="blue"
                >
                  <label className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl cursor-pointer transition-colors select-none">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                      checked={isEasyToSellConfirmed}
                      onChange={(e) =>
                        setIsEasyToSellConfirmed(e.target.checked)
                      }
                    />
                    <div>
                      <span className="font-semibold text-slate-800 text-sm">
                        ملک سهل‌البیع می‌باشد
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        با علامت زدن این گزینه، سهل‌البیع بودن ملک تأیید شده و
                        دکمه «تأیید درخواست» فعال می‌شود.
                      </p>
                    </div>
                  </label>
                </RequestDetailSection>
              )}

              <RequestDetailSection
                icon={<ClipboardList className="w-5 h-5" />}
                title="امضاهای ثبت‌شده"
                tone="blue"
              >
                {requestSignatures.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-full text-right text-sm">
                      <thead className="bg-slate-50 text-slate-700">
                        <tr>
                          <th className="whitespace-nowrap px-4 py-3 font-semibold">
                            ردیف
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 font-semibold">
                            نام و نام خانوادگی
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 font-semibold">
                            کد پرسنلی
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 font-semibold">
                            نقش سازمانی
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 font-semibold">
                            تاریخ و زمان امضا
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {requestSignatures.map((signature, index) => (
                          <tr
                            key={
                              signature.id ?? `${signature.personCode}-${index}`
                            }
                            className="text-slate-700"
                          >
                            <td className="px-4 py-3">{index + 1}</td>

                            <td className="px-4 py-3">
                              {signature.fullName || "-"}
                            </td>

                            <td className="px-4 py-3">
                              {signature.personCode || "-"}
                            </td>

                            <td className="px-4 py-3">
                              {signature.roleName || "-"}
                            </td>

                            <td className="px-4 py-3">
                              {signature.creationTime ? (
                                <span
                                  dir="ltr"
                                  className="inline-block whitespace-nowrap"
                                >
                                  {isoToPersianDateTime(signature.creationTime)}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    هنوز امضایی برای این درخواست ثبت نشده است.
                  </div>
                )}
              </RequestDetailSection>

              <RequestDetailSection
                icon={<MessageSquareText className="w-5 h-5" />}
                title="توضیحات تکمیلی"
                tone="amber"
              >
                <FormTextarea
                  id="cmt"
                  name="cmt"
                  label={
                    departmentType.id === REQUEST_DEPARTMENT_TYPES.branch.id
                      ? "یادداشت / نظر کارشناس شعبه"
                      : departmentType.id ===
                          REQUEST_DEPARTMENT_TYPES.independentBranch.id
                        ? "یادداشت / نظر کارشناس شعبه مستقل"
                        : departmentType.id ===
                            REQUEST_DEPARTMENT_TYPES.region.id
                          ? "یادداشت / نظر کارشناس منطقه"
                          : departmentType.id ===
                              REQUEST_DEPARTMENT_TYPES.mainOffice.id
                            ? "یادداشت / نظر کارشناس ستاد"
                            : "یادداشت / نظر کارشناس"
                  }
                  value={comment}
                  onChange={setComment}
                  rows={3}
                />
              </RequestDetailSection>
            </RequestDetailsPanel>
          );
        }}
      />

      <PropertyAppraisalReadOnlyModal
        isOpen={isAppraisalReadOnlyOpen}
        appraisal={selectedReadonlyAppraisal}
        lookups={lookups}
        signatures={requestSignatures}
        onClose={() => {
          setIsAppraisalReadOnlyOpen(false);
          setSelectedReadonlyAppraisal(null);
        }}
      />
    </MainLayout.Main>
  );
}

export default function RequestAssetReviewPage() {
  return (
    <DepartmentRequestAssetReviewPage
      departmentType={REQUEST_DEPARTMENT_TYPES.branch}
    />
  );
}
