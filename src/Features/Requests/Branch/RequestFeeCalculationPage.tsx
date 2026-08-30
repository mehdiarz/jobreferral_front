import { useMemo, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Calculator, ClipboardList, MessageSquareText } from "lucide-react";

import { MainLayout } from "../../../baseComponents/MainLayout";
import FormButton from "../../../baseComponents/FormButton";
import FormInput from "../../../baseComponents/FormInput";
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
import { userAction } from "../../../services/RequestCrud/userAction";
import { createRequestComment } from "../../../services/RequestCommentCrud/create";
import { getUserById } from "../../../services/Users/getUserById";
import { getPropertyAppraisalLookups } from "../../../services/PropertyAppraisalCrud/getLookups";
import { getPropertyAppraisalByRequestId } from "../../../services/PropertyAppraisalCrud/getByRequestId";
import { calculateBankFee } from "../../../services/FeeCalculationCrud/feeCalculation";
import { calculateJudicialFee } from "../../../services/FeeCalculationCrud/feeCalculation";
import { generateAppraisalPdf } from "../../../utils/htmlPdfGenerator";
import { getAllRequestSignatures } from "../../../services/RequestSignatureCrud/getAll";
import { createCalculatedFee } from "../../../services/CalculatedFeeCrud/create";
import { getAllDocuments } from "../../../services/DocumentCrud/getAll";
import { getDocumentAllFiles } from "../../../services/FileService/GetDocumentAllFiles";
import { downloadFile } from "../../../services/FileService/download";
import type { DocumentItem } from "../../../services/DocumentCrud/types";
import type { DocumentFile } from "../../../services/FileService/GetDocumentAllFiles";

import type { RequestSignatureOutputDto } from "../../../services/RequestSignatureCrud/types";

import type { RequestItem } from "../../../services/RequestCrud/types";
import type {
  PropertyAppraisalOutputDto,
  PropertyAppraisalLookupsDto,
} from "../../../services/PropertyAppraisalCrud/types";
import type {
  CalculateBankFeeInput,
  CalculateJudicialFeeInput,
  FeeCalculationResultDto,
} from "../../../services/FeeCalculationCrud/types";
import {
  isoToPersianDateTime,
  isoToPersian,
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

function formatNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function parseValue(str: string): number {
  return Number(String(str || "").replace(/,/g, ""));
}

function formatWithCommas(num: number): string {
  return num.toLocaleString("en-US");
}

// ─── Main Component ──────────────────────────────────────────────
interface RequestFeeCalculationPageProps {
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

function getValidNumber(
  value: number | string | null | undefined,
): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function hasValidPositiveAmount(value: string): boolean {
  const parsedValue = parseValue(value);

  return Number.isFinite(parsedValue) && parsedValue > 0;
}

export function DepartmentRequestFeeCalculationPage({
  departmentType,
}: RequestFeeCalculationPageProps) {
  const { showToast } = useToast();
  const { user } = useAuthStore();

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [filters, setFilters] = useState<TableFilter[]>([]);
  const [selectedRequest, setSelectedRequest] =
    useState<SelectedRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // مودال مشاهده فرم ارزیابی
  const [isAppraisalReadOnlyOpen, setIsAppraisalReadOnlyOpen] = useState(false);

  // تمام فرم‌های ارزیابی ثبت‌شده برای درخواست
  const [appraisals, setAppraisals] = useState<PropertyAppraisalOutputDto[]>(
    [],
  );

  // فرم انتخاب‌شده برای مشاهده و دریافت PDF
  const [selectedReadonlyAppraisal, setSelectedReadonlyAppraisal] =
    useState<PropertyAppraisalOutputDto | null>(null);

  const [requestSignatures, setRequestSignatures] = useState<
    RequestSignatureOutputDto[]
  >([]);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Bank fee modal
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankFa, setBankFa] = useState("");
  const [bankPv, setBankPv] = useState("");

  const [isCalculatingBank, setIsCalculatingBank] = useState(false);

  // Judicial fee modal
  const [isJudicialModalOpen, setIsJudicialModalOpen] = useState(false);
  const [judicialFa, setJudicialFa] = useState("");
  const [judicialPv, setJudicialPv] = useState("");

  const [isCalculatingJudicial, setIsCalculatingJudicial] = useState(false);

  // نتیجه موقت داخل مودال؛ تا زمانی که کاربر «ثبت نتیجه» نزند نهایی نیست.
  const [bankCalculationPreview, setBankCalculationPreview] =
    useState<FeeCalculationResultDto | null>(null);

  const [judicialCalculationPreview, setJudicialCalculationPreview] =
    useState<FeeCalculationResultDto | null>(null);

  // آخرین محاسبه‌ای که کاربر آن را ثبت کرده است.
  // فقط همین مقادیر در زمان تأیید درخواست به CalculatedFee/Create می‌روند.
  const [savedBankCalculation, setSavedBankCalculation] = useState<{
    facilityAmount: number;
    propertyValue: number;
    isBoard: boolean;
    fee: number;
  } | null>(null);

  const [savedJudicialCalculation, setSavedJudicialCalculation] = useState<{
    facilityAmount: number;
    propertyValue: number;
    isBoard: boolean;
    fee: number;
  } | null>(null);

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
      "requests-fee-calculation",
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
        hasBidFilter: true,
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
          r.requestStatusCode === REQUEST_STATUS_CODES.expertFeeCalculation,
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
      setRequestSignatures([]);
      setDetailDocs([]);
      setAppraisals([]);
      setSelectedReadonlyAppraisal(null);

      setIsAppraisalReadOnlyOpen(false);
      setIsDetailOpen(true);
      setBankFa("");
      setBankPv("");
      setBankCalculationPreview(null);
      setSavedBankCalculation(null);

      setJudicialFa("");
      setJudicialPv("");
      setJudicialCalculationPreview(null);
      setSavedJudicialCalculation(null);

      setIsBankModalOpen(false);
      setIsJudicialModalOpen(false);

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
          // سرویس همه فرم‌های ارزیابی ثبت‌شده برای درخواست را برمی‌گرداند.
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
      if (!selectedRequest) {
        return;
      }

      setIsSubmitting(true);

      try {
        if (accepted) {
          if (!savedBankCalculation) {
            showToast(
              "لطفاً ابتدا کارمزد بانک را محاسبه و نتیجه آن را ثبت کنید.",
              "error",
            );
            return;
          }

          if (!savedJudicialCalculation) {
            showToast(
              "لطفاً ابتدا حق‌الزحمه کارشناس دادگستری را محاسبه و نتیجه آن را ثبت کنید.",
              "error",
            );
            return;
          }

          const departmentId = getValidNumber(
            selectedRequest.currentDepartmentTypeId,
          );
          const branchCode = getValidNumber(selectedRequest.branchId);
          const supervisionCode = getValidNumber(
            selectedRequest.supersvisionId,
          );

          if (departmentId === null) {
            showToast("شناسه دپارتمان درخواست معتبر نیست.", "error");
            return;
          }

          if (branchCode === null) {
            showToast("کد شعبه درخواست معتبر نیست.", "error");
            return;
          }

          if (supervisionCode === null) {
            showToast("کد سرپرستی درخواست معتبر نیست.", "error");
            return;
          }

          await createCalculatedFee({
            requestId: selectedRequest.id,
            departmentId,
            branchCode,
            supervisionCode,

            propertyValueBankFee: savedBankCalculation.propertyValue,
            loanAmountBankFee: savedBankCalculation.facilityAmount,
            isBankFeeBoard: savedBankCalculation.isBoard,

            propertyValueJudicialFee: savedJudicialCalculation.propertyValue,
            loanAmountJudicialFee: savedJudicialCalculation.facilityAmount,
            isJudicialFeeBoard: savedJudicialCalculation.isBoard,
          });
        }

        if (comment.trim()) {
          await createRequestComment({
            requestId: selectedRequest.id,
            userId: Number(user?.id || 0),
            description: comment.trim(),
          });
        }

        await userAction({
          requestId: selectedRequest.id,
          accepted,
        });

        showToast(
          accepted
            ? "کارمزدها ثبت و درخواست با موفقیت تأیید شد."
            : "درخواست رد شد.",
          "success",
        );

        setIsDetailOpen(false);
        await requestsQuery.refetch();
      } catch (error: unknown) {
        console.error("Error in request action:", error);

        showToast(
          getErrorMessage(
            error,
            accepted
              ? "خطا در ثبت کارمزد یا تأیید درخواست"
              : "خطا در رد درخواست",
          ),
          "error",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      selectedRequest,
      savedBankCalculation,
      savedJudicialCalculation,
      comment,
      user,
      requestsQuery,
      showToast,
    ],
  );

  const handleCalculateBank = useCallback(async () => {
    if (!hasValidPositiveAmount(bankFa) || !hasValidPositiveAmount(bankPv)) {
      showToast(
        "مبلغ تسهیلات و ارزش ملک برای کارمزد بانک باید بزرگ‌تر از صفر باشند.",
        "error",
      );
      return;
    }

    const facilityAmount = parseValue(bankFa);
    const propertyValue = parseValue(bankPv);

    setIsCalculatingBank(true);

    try {
      const body: CalculateBankFeeInput = {
        facilityAmount,
        propertyValue,
      };

      const result = await calculateBankFee(body);

      // فقط پیش‌نمایش است و هنوز برای درخواست ثبت نشده.
      setBankCalculationPreview(result);

      showToast(
        "محاسبه انجام شد. برای استفاده در تأیید درخواست، نتیجه را ثبت کنید.",
        "success",
      );
    } catch (error: unknown) {
      console.error("Error calculating bank fee:", error);
      showToast(getErrorMessage(error, "خطا در محاسبه کارمزد بانک"), "error");
    } finally {
      setIsCalculatingBank(false);
    }
  }, [bankFa, bankPv, showToast]);

  const handleCalculateJudicial = useCallback(async () => {
    if (
      !hasValidPositiveAmount(judicialFa) ||
      !hasValidPositiveAmount(judicialPv)
    ) {
      showToast(
        "مبلغ تسهیلات و ارزش ملک برای حق‌الزحمه کارشناس باید بزرگ‌تر از صفر باشند.",
        "error",
      );
      return;
    }

    const facilityAmount = parseValue(judicialFa);
    const propertyValue = parseValue(judicialPv);

    setIsCalculatingJudicial(true);

    try {
      const body: CalculateJudicialFeeInput = {
        facilityAmount,
        propertyValue,
      };

      const result = await calculateJudicialFee(body);

      // فقط پیش‌نمایش است و هنوز برای درخواست ثبت نشده.
      setJudicialCalculationPreview(result);

      showToast(
        "محاسبه انجام شد. برای استفاده در تأیید درخواست، نتیجه را ثبت کنید.",
        "success",
      );
    } catch (error: unknown) {
      console.error("Error calculating judicial fee:", error);
      showToast(
        getErrorMessage(error, "خطا در محاسبه حق‌الزحمه کارشناس"),
        "error",
      );
    } finally {
      setIsCalculatingJudicial(false);
    }
  }, [judicialFa, judicialPv, showToast]);

  const handleSaveBankCalculation = useCallback(() => {
    if (!bankCalculationPreview) {
      showToast("ابتدا کارمزد بانک را محاسبه کنید.", "error");
      return;
    }

    const facilityAmount = parseValue(bankFa);
    const propertyValue = parseValue(bankPv);

    if (!facilityAmount || !propertyValue) {
      showToast(
        "مقادیر واردشده برای محاسبه کارمزد بانک معتبر نیستند.",
        "error",
      );
      return;
    }

    setSavedBankCalculation({
      facilityAmount,
      propertyValue,
      isBoard: Boolean(bankCalculationPreview.isBoard),
      fee: bankCalculationPreview.bankFee ?? 0,
    });

    setIsBankModalOpen(false);

    showToast(
      "کارمزد بانک ثبت شد و در زمان تأیید درخواست استفاده می‌شود.",
      "success",
    );
  }, [bankCalculationPreview, bankFa, bankPv, showToast]);

  const handleSaveJudicialCalculation = useCallback(() => {
    if (!judicialCalculationPreview) {
      showToast("ابتدا حق‌الزحمه کارشناس دادگستری را محاسبه کنید.", "error");
      return;
    }

    const facilityAmount = parseValue(judicialFa);
    const propertyValue = parseValue(judicialPv);

    if (!facilityAmount || !propertyValue) {
      showToast(
        "مقادیر واردشده برای محاسبه حق‌الزحمه کارشناس معتبر نیستند.",
        "error",
      );
      return;
    }

    setSavedJudicialCalculation({
      facilityAmount,
      propertyValue,
      isBoard: Boolean(judicialCalculationPreview.isBoard),
      fee: judicialCalculationPreview.judicialFee ?? 0,
    });

    setIsJudicialModalOpen(false);

    showToast(
      "حق‌الزحمه کارشناس ثبت شد و در زمان تأیید درخواست استفاده می‌شود.",
      "success",
    );
  }, [judicialCalculationPreview, judicialFa, judicialPv, showToast]);

  const handleGeneratePdf = useCallback(async () => {
    if (!selectedReadonlyAppraisal) {
      showToast("فرم ارزیابی برای ایجاد PDF انتخاب نشده است.", "error");
      return;
    }

    setIsGeneratingPdf(true);

    try {
      const pdfUrl = await generateAppraisalPdf(
        selectedReadonlyAppraisal,
        lookups,
        {
          requestCode: selectedRequest?.requestCode,
          date: selectedRequest?.creationTime
            ? isoToPersian(selectedRequest.creationTime)
            : "",
          signatures: requestSignatures,
        },
      );

      window.open(pdfUrl, "_blank");

      showToast("گزارش PDF با موفقیت ایجاد شد", "success");
    } catch (error: unknown) {
      console.error("Error generating appraisal PDF:", error);
      showToast(getErrorMessage(error, "خطا در ایجاد فایل PDF"), "error");
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [lookups, selectedReadonlyAppraisal, selectedRequest, showToast]);

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

  return (
    <MainLayout.Main maxWidth="screen-xl">
      <PageTitle
        title={`محاسبه کارمزد کارشناس رسمی دادگستری - ${departmentType.name}`}
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
        header={`محاسبه کارمزد کارشناس رسمی دادگستری - ${departmentType.name}`}
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
              {/* محاسبه کارمزد */}
              {/*<RequestDetailSection*/}
              {/*  icon={<Calculator className="w-5 h-5" />}*/}
              {/*  title="محاسبه کارمزد"*/}
              {/*  tone="blue"*/}
              {/*>*/}
              {/*  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">*/}
              {/*    <button*/}
              {/*      onClick={() => setIsBankModalOpen(true)}*/}
              {/*      className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center hover:bg-blue-100 transition-colors cursor-pointer"*/}
              {/*    >*/}
              {/*      <p className="font-bold text-blue-700">کارمزد بانک</p>*/}
              {/*      <p className="text-xs text-blue-500 mt-1">*/}
              {/*        کلیک برای محاسبه*/}
              {/*      </p>*/}
              {/*    </button>*/}
              {/*    <button*/}
              {/*      onClick={() => setIsJudicialModalOpen(true)}*/}
              {/*      className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center hover:bg-emerald-100 transition-colors cursor-pointer"*/}
              {/*    >*/}
              {/*      <p className="font-bold text-emerald-700">*/}
              {/*        کارمزد کارشناس دادگستری*/}
              {/*      </p>*/}
              {/*      <p className="text-xs text-emerald-500 mt-1">*/}
              {/*        کلیک برای محاسبه*/}
              {/*      </p>*/}
              {/*    </button>*/}
              {/*  </div>*/}
              {/*</RequestDetailSection>*/}

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
                            : "border-blue-200 bg-blue-50",
                        ].join(" ")}
                      >
                        <div className="min-w-0">
                          <div
                            className={[
                              "text-sm font-medium",
                              isMainOffice ? "text-blue-800" : "text-blue-800",
                            ].join(" ")}
                          >
                            فرم ارزیابی ثبت‌شده توسط واحد{" "}
                            <span className="font-bold">{departmentName}</span>
                          </div>

                          <div
                            className={[
                              "mt-1 text-xs",
                              isMainOffice ? "text-blue-700" : "text-blue-700",
                            ].join(" ")}
                          >
                            این فرم فقط قابل مشاهده است.
                          </div>
                        </div>

                        <FormButton
                          title={`مشاهده فرم ${departmentName}`}
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
                icon={<Calculator className="w-5 h-5" />}
                title="محاسبه کارمزد"
                tone="blue"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {/* کارمزد بانک */}
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-blue-700">کارمزد بانک</p>

                        {savedBankCalculation ? (
                          <div className="mt-2 space-y-1 text-sm text-slate-700">
                            <p>
                              مبلغ تسهیلات:{" "}
                              <span dir="ltr">
                                {formatWithCommas(
                                  savedBankCalculation.facilityAmount,
                                )}
                              </span>{" "}
                              ریال
                            </p>

                            <p>
                              ارزش ملک:{" "}
                              <span dir="ltr">
                                {formatWithCommas(
                                  savedBankCalculation.propertyValue,
                                )}
                              </span>{" "}
                              ریال
                            </p>

                            <p className="font-bold text-emerald-700">
                              کارمزد محاسبه‌شده:{" "}
                              <span dir="ltr">
                                {formatWithCommas(savedBankCalculation.fee)}
                              </span>{" "}
                              ریال
                            </p>

                            <p className="text-xs text-slate-500">
                              {savedBankCalculation.isBoard
                                ? "نوع کارشناسی: هیئتی"
                                : "نوع کارشناسی: تک‌نفره"}
                            </p>
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-amber-700">
                            هنوز نتیجه‌ای برای کارمزد بانک ثبت نشده است.
                          </p>
                        )}
                      </div>

                      <FormButton
                        title={savedBankCalculation ? "محاسبه مجدد" : "محاسبه"}
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setBankCalculationPreview(null);
                          setIsBankModalOpen(true);
                        }}
                      />
                    </div>
                  </div>

                  {/* حق‌الزحمه کارشناس دادگستری */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-emerald-700">
                          حق‌الزحمه کارشناس دادگستری
                        </p>

                        {savedJudicialCalculation ? (
                          <div className="mt-2 space-y-1 text-sm text-slate-700">
                            <p>
                              مبلغ تسهیلات:{" "}
                              <span dir="ltr">
                                {formatWithCommas(
                                  savedJudicialCalculation.facilityAmount,
                                )}
                              </span>{" "}
                              ریال
                            </p>

                            <p>
                              ارزش ملک:{" "}
                              <span dir="ltr">
                                {formatWithCommas(
                                  savedJudicialCalculation.propertyValue,
                                )}
                              </span>{" "}
                              ریال
                            </p>

                            <p className="font-bold text-emerald-700">
                              حق‌الزحمه محاسبه‌شده:{" "}
                              <span dir="ltr">
                                {formatWithCommas(savedJudicialCalculation.fee)}
                              </span>{" "}
                              ریال
                            </p>

                            <p className="text-xs text-slate-500">
                              {savedJudicialCalculation.isBoard
                                ? "نوع کارشناسی: هیئتی"
                                : "نوع کارشناسی: تک‌نفره"}
                            </p>
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-amber-700">
                            هنوز نتیجه‌ای برای حق‌الزحمه کارشناس ثبت نشده است.
                          </p>
                        )}
                      </div>

                      <FormButton
                        title={
                          savedJudicialCalculation ? "محاسبه مجدد" : "محاسبه"
                        }
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setJudicialCalculationPreview(null);
                          setIsJudicialModalOpen(true);
                        }}
                      />
                    </div>
                  </div>
                </div>
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

      {/* مودال کارمزد بانک */}
      <Modal
        isOpen={isBankModalOpen}
        isRTL
        header="محاسبه کارمزد بانک"
        onClose={() => setIsBankModalOpen(false)}
        overlayLock={isCalculatingBank}
        footerButtons={
          <div className="flex flex-wrap gap-2">
            <FormButton
              title="محاسبه"
              variant="primary"
              onClick={handleCalculateBank}
              isLoading={isCalculatingBank}
              disabled={isCalculatingBank}
            />

            <FormButton
              title="ثبت نتیجه و بازگشت به جزئیات"
              variant="success"
              onClick={handleSaveBankCalculation}
              disabled={!bankCalculationPreview || isCalculatingBank}
            />
          </div>
        }

        renderContent={() => (
          <div className="space-y-4">
            <FormInput
              id="bank-fa"
              name="bank-fa"
              label="مبلغ تسهیلات (ریال)"
              value={bankFa}
              onChange={(value) => {
                setBankFa(formatNumber(value));
                setBankCalculationPreview(null);
              }}
              dir="ltr"
            />

            <FormInput
              id="bank-pv"
              name="bank-pv"
              label="ارزش ملک (ریال)"
              value={bankPv}
              onChange={(value) => {
                setBankPv(formatNumber(value));
                setBankCalculationPreview(null);
              }}
              dir="ltr"
            />

            {bankCalculationPreview && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-bold text-emerald-700">
                  کارمزد بانک:{" "}
                  {formatWithCommas(bankCalculationPreview.bankFee ?? 0)} ریال
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {bankCalculationPreview.isBoard
                    ? "کارشناسی به‌صورت هیئتی است."
                    : "کارشناسی به‌صورت تک‌نفره است."}
                </p>

                <p className="mt-2 text-xs text-amber-700">
                  برای ثبت نهایی این نتیجه، دکمه «ثبت نتیجه و بازگشت به جزئیات»
                  را بزنید.
                </p>
              </div>
            )}
          </div>
        )}
      />

      {/* مودال کارمزد کارشناس دادگستری */}
      <Modal
        isOpen={isJudicialModalOpen}
        isRTL
        header="محاسبه حق‌الزحمه کارشناس رسمی دادگستری"
        onClose={() => setIsJudicialModalOpen(false)}
        overlayLock={isCalculatingJudicial}
        footerButtons={
          <div className="flex flex-wrap gap-2">
            <FormButton
              title="محاسبه"
              variant="primary"
              onClick={handleCalculateJudicial}
              isLoading={isCalculatingJudicial}
              disabled={isCalculatingJudicial}
            />

            <FormButton
              title="ثبت نتیجه و بازگشت به جزئیات"
              variant="success"
              onClick={handleSaveJudicialCalculation}
              disabled={!judicialCalculationPreview || isCalculatingJudicial}
            />
          </div>
        }

        renderContent={() => (
          <div className="space-y-4">
            <FormInput
              id="judicial-fa"
              name="judicial-fa"
              label="مبلغ تسهیلات (ریال)"
              value={judicialFa}
              onChange={(value) => {
                setJudicialFa(formatNumber(value));
                setJudicialCalculationPreview(null);
              }}
              dir="ltr"
            />

            <FormInput
              id="judicial-pv"
              name="judicial-pv"
              label="ارزش ملک (ریال)"
              value={judicialPv}
              onChange={(value) => {
                setJudicialPv(formatNumber(value));
                setJudicialCalculationPreview(null);
              }}
              dir="ltr"
            />

            {judicialCalculationPreview && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-bold text-emerald-700">
                  حق‌الزحمه کارشناس:{" "}
                  {formatWithCommas(
                    judicialCalculationPreview.judicialFee ?? 0,
                  )}{" "}
                  ریال
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {judicialCalculationPreview.isBoard
                    ? "کارشناسی به‌صورت هیئتی است."
                    : "کارشناسی به‌صورت تک‌نفره است."}
                </p>

                <p className="mt-2 text-xs text-amber-700">
                  برای ثبت نهایی این نتیجه، دکمه «ثبت نتیجه و بازگشت به جزئیات»
                  را بزنید.
                </p>
              </div>
            )}
          </div>
        )}
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

export default function RequestFeeCalculationPage() {
  return (
    <DepartmentRequestFeeCalculationPage
      departmentType={REQUEST_DEPARTMENT_TYPES.branch}
    />
  );
}
