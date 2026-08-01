import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";

import { MainLayout } from "../../../baseComponents/MainLayout";
import FormTextarea from "../../../baseComponents/FormTextarea";
import FormButton from "../../../baseComponents/FormButton";
import PageTitle from "../../../baseComponents/PageTitle";
import DataTable from "../../../baseComponents/DataTable";
import Modal from "../../../baseComponents/Modal";
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
import { isoToPersian } from "../../../utils/persianToISO";

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

// ─── Sub-Components ──────────────────────────────────────────────
const InfoRow: React.FC<{
  label: string;
  value: string | null | undefined;
  isBold?: boolean;
}> = ({ label, value, isBold }) => (
  <div>
    <span className="text-gray-500 text-xs">{label}:</span>{" "}
    <span className={`mr-2 text-gray-800 ${isBold ? "font-bold" : ""}`}>
      {value || "-"}
    </span>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────
export default function RequestReviewPage() {
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
      pagination.pageIndex,
      pagination.pageSize,
    ],
    queryFn: async () => {
      const response = await getAllRequests({
        skipCount: pagination.pageIndex * pagination.pageSize,
        maxResultCount: pagination.pageSize,
        sorting: "creationTime desc",
      });
      return response;
    },
    select: (data) => {
      const items = ((data?.items ?? []) as RequestItem[]).filter(
        (r) => r.requestStatusCode === 1, // فقط ثبت اولیه
      );
      const totalCount = (data as any)?.totalCount ?? items.length;

      const titleFilter =
        filters
          .find((f) => f.key === "title")
          ?.value?.trim()
          .toLocaleLowerCase("fa") ?? "";
      const loanFilter =
        filters.find((f) => f.key === "loanNumber")?.value?.trim() ?? "";

      const filteredItems = items.filter(
        (r: RequestItem) =>
          (!titleFilter ||
            (r.title ?? "").toLocaleLowerCase("fa").includes(titleFilter)) &&
          (!loanFilter || String(r.loanNumber ?? "").includes(loanFilter)),
      );

      return {
        listResult: filteredItems,
        total: totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / pagination.pageSize)),
      };
    },
    placeholderData: (previousData) => previousData,
  });

  // ─── Fetch کاربران تاریخچه ────────────────────────────────────
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

        const allDocs = await getAllDocuments({ maxResultCount: 5000 });
        if (activeRequestIdRef.current !== req.id) return;

        const reqDocs = (allDocs.items ?? []).filter(
          (d: DocumentItem) => d.requestId === req.id,
        );

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

  // ─── Action Handlers ───────────────────────────────────────────
  const handleAction = useCallback(
    async (accepted: boolean) => {
      if (!selectedRequest) return;

      setIsSubmitting(true);
      try {
        // ارسال نظر در صورت وجود
        if (comment.trim()) {
          await createRequestComment({
            requestId: selectedRequest.id,
            userId: Number(user?.id || 0),
            description: comment.trim(),
          });
        }

        // انجام عملیات
        await userAction({
          requestId: selectedRequest.id,
          accepted,
        });

        showToast(accepted ? "درخواست تأیید شد" : "درخواست رد شد", "success");
        setIsDetailOpen(false);
        setSelectedRequest(null);
        requestsQuery.refetch();
      } catch (err: any) {
        console.error("Error in userAction:", err);
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
          <button
            onClick={() => handleView(row.original)}
            className="text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </button>
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

  // ─── Render ──────────────────────────────────────────────────
  return (
    <MainLayout.Main maxWidth="screen-xl">
      <PageTitle title="بررسی درخواست توسط شعبه" />
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <DataTable<RequestItem>
          query={requestsQuery}
          columns={columns}
          pagination={pagination}
          onPaginationChange={setPagination}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          filterFields={[
            { field: "title", label: "عنوان" },
            { field: "loanNumber", label: "شماره پرونده" },
          ]}
          searchMode="onEnter"
          skeletonColumns={6}
          emptyStateMessage="هیچ درخواستی برای بررسی یافت نشد"
        />
      </div>

      {/* ─── مودال جزئیات و بررسی ─── */}
      <Modal
        isOpen={isDetailOpen}
        isRTL
        header="بررسی درخواست"
        onClose={() => setIsDetailOpen(false)}
        overlayLock={isSubmitting}
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title="رد درخواست"
              variant="danger"
              onClick={() => handleAction(false)}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            />
            <FormButton
              title="تأیید درخواست"
              variant="success"
              onClick={() => handleAction(true)}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            />
            <FormButton
              title="بستن"
              variant="secondary"
              onClick={() => setIsDetailOpen(false)}
            />
          </div>
        }
        renderContent={() => {
          if (!selectedRequest) return <p>در حال بارگذاری...</p>;

          const histories = selectedRequest.requestHistoryOutputDtos || [];
          const matchedDept = selectedRequest.departmentOutputDto?.title || "-";
          const customerDisplay = selectedRequest.customerOutputDto
            ? `${selectedRequest.customerOutputDto.name} (${selectedRequest.customerOutputDto.cifNumber || selectedRequest.customerId})`
            : `مشتری شماره ${selectedRequest.customerId || "-"}`;

          return (
            <div className="space-y-4 text-sm max-h-[65vh] overflow-y-auto">
              {/* اطلاعات درخواست */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-bold text-blue-900 mb-3 text-base border-b border-gray-200 pb-2">
                  اطلاعات درخواست
                </h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <InfoRow
                    label="شماره پرونده"
                    value={selectedRequest.loanNumber}
                  />
                  <InfoRow label="عنوان" value={selectedRequest.title} />
                  <InfoRow
                    label="شماره مصوبه"
                    value={selectedRequest.requestCode || "-"}
                  />
                  <InfoRow
                    label="مبلغ (ریال)"
                    value={Number(selectedRequest.amount).toLocaleString(
                      "fa-IR",
                    )}
                    isBold
                  />
                  <InfoRow
                    label="مرحله"
                    value={selectedRequest.requestStatusTitle || "-"}
                  />
                  <InfoRow
                    label="تاریخ ثبت"
                    value={
                      selectedRequest.creationTime
                        ? isoToPersian(selectedRequest.creationTime)
                        : "-"
                    }
                  />
                  <InfoRow label="دپارتمان" value={matchedDept} />
                  <InfoRow label="درخواست کننده" value={customerDisplay} />
                </div>
                {selectedRequest.description && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-gray-500 text-xs">توضیحات:</span>
                    <p className="text-gray-700 mt-1">
                      {selectedRequest.description}
                    </p>
                  </div>
                )}
              </div>

              {/* تاریخچه اقدامات */}
              {histories.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-blue-900 mb-3 text-base border-b border-gray-200 pb-2">
                    تاریخچه اقدامات{" "}
                    <span className="text-gray-400 text-xs font-normal mr-2">
                      ({histories.length} اقدام)
                    </span>
                  </h4>
                  <div className="relative">
                    <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-blue-200"></div>
                    <div className="space-y-3">
                      {histories.map((h: any, i: number) => (
                        <div
                          key={h.id}
                          className="flex items-start gap-3 relative"
                        >
                          <div
                            className={`w-3 h-3 rounded-full mt-1 z-10 flex-shrink-0 ${
                              i === 0
                                ? "bg-blue-500 ring-2 ring-blue-200"
                                : "bg-gray-300"
                            }`}
                          ></div>
                          <div className="flex-1 bg-white rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-700">
                              {h.description}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {h.creationTime
                                ? isoToPersian(h.creationTime)
                                : "-"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* وثیقه گذاران */}
              {(selectedRequest.collatralOutputDtos || []).length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-blue-900 mb-3 text-base border-b border-gray-200 pb-2">
                    وثیقه گذاران{" "}
                    <span className="text-gray-400 text-xs font-normal mr-2">
                      ({selectedRequest.collatralOutputDtos.length} نفر)
                    </span>
                  </h4>
                  <div className="space-y-2">
                    {selectedRequest.collatralOutputDtos.map(
                      (c: any, i: number) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 text-xs font-bold">
                              {i + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                {c.firstName} {c.lastName}
                              </p>
                              <p className="text-xs text-gray-500">
                                کد ملی: {c.nationalCode}
                              </p>
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* مدارک پیوست */}
              {detailDocs.some(({ files }) => files.length > 0) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-blue-900 mb-3 text-base border-b border-gray-200 pb-2">
                    مدارک پیوست
                  </h4>
                  <div className="space-y-1">
                    {detailDocs.map(({ files }) =>
                      files.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between bg-white rounded-lg p-2.5 border border-gray-100"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-mono">
                              {f.extension}
                            </span>
                            <span className="text-sm text-gray-700">
                              {f.fileName}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">
                              {(Number(f.fileSize) / 1024).toFixed(1)} KB
                            </span>
                            <button
                              onClick={() =>
                                downloadFile(f.filePath, f.documentId)
                              }
                              className="text-blue-600 hover:text-blue-800 cursor-pointer p-1"
                            >
                              <svg
                                className="w-4 h-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )),
                    )}
                  </div>
                </div>
              )}

              {/* توضیحات کارشناس قبلی */}
              {(selectedRequest.requestCommentOutputDtos || []).length > 0 && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                  <h4 className="font-bold text-yellow-800 mb-3 text-base border-b border-yellow-200 pb-2">
                    توضیحات کارشناس
                  </h4>
                  <div className="space-y-2">
                    {selectedRequest.requestCommentOutputDtos.map((c: any) => {
                      const userData = getUserCacheData(c.userId || 0);
                      return (
                        <div
                          key={c.id}
                          className="bg-white rounded-lg p-3 border border-yellow-100"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500">
                              {userData.name} — {userData.role}
                            </span>
                            <span className="text-xs text-gray-400">
                              {c.creationTime
                                ? isoToPersian(c.creationTime)
                                : "-"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {c.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* افزودن توضیح جدید */}
              <div className="border-t pt-3">
                <h4 className="font-bold text-sm mb-2">افزودن توضیح</h4>
                <FormTextarea
                  id="review-comment"
                  name="review-comment"
                  label="توضیحات کارشناس"
                  value={comment}
                  onChange={(v) => setComment(v)}
                  rows={3}
                  dir="rtl"
                />
              </div>
            </div>
          );
        }}
      />
    </MainLayout.Main>
  );
}
