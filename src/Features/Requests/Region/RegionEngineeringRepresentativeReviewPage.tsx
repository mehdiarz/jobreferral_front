import { useMemo, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardList, MessageSquareText, Check } from "lucide-react";

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
import PropertyAppraisalReadOnlyModal from "../../../baseComponents/PropertyAppraisalReadOnlyModal";
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
import { getPropertyAppraisalLookups } from "../../../services/PropertyAppraisalCrud/getLookups";
import { getPropertyAppraisalByRequestId } from "../../../services/PropertyAppraisalCrud/getByRequestId";
import { getAllRequestSignatures } from "../../../services/RequestSignatureCrud/getAll";
import type { RequestSignatureOutputDto } from "../../../services/RequestSignatureCrud/types";
import { getAllDocuments } from "../../../services/DocumentCrud/getAll";
import { getDocumentAllFiles } from "../../../services/FileService/GetDocumentAllFiles";
import { downloadFile } from "../../../services/FileService/download";
import type { DocumentItem } from "../../../services/DocumentCrud/types";
import type { DocumentFile } from "../../../services/FileService/GetDocumentAllFiles";

import type { RequestItem } from "../../../services/RequestCrud/types";
import type {
  PropertyAppraisalLookupsDto,
  PropertyAppraisalOutputDto,
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

// ─── Main Component ──────────────────────────────────────────────
interface RegionEngineeringRepresentativeReviewPageProps {
  departmentType: RequestDepartmentTypeConfig;
}

const getDepartmentName = (id: number | string | null | undefined): string => {
  switch (Number(id)) {
    case Number(REQUEST_DEPARTMENT_TYPES.branch.id):
      return REQUEST_DEPARTMENT_TYPES.branch.name;

    case Number(REQUEST_DEPARTMENT_TYPES.independentBranch.id):
      return REQUEST_DEPARTMENT_TYPES.independentBranch.name;

    case Number(REQUEST_DEPARTMENT_TYPES.region.id):
      return REQUEST_DEPARTMENT_TYPES.region.name;

    case Number(REQUEST_DEPARTMENT_TYPES.mainOffice.id):
      return REQUEST_DEPARTMENT_TYPES.mainOffice.name;

    default:
      return "واحد نامشخص";
  }
};

export function DepartmentRegionEngineeringRepresentativeReviewPage({
  departmentType,
}: RegionEngineeringRepresentativeReviewPageProps) {
  const { showToast } = useToast();
  const { user } = useAuthStore();

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [filters, setFilters] = useState<TableFilter[]>([]);
  const [selectedRequest, setSelectedRequest] =
    useState<SelectedRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isAppraisalReadOnlyOpen, setIsAppraisalReadOnlyOpen] = useState(false);

  const [selectedReadonlyAppraisal, setSelectedReadonlyAppraisal] =
    useState<PropertyAppraisalOutputDto | null>(null);

  // تمام فرم‌های ارزیابی ثبت‌شده برای درخواست؛ فقط قابل مشاهده
  const [appraisals, setAppraisals] = useState<PropertyAppraisalOutputDto[]>(
    [],
  );
  const [requestSignatures, setRequestSignatures] = useState<
    RequestSignatureOutputDto[]
  >([]);

  const [directActionRequest, setDirectActionRequest] =
    useState<RequestItem | null>(null);
  const [isDirectSubmitting, setIsDirectSubmitting] = useState(false);
  // type جدید برای مدارک
  interface DetailDocWithFiles {
    doc: DocumentItem;
    files: DocumentFile[];
  }

  // state های جدید در کامپوننت
  const [detailDocs, setDetailDocs] = useState<DetailDocWithFiles[]>([]);

  const userCacheRef = useRef<Map<number, { name: string; role: string }>>(
    new Map(),
  );

  const statusQuery = useQuery({
    queryKey: ["request-statuses"],
    queryFn: () => getAllRequestStatus({ maxResultCount: 100 }),
    staleTime: 10 * 60 * 1000,
  });

  const statuses = statusQuery.data?.items;

  const lookupsQuery = useQuery({
    queryKey: ["property-appraisal-lookups"],
    queryFn: getPropertyAppraisalLookups,
    staleTime: 10 * 60 * 1000,
  });

  const lookups = useMemo(
    () => (lookupsQuery.data ?? {}) as PropertyAppraisalLookupsDto,
    [lookupsQuery.data],
  );

  const requestsQuery = useQuery({
    queryKey: [
      "requests-region-engineering-representative-review",
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
        hasSidFilter: true,
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
          REQUEST_STATUS_CODES.engineeringDepartmentRepresentativeReview,
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

  const getUserCacheData = useCallback((userId: number) => {
    return (
      userCacheRef.current.get(userId) || { name: `کاربر ${userId}`, role: "-" }
    );
  }, []);

  const handleView = useCallback(
    async (req: RequestItem) => {
      setSelectedRequest(null);
      setComment("");
      setAppraisals([]);
      setSelectedReadonlyAppraisal(null);
      setRequestSignatures([]);
      setDetailDocs([]);
      setIsAppraisalReadOnlyOpen(false);
      setIsDetailOpen(true);

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

        try {
          // خروجی سرویس آرایه‌ای از تمام فرم‌های ارزیابی این درخواست است.
          const requestAppraisals = await getPropertyAppraisalByRequestId(
            req.id,
          );

          setAppraisals(requestAppraisals ?? []);
        } catch (error) {
          console.error("Error loading property appraisals:", error);

          setAppraisals([]);
          setSelectedReadonlyAppraisal(null);
        }

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

  const handleDirectAction = useCallback(
    async (req: RequestItem) => {
      setIsDirectSubmitting(true);
      try {
        const actionResult = await userAction({
          requestId: req.id,
          accepted: true,
        });

        showToast(
          getUserActionSuccessMessage(
            actionResult,
            "درخواست با موفقیت تأیید شد",
          ),
          "success",
          8000,
        );
        setDirectActionRequest(null);
        await requestsQuery.refetch();
      } catch (error: unknown) {
        console.error("Error in direct action:", error);
        showToast(getErrorMessage(error, "خطا در انجام عملیات"), "error");
      } finally {
        setIsDirectSubmitting(false);
      }
    },
    [requestsQuery, showToast],
  );

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
          <div className="flex items-center gap-2">
            <ViewDetailsButton onClick={() => handleView(row.original)} />

            <button
              type="button"
              onClick={() => setDirectActionRequest(row.original)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/20 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 hover:text-emerald-800 cursor-pointer"
              title="تأیید"
            >
              <Check className="h-3.5 w-3.5" />
              <span>تأیید</span>
            </button>
          </div>
        ),
      },
    ],
    [handleView, statuses],
  );

  return (
    <MainLayout.Main maxWidth="screen-xl">
      <PageTitle title="بررسی توسط نماینده دایره مهندسی" />
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
        header="بررسی توسط نماینده دایره مهندسی"
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
              title="تأیید"
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
              documents={detailDocs}
              getUserData={getUserCacheData}
              onDownloadFile={(file) =>
                downloadFile(file.filePath, file.documentId)
              }
            >
              <RequestDetailSection
                icon={<ClipboardList className="w-5 h-5" />}
                title="فرم‌های ارزیابی ملک"
                tone="blue"
              >
                <div className="space-y-3">
                  {appraisals.map((appraisal, index) => {
                    const departmentName = getDepartmentName(
                      appraisal.creatorDepartmentId,
                    );

                    const isMainOffice =
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
                          isMainOffice
                            ? "border-blue-200 bg-blue-50"
                            : "border-amber-200 bg-amber-50",
                        ].join(" ")}
                      >
                        <div className="min-w-0">
                          <div
                            className={[
                              "text-sm font-medium",
                              isMainOffice ? "text-blue-800" : "text-amber-800",
                            ].join(" ")}
                          >
                            فرم ارزیابی ثبت‌شده توسط واحد{" "}
                            <span className="font-bold">{departmentName}</span>
                          </div>

                          <div
                            className={[
                              "mt-1 text-xs",
                              isMainOffice ? "text-blue-700" : "text-amber-700",
                            ].join(" ")}
                          >
                            این فرم فقط قابل مشاهده است.
                          </div>
                        </div>

                        <FormButton
                          title={`مشاهده فرم ${departmentName}`}
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedReadonlyAppraisal(appraisal);
                            setIsAppraisalReadOnlyOpen(true);
                          }}
                        />
                      </div>
                    );
                  })}

                  {appraisals.length === 0 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      هنوز هیچ فرم ارزیابی ملکی توسط واحدها ثبت نشده است.
                    </div>
                  )}
                </div>
              </RequestDetailSection>
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

      {/* مودال تایید مستقیم از روی جدول */}
      <Modal
        isOpen={!!directActionRequest}
        isRTL
        header="تأیید درخواست"
        onClose={() => {
          if (!isDirectSubmitting) setDirectActionRequest(null);
        }}
        overlayLock={isDirectSubmitting}
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title="انصراف"
              variant="secondary"
              onClick={() => setDirectActionRequest(null)}
              disabled={isDirectSubmitting}
            />
            <FormButton
              title="بله، تأیید شود"
              variant="success"
              onClick={() =>
                directActionRequest && handleDirectAction(directActionRequest)
              }
              isLoading={isDirectSubmitting}
            />
          </div>
        }
        renderContent={() => (
          <div className="p-4 text-sm text-slate-700">
            آیا از تأیید درخواست شماره{" "}
            <span className="font-semibold text-slate-900">
              {directActionRequest?.requestCode || directActionRequest?.id}
            </span>{" "}
            اطمینان دارید؟
          </div>
        )}
      />
    </MainLayout.Main>
  );
}

export default function RegionEngineeringRepresentativeReviewPage() {
  return (
    <DepartmentRegionEngineeringRepresentativeReviewPage
      departmentType={REQUEST_DEPARTMENT_TYPES.region}
    />
  );
}
