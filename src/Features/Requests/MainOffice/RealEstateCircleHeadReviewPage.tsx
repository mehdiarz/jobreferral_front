import { useMemo, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardList, MessageSquareText, Send, Check } from "lucide-react";

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
import { getPropertyAppraisalLookups } from "../../../services/PropertyAppraisalCrud/getLookups";
import { getPropertyAppraisalByRequestId } from "../../../services/PropertyAppraisalCrud/getByRequestId";
import { getAllRequestSignatures } from "../../../services/RequestSignatureCrud/getAll";
import type { RequestSignatureOutputDto } from "../../../services/RequestSignatureCrud/types";
import { getAllDocuments } from "../../../services/DocumentCrud/getAll";
import { getDocumentAllFiles } from "../../../services/FileService/GetDocumentAllFiles";
import { downloadFile } from "../../../services/FileService/download";
import type { DocumentItem } from "../../../services/DocumentCrud/types";
import type { DocumentFile } from "../../../services/FileService/GetDocumentAllFiles";

import PropertyAppraisalReadOnlyModal from "../../../baseComponents/PropertyAppraisalReadOnlyModal";

import type { RequestItem } from "../../../services/RequestCrud/types";
import type {
  PropertyAppraisalLookupsDto,
  PropertyAppraisalOutputDto,
} from "../../../services/PropertyAppraisalCrud/types";
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
  REQUEST_STATUS_CODES,
  resolveRequestStatusTitle,
} from "../requestStatuses";
import { createBlobAppraisalDocx } from "../../../utils/wordGenerator.ts";
import { convertDocxToPdf } from "../../../services/AppraisalReport/convertDocxToPdf.ts";

// ─── Types ───────────────────────────────────────────────────────
type TableFilter = { key: string; value: string };
type SelectedRequest = RequestItem & {
  requesterFullName?: string | null;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

// ─── Main Component ──────────────────────────────────────────────
interface RealEstateCircleHeadReviewPageProps {
  departmentType: RequestDepartmentTypeConfig;
}

export function DepartmentRealEstateCircleHeadReviewPage({
  departmentType,
}: RealEstateCircleHeadReviewPageProps) {
  const { showToast } = useToast();
  const { user } = useAuthStore();

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [filters, setFilters] = useState<TableFilter[]>([]);
  const [selectedRequest, setSelectedRequest] =
    useState<SelectedRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // فقط فرم ارزیابی متعلق به ستاد؛ قابل ایجاد/ویرایش
  const [mainOfficeAppraisal, setMainOfficeAppraisal] =
    useState<PropertyAppraisalOutputDto | null>(null);

  // فرم ایجادشده توسط شعبه، شعبه مستقل یا منطقه؛ فقط قابل مشاهده
  const [externalAppraisals, setExternalAppraisals] = useState<
    PropertyAppraisalOutputDto[]
  >([]);

  const [isAppraisalReadOnlyOpen, setIsAppraisalReadOnlyOpen] = useState(false);

  const [selectedReadonlyAppraisal, setSelectedReadonlyAppraisal] =
    useState<PropertyAppraisalOutputDto | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
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
      "requests-real-estate-circle-head-review",
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
            REQUEST_STATUS_CODES.realEstateCircleHeadReview ||
          r.requestStatusCode ===
            REQUEST_STATUS_CODES.realEstateCircleHeadReturned,
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
      setSelectedReadonlyAppraisal(null);
      setDetailDocs([]);
      setMainOfficeAppraisal(null);

      setIsAppraisalReadOnlyOpen(false);
      setIsDetailOpen(true);
      setRequestSignatures([]);

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
          const appraisals = await getPropertyAppraisalByRequestId(req.id);

          console.log("appraisals after service:", appraisals);

          const mainOfficeDepartmentId = REQUEST_DEPARTMENT_TYPES.mainOffice.id;

          console.log("mainOfficeDepartmentId:", mainOfficeDepartmentId);

          const mainOfficeForm =
            appraisals.find(
              (appraisal) =>
                Number(appraisal.creatorDepartmentId) ===
                Number(mainOfficeDepartmentId),
            ) ?? null;

          const externalForms = appraisals.filter(
            (appraisal) =>
              Number(appraisal.creatorDepartmentId) !==
              Number(mainOfficeDepartmentId),
          );

          setMainOfficeAppraisal(mainOfficeForm);
          setExternalAppraisals(externalForms);
        } catch (error) {
          console.error("Error loading property appraisals:", error);

          setMainOfficeAppraisal(null);
          setExternalAppraisals([]);
          setSelectedReadonlyAppraisal(null);
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
          8000,
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

  const handleGeneratePdf = useCallback(async () => {
    if (!selectedReadonlyAppraisal) return;
    setIsGeneratingPdf(true);

    try {
      // ۱. تولید فایل Word در حافظه (بدون اینکه دانلود شود یا کاربر متوجه شود)
      const docxBlob = await createBlobAppraisalDocx(
        selectedReadonlyAppraisal,
        lookupsQuery.data ?? {},
        {
          requestCode: selectedRequest?.requestCode,
          date: selectedRequest?.creationTime
            ? isoToPersian(selectedRequest.creationTime)
            : "",
          signatures: requestSignatures,
        },
      );

      // ۲. ایجاد شیء File از Blob برای ارسال به سرویس تبدیل
      const docxFile = new File(
        [docxBlob],
        `AppraisalReport_${selectedReadonlyAppraisal.applicantName || "Report"}.docx`,
        {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
      );

      // ۳. ارسال فایل Word به بک‌اند و دریافت مستقیم PDF Blob
      const pdfBlob = await convertDocxToPdf({ file: docxFile });

      // ۴. باز کردن مستقیم PDF در تب جدید یا دانلود آن
      const pdfUrl = window.URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, "_blank");

      // دانلود مستقیم (در صورت نیاز به دانلود خودکار به جای تب جدید، می‌توانید کد زیر را فعال کنید):
      /*
      const anchor = document.createElement("a");
      anchor.href = pdfUrl;
      anchor.download = `AppraisalReport_${selectedReadonlyAppraisal.applicantName || "Report"}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      */

      showToast("گزارش PDF با موفقیت ایجاد شد", "success");
    } catch (error: unknown) {
      console.error("Error generating appraisal PDF:", error);
      showToast(getErrorMessage(error, "خطا در ایجاد فایل PDF"), "error");
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [
    selectedReadonlyAppraisal,
    lookupsQuery.data,
    selectedRequest,
    requestSignatures,
    showToast,
  ]);

  const handleDirectAction = useCallback(
    async (req: RequestItem) => {
      setIsDirectSubmitting(true);
      try {
        const actionResult = await userAction({
          requestId: req.id,
          accepted: true,
        });

        const isReferral =
          req.requestStatusCode ===
          REQUEST_STATUS_CODES.realEstateCircleHeadReview;

        showToast(
          getUserActionSuccessMessage(
            actionResult,
            isReferral
              ? "درخواست با موفقیت ارجاع شد"
              : "درخواست با موفقیت تأیید شد",
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
        cell: ({ row }) => {
          const isReferral =
            row.original.requestStatusCode ===
            REQUEST_STATUS_CODES.realEstateCircleHeadReview;
          const actionTitle = isReferral ? "ارجاع" : "تأیید";
          const ActionIcon = isReferral ? Send : Check;

          return (
            <div className="flex items-center gap-2">
              <ViewDetailsButton onClick={() => handleView(row.original)} />

              <button
                type="button"
                onClick={() => setDirectActionRequest(row.original)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/20 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 hover:text-emerald-800 cursor-pointer"
                title={actionTitle}
              >
                <ActionIcon className="h-3.5 w-3.5" />
                <span>{actionTitle}</span>
              </button>
            </div>
          );
        },
      },
    ],
    [handleView, statuses],
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

  return (
    <MainLayout.Main maxWidth="screen-xl">
      <PageTitle title="بررسی و امضا توسط رئیس دایره املاک" />
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
        header="بررسی و امضا توسط رئیس دایره املاک"
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
              title={
                selectedRequest?.requestStatusCode ===
                REQUEST_STATUS_CODES.realEstateCircleHeadReview
                  ? "ارجاع"
                  : "تأیید"
              }
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
                  {/* فرم ارزیابی ستاد */}
                  {mainOfficeAppraisal && (
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <div className="text-sm text-blue-800">
                        فرم ارزیابی توسط واحد{" "}
                        <span className="font-semibold">
                          {REQUEST_DEPARTMENT_TYPES.mainOffice.name}
                        </span>{" "}
                        ثبت شده است و فقط قابل مشاهده است.
                      </div>

                      <FormButton
                        title={`مشاهده فرم ارزیابی ${REQUEST_DEPARTMENT_TYPES.mainOffice.name}`}
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedReadonlyAppraisal(mainOfficeAppraisal);
                          setIsAppraisalReadOnlyOpen(true);
                        }}
                      />
                    </div>
                  )}

                  {/* فرم‌های سایر واحدها */}
                  {externalAppraisals.map((appraisal, index) => {
                    const departmentName = getDepartmentName(
                      appraisal.creatorDepartmentId,
                    );

                    return (
                      <div
                        key={appraisal.id ?? index}
                        className="flex items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4"
                      >
                        <div className="text-sm text-blue-800">
                          فرم ارزیابی توسط واحد{" "}
                          <span className="font-semibold">
                            {departmentName}
                          </span>{" "}
                          ثبت شده است و فقط قابل مشاهده است.
                        </div>

                        <FormButton
                          title={`مشاهده فرم ارزیابی ${departmentName}`}
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedReadonlyAppraisal(appraisal);
                            setIsAppraisalReadOnlyOpen(true);
                          }}
                        />
                      </div>
                    );
                  })}

                  {/* هیچ فرمی ثبت نشده است */}
                  {!mainOfficeAppraisal && externalAppraisals.length === 0 && (
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
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse text-right text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                          <th className="px-4 py-3 font-semibold">ردیف</th>
                          <th className="px-4 py-3 font-semibold">
                            نام و نام خانوادگی
                          </th>
                          <th className="px-4 py-3 font-semibold">کد پرسنلی</th>
                          <th className="px-4 py-3 font-semibold">
                            نقش سازمانی
                          </th>
                          <th className="px-4 py-3 font-semibold">
                            تاریخ و زمان امضا
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {requestSignatures.map((signature, index) => (
                          <tr
                            key={signature.id}
                            className="border-b border-slate-100 last:border-b-0"
                          >
                            <td className="px-4 py-3 text-slate-600">
                              {index + 1}
                            </td>

                            <td className="px-4 py-3 font-medium text-slate-800">
                              {signature.fullName || "-"}
                            </td>

                            <td className="px-4 py-3 text-slate-700">
                              {signature.personCode || "-"}
                            </td>

                            <td className="px-4 py-3 text-slate-700">
                              {signature.roleName || "-"}
                            </td>

                            <td className="px-4 py-3 text-slate-700">
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
                  label="یادداشت / نظر رئیس دایره املاک ستاد"
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
        isGeneratingPdf={isGeneratingPdf}
        onGeneratePdf={handleGeneratePdf}
        onClose={() => {
          setIsAppraisalReadOnlyOpen(false);
          setSelectedReadonlyAppraisal(null);
        }}
      />

      {/* مودال تایید مستقیم قبل از انجام عملیات */}
      <Modal
        isOpen={!!directActionRequest}
        isRTL
        header={
          directActionRequest?.requestStatusCode ===
          REQUEST_STATUS_CODES.realEstateCircleHeadReview
            ? "تأیید ارجاع درخواست"
            : "تأیید درخواست"
        }
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
              title={
                directActionRequest?.requestStatusCode ===
                REQUEST_STATUS_CODES.realEstateCircleHeadReview
                  ? "بله، ارجاع شود"
                  : "بله، تأیید شود"
              }
              variant="success"
              onClick={() =>
                directActionRequest && handleDirectAction(directActionRequest)
              }
              isLoading={isDirectSubmitting}
            />
          </div>
        }
        renderContent={() => {
          const isReferral =
            directActionRequest?.requestStatusCode ===
            REQUEST_STATUS_CODES.realEstateCircleHeadReview;
          return (
            <div className="p-4 text-sm text-slate-700">
              آیا از {isReferral ? "ارجاع" : "تأیید"} درخواست شماره{" "}
              <span className="font-semibold text-slate-900">
                {directActionRequest?.requestCode || directActionRequest?.id}
              </span>{" "}
              اطمینان دارید؟
            </div>
          );
        }}
      />
    </MainLayout.Main>
  );
}

export default function RealEstateCircleHeadReviewPage() {
  return (
    <DepartmentRealEstateCircleHeadReviewPage
      departmentType={REQUEST_DEPARTMENT_TYPES.mainOffice}
    />
  );
}
