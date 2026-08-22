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
import PropertyAppraisalFormModal from "../../../baseComponents/PropertyAppraisalFormModal";
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
import { updatePropertyAppraisal } from "../../../services/PropertyAppraisalCrud/update";

import type { RequestItem } from "../../../services/RequestCrud/types";
import type {
  PropertyAppraisalInputDto,
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

  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetForm, setAssetForm] = useState<PropertyAppraisalInputDto>({});
  const [isSavingAppraisal, setIsSavingAppraisal] = useState(false);
  const [isAppraisalReadOnlyOpen, setIsAppraisalReadOnlyOpen] = useState(false);

  // فرم متعلق به منطقه؛ تنها فرم قابل ویرایش
  const [regionAppraisal, setRegionAppraisal] =
    useState<PropertyAppraisalOutputDto | null>(null);

  // فرم‌های متعلق به سایر واحدها؛ فقط قابل مشاهده
  const [otherAppraisals, setOtherAppraisals] = useState<
    PropertyAppraisalOutputDto[]
  >([]);

  const [selectedReadonlyAppraisal, setSelectedReadonlyAppraisal] =
    useState<PropertyAppraisalOutputDto | null>(null);

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

      // پاک‌سازی اطلاعات درخواست قبلی
      setRegionAppraisal(null);
      setOtherAppraisals([]);
      setSelectedReadonlyAppraisal(null);
      setAssetForm({});

      setIsAssetModalOpen(false);
      setIsAppraisalReadOnlyOpen(false);
      setIsDetailOpen(true);

      try {
        await viewRequest(req.id);

        const detail = await getRequest(req.id);
        setSelectedRequest(detail);

        try {
          const appraisals = await getPropertyAppraisalByRequestId(req.id);

          const ownAppraisal =
            appraisals.find(
              (appraisal) =>
                Number(appraisal.creatorDepartmentId) ===
                Number(departmentType.id),
            ) ?? null;

          const appraisalsOfOtherDepartments = appraisals.filter(
            (appraisal) =>
              Number(appraisal.creatorDepartmentId) !==
              Number(departmentType.id),
          );

          setRegionAppraisal(ownAppraisal);
          setOtherAppraisals(appraisalsOfOtherDepartments);
          setAssetForm(ownAppraisal ?? {});
        } catch (error) {
          console.error("Error loading property appraisals:", error);
          setRegionAppraisal(null);
          setOtherAppraisals([]);
          setSelectedReadonlyAppraisal(null);
          setAssetForm({});
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
    [departmentType.id, showToast],
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

  const handleFormChange = useCallback(
    (
      field: keyof PropertyAppraisalInputDto,
      value: string | boolean | number,
    ) => {
      setAssetForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSaveAppraisal = useCallback(async () => {
    if (!selectedRequest?.id) {
      showToast("شناسه درخواست نامعتبر است.", "error");
      return;
    }

    if (
      !regionAppraisal?.id ||
      Number(regionAppraisal.creatorDepartmentId) !== Number(departmentType.id)
    ) {
      showToast("فقط فرم ارزیابی ثبت‌شده توسط منطقه قابل ویرایش است.", "error");
      return;
    }

    setIsSavingAppraisal(true);

    try {
      // بررسی مجدد API پیش از ویرایش، برای جلوگیری از update رکورد قدیمی
      const latestAppraisals = await getPropertyAppraisalByRequestId(
        selectedRequest.id,
      );

      const latestRegionAppraisal = latestAppraisals.find(
        (appraisal) =>
          Number(appraisal.creatorDepartmentId) === Number(departmentType.id),
      );

      if (!latestRegionAppraisal?.id) {
        showToast(
          "فرم ارزیابی منطقه یافت نشد یا اطلاعات آن تغییر کرده است.",
          "error",
        );
        return;
      }

      const cleanBody: PropertyAppraisalInputDto = {
        ...assetForm,
        requestId: selectedRequest.id,
        creatorDepartmentId: departmentType.id,
      };

      (Object.keys(cleanBody) as (keyof PropertyAppraisalInputDto)[]).forEach(
        (key) => {
          const value = cleanBody[key];

          // مقدار false حذف نمی‌شود.
          if (value === null || value === undefined || value === "") {
            delete cleanBody[key];
          }
        },
      );

      const saved = await updatePropertyAppraisal({
        ...cleanBody,
        id: latestRegionAppraisal.id,
      });

      setRegionAppraisal(saved);
      setAssetForm(saved);

      showToast("ارزیابی ملک با موفقیت ویرایش شد.", "success");
      setIsAssetModalOpen(false);
    } catch (error: unknown) {
      console.error("Error saving appraisal:", error);
      showToast(getErrorMessage(error, "خطا در ذخیره ارزیابی"), "error");
    } finally {
      setIsSavingAppraisal(false);
    }
  }, [
    assetForm,
    departmentType.id,
    regionAppraisal,
    selectedRequest,
    showToast,
  ]);

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
              documents={[]}
              getUserData={getUserCacheData}
            >
              {(regionAppraisal || otherAppraisals.length > 0) && (
                <RequestDetailSection
                  icon={<ClipboardList className="w-5 h-5" />}
                  title="فرم‌های ارزیابی ملک"
                  tone="blue"
                >
                  <div className="space-y-3">
                    {regionAppraisal && (
                      <div className="flex items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-blue-800">
                            فرم ارزیابی ثبت‌شده توسط {departmentType.name}
                          </div>

                          <div className="mt-1 text-xs text-blue-600">
                            این فرم قابل ویرایش است.
                          </div>
                        </div>

                        <FormButton
                          title="ویرایش فرم ارزیابی"
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setAssetForm(regionAppraisal);
                            setIsAssetModalOpen(true);
                          }}
                        />
                      </div>
                    )}

                    {otherAppraisals.map((appraisal, index) => (
                      <div
                        key={
                          appraisal.id ??
                          `${appraisal.creatorDepartmentId}-${index}`
                        }
                        className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-amber-800">
                            فرم ارزیابی ثبت‌شده توسط واحد دیگر
                          </div>

                          <div className="mt-1 text-xs text-amber-700">
                            این فرم فقط قابل مشاهده است.
                          </div>
                        </div>

                        <FormButton
                          title="مشاهده فرم"
                          variant="secondary"
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

      <PropertyAppraisalFormModal
        isOpen={isAssetModalOpen}
        form={assetForm}
        lookups={lookups}
        isSaving={isSavingAppraisal}
        onChange={handleFormChange}
        onSave={handleSaveAppraisal}
        onClose={() => setIsAssetModalOpen(false)}
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

export default function RegionEngineeringRepresentativeReviewPage() {
  return (
    <DepartmentRegionEngineeringRepresentativeReviewPage
      departmentType={REQUEST_DEPARTMENT_TYPES.region}
    />
  );
}
