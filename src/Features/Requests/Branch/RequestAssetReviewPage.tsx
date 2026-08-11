import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Download,
  MessageSquareText,
  Paperclip,
  Trash2,
  Upload,
} from "lucide-react";

import { MainLayout } from "../../../baseComponents/MainLayout";
import FormSelect from "../../../baseComponents/FormSelect";
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
import { filterRequestItems } from "./requestShared";

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

  // Upload states - با ref برای حفظ بین رندرها
  const uploadedFilesRef = useRef<UploadedFile[]>([]);
  const [_uploadedFilesVersion, setUploadedFilesVersion] = useState(0);
  const [docTypeId, setDocTypeId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<Set<string>>(new Set());
  const uploadStateRef = useRef<Map<string, any>>(new Map());

  const userCacheRef = useRef<Map<number, UserCacheData>>(new Map());

  // helper برای آپدیت uploadedFiles
  const updateUploadedFiles = useCallback(
    (updater: (prev: UploadedFile[]) => UploadedFile[]) => {
      uploadedFilesRef.current = updater(uploadedFilesRef.current);
      setUploadedFilesVersion((v) => v + 1);
    },
    [],
  );

  // ─── Queries ───────────────────────────────────────────────────
  const requestsQuery = useQuery({
    queryKey: [
      "requests-asset-review",
      pagination.pageIndex,
      pagination.pageSize,
      filters,
    ],
    queryFn: async () => {
      const response = await getAllRequests({
        skipCount: 0,
        maxResultCount: 5000,
        sorting: "creationTime desc",
      });
      return response;
    },
    select: (data) => {
      const items = ((data?.items ?? []) as RequestItem[]).filter(
        (r) => r.requestStatusCode === 4 || r.requestStatusCode === 5,
      );
      const filteredItems = filterRequestItems(items, filters);
      const pageStart = pagination.pageIndex * pagination.pageSize;
      const listResult = filteredItems.slice(
        pageStart,
        pageStart + pagination.pageSize,
      );
      const totalCount = filteredItems.length;

      return {
        listResult,
        total: totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / pagination.pageSize)),
      };
    },
    placeholderData: (previousData) => previousData,
  });

  const isStatusFive = selectedRequest?.requestStatusCode === 5;

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
      uploadedFilesRef.current = [];
      setUploadedFilesVersion((v) => v + 1);
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
          updateUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === docId ? { ...f, uploadProgress: overall } : f,
            ),
          );
        });

        updateUploadedFiles((prev) =>
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
    [updateUploadedFiles],
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

    updateUploadedFiles((prev) => [newFile, ...prev]);
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

      updateUploadedFiles((prev) =>
        prev.map((f) => (f.id === docId ? { ...f, uploadId } : f)),
      );

      await uploadChunksInBatches(docId, file, uploadId, totalChunks, 0);

      updateUploadedFiles((prev) =>
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
        updateUploadedFiles((prev) =>
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
    updateUploadedFiles,
    showToast,
  ]);

  const handleDeleteFile = useCallback(
    (id: string) => {
      cancelRef.current.add(id);
      uploadStateRef.current.delete(id);
      updateUploadedFiles((prev) => prev.filter((f) => f.id !== id));
    },
    [updateUploadedFiles],
  );

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

        // Upload files if any - از ref بخون
        const newFiles = uploadedFilesRef.current.filter((f) => f.isCompleted);
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
    [selectedRequest, comment, user, requestsQuery, showToast],
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

  // uploadedFiles برای JSX
  const uploadedFiles = uploadedFilesRef.current;

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
        header="بررسی و بازنگری اطلاعات ملک"
        onClose={() => setIsDetailOpen(false)}
        overlayLock={isSubmitting}
        footerButtons={
          isStatusFive ? (
            <FormButton
              title="مختومه"
              variant="danger"
              onClick={() => handleAction(false)}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            />
          ) : (
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
            </div>
          )
        }
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
              {!isStatusFive && (
                <>
                  <RequestDetailSection
                    icon={<Upload className="h-4.5 w-4.5" />}
                    title="بارگذاری فایل ارزیابی ملک"
                  >
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
                  </RequestDetailSection>

                  {uploadedFiles.length > 0 && (
                    <RequestDetailSection
                      icon={<Paperclip className="h-4.5 w-4.5" />}
                      title="فایل‌های آپلود شده"
                      count={`${uploadedFiles.length} فایل`}
                    >
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="p-3 text-right">عنوان فایل</th>
                              <th className="p-3 text-right">نوع فایل</th>
                              <th className="p-3 text-right">حجم</th>
                              <th className="p-3 text-right">بارگذار</th>
                              <th className="p-3 text-right">نقش سازمانی</th>
                              <th className="p-3 text-right">تاریخ</th>
                              <th className="p-3 text-center">عملیات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {uploadedFiles.map((f) => (
                              <tr key={f.id} className="bg-white">
                                <td className="p-3">{f.fileName}</td>
                                <td className="p-3">{f.fileFormat}</td>
                                <td className="p-3">
                                  {(f.fileSize / 1024).toFixed(1)} KB
                                </td>
                                <td className="p-3">{f.userName}</td>
                                <td className="p-3">{f.userRole}</td>
                                <td className="p-3">{f.uploadDate}</td>
                                <td className="p-3 text-center">
                                  {f.isCompleted && (
                                    <button
                                      onClick={() =>
                                        downloadFile(f.fileAddress, 0)
                                      }
                                      className="mx-1 text-blue-600"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteFile(f.id)}
                                    className="mx-1 text-red-600"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </RequestDetailSection>
                  )}
                </>
              )}

              <RequestDetailSection
                icon={<MessageSquareText className="h-4.5 w-4.5" />}
                title="افزودن توضیح"
                tone="amber"
              >
                <FormTextarea
                  id="asset-comment"
                  name="asset-comment"
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
