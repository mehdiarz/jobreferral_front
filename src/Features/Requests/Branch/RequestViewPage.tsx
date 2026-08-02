import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Download, Trash2, Upload } from "lucide-react";

import { MainLayout } from "../../../baseComponents/MainLayout";
import FormInput from "../../../baseComponents/FormInput";
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
import { editRequest } from "../../../services/RequestCrud/update";
import { getAllDocuments } from "../../../services/DocumentCrud/getAll";
import { getDocumentAllFiles } from "../../../services/FileService/GetDocumentAllFiles";
import { downloadFile } from "../../../services/FileService/download";
import { startUpload } from "../../../services/FileService/start";
import { completeBatchUpload } from "../../../services/FileService/completeBatch";
import { createDocument } from "../../../services/DocumentCrud/create";
import { createRequestComment } from "../../../services/RequestCommentCrud/create";
import { findCustomer } from "../../../services/CustomerCrud/find";
import { getUserById } from "../../../services/Users/getUserById";
import { viewRequest } from "../../../services/RequestCrud/viewRequest";

import type {
  RequestItem,
  EditRequestBody,
} from "../../../services/RequestCrud/types";
import type { DocumentItem } from "../../../services/DocumentCrud/types";
import type { DocumentFile } from "../../../services/FileService/GetDocumentAllFiles";
import type { RequestCommentItem } from "../../../services/RequestCommentCrud/types";
import type { CollatralItem } from "../../../services/CollatralCrud/types";
import type { CustomerItem } from "../../../services/CustomerCrud/types";
import type { DocumentTypeItem } from "../../../services/DocumentTypeCrud/types";
import { isoToPersian } from "../../../utils/persianToISO";
import { createCollatral } from "../../../services/CollatralCrud/create";
import { editCollatral } from "../../../services/CollatralCrud/update";
import { deleteCollatral } from "../../../services/CollatralCrud/delete";
import {
  extractEntityId,
  getErrorMessage,
  REQUEST_CHUNK_SIZE,
  uploadChunksSequentially,
  type UploadState,
} from "./requestShared";
import { useRequestReferenceData } from "./useRequestReferenceData";

// ─── Type Definitions ────────────────────────────────────────────
type TableFilter = { key: string; value: string };

interface UploadedFile {
  id: string;
  documentTypeId: number | null;
  documentTypeTitle: string;
  fileName: string;
  fileSize: number;
  fileFormat: string;
  fileAddress: string;
  source: "existing" | "new";
  uploadProgress: number;
  isUploading: boolean;
  isCompleting: boolean;
  isCompleted: boolean;
  userName: string;
  userRole: string;
  uploadDate: string;
  uploadTime: string;
  uploadId?: string;
  totalChunks?: number;
}

interface CollateralFormData {
  id?: number;
  personTypeId: number | null;
  collatralTypeId: number | null;
  firstName: string;
  lastName: string;
  nationalCode: string;
}

interface EditFormData {
  loanNumber: string;
  title: string;
  requestCode: string;
  amount: string;
  requestTypeId: number | null;
  departmentId: number | null;
  personalTypeId: number | null;
  description: string;
}

interface DetailDocWithFiles {
  doc: DocumentItem;
  files: DocumentFile[];
}

interface RequestDetail extends RequestItem {
  departmentTitle?: string;
  customerName?: string;
  customerCif?: string;
}

interface UserCacheData {
  name: string;
  role: string;
}

// ─── Constants ───────────────────────────────────────────────────
const EMPTY_EDIT_FORM: EditFormData = {
  loanNumber: "",
  title: "",
  requestCode: "",
  amount: "",
  requestTypeId: null,
  departmentId: null,
  personalTypeId: null,
  description: "",
};

function isCollateralEmpty(collateral: CollateralFormData): boolean {
  return (
    !collateral.personTypeId &&
    !collateral.collatralTypeId &&
    !collateral.firstName.trim() &&
    !collateral.lastName.trim() &&
    !collateral.nationalCode.trim()
  );
}

function isCollateralValid(collateral: CollateralFormData): boolean {
  return Boolean(
    collateral.personTypeId &&
      collateral.collatralTypeId &&
      collateral.firstName.trim(),
  );
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
export default function RequestViewPage() {
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const today = isoToPersian(new Date().toISOString());
  const now = new Date().toLocaleTimeString("fa-IR");
  const userName = user?.fullName || user?.username || "";

  // ─── State ─────────────────────────────────────────────────────
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [filters, setFilters] = useState<TableFilter[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestDetail | null>(
    null,
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [detailDocs, setDetailDocs] = useState<DetailDocWithFiles[]>([]);
  const [detailComments, setDetailComments] = useState<RequestCommentItem[]>(
    [],
  );
  const [detailCollaterals, setDetailCollaterals] = useState<CollatralItem[]>(
    [],
  );
  const [isSaving, setIsSaving] = useState(false);

  // Edit states
  const [editForm, setEditForm] = useState<EditFormData>(EMPTY_EDIT_FORM);
  const [editCollaterals, setEditCollaterals] = useState<CollateralFormData[]>(
    [],
  );
  const [editCustomerId, setEditCustomerId] = useState<number | null>(null);
  const [editCustomerCif, setEditCustomerCif] = useState("");
  const [editCustomerInfo, setEditCustomerInfo] = useState<{
    cif: string;
    name: string;
  } | null>(null);
  const [isEditSearchingCustomer, setIsEditSearchingCustomer] = useState(false);
  const [editFoundCustomers, setEditFoundCustomers] = useState<CustomerItem[]>(
    [],
  );
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [editComments, setEditComments] = useState<RequestCommentItem[]>([]);
  const [newComment, setNewComment] = useState("");

  // Upload states
  const [editUploadedFiles, setEditUploadedFiles] = useState<UploadedFile[]>(
    [],
  );
  const [editDocTypeId, setEditDocTypeId] = useState<number | null>(null);
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [isEditUploading, setIsEditUploading] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const editCancelRef = useRef<Set<string>>(new Set());
  const editUploadStateRef = useRef<Map<string, UploadState>>(new Map());
  const [editFileToDelete, setEditFileToDelete] = useState<string | null>(null);
  const activeRequestIdRef = useRef<number | null>(null);

  const referenceQueriesEnabled = isDetailOpen || isEditOpen;

  // Cache with ref to prevent unnecessary re-renders
  const userCacheRef = useRef<Map<number, UserCacheData>>(new Map());
  const [, setUserCacheVersion] = useState(0);

  // ─── Queries ───────────────────────────────────────────────────
  // 1. بهینه‌سازی شده: Server-Side Pagination با SkipCount و MaxResultCount
  const requestsQuery = useQuery({
    queryKey: ["requests-all-view", pagination.pageIndex, pagination.pageSize],
    queryFn: async () => {
      const response = await getAllRequests({
        skipCount: pagination.pageIndex * pagination.pageSize,
        maxResultCount: pagination.pageSize,
        sorting: "creationTime desc",
      });
      return response;
    },
    select: (data) => {
      const items = (data?.items ?? []) as RequestItem[];
      const totalCount = data.totalCount ?? items.length;

      // Client-side filtering روی داده‌های صفحه فعلی
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

  const {
    documentTypes,
    requestTypeOptions: typeOpts,
    departmentOptions: deptOpts,
    personalTypeOptions: persTypeOpts,
    collateralTypeOptions: collTypeOpts,
    documentTypeOptions: docTypeOpts,
  } = useRequestReferenceData(referenceQueriesEnabled);

  // ─── بهینه‌سازی شده: Fetch کاربران با deduplication و parallel ───
  useEffect(() => {
    const idsToFetch = new Set<number>();

    // جمع‌آوری ID های کاربران از تاریخچه - مستقیماً از selectedRequest
    (selectedRequest?.requestHistoryOutputDtos || []).forEach((history) => {
      if (
        history.reviewerUserId &&
        !userCacheRef.current.has(history.reviewerUserId)
      ) {
        idsToFetch.add(history.reviewerUserId);
      }
    });

    // جمع‌آوری ID های کاربران از کامنت‌های detail
    (selectedRequest?.requestCommentOutputDtos || []).forEach((comment) => {
      if (comment.userId && !userCacheRef.current.has(comment.userId)) {
        idsToFetch.add(comment.userId);
      }
    });

    // جمع‌آوری ID های کاربران از کامنت‌های edit
    detailComments.forEach((c) => {
      if (c.userId && !userCacheRef.current.has(c.userId)) {
        idsToFetch.add(c.userId);
      }
    });

    editComments.forEach((c) => {
      if (c.userId && !userCacheRef.current.has(c.userId)) {
        idsToFetch.add(c.userId);
      }
    });

    if (idsToFetch.size === 0) return;

    let cancelled = false;

    // Parallel fetch با Promise.allSettled
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
      setUserCacheVersion((version) => version + 1);
    };

    fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [
    selectedRequest?.requestHistoryOutputDtos,
    selectedRequest?.requestCommentOutputDtos,
    detailComments,
    editComments,
  ]);

  // ─── بهینه‌سازی شده: View Handler با درخواست‌های موازی ───
  const handleView = useCallback(
    async (req: RequestItem) => {
      activeRequestIdRef.current = req.id;
      setSelectedRequest(null);
      setDetailDocs([]);
      setDetailComments([]);
      setDetailCollaterals([]);
      setIsDetailOpen(true);

      try {
        await viewRequest(req.id);
        if (activeRequestIdRef.current !== req.id) return;

        // فقط یه call به getRequest - همۀ اطلاعات توش هست
        const detail = await getRequest(req.id);
        if (activeRequestIdRef.current !== req.id) return;

        setSelectedRequest(detail);

        // فقط برای document ها باید جداگانه call کنیم
        const allDocs = await getAllDocuments({
          requestId: req.id,
          maxResultCount: 5000,
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
        setDetailComments(detail.requestCommentOutputDtos ?? []);
        setDetailCollaterals(detail.collatralOutputDtos ?? []);
      } catch (err) {
        if (activeRequestIdRef.current === req.id) {
          console.error("Error in handleView:", err);
          showToast("خطا در بارگذاری جزئیات", "error");
        }
      }
    },
    [showToast],
  );
  // ─── بهینه‌سازی شده: Edit Handler با درخواست‌های موازی ───
  const handleEdit = useCallback(
    async (req: RequestItem) => {
      activeRequestIdRef.current = req.id;
      setSelectedRequest(null);
      setEditUploadedFiles([]);
      setEditComments([]);
      setEditCustomerId(null);
      setEditCustomerCif("");
      setEditCustomerInfo(null);
      setIsEditOpen(true);

      try {
        // فقط یه call - همۀ اطلاعات توش هست
        const detail = await getRequest(req.id);
        if (activeRequestIdRef.current !== req.id) return;

        setSelectedRequest(detail);

        // فرم رو پر کن
        setEditForm({
          loanNumber: detail.loanNumber ?? "",
          title: detail.title ?? "",
          requestCode: detail.requestCode ?? "",
          amount: detail.amount?.toString() ?? "",
          requestTypeId: detail.requestTypeId ?? null,
          departmentId: detail.departmentId ?? null,
          personalTypeId: detail.personalTypeId ?? null,
          description: detail.description ?? "",
        });

        // مشتری
        if (detail.customerId && detail.customerOutputDto) {
          setEditCustomerId(detail.customerId);
          setEditCustomerCif(
            detail.customerOutputDto.cifNumber || String(detail.customerId),
          );
          setEditCustomerInfo({
            cif:
              detail.customerOutputDto.cifNumber || String(detail.customerId),
            name: detail.customerOutputDto.name || "-",
          });
        } else {
          setEditCustomerId(null);
          setEditCustomerCif("");
          setEditCustomerInfo(null);
        }

        // وثیقه‌ها - از همون response میاد
        const collaterals = detail.collatralOutputDtos ?? [];
        setEditCollaterals(
          collaterals.length > 0
            ? collaterals.map((c): CollateralFormData => ({
                id: c.id,
                personTypeId: c.personTypeId ?? null,
                collatralTypeId: c.collatralTypeId ?? null,
                firstName: c.firstName ?? "",
                lastName: c.lastName ?? "",
                nationalCode: c.nationalCode ?? "",
              }))
            : [
                {
                  personTypeId: null,
                  collatralTypeId: null,
                  firstName: "",
                  lastName: "",
                  nationalCode: "",
                },
              ],
        );

        // فقط document ها جداگانه
        const allDocs = await getAllDocuments({
          requestId: req.id,
          maxResultCount: 5000,
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

        // فایل‌های موجود
        const existingFiles: UploadedFile[] = docsWithFiles.flatMap(
          ({ doc, files }) =>
            files.map((f: DocumentFile): UploadedFile => ({
              id: f.id?.toString() || crypto.randomUUID(),
              documentTypeId: doc.documentTypeId ?? null,
              documentTypeTitle:
                docTypeOpts.find((o) => o.id === doc.documentTypeId)?.title ||
                "",
              fileName: f.fileName,
              fileSize: Number(f.fileSize),
              fileFormat: f.extension,
              fileAddress: f.filePath,
              source: "existing",
              uploadProgress: 100,
              isUploading: false,
              isCompleting: false,
              isCompleted: true,
              userName: "",
              userRole: "",
              uploadDate: "",
              uploadTime: "",
              uploadId: undefined,
            })),
        );

        setEditUploadedFiles(existingFiles);
        setEditComments(detail.requestCommentOutputDtos ?? []);
        setNewComment("");
        setEditDocTypeId(null);
        setEditSelectedFile(null);
      } catch (err) {
        if (activeRequestIdRef.current === req.id) {
          console.error("Error in handleEdit:", err);
          showToast("خطا در بارگذاری ویرایش", "error");
        }
      }
    },
    [showToast, docTypeOpts],
  );

  // ─── بهینه‌سازی شده: Immutable Collateral Updates ──────────────
  const handleCollateralFieldChange = useCallback(
    (
      index: number,
      field: keyof CollateralFormData,
      value: string | number | null,
    ) => {
      setEditCollaterals((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
                ...item,
                [field]:
                  field === "personTypeId" || field === "collatralTypeId"
                    ? value
                      ? Number(value)
                      : null
                    : value,
              }
            : item,
        ),
      );
    },
    [],
  );

  const handleAddCollateral = useCallback(() => {
    setEditCollaterals((prev) => [
      ...prev,
      {
        personTypeId: null,
        collatralTypeId: null,
        firstName: "",
        lastName: "",
        nationalCode: "",
      },
    ]);
  }, []);

  const handleRemoveCollateral = useCallback((index: number) => {
    setEditCollaterals((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ─── Edit Form Field Handlers ──────────────────────────────────
  const handleEditFormChange = useCallback(
    (field: keyof EditFormData, value: string | number | null) => {
      setEditForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  // ─── Upload Handlers ──────────────────────────────────────────
  const handleEditFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) setEditSelectedFile(f);
      e.target.value = "";
    },
    [],
  );

  const handleEditResumeUpload = useCallback(
    async (file: UploadedFile) => {
      const state = editUploadStateRef.current.get(file.id);
      if (!state?.file || !state?.uploadId) {
        showToast("امکان ادامه آپلود وجود ندارد", "error");
        return;
      }

      state.isPaused = false;
      const startIndex = (state.lastUploadedChunk ?? -1) + 1;

      setEditUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? { ...f, isUploading: true, isCompleted: false }
            : f,
        ),
      );

      try {
        await uploadChunksSequentially({
          itemId: file.id,
          file: state.file,
          uploadId: state.uploadId,
          totalChunks: state.totalChunks,
          startIndex,
          cancelRef: editCancelRef,
          uploadStateRef: editUploadStateRef,
          setFiles: setEditUploadedFiles,
        });

        setEditUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  isUploading: false,
                  isCompleted: true,
                  fileAddress: state.uploadId,
                }
              : f,
          ),
        );

        editUploadStateRef.current.delete(file.id);
        showToast("فایل با موفقیت آپلود شد", "success");
      } catch (error: unknown) {
        setEditUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, isUploading: false } : f,
          ),
        );
        showToast(`خطا: ${getErrorMessage(error)}`, "warning");
      }
    },
    [showToast],
  );

  const handleEditPauseUpload = useCallback((docId: string) => {
    const state = editUploadStateRef.current.get(docId);
    if (state) state.isPaused = true;
    setEditUploadedFiles((prev) =>
      prev.map((f) => (f.id === docId ? { ...f, isUploading: false } : f)),
    );
  }, []);

  const handleEditStartUpload = useCallback(async () => {
    if (!editDocTypeId) {
      showToast("لطفاً نوع مدرک را انتخاب کنید", "error");
      return;
    }
    if (!editSelectedFile) {
      showToast("لطفاً فایل را انتخاب کنید", "error");
      return;
    }

    const file = editSelectedFile;
    const docId = crypto.randomUUID();
    const format = file.name.split(".").pop() || "";
    const docType = documentTypes.find(
      (d: DocumentTypeItem) => d.id === editDocTypeId,
    );
    if (file.size === 0) {
      showToast("فایل انتخاب‌شده خالی است", "error");
      return;
    }

    const totalChunks = Math.ceil(file.size / REQUEST_CHUNK_SIZE);

    const newFile: UploadedFile = {
      id: docId,
      documentTypeId: editDocTypeId,
      documentTypeTitle: docType?.title ?? "",
      fileName: file.name,
      fileSize: file.size,
      fileFormat: format,
      fileAddress: "",
      source: "new",
      uploadProgress: 0,
      isUploading: true,
      isCompleting: false,
      isCompleted: false,
      userName,
      userRole: user?.roles || "",
      uploadDate: today,
      uploadTime: now,
      totalChunks,
    };

    setEditUploadedFiles((prev) => [newFile, ...prev]);
    setEditSelectedFile(null);
    setIsEditUploading(true);

    try {
      const startRes = await startUpload({
        fileName: file.name,
        fileSize: file.size,
        chunkSize: REQUEST_CHUNK_SIZE,
      });
      const uploadId = (
        startRes as typeof startRes & { result?: { uploadId?: string } }
      ).result?.uploadId ?? startRes.uploadId;
      if (!uploadId) {
        throw new Error("شناسه آپلود از سرور دریافت نشد");
      }

      editUploadStateRef.current.set(docId, {
        file,
        uploadId,
        totalChunks,
        lastUploadedChunk: -1,
        isPaused: false,
        isCompleting: false,
      });

      setEditUploadedFiles((prev) =>
        prev.map((f) => (f.id === docId ? { ...f, uploadId } : f)),
      );

      await uploadChunksSequentially({
        itemId: docId,
        file,
        uploadId,
        totalChunks,
        startIndex: 0,
        cancelRef: editCancelRef,
        uploadStateRef: editUploadStateRef,
        setFiles: setEditUploadedFiles,
      });

      setEditUploadedFiles((prev) =>
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

      editUploadStateRef.current.delete(docId);
      showToast("فایل با موفقیت آپلود شد", "success");
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      if (message !== "آپلود لغو شد" && message !== "آپلود متوقف شد") {
        setEditUploadedFiles((prev) =>
          prev.map((f) => (f.id === docId ? { ...f, isUploading: false } : f)),
        );
        showToast(`خطا: ${message}`, "warning");
      }
    } finally {
      setIsEditUploading(false);
    }
  }, [
    editDocTypeId,
    editSelectedFile,
    documentTypes,
    userName,
    user?.roles,
    today,
    now,
    showToast,
  ]);

  const handleEditDeleteFile = useCallback((id: string) => {
    setEditFileToDelete(id);
  }, []);

  const confirmEditDeleteFile = useCallback(() => {
    if (editFileToDelete) {
      editCancelRef.current.add(editFileToDelete);
      editUploadStateRef.current.delete(editFileToDelete);
      setEditUploadedFiles((prev) =>
        prev.filter((f) => f.id !== editFileToDelete),
      );
      setEditFileToDelete(null);
    }
  }, [editFileToDelete]);

  // ─── Customer Search Handlers ──────────────────────────────────
  const handleEditFindCustomer = useCallback(async () => {
    const cif = editCustomerCif.trim();
    if (!cif) {
      showToast("لطفاً شماره مشتری را وارد کنید", "error");
      return;
    }

    setIsEditSearchingCustomer(true);
    try {
      const customers = await findCustomer(cif);
      if (customers.length === 0) {
        setEditCustomerId(null);
        setEditCustomerInfo(null);
        showToast("مشتری با این شماره یافت نشد", "warning");
      } else if (customers.length === 1) {
        const c = customers[0];
        setEditCustomerId(c.id);
        setEditCustomerInfo({
          cif: c.cifNumber || cif,
          name: c.name || "-",
        });
        showToast("مشتری یافت شد", "success");
      } else {
        setEditFoundCustomers(customers);
        setIsEditCustomerModalOpen(true);
      }
    } catch (error: unknown) {
      console.error("Error finding customer:", error);
      showToast(getErrorMessage(error, "خطا در جستجوی مشتری"), "error");
    } finally {
      setIsEditSearchingCustomer(false);
    }
  }, [editCustomerCif, showToast]);

  const handleEditSelectCustomer = useCallback((c: CustomerItem) => {
    setEditCustomerId(c.id);
    setEditCustomerCif(c.cifNumber || "");
    setEditCustomerInfo({
      cif: c.cifNumber || "",
      name: c.name || "-",
    });
    setIsEditCustomerModalOpen(false);
  }, []);

  const handleClearCustomer = useCallback(() => {
    setEditCustomerId(null);
    setEditCustomerCif("");
    setEditCustomerInfo(null);
  }, []);

  // ─── Save Handler ────────────────────────────────────────────
  const handleSaveEdit = useCallback(async () => {
    if (!selectedRequest) return;

    const amount = Number(editForm.amount);
    if (!editForm.loanNumber.trim() || !editForm.title.trim()) {
      showToast("شماره پرونده و عنوان الزامی هستند", "error");
      return;
    }
    if (
      !editForm.requestTypeId ||
      !editForm.departmentId ||
      !editForm.personalTypeId
    ) {
      showToast("نوع درخواست، دپارتمان و نوع شخص الزامی هستند", "error");
      return;
    }
    if (!editCustomerId) {
      showToast("لطفاً مشتری را استعلام و انتخاب کنید", "error");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast("مبلغ واردشده معتبر نیست", "error");
      return;
    }

    const activeCollaterals = editCollaterals.filter(
      (collateral) => !isCollateralEmpty(collateral),
    );
    if (activeCollaterals.some((collateral) => !isCollateralValid(collateral))) {
      showToast("اطلاعات وثیقه‌گذار را کامل وارد کنید", "error");
      return;
    }

    setIsSaving(true);
    try {
      await editRequest({
        id: selectedRequest.id,
        requestTypeId: editForm.requestTypeId,
        departmentId: editForm.departmentId,
        customerId: editCustomerId,
        title: editForm.title.trim(),
        requestCode: editForm.requestCode,
        loanNumber: editForm.loanNumber.trim(),
        amount,
        description: editForm.description,
        personalTypeId: editForm.personalTypeId,
        requestStatusCode: selectedRequest.requestStatusCode,
      } as EditRequestBody);

      const originalCollateralIds = new Set(
        (selectedRequest.collatralOutputDtos ?? []).map(
          (collateral) => collateral.id,
        ),
      );
      const retainedCollateralIds = new Set(
        activeCollaterals
          .map((collateral) => collateral.id)
          .filter((id): id is number => typeof id === "number"),
      );

      const collateralOperations: Promise<unknown>[] = [];

      originalCollateralIds.forEach((id) => {
        if (!retainedCollateralIds.has(id)) {
          collateralOperations.push(deleteCollatral(id));
        }
      });

      activeCollaterals.forEach((collateral) => {
        const body = {
          collatralTypeId: collateral.collatralTypeId!,
          requestId: selectedRequest.id,
          firstName: collateral.firstName.trim(),
          lastName: collateral.lastName.trim(),
          nationalCode: collateral.nationalCode.trim(),
          personTypeId: collateral.personTypeId!,
        };

        collateralOperations.push(
          collateral.id
            ? editCollatral({ id: collateral.id, ...body })
            : createCollatral(body),
        );
      });

      await Promise.all(collateralOperations);

      // Add comment if exists
      if (newComment.trim()) {
        await createRequestComment({
          requestId: selectedRequest.id,
          userId: Number(user?.id || 0),
          description: newComment.trim(),
        });
      }

      // Upload new files
      const newFiles = editUploadedFiles.filter(
        (f) => f.isCompleted && f.source === "new",
      );

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
          const docRes = await createDocument({
            documentTypeId: dtId,
            requestId: selectedRequest.id,
          });
          const docId = extractEntityId(docRes, "سند");

          files.forEach((f) => {
            if (f.uploadId)
              batchItems.push({ uploadId: f.uploadId, documentId: docId });
          });
        }

        if (batchItems.length > 0) {
          await completeBatchUpload({ items: batchItems });
        }
      }

      showToast("ذخیره شد", "success");
      setIsEditOpen(false);
      requestsQuery.refetch();
    } catch (error: unknown) {
      console.error("Error saving edit:", error);
      showToast(getErrorMessage(error, "خطا در ذخیره‌سازی"), "error");
    } finally {
      setIsSaving(false);
    }
  }, [
    selectedRequest,
    editForm,
    editCustomerId,
    editCollaterals,
    newComment,
    user,
    editUploadedFiles,
    requestsQuery,
    showToast,
  ]);

  // ─── Columns Definition (Optimized with useCallback references) ──
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
        header: "جزئیات",
        cell: ({ row }) => (
          <button
            onClick={() => handleView(row.original)}
            className="text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </button>
        ),
      },
      {
        id: "actions",
        header: "عملیات",
        cell: ({ row }) => (
          <button
            onClick={() => handleEdit(row.original)}
            className="text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
          </button>
        ),
      },
    ],
    [handleView, handleEdit],
  );

  // ─── Filter Change Handler ────────────────────────────────────
  const handleFiltersChange = useCallback((nf: TableFilter[]) => {
    const lastFilter = nf.at(-1);
    setFilters(lastFilter ? [lastFilter] : []);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  // ─── Helper function to get user cache data ──────────────────
  const getUserCacheData = useCallback((userId: number): UserCacheData => {
    return (
      userCacheRef.current.get(userId) || {
        name: `کاربر ${userId}`,
        role: "-",
      }
    );
  }, []);

  // ─── Render ──────────────────────────────────────────────────
  return (
    <MainLayout.Main maxWidth="screen-xl">
      <PageTitle title="مشاهده و پیگیری درخواست‌ها" />
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
          skeletonColumns={7}
          emptyStateMessage="هیچ درخواستی یافت نشد"
        />
      </div>

      {/* ─── مودال جزئیات ─── */}
      <Modal
        isOpen={isDetailOpen}
        isRTL
        header="جزئیات پرونده"
        onClose={() => setIsDetailOpen(false)}
        overlayLock={false}
        renderContent={() => {
          if (!selectedRequest) return <p>در حال بارگذاری...</p>;

          const histories = selectedRequest.requestHistoryOutputDtos || [];

          const createHistory = histories.find((history) =>
            history.description?.includes("ایجاد گردید"),
          );

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

              {/* کاربر ایجاد کننده */}
              {createHistory && (
                <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-bold">
                      {(createHistory.description?.match(
                        /توسط کاربر (.+?) با کد/,
                      ) || ["", "?"])[1]?.charAt(0) || "?"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">
                      {(createHistory.description?.match(
                        /توسط کاربر (.+?) با کد/,
                      ) || ["", "-"])[1] || "-"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getUserCacheData(createHistory.reviewerUserId ?? 0).role}
                      {createHistory.creationTime
                        ? isoToPersian(createHistory.creationTime)
                        : "-"}
                    </p>
                  </div>
                </div>
              )}

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
                      {histories.map((history, index) => (
                        <div
                          key={history.id}
                          className="flex items-start gap-3 relative"
                        >
                          <div
                            className={`w-3 h-3 rounded-full mt-1 z-10 flex-shrink-0 ${
                              index === 0
                                ? "bg-blue-500 ring-2 ring-blue-200"
                                : "bg-gray-300"
                            }`}
                          ></div>
                          <div className="flex-1 bg-white rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-700">
                              {history.description}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {history.creationTime
                                ? isoToPersian(history.creationTime)
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
              {detailCollaterals.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-blue-900 mb-3 text-base border-b border-gray-200 pb-2">
                    وثیقه گذاران{" "}
                    <span className="text-gray-400 text-xs font-normal mr-2">
                      ({detailCollaterals.length} نفر)
                    </span>
                  </h4>
                  <div className="space-y-2">
                    {detailCollaterals.map((c, i) => (
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
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                          {persTypeOpts.find(
                            (o) => String(o.id) === String(c.personTypeId),
                          )?.title || "—"}
                        </span>
                      </div>
                    ))}
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
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )),
                    )}
                  </div>
                </div>
              )}

              {/* توضیحات کارشناس */}
              {detailComments.length > 0 && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                  <h4 className="font-bold text-yellow-800 mb-3 text-base border-b border-yellow-200 pb-2">
                    توضیحات کارشناس{" "}
                    <span className="text-yellow-600 text-xs font-normal mr-2">
                      ({detailComments.length} مورد)
                    </span>
                  </h4>
                  <div className="space-y-2">
                    {detailComments.map((c) => {
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
            </div>
          );
        }}
        footerButtons={
          <FormButton
            title="بستن"
            variant="secondary"
            onClick={() => setIsDetailOpen(false)}
          />
        }
      />

      {/* ─── مودال ویرایش ─── */}
      <Modal
        isOpen={isEditOpen}
        isRTL
        header="ویرایش درخواست"
        onClose={() => setIsEditOpen(false)}
        overlayLock={isSaving}
        className="min-w-0 overflow-x-hidden"
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title="ذخیره"
              variant="success"
              onClick={handleSaveEdit}
              isLoading={isSaving}
              disabled={isSaving}
            />
            <FormButton
              title="انصراف"
              variant="secondary"
              onClick={() => setIsEditOpen(false)}
            />
          </div>
        }
        renderContent={() => (
          <div className="space-y-4 max-h-[65vh] overflow-y-auto">
            {/* فرم اصلی */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                id="e-loan"
                name="loanNumber"
                label="شماره پرونده"
                value={editForm.loanNumber}
                onChange={(v) => handleEditFormChange("loanNumber", v)}
                dir="ltr"
                required
              />
              <FormInput
                id="e-title"
                name="title"
                label="عنوان"
                value={editForm.title}
                onChange={(v) => handleEditFormChange("title", v)}
                dir="rtl"
                required
              />
              <FormInput
                id="e-code"
                name="requestCode"
                label="شماره مصوبه"
                value={editForm.requestCode}
                onChange={(v) => handleEditFormChange("requestCode", v)}
                dir="ltr"
              />
              <FormInput
                id="e-amount"
                name="amount"
                label="مبلغ (ریال)"
                value={editForm.amount}
                onChange={(v) => handleEditFormChange("amount", v)}
                dir="ltr"
                type="number"
                required
              />
              <FormSelect<number>
                id="e-rtype"
                name="requestTypeId"
                label="نوع درخواست"
                value={editForm.requestTypeId ?? ""}
                onChange={(v) =>
                  handleEditFormChange("requestTypeId", v ? Number(v) : null)
                }
                options={typeOpts}
              />
              <FormSelect<number>
                id="e-dept"
                name="departmentId"
                label="دپارتمان"
                value={editForm.departmentId ?? ""}
                onChange={(v) =>
                  handleEditFormChange("departmentId", v ? Number(v) : null)
                }
                options={deptOpts}
              />
              <FormSelect<number>
                id="e-ptype"
                name="personalTypeId"
                label="نوع شخص"
                value={editForm.personalTypeId ?? ""}
                onChange={(v) =>
                  handleEditFormChange("personalTypeId", v ? Number(v) : null)
                }
                options={persTypeOpts}
              />

              {/* جستجوی مشتری */}
              <div className="relative">
                <FormInput
                  id="e-requester"
                  name="requesterName"
                  label="درخواست کننده (شماره مشتری)"
                  value={editCustomerCif}
                  onChange={(v) => {
                    setEditCustomerCif(v);
                    setEditCustomerId(null);
                    setEditCustomerInfo(null);
                  }}
                  dir="ltr"
                />
                <button
                  onClick={handleEditFindCustomer}
                  disabled={
                    !editCustomerCif.trim() || isEditSearchingCustomer
                  }
                  className="absolute bottom-2 left-2 rounded-md p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </button>
              </div>

              {editCustomerInfo && (
                <div className="md:col-span-2 flex items-center gap-2 p-2 bg-green-50 rounded text-xs">
                  <svg
                    className="w-4 h-4 text-green-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span>{editCustomerInfo.name}</span>
                  <span className="text-gray-300">|</span>
                  <span dir="ltr">{editCustomerInfo.cif}</span>
                  <button
                    onClick={handleClearCustomer}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* توضیحات */}
              <div className="md:col-span-2">
                <FormTextarea
                  id="e-desc"
                  name="description"
                  label="توضیحات"
                  value={editForm.description}
                  onChange={(v) => handleEditFormChange("description", v)}
                  rows={3}
                  dir="rtl"
                />
              </div>
            </div>

            {/* وثیقه گذاران */}
            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-sm">وثیقه گذاران</h4>
                <button
                  onClick={handleAddCollateral}
                  className="text-xs text-green-600 hover:text-green-800 cursor-pointer"
                >
                  + افزودن
                </button>
              </div>
              {editCollaterals.map((col, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 p-2 bg-gray-50 rounded relative"
                >
                  {editCollaterals.length > 1 && (
                    <button
                      onClick={() => handleRemoveCollateral(i)}
                      className="absolute top-1 right-1 text-red-400 hover:text-red-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                  <FormSelect<number>
                    id={`ec-pt-${i}`}
                    name={`ec-pt-${i}`}
                    label="نوع شخص"
                    value={col.personTypeId ?? ""}
                    onChange={(v) =>
                      handleCollateralFieldChange(i, "personTypeId", v)
                    }
                    options={persTypeOpts}
                  />
                  <FormSelect<number>
                    id={`ec-ct-${i}`}
                    name={`ec-ct-${i}`}
                    label="نوع وثیقه"
                    value={col.collatralTypeId ?? ""}
                    onChange={(v) =>
                      handleCollateralFieldChange(i, "collatralTypeId", v)
                    }
                    options={collTypeOpts}
                  />
                  <FormInput
                    id={`ec-fn-${i}`}
                    name={`ec-fn-${i}`}
                    label="نام"
                    value={col.firstName}
                    onChange={(v) =>
                      handleCollateralFieldChange(i, "firstName", v)
                    }
                    dir="rtl"
                  />
                  <FormInput
                    id={`ec-ln-${i}`}
                    name={`ec-ln-${i}`}
                    label="نام خانوادگی"
                    value={col.lastName}
                    onChange={(v) =>
                      handleCollateralFieldChange(i, "lastName", v)
                    }
                    dir="rtl"
                  />
                  <FormInput
                    id={`ec-nc-${i}`}
                    name={`ec-nc-${i}`}
                    label="کد ملی"
                    value={col.nationalCode}
                    onChange={(v) =>
                      handleCollateralFieldChange(i, "nationalCode", v)
                    }
                    dir="ltr"
                  />
                </div>
              ))}
            </div>

            {/* مدارک پیوست شده */}
            {editUploadedFiles.length > 0 && (
              <div className="border-t pt-3">
                <h4 className="font-bold text-sm mb-2">مدارک پیوست</h4>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border text-right">نوع مدرک</th>
                      <th className="p-2 border text-right">نام فایل</th>
                      <th className="p-2 border text-right">حجم</th>
                      <th className="p-2 border text-right">وضعیت</th>
                      <th className="p-2 border text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editUploadedFiles.map((f) => (
                      <tr key={f.id} className="border-b">
                        <td className="p-2 border">
                          {docTypeOpts.find(
                            (option) => option.id === f.documentTypeId,
                          )?.title ||
                            f.documentTypeTitle ||
                            "-"}
                        </td>
                        <td className="p-2 border">{f.fileName}</td>
                        <td className="p-2 border">
                          {(f.fileSize / 1024).toFixed(1)} KB
                        </td>
                        <td className="p-2 border">
                          {f.isUploading ? (
                            <div className="flex items-center gap-1">
                              <div className="flex-1 bg-gray-200 rounded-full h-1.5 w-20">
                                <div
                                  className="bg-blue-600 h-1.5 rounded-full"
                                  style={{
                                    width: `${f.uploadProgress}%`,
                                  }}
                                ></div>
                              </div>
                              <span>{f.uploadProgress}%</span>
                              <button
                                onClick={() => handleEditPauseUpload(f.id)}
                                className="text-yellow-600"
                              >
                                ⏸
                              </button>
                            </div>
                          ) : f.isCompleted ? (
                            "✅ تکمیل"
                          ) : (
                            <button
                              onClick={() => handleEditResumeUpload(f)}
                              className="text-green-600"
                            >
                              ▶ ادامه
                            </button>
                          )}
                        </td>
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
                            onClick={() => handleEditDeleteFile(f.id)}
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

            {/* آپلود فایل جدید */}
            <div className="border-t pt-3">
              <h4 className="font-bold text-sm mb-2">آپلود مدرک جدید</h4>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-48">
                  <FormSelect<number>
                    id="edit-doc-type"
                    name="edit-doc-type"
                    label="نوع مدارک"
                    value={editDocTypeId ?? ""}
                    onChange={(v) => setEditDocTypeId(v ? Number(v) : null)}
                    options={docTypeOpts}
                  />
                </div>
                <button
                  onClick={() => editFileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer text-sm"
                >
                  <Upload className="w-4 h-4 text-blue-500" />
                  <span className="truncate max-w-[120px]">
                    {editSelectedFile ? editSelectedFile.name : "انتخاب فایل"}
                  </span>
                </button>
                <input
                  ref={editFileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleEditFileSelect}
                />
                <FormButton
                  title="آپلود"
                  variant="primary"
                  size="sm"
                  onClick={handleEditStartUpload}
                  isLoading={isEditUploading}
                  disabled={
                    isEditUploading || !editSelectedFile || !editDocTypeId
                  }
                />
              </div>
            </div>

            {/* توضیحات کارشناس قبلی */}
            {editComments.length > 0 && (
              <div className="border-t pt-3">
                <h4 className="font-bold text-sm mb-2">توضیحات کارشناس قبلی</h4>
                {editComments.map((c) => {
                  const userData = getUserCacheData(c.userId || 0);
                  return (
                    <div
                      key={c.id}
                      className="bg-yellow-50 p-2 rounded mb-1 text-xs"
                    >
                      <p className="text-gray-500">{userData.name}</p>
                      <p>{c.description}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* افزودن توضیح جدید */}
            <div className="border-t pt-3">
              <h4 className="font-bold text-sm mb-2">افزودن توضیح جدید</h4>
              <FormTextarea
                id="new-comment"
                name="new-comment"
                label="توضیحات کارشناس"
                value={newComment}
                onChange={(v) => setNewComment(v)}
                rows={3}
                dir="rtl"
              />
            </div>
          </div>
        )}
      />

      {/* مودال تأیید حذف فایل */}
      <Modal
        isOpen={!!editFileToDelete}
        isRTL
        header="تأیید حذف فایل"
        onClose={() => setEditFileToDelete(null)}
        overlayLock={false}
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title="حذف"
              variant="danger"
              onClick={confirmEditDeleteFile}
            />
            <FormButton
              title="انصراف"
              variant="secondary"
              onClick={() => setEditFileToDelete(null)}
            />
          </div>
        }
        renderContent={() => <p>آیا از حذف این فایل اطمینان دارید؟</p>}
      />

      {/* مودال انتخاب مشتری */}
      <Modal
        isOpen={isEditCustomerModalOpen}
        isRTL
        header="انتخاب مشتری"
        onClose={() => setIsEditCustomerModalOpen(false)}
        overlayLock={false}
        renderContent={() => (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              {editFoundCustomers.length} مشتری یافت شد:
            </p>
            <DataTable<CustomerItem>
              query={{
                data: {
                  listResult: editFoundCustomers,
                  total: editFoundCustomers.length,
                  totalPages: 1,
                },
                isLoading: false,
                isError: false,
                isFetching: false,
              }}
              columns={[
                {
                  id: "cifNumber",
                  header: "شماره مشتری",
                  cell: ({ row }) => row.original.cifNumber || "-",
                },
                {
                  id: "name",
                  header: "نام مشتری",
                  cell: ({ row }) => row.original.name || "-",
                },
                {
                  id: "select",
                  header: "انتخاب",
                  cell: ({ row }) => (
                    <FormButton
                      title="انتخاب"
                      variant="primary"
                      size="sm"
                      onClick={() => handleEditSelectCustomer(row.original)}
                    />
                  ),
                },
              ]}
              pagination={{ pageIndex: 0, pageSize: 10 }}
              onPaginationChange={() => {}}
              filters={[]}
              onFiltersChange={() => {}}
              filterFields={[]}
              skeletonColumns={3}
            />
          </div>
        )}
        footerButtons={
          <FormButton
            title="انصراف"
            variant="secondary"
            onClick={() => setIsEditCustomerModalOpen(false)}
          />
        }
      />
    </MainLayout.Main>
  );
}
