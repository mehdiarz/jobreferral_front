// src/Features/Requests/Branch/RequestFeeCalculationPage.tsx

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

  const [isAppraisalReadOnlyOpen, setIsAppraisalReadOnlyOpen] = useState(false);
  const [detailAppraisal, setDetailAppraisal] =
    useState<PropertyAppraisalOutputDto | null>(null);

  // Bank fee modal
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankFa, setBankFa] = useState("");
  const [bankPv, setBankPv] = useState("");
  const [bankResult, setBankResult] = useState<FeeCalculationResultDto | null>(
    null,
  );
  const [isCalculatingBank, setIsCalculatingBank] = useState(false);

  // Judicial fee modal
  const [isJudicialModalOpen, setIsJudicialModalOpen] = useState(false);
  const [judicialFa, setJudicialFa] = useState("");
  const [judicialPv, setJudicialPv] = useState("");
  const [judicialResult, setJudicialResult] =
    useState<FeeCalculationResultDto | null>(null);
  const [isCalculatingJudicial, setIsCalculatingJudicial] = useState(false);

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
      setDetailAppraisal(null);
      setIsAppraisalReadOnlyOpen(false);
      setIsDetailOpen(true);
      try {
        await viewRequest(req.id);
        const detail = await getRequest(req.id);
        setSelectedRequest(detail);

        try {
          const existingAppraisal = await getPropertyAppraisalByRequestId(
            req.id,
          );
          if (existingAppraisal && Array.isArray(existingAppraisal)) {
            setDetailAppraisal(existingAppraisal[0] ?? null);
          } else if (existingAppraisal) {
            setDetailAppraisal(existingAppraisal as PropertyAppraisalOutputDto);
          }
        } catch {
          console.log("No appraisal found for this request");
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

  const handleCalculateBank = useCallback(async () => {
    const fa = parseValue(bankFa);
    const pv = parseValue(bankPv);
    if (!fa || !pv) {
      showToast("لطفاً هر دو مقدار را وارد کنید", "error");
      return;
    }

    setIsCalculatingBank(true);
    try {
      const body: CalculateBankFeeInput = {
        facilityAmount: fa,
        propertyValue: pv,
      };
      const result = await calculateBankFee(body);
      setBankResult(result);
      showToast("محاسبه با موفقیت انجام شد", "success");
    } catch (error: unknown) {
      console.error("Error calculating bank fee:", error);
      showToast(getErrorMessage(error, "خطا در محاسبه"), "error");
    } finally {
      setIsCalculatingBank(false);
    }
  }, [bankFa, bankPv, selectedRequest, showToast]);

  const handleCalculateJudicial = useCallback(async () => {
    const fa = parseValue(judicialFa);
    const pv = parseValue(judicialPv);
    if (!fa || !pv) {
      showToast("لطفاً هر دو مقدار را وارد کنید", "error");
      return;
    }

    setIsCalculatingJudicial(true);
    try {
      const body: CalculateJudicialFeeInput = {
        facilityAmount: fa,
        propertyValue: pv,
      };
      const result = await calculateJudicialFee(body);
      setJudicialResult(result);
      showToast("محاسبه با موفقیت انجام شد", "success");
    } catch (error: unknown) {
      console.error("Error calculating judicial fee:", error);
      showToast(getErrorMessage(error, "خطا در محاسبه"), "error");
    } finally {
      setIsCalculatingJudicial(false);
    }
  }, [judicialFa, judicialPv, selectedRequest, showToast]);

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
              documents={[]}
              getUserData={getUserCacheData}
            >
              {/* محاسبه کارمزد */}
              <RequestDetailSection
                icon={<Calculator className="w-5 h-5" />}
                title="محاسبه کارمزد"
                tone="blue"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsBankModalOpen(true)}
                    className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <p className="font-bold text-blue-700">کارمزد بانک</p>
                    <p className="text-xs text-blue-500 mt-1">
                      کلیک برای محاسبه
                    </p>
                  </button>
                  <button
                    onClick={() => setIsJudicialModalOpen(true)}
                    className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    <p className="font-bold text-emerald-700">
                      کارمزد کارشناس دادگستری
                    </p>
                    <p className="text-xs text-emerald-500 mt-1">
                      کلیک برای محاسبه
                    </p>
                  </button>
                </div>
              </RequestDetailSection>

              {detailAppraisal && (
                <RequestDetailSection
                  icon={<ClipboardList className="w-5 h-5" />}
                  title="فرم ارزیابی ملک"
                  tone="blue"
                >
                  <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <div className="text-sm text-blue-800">
                      فرم ارزیابی ملک برای این درخواست موجود است.
                    </div>
                    <FormButton
                      title="مشاهده فرم ارزیابی"
                      variant="primary"
                      size="sm"
                      onClick={() => setIsAppraisalReadOnlyOpen(true)}
                    />
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

      {/* مودال کارمزد بانک */}
      <Modal
        isOpen={isBankModalOpen}
        isRTL
        header="محاسبه کارمزد بانک"
        onClose={() => setIsBankModalOpen(false)}
        overlayLock={isCalculatingBank}
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title="محاسبه"
              variant="primary"
              onClick={handleCalculateBank}
              isLoading={isCalculatingBank}
              disabled={isCalculatingBank}
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
              onChange={(v) => setBankFa(formatNumber(v))}
              dir="ltr"
            />
            <FormInput
              id="bank-pv"
              name="bank-pv"
              label="ارزش ملک (ریال)"
              value={bankPv}
              onChange={(v) => setBankPv(formatNumber(v))}
              dir="ltr"
            />
            {bankResult && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-bold text-emerald-700">
                  کارمزد بانک: {formatWithCommas(bankResult.bankFee ?? 0)} ریال
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {bankResult.isBoard
                    ? "کارشناسی به صورت هیئتی می باشد"
                    : "کارشناسی به صورت تک نفره می باشد"}
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
          <div className="flex gap-2">
            <FormButton
              title="محاسبه"
              variant="primary"
              onClick={handleCalculateJudicial}
              isLoading={isCalculatingJudicial}
              disabled={isCalculatingJudicial}
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
              onChange={(v) => setJudicialFa(formatNumber(v))}
              dir="ltr"
            />
            <FormInput
              id="judicial-pv"
              name="judicial-pv"
              label="ارزش ملک (ریال)"
              value={judicialPv}
              onChange={(v) => setJudicialPv(formatNumber(v))}
              dir="ltr"
            />
            {judicialResult && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-bold text-emerald-700">
                  حق‌الزحمه کارشناس:{" "}
                  {formatWithCommas(judicialResult.judicialFee ?? 0)} ریال
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {judicialResult.isBoard
                    ? "کارشناسی به صورت هیئتی می باشد"
                    : "کارشناسی به صورت تک نفره می باشد"}
                </p>
              </div>
            )}
          </div>
        )}
      />

      <PropertyAppraisalReadOnlyModal
        isOpen={isAppraisalReadOnlyOpen}
        appraisal={detailAppraisal}
        lookups={lookups}
        onClose={() => setIsAppraisalReadOnlyOpen(false)}
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
