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
} from "lucide-react";

import { MainLayout } from "../../../baseComponents/MainLayout";
import FormButton from "../../../baseComponents/FormButton";
import FormTextarea from "../../../baseComponents/FormTextarea";
import PageTitle from "../../../baseComponents/PageTitle";
import DataTable from "../../../baseComponents/DataTable";
import Modal from "../../../baseComponents/Modal";
import { ViewDetailsButton } from "../../../baseComponents/RequestDetailsPanel";
import { useToast } from "../../../libs/toastContext";

import { getGroupedByRequest } from "../../../services/RequestAssignedJudicialExpertCrud/GetGroupedByRequest";
import { cancelAndReassign } from "../../../services/AssignCrud/cancelAndReassign";
import { getRequest } from "../../../services/RequestCrud/get";
import { viewRequest } from "../../../services/RequestCrud/viewRequest";
import FormSection from "../../../baseComponents/FormSection";
import { FluidGrid } from "../../../baseComponents/FluidGrid";
import { FluidCol } from "../../../baseComponents/FluidCol";
import type {
  RequestWithJudicialExpertsItem,
  JudicialExpertItemDto,
  RequestSummaryDto,
} from "../../../services/RequestAssignedJudicialExpertCrud/types";
import type { RequestItem } from "../../../services/RequestCrud/types";

import { isoToPersianDateTime } from "../../../utils/persianToISO";
import {
  REQUEST_DEPARTMENT_TYPES,
  type RequestDepartmentTypeConfig,
} from "../requestDepartmentTypes";

// ─── Types ───────────────────────────────────────────────────────
type TableFilter = { key: string; value: string };

interface ReferredToExpertPageProps {
  departmentType: RequestDepartmentTypeConfig;
}

// ─── Helper Functions ────────────────────────────────────────────
function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function safeText(value: unknown): string {
  if (typeof value === "string") return toPersianDigits(value);
  if (typeof value === "number") return toPersianDigits(value);
  return "";
}

function getExpertFullName(expert?: JudicialExpertItemDto | null): string {
  if (!expert) return "-";
  return (
    `${safeText(expert.firstName)} ${safeText(expert.lastName)}`.trim() || "-"
  );
}

function getExpertCode(expert?: JudicialExpertItemDto | null): string {
  return safeText(expert?.code || expert?.id);
}

// ─── Helper Functions ────────────────────────────────────────────
function toPersianDigits(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  const str = String(value);
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return str.replace(/[0-9]/g, (w) => persianDigits[Number(w)]);
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

  // ─── Cancel Mutation ───────────────────────────────────────────
  const cancelMutation = useMutation({
    mutationFn: cancelAndReassign,
    onSuccess: () => {
      showToast("کارشناس با موفقیت لغو و جایگزین شد", "success");
      setIsCancelModalOpen(false);
      setCancelReason("");
      setExpertToCancel(null);
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

    cancelMutation.mutate({
      reqId: targetRequestId,
      judicialExpertId: expertToCancel.id,
      cancellationReason: cancelReason.trim(),
    });
  }, [expertToCancel, selectedGroup, cancelReason, cancelMutation, showToast]);

  function getCustomerName(
    reqData?: RequestItem | RequestSummaryDto | null,
  ): string {
    if (!reqData) return "-";
    // اگر ساختار RequestSummaryDto با آبجکت customer باشد
    if ("customer" in reqData && reqData.customer?.name) {
      return safeText(reqData.customer.name);
    }
    // اگر ساختار RequestItem باشد
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

  // داده‌های کارشناسان برای رندر در مودال
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

      {/* ─── مودال جزئیات درخواست و کارشناسان ─── */}
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
        header="لغو کارشناس و جایگزینی خودکار"
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
          <FormSection
            title="لغو کارشناس"
            description="کارشناس مورد نظر را لغو و دلیل آن را ثبت کنید. پس از لغو، سیستم به صورت خودکار کارشناس جایگزین تخصیص می‌دهد."
            icon={<AlertTriangle className="h-5 w-5" />}
          >
            <FluidGrid className="gap-4">
              <FluidCol colSpan="col-span-12">
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
              </FluidCol>
              <FluidCol colSpan="col-span-12">
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
              </FluidCol>
            </FluidGrid>
          </FormSection>
        )}
      />
    </MainLayout.Main>
  );
}

export default function ReferredToExpertPage() {
  return (
    <DepartmentReferredToExpertPage
      departmentType={REQUEST_DEPARTMENT_TYPES.branch}
    />
  );
}
