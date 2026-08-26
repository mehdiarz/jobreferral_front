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
import {
  getUserActionSuccessMessage,
  userAction,
} from "../../../services/RequestCrud/userAction";
import { createRequestComment } from "../../../services/RequestCommentCrud/create";
import { getUserById } from "../../../services/Users/getUserById";
import { getPropertyAppraisalLookups } from "../../../services/PropertyAppraisalCrud/getLookups";
import { getPropertyAppraisalByRequestId } from "../../../services/PropertyAppraisalCrud/getByRequestId";
import { createPropertyAppraisal } from "../../../services/PropertyAppraisalCrud/create";
import { updatePropertyAppraisal } from "../../../services/PropertyAppraisalCrud/update";
import PropertyAppraisalReadOnlyModal from "../../../baseComponents/PropertyAppraisalReadOnlyModal";
import PropertyAppraisalFormModal from "../../../baseComponents/PropertyAppraisalFormModal";
import { generateAppraisalPdf } from "../../../utils/htmlPdfGenerator";
import { getAllRequestSignatures } from "../../../services/RequestSignatureCrud/getAll";
import type { RequestSignatureOutputDto } from "../../../services/RequestSignatureCrud/types";

import type { RequestItem } from "../../../services/RequestCrud/types";
import type {
  PropertyAppraisalInputDto,
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

// ─── Types ───────────────────────────────────────────────────────
type TableFilter = { key: string; value: string };
type SelectedRequest = RequestItem & {
  requesterFullName?: string | null;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

// ─── Main Component ──────────────────────────────────────────────
interface RealEstateExpertReviewPageProps {
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
      return "نامشخص";
  }
};

export function DepartmentRealEstateExpertReviewPage({
  departmentType,
}: RealEstateExpertReviewPageProps) {
  const { showToast } = useToast();
  const { user } = useAuthStore();

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [filters, setFilters] = useState<TableFilter[]>([]);
  const [selectedRequest, setSelectedRequest] =
    useState<SelectedRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetForm, setAssetForm] = useState<PropertyAppraisalInputDto>({});
  const [isSavingAppraisal, setIsSavingAppraisal] = useState(false);

  // فرم ثبت‌شده توسط ستاد؛ قابل ایجاد و ویرایش
  const [mainOfficeAppraisal, setMainOfficeAppraisal] =
    useState<PropertyAppraisalOutputDto | null>(null);

  // فرم‌های،‌شده توسط شعبه، شعبه مستقل، منطقه و سایر واحدها؛ فقط قابل مشاهده
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
      "requests-real-estate-expert-review",
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
          r.requestStatusCode === REQUEST_STATUS_CODES.realEstateExpertReview,
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
      setMainOfficeAppraisal(null);
      setExternalAppraisals([]);
      setSelectedReadonlyAppraisal(null);
      setAssetForm({});
      setIsAssetModalOpen(false);
      setIsAppraisalReadOnlyOpen(false);
      setIsDetailOpen(true);
      setRequestSignatures([]);

      try {
        await viewRequest(req.id);

        const detail = await getRequest(req.id);
        setSelectedRequest(detail);

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
          /*
           * سرویس اکنون آرایه برمی‌گرداند:
           * [
           *   { id: 8, creatorDepartmentId: 3, ... },
           *   { id: 9, creatorDepartmentId: 4, ... }
           * ]
           */
          const appraisals = await getPropertyAppraisalByRequestId(req.id);

          const mainOfficeDepartmentId = REQUEST_DEPARTMENT_TYPES.mainOffice.id;

          // فقط فرم متعلق به ستاد قابل ویرایش است.
          const mainOfficeForm =
            appraisals.find(
              (appraisal) =>
                Number(appraisal.creatorDepartmentId) ===
                Number(mainOfficeDepartmentId),
            ) ?? null;

          // تمام فرم‌های سایر واحدها صرفاً قابل مشاهده هستند.
          const externalForms = appraisals.filter(
            (appraisal) =>
              Number(appraisal.creatorDepartmentId) !==
              Number(mainOfficeDepartmentId),
          );

          setMainOfficeAppraisal(mainOfficeForm);
          setExternalAppraisals(externalForms);

          // فرم قابل ویرایش فقط از فرم ستاد پر شود.
          setAssetForm(mainOfficeForm ?? {});
        } catch (error) {
          console.error("Error loading property appraisals:", error);
          setMainOfficeAppraisal(null);
          setExternalAppraisals([]);
          setSelectedReadonlyAppraisal(null);
          setAssetForm({});
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

  const handleFormChange = useCallback(
    (
      field: keyof PropertyAppraisalInputDto,
      value: string | boolean | number,
    ) => {
      setAssetForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleOpenAssetModal = useCallback(() => {
    if (!hasAssignedJudicialExpert) {
      showToast(
        "ابتدا باید کارشناس دادگستری برای این درخواست تخصیص داده شود.",
        "error",
        3000,
      );
      return;
    }

    if (mainOfficeAppraisal) {
      // فرم ستاد قبلاً ثبت شده؛ قابل ویرایش است
      setAssetForm(mainOfficeAppraisal);
    } else {
      // حتی در صورت وجود فرم خارجی، ستاد مجاز به ثبت فرم خودش است
      setAssetForm({
        applicantName:
          selectedRequest?.requesterFullName ||
          selectedRequest?.customerOutputDto?.name ||
          "",
        loanAmount: Number(selectedRequest?.amount) || 0,
        loanType: selectedRequest?.requestTypeOutputDto?.title || "",
        branchName: user?.branchName || "",
        branchCode: user?.bid || "",
        requestId: selectedRequest?.id,
      });
    }

    setIsAssetModalOpen(true);
  }, [mainOfficeAppraisal, selectedRequest, user]);

  const handleSaveAppraisal = useCallback(async () => {
    if (!selectedRequest?.id) {
      showToast("شناسه درخواست نامعتبر است.", "error");
      return;
    }

    if (!hasAssignedJudicialExpert) {
      showToast(
        "بدون تخصیص کارشناس دادگستری، ثبت یا ویرایش فرم ارزیابی مجاز نیست.",
        "error",
      );
      setIsAssetModalOpen(false);
      return;
    }

    setIsSavingAppraisal(true);

    try {
      const mainOfficeDepartmentId = REQUEST_DEPARTMENT_TYPES.mainOffice.id;

      const cleanBody: PropertyAppraisalInputDto = {
        ...assetForm,
        requestId: selectedRequest.id,
        creatorDepartmentId: mainOfficeDepartmentId,
      };

      /*
       * حذف null، undefined و string خالی.
       * مقدار false حذف نمی‌شود تا وضعیت checkboxها حفظ شود.
       */
      (Object.keys(cleanBody) as (keyof PropertyAppraisalInputDto)[]).forEach(
        (key) => {
          const value = cleanBody[key];

          if (value === null || value === undefined || value === "") {
            delete cleanBody[key];
          }
        },
      );

      let saved: PropertyAppraisalOutputDto;

      if (mainOfficeAppraisal?.id) {
        // فرم ستادی در state وجود دارد؛ همان فرم update می‌شود.
        saved = await updatePropertyAppraisal({
          ...cleanBody,
          id: mainOfficeAppraisal.id,
        });

        showToast("فرم ارزیابی ستاد با موفقیت ویرایش شد.", "success");
      } else {
        /*
         * بررسی مجدد API قبل از create:
         * برای جلوگیری از ثبت تکراری در حالت stale state یا چند تب هم‌زمان.
         */
        const latestAppraisals = await getPropertyAppraisalByRequestId(
          selectedRequest.id,
        );

        const existingMainOfficeAppraisal =
          latestAppraisals.find(
            (appraisal) =>
              Number(appraisal.creatorDepartmentId) ===
              Number(mainOfficeDepartmentId),
          ) ?? null;

        if (existingMainOfficeAppraisal?.id) {
          saved = await updatePropertyAppraisal({
            ...cleanBody,
            id: existingMainOfficeAppraisal.id,
          });

          showToast(
            "فرم ارزیابی ستاد از قبل وجود داشت و با موفقیت ویرایش شد.",
            "success",
          );
        } else {
          saved = await createPropertyAppraisal(cleanBody);

          showToast("فرم ارزیابی ستاد با موفقیت ثبت شد.", "success");
        }
      }

      setMainOfficeAppraisal(saved);
      setAssetForm(saved);
      setIsAssetModalOpen(false);
    } catch (error: unknown) {
      console.error("Error saving appraisal:", error);
      showToast(getErrorMessage(error, "خطا در ذخیره ارزیابی"), "error");
    } finally {
      setIsSavingAppraisal(false);
    }
  }, [assetForm, mainOfficeAppraisal, selectedRequest, showToast]);

  const handleGeneratePdf = useCallback(async () => {
    setIsGeneratingPdf(true);
    try {
      const pdfUrl = await generateAppraisalPdf(assetForm, lookups, {
        requestCode: selectedRequest?.requestCode,
        date: selectedRequest?.creationTime
          ? isoToPersian(selectedRequest.creationTime)
          : "",
        signatures: requestSignatures,
      });

      window.open(pdfUrl, "_blank");

      showToast("گزارش PDF با موفقیت ایجاد شد", "success");
    } catch (error: unknown) {
      console.error("Error generating appraisal PDF:", error);
      showToast(getErrorMessage(error, "خطا در ایجاد فایل PDF"), "error");
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [assetForm, lookups, selectedRequest, showToast]);

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
  const hasAssignedJudicialExpert = Boolean(
    selectedRequest?.judicialExpertOutputDtos?.some((judicialExpert) =>
      Boolean(judicialExpert?.id),
    ),
  );

  return (
    <MainLayout.Main maxWidth="screen-xl">
      <PageTitle title="بررسی توسط کارشناس املاک" />
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
        header="بررسی توسط کارشناس املاک"
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
              documents={[]}
              getUserData={getUserCacheData}
            >
              <RequestDetailSection
                icon={<ClipboardList className="w-5 h-5" />}
                title="فرم‌های ارزیابی ملک"
                tone="blue"
              >
                <div className="space-y-3">
                  {/* فرم ستاد */}
                  {mainOfficeAppraisal && (
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <div className="text-sm text-blue-800">
                        فرم ارزیابی توسط واحد{" "}
                        <span className="font-semibold">
                          {REQUEST_DEPARTMENT_TYPES.mainOffice.name}
                        </span>{" "}
                        ثبت شده است و فقط قابل مشاهده است.
                      </div>

                      <FormButton
                        title={`مشاهده فرم ارزیابی ${REQUEST_DEPARTMENT_TYPES.mainOffice.name}`}
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedReadonlyAppraisal(mainOfficeAppraisal);
                          setIsAppraisalReadOnlyOpen(true);
                        }}
                      />
                    </div>
                  )}

                  {/* تمام فرم‌های غیرستادی */}
                  {externalAppraisals.map((appraisal, index) => {
                    const departmentName = getDepartmentName(
                      appraisal.creatorDepartmentId,
                    );

                    return (
                      <div
                        key={
                          appraisal.id ??
                          `${appraisal.creatorDepartmentId}-${index}`
                        }
                        className="flex items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4"
                      >
                        <div className="min-w-0 text-sm text-blue-800">
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

                  {/* حالت نبود هیچ فرم غیرستادی یا ستادی */}
                  {!mainOfficeAppraisal && externalAppraisals.length === 0 && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-600">
                      هنوز هیچ فرم ارزیابی ملکی توسط واحدها ثبت نشده است.
                    </div>
                  )}

                  {/* بخش ایجاد یا ویرایش فرم ستاد برای کارشناس املاک */}
                  {hasAssignedJudicialExpert ? (
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <div className="text-sm text-blue-800">
                        {mainOfficeAppraisal
                          ? "فرم ارزیابی ستاد ثبت شده است و امکان ویرایش آن وجود دارد."
                          : "فرم ارزیابی ستاد ثبت نشده است. می‌توانید فرم جدید ایجاد کنید."}
                      </div>

                      <FormButton
                        title={
                          mainOfficeAppraisal
                            ? "ویرایش فرم ارزیابی ستاد"
                            : "ایجاد فرم ارزیابی ستاد"
                        }
                        variant="primary"
                        size="sm"
                        onClick={handleOpenAssetModal}
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                      برای این درخواست هنوز کارشناس دادگستری تخصیص داده نشده
                      است؛ بنابراین امکان ایجاد یا ویرایش فرم ارزیابی در این
                      مرحله وجود ندارد.
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

      <PropertyAppraisalFormModal
        isOpen={isAssetModalOpen}
        form={assetForm}
        lookups={lookups}
        signatures={requestSignatures}
        isSaving={isSavingAppraisal}
        isGeneratingPdf={isGeneratingPdf}
        onChange={handleFormChange}
        onSave={handleSaveAppraisal}
        onGeneratePdf={handleGeneratePdf}
        onClose={() => setIsAssetModalOpen(false)}
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
    </MainLayout.Main>
  );
}

export default function RealEstateExpertReviewPage() {
  return (
    <DepartmentRealEstateExpertReviewPage
      departmentType={REQUEST_DEPARTMENT_TYPES.mainOffice}
    />
  );
}
