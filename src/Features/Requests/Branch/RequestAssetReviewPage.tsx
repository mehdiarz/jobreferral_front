import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Download, Trash2, Upload } from "lucide-react";

import { MainLayout } from "../../../baseComponents/MainLayout";
import FormSelect from "../../../baseComponents/FormSelect";
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
import { startUpload } from "../../../services/FileService/start";
import { completeBatchUpload } from "../../../services/FileService/completeBatch";
import { createDocument } from "../../../services/DocumentCrud/create";
import { getAllDocumentTypes } from "../../../services/DocumentTypeCrud/getAll";
import { getUserById } from "../../../services/Users/getUserById";
import { uploadChunk } from "../../../services/FileService/uploadChunk";

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

interface UploadedFile {
  id: string;
  documentTypeId: number | null;
  documentTypeTitle: string;
  fileName: string;
  fileSize: number;
  fileFormat: string;
  fileAddress: string;
  uploadProgress: number;
  isUploading: boolean;
  isCompleted: boolean;
  userName: string;
  userRole: string;
  uploadDate: string;
  uploadTime: string;
  uploadId?: string;
  totalChunks?: number;
}

interface UserCacheData {
  name: string;
  role: string;
}

const CHUNK_SIZE = 2 * 1024 * 1024;

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
export default function RequestAssetReviewPage() {
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const today = isoToPersian(new Date().toISOString());
  const now = new Date().toLocaleTimeString("fa-IR");
  const userName = user?.fullName || user?.username || "";

  // ─── State ─────────────────────────────────────────────────────
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [filters, setFilters] = useState<TableFilter[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailDocs, setDetailDocs] = useState<DetailDocWithFiles[]>([]);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const activeRequestIdRef = useRef<number | null>(null);

  // Upload states
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [docTypeId, setDocTypeId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<Set<string>>(new Set());
  const uploadStateRef = useRef<Map<string, any>>(new Map());

  const userCacheRef = useRef<Map<number, UserCacheData>>(new Map());

  // ─── Queries ───────────────────────────────────────────────────
  const requestsQuery = useQuery({
    queryKey: [
      "requests-asset-review",
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
        (r) => r.requestStatusCode === 3, // فقط ارزیابی ملک
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

  const docTypesQuery = useQuery({
    queryKey: ["doc-types-asset-review"],
    queryFn: () => getAllDocumentTypes({ maxResultCount: 1000 }),
    select: (d) => (d as any)?.items ?? [],
    staleTime: 5 * 60 * 1000,
  });

  const docTypeOpts = useMemo(
    () =>
      (docTypesQuery.data ?? []).map((i: any) => ({
        id: i.id,
        title: i.title ?? "",
      })),
    [docTypesQuery.data],
  );

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

  // ─── Helpers ───────────────────────────────────────────────────
  const getUserCacheData = useCallback((userId: number): UserCacheData => {
    return (
      userCacheRef.current.get(userId) || { name: `کاربر ${userId}`, role: "-" }
    );
  }, []);

  // ─── View Handler ──────────────────────────────────────────────
  const handleView = useCallback(
    async (req: RequestItem) => {
      activeRequestIdRef.current = req.id;
      setSelectedRequest(null);
      setDetailDocs([]);
      setUploadedFiles([]);
      setComment("");
      setDocTypeId(null);
      setSelectedFile(null);
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
      } catch (err) {
        if (activeRequestIdRef.current === req.id) {
          console.error("Error in handleView:", err);
          showToast("خطا در بارگذاری جزئیات", "error");
        }
      }
    },
    [showToast],
  );

  // ─── Upload Handlers ───────────────────────────────────────────
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) setSelectedFile(f);
      e.target.value = "";
    },
    [],
  );

  const uploadChunksInBatches = useCallback(
    async (
      docId: string,
      file: File,
      uploadId: string,
      totalChunks: number,
      startIndex: number,
    ) => {
      for (let i = startIndex; i < totalChunks; i++) {
        if (cancelRef.current.has(docId)) {
          cancelRef.current.delete(docId);
          throw new Error("آپلود لغو شد");
        }

        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        await uploadChunk(uploadId, i, chunk, file.name, (chunkPercent) => {
          const overall = Math.round(
            ((i + chunkPercent / 100) / totalChunks) * 100,
          );
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === docId ? { ...f, uploadProgress: overall } : f,
            ),
          );
        });

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === docId
              ? {
                  ...f,
                  uploadProgress: Math.round(((i + 1) / totalChunks) * 100),
                }
              : f,
          ),
        );
      }
    },
    [],
  );

  const handleStartUpload = useCallback(async () => {
    if (!docTypeId || !selectedFile) {
      showToast("لطفاً نوع مدرک و فایل را انتخاب کنید", "error");
      return;
    }

    const file = selectedFile;
    const docId = crypto.randomUUID();
    const format = file.name.split(".").pop() || "";
    const docType = (docTypesQuery.data ?? []).find(
      (d: any) => d.id === docTypeId,
    );
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    const newFile: UploadedFile = {
      id: docId,
      documentTypeId: docTypeId,
      documentTypeTitle: docType?.title ?? "",
      fileName: file.name,
      fileSize: file.size,
      fileFormat: format,
      fileAddress: "",
      uploadProgress: 0,
      isUploading: true,
      isCompleted: false,
      userName,
      userRole: user?.roles || "",
      uploadDate: today,
      uploadTime: now,
      totalChunks,
    };

    setUploadedFiles((prev) => [newFile, ...prev]);
    setSelectedFile(null);
    setIsUploading(true);

    try {
      const startRes: any = await startUpload({
        fileName: file.name,
        fileSize: file.size,
        chunkSize: CHUNK_SIZE,
      });
      const uploadId = startRes?.result?.uploadId || startRes?.uploadId;

      uploadStateRef.current.set(docId, {
        file,
        uploadId,
        totalChunks,
        lastUploadedChunk: -1,
      });

      setUploadedFiles((prev) =>
        prev.map((f) => (f.id === docId ? { ...f, uploadId } : f)),
      );

      await uploadChunksInBatches(docId, file, uploadId, totalChunks, 0);

      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === docId
            ? {
                ...f,
                uploadProgress: 100,
                isUploading: false,
                isCompleted: true,
                fileAddress: uploadId,
              }
            : f,
        ),
      );

      uploadStateRef.current.delete(docId);
      showToast("فایل با موفقیت آپلود شد", "success");
    } catch (err: any) {
      if (err.message !== "آپلود لغو شد") {
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === docId ? { ...f, isUploading: false } : f)),
        );
        showToast(`خطا: ${err.message}`, "warning");
      }
    } finally {
      setIsUploading(false);
    }
  }, [
    docTypeId,
    selectedFile,
    docTypesQuery.data,
    userName,
    user?.roles,
    today,
    now,
    uploadChunksInBatches,
    showToast,
  ]);

  const handleDeleteFile = useCallback((id: string) => {
    cancelRef.current.add(id);
    uploadStateRef.current.delete(id);
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // ─── Action Handlers ───────────────────────────────────────────
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

        // Upload files if any
        const newFiles = uploadedFiles.filter((f) => f.isCompleted);
        if (newFiles.length > 0) {
          const filesByType = new Map<number, UploadedFile[]>();
          newFiles.forEach((f) => {
            if (f.documentTypeId) {
              const arr = filesByType.get(f.documentTypeId) || [];
              arr.push(f);
              filesByType.set(f.documentTypeId, arr);
            }
          });

          const batchItems: { uploadId: string; documentId: number }[] = [];

          for (const [dtId, files] of filesByType) {
            const docRes: any = await createDocument({
              documentTypeId: dtId,
              requestId: selectedRequest.id,
            });
            const docId = docRes?.result?.id || docRes?.id;

            if (!docId) {
              console.error("شناسه سند دریافت نشد");
              continue;
            }

            files.forEach((f) => {
              if (f.uploadId)
                batchItems.push({ uploadId: f.uploadId, documentId: docId });
            });
          }

          if (batchItems.length > 0) {
            await completeBatchUpload({ items: batchItems });
          }
        }

        await userAction({ requestId: selectedRequest.id, accepted });

        showToast(accepted ? "درخواست تأیید شد" : "سهل البیع نیست", "success");
        setIsDetailOpen(false);
        setSelectedRequest(null);
        requestsQuery.refetch();
      } catch (err: any) {
        console.error("Error in action:", err);
        showToast(err?.message || "خطا در انجام عملیات", "error");
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedRequest, comment, uploadedFiles, user, requestsQuery, showToast],
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
      <PageTitle title="بررسی و بازنگری اطلاعات ملک توسط شعبه" />
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

      {/* ─── مودال جزئیات ─── */}
      <Modal
        isOpen={isDetailOpen}
        isRTL
        header="بررسی و بازنگری اطلاعات ملک"
        onClose={() => setIsDetailOpen(false)}
        overlayLock={isSubmitting}
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title="سهل البیع نیست"
              variant="danger"
              onClick={() => handleAction(false)}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            />
            <FormButton
              title="تأیید"
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

              {/* تاریخچه */}
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
                            className={`w-3 h-3 rounded-full mt-1 z-10 flex-shrink-0 ${i === 0 ? "bg-blue-500 ring-2 ring-blue-200" : "bg-gray-300"}`}
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

              {/* مدارک پیوست قبلی */}
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
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )),
                    )}
                  </div>
                </div>
              )}

              {/* آپلود فایل ارزیابی ملک */}
              <div className="border-t pt-3">
                <h4 className="font-bold text-sm mb-2">
                  بارگذاری فایل ارزیابی ملک توسط کارشناس
                </h4>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-48">
                    <FormSelect<number>
                      id="asset-doc-type"
                      name="asset-doc-type"
                      label="نوع مدارک"
                      value={docTypeId ?? ""}
                      onChange={(v) => setDocTypeId(v ? Number(v) : null)}
                      options={docTypeOpts}
                    />
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer text-sm"
                  >
                    <Upload className="w-4 h-4 text-blue-500" />
                    <span className="truncate max-w-[120px]">
                      {selectedFile ? selectedFile.name : "انتخاب فایل"}
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <FormButton
                    title="آپلود"
                    variant="primary"
                    size="sm"
                    onClick={handleStartUpload}
                    isLoading={isUploading}
                    disabled={isUploading || !selectedFile || !docTypeId}
                  />
                </div>
              </div>

              {/* جدول فایل‌های آپلود شده */}
              {uploadedFiles.length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="font-bold text-sm mb-2">فایل‌های آپلود شده</h4>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 border text-right">عنوان فایل</th>
                        <th className="p-2 border text-right">نوع فایل</th>
                        <th className="p-2 border text-right">حجم</th>
                        <th className="p-2 border text-right">بارگذار</th>
                        <th className="p-2 border text-right">نقش سازمانی</th>
                        <th className="p-2 border text-right">تاریخ</th>
                        <th className="p-2 border text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadedFiles.map((f) => (
                        <tr key={f.id} className="border-b">
                          <td className="p-2 border">{f.fileName}</td>
                          <td className="p-2 border">{f.fileFormat}</td>
                          <td className="p-2 border">
                            {(f.fileSize / 1024).toFixed(1)} KB
                          </td>
                          <td className="p-2 border">{f.userName}</td>
                          <td className="p-2 border">{f.userRole}</td>
                          <td className="p-2 border">{f.uploadDate}</td>
                          <td className="p-2 border text-center">
                            {f.isCompleted && (
                              <button
                                onClick={() => downloadFile(f.fileAddress, 0)}
                                className="text-blue-600 mx-1"
                              >
                                <Download className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteFile(f.id)}
                              className="text-red-600 mx-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* توضیحات قبلی */}
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

              {/* افزودن توضیح */}
              <div className="border-t pt-3">
                <h4 className="font-bold text-sm mb-2">افزودن توضیح</h4>
                <FormTextarea
                  id="asset-comment"
                  name="asset-comment"
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
