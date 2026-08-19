import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { MessageSquareText } from "lucide-react";

import { MainLayout } from "../../../baseComponents/MainLayout";
import FormTextarea from "../../../baseComponents/FormTextarea";
import FormButton from "../../../baseComponents/FormButton";
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
import { getAllDocuments } from "../../../services/DocumentCrud/getAll";
import { getDocumentAllFiles } from "../../../services/FileService/GetDocumentAllFiles";
import { downloadFile } from "../../../services/FileService/download";
import { getUserById } from "../../../services/Users/getUserById";

import type { RequestItem } from "../../../services/RequestCrud/types";
import type { DocumentItem } from "../../../services/DocumentCrud/types";
import type { DocumentFile } from "../../../services/FileService/GetDocumentAllFiles";
import { isoToPersian, persianToISO } from "../../../utils/persianToISO";
import {
  REQUEST_DEPARTMENT_TYPES,
  type RequestDepartmentTypeConfig,
} from "../requestDepartmentTypes";

// ─── Types ───────────────────────────────────────────────────────
type TableFilter = { key: string; value: string };

interface DetailDocWithFiles {
  doc: DocumentItem;
  files: DocumentFile[];
}

interface UserCacheData {
  name: string;
  role: string;
}

// ─── Main Component ──────────────────────────────────────────────
interface RequestReviewPageProps {
  departmentType: RequestDepartmentTypeConfig;
}

export function DepartmentRequestReviewPage({
  departmentType,
}: RequestReviewPageProps) {
  const { showToast } = useToast();
  const { user } = useAuthStore();

  // ─── State ─────────────────────────────────────────────────────
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [filters, setFilters] = useState<TableFilter[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailDocs, setDetailDocs] = useState<DetailDocWithFiles[]>([]);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const activeRequestIdRef = useRef<number | null>(null);

  const userCacheRef = useRef<Map<number, UserCacheData>>(new Map());

  // ─── Queries ───────────────────────────────────────────────────
  const requestsQuery = useQuery({
    queryKey: [
      "requests-pending-review",
      departmentType.id,
      pagination.pageIndex,
      pagination.pageSize,
      filters,
    ],
    queryFn: async () => {
      const apiFilters = Object.fromEntries(
        filters.filter((f) => f.value.trim()).map((f) => [
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
      // نمایش status 1 و 2
      const items = ((data?.items ?? []) as RequestItem[]).filter(
        (r) =>
          r.requestStatusCode === 1 ||
          r.requestStatusCode === 2 ||
          r.requestStatusCode === 3,
      );
      const listResult = items;
      const totalCount = data.totalCount ?? items.length;

      return {
        listResult,
        total: totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / pagination.pageSize)),
      };
    },
    placeholderData: (previousData) => previousData,
  });

  // ─── تشخیص status فعلی ────────────────────────────────────────
  const isStatusOne = selectedRequest?.requestStatusCode === 1;
  const isStatusTwo = selectedRequest?.requestStatusCode === 2;
  const isStatusThree = selectedRequest?.requestStatusCode === 3;

  // ─── Fetch کاربران ────────────────────────────────────────────
  useEffect(() => {
    const idsToFetch = new Set<number>();

    (selectedRequest?.requestHistoryOutputDtos || []).forEach((h: any) => {
      if (h.reviewerUserId && !userCacheRef.current.has(h.reviewerUserId)) {
        idsToFetch.add(h.reviewerUserId);
      }
    });

    (selectedRequest?.requestCommentOutputDtos || []).forEach((c: any) => {
      if (c.userId && !userCacheRef.current.has(c.userId)) {
        idsToFetch.add(c.userId);
      }
    });

    if (idsToFetch.size === 0) return;

    let cancelled = false;

    const fetchUsers = async () => {
      const idsArray = Array.from(idsToFetch);
      const results = await Promise.allSettled(
        idsArray.map((id) => getUserById(id)),
      );

      if (cancelled) return;

      const newCache = new Map(userCacheRef.current);

      results.forEach((result, index) => {
        const id = idsArray[index];
        if (result.status === "fulfilled") {
          const u = result.value;
          newCache.set(id, {
            name:
              u?.fullName ||
              `${u?.name || ""} ${u?.surname || ""}`.trim() ||
              `کاربر ${id}`,
            role: u?.roleNames?.join(", ") || "کاربر",
          });
        } else {
          newCache.set(id, { name: `کاربر ${id}`, role: "-" });
        }
      });

      userCacheRef.current = newCache;
    };

    fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [
    selectedRequest?.requestHistoryOutputDtos,
    selectedRequest?.requestCommentOutputDtos,
  ]);

  // ─── Handlers ──────────────────────────────────────────────────
  const getUserCacheData = useCallback((userId: number): UserCacheData => {
    return (
      userCacheRef.current.get(userId) || { name: `کاربر ${userId}`, role: "-" }
    );
  }, []);

  const handleView = useCallback(
    async (req: RequestItem) => {
      activeRequestIdRef.current = req.id;
      setIsDetailOpen(true);

      try {
        await viewRequest(req.id);
        if (activeRequestIdRef.current !== req.id) return;

        const detail = await getRequest(req.id);
        if (activeRequestIdRef.current !== req.id) return;

        setSelectedRequest(detail);

        const allDocs = await getAllDocuments({
          requestId: req.id,
          maxResultCount: 100,
        });
        if (activeRequestIdRef.current !== req.id) return;

        const reqDocs = allDocs.items ?? [];

        const docsWithFiles = await Promise.all(
          reqDocs.map(async (doc: DocumentItem) => ({
            doc,
            files: await getDocumentAllFiles(doc.id),
          })),
        );
        if (activeRequestIdRef.current !== req.id) return;

        setDetailDocs(docsWithFiles);
        setComment("");
      } catch (err) {
        if (activeRequestIdRef.current === req.id) {
          console.error("Error in handleView:", err);
          showToast("خطا در بارگذاری جزئیات", "error");
        }
      }
    },
    [showToast],
  );

  // ─── Action: ارسال جهت بررسی (status 1) ───────────────────────
  const handleSendForReview = useCallback(async () => {
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

      await userAction({ requestId: selectedRequest.id, accepted: true });

      showToast("درخواست با موفقیت ارسال شد", "success");
      setIsDetailOpen(false);
      setSelectedRequest(null);
      requestsQuery.refetch();
    } catch (err: any) {
      console.error("Error in sendForReview:", err);
      showToast(err?.message || "خطا در ارسال درخواست", "error");
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedRequest, comment, user?.id, requestsQuery, showToast]);

  // ─── Action: تأیید/رد (status 2) ──────────────────────────────
  const handleApproveReject = useCallback(
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
        setSelectedRequest(null);
        requestsQuery.refetch();
      } catch (err: any) {
        console.error("Error in approveReject:", err);
        showToast(err?.message || "خطا در انجام عملیات", "error");
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedRequest, comment, user?.id, requestsQuery, showToast],
  );

  // ─── Columns ───────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<RequestItem, unknown>[]>(
    () => [
      {
        id: "status",
        header: "مرحله فرآیند",
        cell: ({ row }) => row.original.requestStatusTitle || "-",
      },
      {
        id: "user",
        header: "نام کاربر اقدام کننده",
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
            ? isoToPersian(row.original.creationTime)
            : "-",
      },
      {
        id: "desc",
        header: "توضیحات",
        cell: ({ row }) => row.original.description || "-",
      },
      {
        id: "detail",
        header: "عملیات",
        cell: ({ row }) => (
          <ViewDetailsButton onClick={() => handleView(row.original)} />
        ),
      },
    ],
    [handleView],
  );

  const handleFiltersChange = useCallback((nf: TableFilter[]) => {
    const lastFilter = nf.at(-1);
    setFilters(lastFilter ? [lastFilter] : []);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  // ─── Modal Footer Buttons ─────────────────────────────────────
  const renderFooterButtons = () => {
    if (isStatusOne) {
      // Status 1: فقط ارسال جهت بررسی
      return (
        <FormButton
          title="ارسال جهت بررسی"
          variant="primary"
          onClick={handleSendForReview}
          isLoading={isSubmitting}
          disabled={isSubmitting}
        />
      );
    }

    if (isStatusTwo) {
      // Status 2: تأیید یا رد
      return (
        <div className="flex gap-2">
          <FormButton
            title="رد درخواست"
            variant="danger"
            onClick={() => handleApproveReject(false)}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          />
          <FormButton
            title="تأیید درخواست"
            variant="success"
            onClick={() => handleApproveReject(true)}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          />
        </div>
      );
    }

    if (isStatusThree) {
      return (
        <FormButton
          title="مختومه"
          variant="danger"
          onClick={() => handleApproveReject(false)}
          isLoading={isSubmitting}
          disabled={isSubmitting}
        />
      );
    }
  };

  // ─── Render ──────────────────────────────────────────────────
  return (
    <MainLayout.Main maxWidth="screen-xl">
      <PageTitle title={`بررسی درخواست توسط ${departmentType.name}`} />
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <DataTable<RequestItem>
          query={requestsQuery}
          columns={columns}
          pagination={pagination}
          onPaginationChange={setPagination}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          filterFields={[
            { field: "requestStatusTitle", label: "مرحله فرآیند" },
            {
              field: "actorUserFullName",
              label: "نام کاربر اقدام‌کننده",
            },
            {
              field: "creationTime",
              label: "تاریخ",
              placeholder: "مثال: 1405-05-11",
            },
          ]}
          searchMode="onEnter"
          skeletonColumns={6}
          emptyStateMessage="هیچ درخواستی برای بررسی یافت نشد"
        />
      </div>

      {/* ─── مودال جزئیات ─── */}
      <Modal
        isOpen={isDetailOpen}
        isRTL
        header={`بررسی درخواست - ${selectedRequest?.requestStatusTitle || ""}`}
        onClose={() => setIsDetailOpen(false)}
        overlayLock={isSubmitting}
        footerButtons={renderFooterButtons()}
        renderContent={() => {
          if (!selectedRequest) return <p>در حال بارگذاری...</p>;

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
                icon={<MessageSquareText className="h-4.5 w-4.5" />}
                title="افزودن توضیح"
                tone="amber"
              >
                <FormTextarea
                  id="review-comment"
                  name="review-comment"
                  label="توضیحات کارشناس"
                  value={comment}
                  onChange={(v) => setComment(v)}
                  rows={3}
                  dir="rtl"
                />
              </RequestDetailSection>
            </RequestDetailsPanel>
          );
        }}
      />
    </MainLayout.Main>
  );
}

export default function RequestReviewPage() {
  return (
    <DepartmentRequestReviewPage
      departmentType={REQUEST_DEPARTMENT_TYPES.branch}
    />
  );
}
