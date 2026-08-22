import { useMemo, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, MessageSquareText, Upload, Trash2 } from "lucide-react";

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
import { userAction } from "../../../services/RequestCrud/userAction";
import { createRequestComment } from "../../../services/RequestCommentCrud/create";
import { getAllRequestStatus } from "../../../services/RequestStatusCrud/getAll";
import { getAllDocumentTypes } from "../../../services/DocumentTypeCrud/getAll";
import { createDocument } from "../../../services/DocumentCrud/create";
import { startUpload } from "../../../services/FileService/start";
import { completeBatchUpload } from "../../../services/FileService/completeBatch";
import { downloadFile } from "../../../services/FileService/download";
import { getUserById } from "../../../services/Users/getUserById";
import type { RequestItem } from "../../../services/RequestCrud/types";
import {
  REQUEST_CHUNK_SIZE,
  extractEntityId,
  uploadChunksSequentially,
  type UploadState,
} from "./requestShared";
import {
  REQUEST_STATUS_TITLES,
  resolveRequestStatusCode,
  resolveRequestStatusTitle,
} from "../requestStatuses";
import {
  REQUEST_DEPARTMENT_TYPES,
  type RequestDepartmentTypeConfig,
} from "../requestDepartmentTypes";
import {
  isoToPersian,
  isoToPersianDateTime,
  persianToISO,
} from "../../../utils/persianToISO";

type UploadItem = {
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
};

interface RequestReferralPageProps {
  departmentType: RequestDepartmentTypeConfig;
}

export function DepartmentRequestReferralPage({
  departmentType,
}: RequestReferralPageProps) {
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const today = isoToPersian(new Date().toISOString());
  const now = new Date().toLocaleTimeString("fa-IR");
  const userName = user?.fullName || user?.username || "";

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [filters, setFilters] = useState<{ key: string; value: string }[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(
    null,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<Set<string>>(new Set());
  const uploadStateRef = useRef<Map<string, UploadState>>(new Map());
  const userCacheRef = useRef<Map<number, { name: string; role: string }>>(
    new Map(),
  );
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  const statusesQuery = useQuery({
    queryKey: ["request-statuses"],
    queryFn: () => getAllRequestStatus({ maxResultCount: 100 }),
    staleTime: 10 * 60 * 1000,
  });

  const statuses = statusesQuery.data?.items;
  const referralCode = resolveRequestStatusCode(
    statuses,
    REQUEST_STATUS_TITLES.appraisalResultUpload,
  );

  const documentTypesQuery = useQuery({
    queryKey: ["document-types", "referral-result"],
    queryFn: () => getAllDocumentTypes({ maxResultCount: 100 }),
    staleTime: 10 * 60 * 1000,
  });

  const resultDocumentType = documentTypesQuery.data?.items.find((item) =>
    /ارزیابی|نتیجه|دادگستری/.test(
      `${item.title ?? ""} ${item.description ?? ""}`,
    ),
  );

  const requestsQuery = useQuery({
    queryKey: [
      "requests-referral",
      departmentType.id,
      pagination,
      referralCode,
      filters,
    ],
    queryFn: () =>
      getAllRequests({
        ...Object.fromEntries(
          filters
            .filter((filter) => filter.value.trim())
            .map((filter) => [
              filter.key,
              filter.key === "creationTime"
                ? persianToISO(filter.value.trim()) || filter.value.trim()
                : filter.value.trim(),
            ]),
        ),
        currentDepartmentTypeName: departmentType.name,
        skipCount: pagination.pageIndex * pagination.pageSize,
        maxResultCount: pagination.pageSize,
        sorting: "creationTime desc",
      }),
    enabled: referralCode !== undefined,
    select: (data) => {
      const list = (data.items ?? []).filter(
        (request) => request.requestStatusCode === referralCode,
      );
      return {
        listResult: list,
        total: data.totalCount ?? list.length,
        totalPages: Math.max(
          1,
          Math.ceil((data.totalCount ?? list.length) / pagination.pageSize),
        ),
      };
    },
  });

  const getUserCacheData = useCallback((userId: number) => {
    return (
      userCacheRef.current.get(userId) || { name: `کاربر ${userId}`, role: "-" }
    );
  }, []);

  const openRequest = useCallback(
    async (request: RequestItem) => {
      setSelectedRequest(null);
      setFile(null);
      setItems([]);
      setComment("");
      setIsOpen(true);

      try {
        await viewRequest(request.id);
        const detail = await getRequest(request.id);
        setSelectedRequest(detail);

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
        console.error("Error in openRequest:", error);
        showToast("خطا در بارگذاری اطلاعات", "error");
      }
    },
    [showToast],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) setFile(f);
      e.target.value = "";
    },
    [],
  );

  const uploadResult = useCallback(async () => {
    if (!selectedRequest || !file || !resultDocumentType) {
      showToast(
        "نوع سند نتیجه ارزیابی پیدا نشد یا فایل انتخاب نشده است",
        "error",
      );
      return false;
    }
    const id = crypto.randomUUID();
    const format = file.name.split(".").pop() || "";
    const totalChunks = Math.max(1, Math.ceil(file.size / REQUEST_CHUNK_SIZE));
    setUploading(true);
    setItems((previous) => [
      ...previous,
      {
        id,
        documentTypeId: resultDocumentType.id,
        documentTypeTitle: resultDocumentType.title || "",
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
      },
    ]);
    try {
      const start = await startUpload({
        fileName: file.name,
        fileSize: file.size,
        chunkSize: REQUEST_CHUNK_SIZE,
      });
      const uploadId =
        (start as typeof start & { result?: { uploadId?: string } }).result
          ?.uploadId ?? start.uploadId;
      if (!uploadId) throw new Error("شناسه آپلود دریافت نشد");
      setItems((previous) =>
        previous.map((item) => (item.id === id ? { ...item, uploadId } : item)),
      );
      uploadStateRef.current.set(id, {
        file,
        uploadId,
        totalChunks,
        lastUploadedChunk: -1,
        isPaused: false,
        isCompleting: false,
      });
      await uploadChunksSequentially({
        itemId: id,
        file,
        uploadId,
        totalChunks,
        startIndex: 0,
        cancelRef,
        uploadStateRef,
        setFiles: setItems,
      });
      const document = await createDocument({
        documentTypeId: resultDocumentType.id,
        requestId: selectedRequest.id,
      });
      await completeBatchUpload({
        items: [{ uploadId, documentId: extractEntityId(document, "سند") }],
      });
      setItems((previous) =>
        previous.map((item) =>
          item.id === id
            ? {
                ...item,
                uploadProgress: 100,
                isUploading: false,
                isCompleted: true,
                fileAddress: uploadId,
              }
            : item,
        ),
      );
      setFile(null);
      showToast("فایل نتیجه ارزیابی با موفقیت ثبت شد", "success");
      return true;
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "خطا در آپلود فایل",
        "error",
      );
      return false;
    } finally {
      setUploading(false);
    }
  }, [
    selectedRequest,
    file,
    resultDocumentType,
    userName,
    user,
    today,
    now,
    showToast,
  ]);

  const handleDeleteFile = useCallback((id: string) => {
    setFileToDelete(id);
  }, []);

  const confirmDeleteFile = useCallback(() => {
    if (fileToDelete) {
      cancelRef.current.add(fileToDelete);
      uploadStateRef.current.delete(fileToDelete);
      setItems((prev) => prev.filter((item) => item.id !== fileToDelete));
      setFileToDelete(null);
    }
  }, [fileToDelete]);

  const submit = useCallback(
    async (accepted: boolean) => {
      if (!selectedRequest) return;
      setSubmitting(true);
      try {
        if (
          accepted &&
          !items.some((item) => item.isCompleted) &&
          !(await uploadResult())
        )
          return;
        if (comment.trim()) {
          await createRequestComment({
            requestId: selectedRequest.id,
            userId: Number(user?.id ?? 0),
            description: comment.trim(),
          });
        }
        await userAction({ requestId: selectedRequest.id, accepted });
        setIsOpen(false);
        requestsQuery.refetch();
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : "خطا در انجام عملیات",
          "error",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [
      selectedRequest,
      items,
      comment,
      user,
      uploadResult,
      requestsQuery,
      showToast,
    ],
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
          <ViewDetailsButton onClick={() => openRequest(row.original)} />
        ),
      },
    ],
    [openRequest, statuses],
  );

  return (
    <MainLayout.Main maxWidth="screen-xl">
      <PageTitle
        title={`نتیجه ارزیابی ارجاع به کارشناس رسمی دادگستری - ${departmentType.name}`}
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
          emptyStateMessage="درخواستی برای این مرحله یافت نشد"
        />
      </div>
      <Modal
        isOpen={isOpen}
        isRTL
        header="نتیجه ارزیابی ارجاع به کارشناس رسمی دادگستری"
        onClose={() => setIsOpen(false)}
        overlayLock={submitting || uploading}
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title="رد درخواست"
              variant="danger"
              onClick={() => submit(false)}
              isLoading={submitting}
            />
            <FormButton
              title="تأیید درخواست"
              variant="success"
              onClick={() => submit(true)}
              isLoading={submitting}
            />
          </div>
        }
        renderContent={() =>
          selectedRequest ? (
            <RequestDetailsPanel
              request={selectedRequest}
              documents={[]}
              getUserData={getUserCacheData}
            >
              <RequestDetailSection
                icon={<Upload className="h-5 w-5" />}
                title="بارگذاری فایل نتیجه ارزیابی"
                tone="blue"
              >
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <FormButton
                    title={file?.name || "انتخاب فایل"}
                    variant="secondary"
                    size="sm"
                    onClick={() => inputRef.current?.click()}
                  />
                  <FormButton
                    title="آپلود"
                    variant="primary"
                    size="sm"
                    onClick={uploadResult}
                    disabled={!file || uploading}
                    isLoading={uploading}
                  />
                </div>

                {items.length > 0 && (
                  <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="p-3 text-right">نام فایل</th>
                          <th className="p-3 text-right">نوع فایل</th>
                          <th className="p-3 text-right">حجم</th>
                          <th className="p-3 text-right">کاربر</th>
                          <th className="p-3 text-right">نقش</th>
                          <th className="p-3 text-right">تاریخ</th>
                          <th className="p-3 text-right">وضعیت</th>
                          <th className="p-3 text-center">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((item) => (
                          <tr key={item.id} className="bg-white">
                            <td className="p-3">{item.fileName}</td>
                            <td className="p-3">{item.fileFormat}</td>
                            <td className="p-3">
                              {(item.fileSize / 1024).toFixed(1)} KB
                            </td>
                            <td className="p-3">{item.userName}</td>
                            <td className="p-3">{item.userRole}</td>
                            <td className="p-3">{item.uploadDate}</td>
                            <td className="p-3">
                              {item.isCompleted
                                ? "✅ تکمیل"
                                : `${item.uploadProgress}%`}
                            </td>
                            <td className="p-3 text-center">
                              {item.isCompleted && (
                                <button
                                  onClick={() =>
                                    downloadFile(item.fileAddress, 0)
                                  }
                                  className="mx-1 text-blue-600"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteFile(item.id)}
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
                )}
              </RequestDetailSection>
              <RequestDetailSection
                icon={<MessageSquareText className="h-5 w-5" />}
                title="توضیحات"
                tone="amber"
              >
                <FormTextarea
                  id="referral-comment"
                  name="referral-comment"
                  label="توضیحات کارشناس"
                  value={comment}
                  onChange={setComment}
                  rows={3}
                />
              </RequestDetailSection>
            </RequestDetailsPanel>
          ) : (
            <div className="p-10 text-center text-gray-400">
              در حال بارگذاری...
            </div>
          )
        }
      />

      {/* مودال تأیید حذف فایل */}
      <Modal
        isOpen={!!fileToDelete}
        isRTL
        header="تأیید حذف فایل"
        onClose={() => setFileToDelete(null)}
        overlayLock={false}
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title="حذف"
              variant="danger"
              onClick={confirmDeleteFile}
            />
            <FormButton
              title="انصراف"
              variant="secondary"
              onClick={() => setFileToDelete(null)}
            />
          </div>
        }
        renderContent={() => <p>آیا از حذف این فایل اطمینان دارید؟</p>}
      />
    </MainLayout.Main>
  );
}

export default function RequestReferralPage() {
  return (
    <DepartmentRequestReferralPage
      departmentType={REQUEST_DEPARTMENT_TYPES.branch}
    />
  );
}
