import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle2,
  ClipboardList,
  Download,
  FilePenLine,
  MessageSquareText,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  UsersRound,
} from "lucide-react";

import { MainLayout } from "../../../baseComponents/MainLayout";
import FormInput from "../../../baseComponents/FormInput";
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
import FormSection from "../../../baseComponents/FormSection";
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
import { getAllRequestStatus } from "../../../services/RequestStatusCrud/getAll";
import { viewRequest } from "../../../services/RequestCrud/viewRequest";
import { deleteDocumentFiles } from "../../../services/FileService/deleteDocumentFiles";
import { getPropertyAppraisalByRequestId } from "../../../services/PropertyAppraisalCrud/getByRequestId";
import type { PropertyAppraisalOutputDto } from "../../../services/PropertyAppraisalCrud/types";
import { getPropertyAppraisalLookups } from "../../../services/PropertyAppraisalCrud/getLookups";
import PropertyAppraisalReadOnlyModal from "../../../baseComponents/PropertyAppraisalReadOnlyModal";
import { generateAppraisalPdf } from "../../../utils/htmlPdfGenerator";

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
import {
  isoToPersian,
  isoToPersianDateTime,
  persianToISO,
} from "../../../utils/persianToISO";
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
import {
  REQUEST_DEPARTMENT_TYPES,
  type RequestDepartmentTypeConfig,
} from "../requestDepartmentTypes";
import { resolveRequestStatusTitle } from "../requestStatuses";

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

// ─── Main Component ──────────────────────────────────────────────
interface RequestViewPageProps {
  departmentType: RequestDepartmentTypeConfig;
}

const getDepartmentName = (id: number | null | undefined): string => {
  switch (Number(id)) {
    case REQUEST_DEPARTMENT_TYPES.branch.id:
      return REQUEST_DEPARTMENT_TYPES.branch.name;
    case REQUEST_DEPARTMENT_TYPES.independentBranch.id:
      return REQUEST_DEPARTMENT_TYPES.independentBranch.name;
    case REQUEST_DEPARTMENT_TYPES.region.id:
      return REQUEST_DEPARTMENT_TYPES.region.name;
    case REQUEST_DEPARTMENT_TYPES.mainOffice.id:
      return REQUEST_DEPARTMENT_TYPES.mainOffice.name;
    default:
      return "نامشخص";
  }
};

export function DepartmentRequestViewPage({
  departmentType,
}: RequestViewPageProps) {
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
  const [editCustomerNationalCode, setEditCustomerNationalCode] = useState("");
  const [editCustomerInfo, setEditCustomerInfo] = useState<{
    cif: string;
    name: string;
    nationalCode: string;
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
  const deletedFileIdsRef = useRef<number[]>([]);

  const [, setUserCacheVersion] = useState(0);
  const [allAppraisals, setAllAppraisals] = useState<
    PropertyAppraisalOutputDto[]
  >([]);
  const [selectedReadonlyAppraisal, setSelectedReadonlyAppraisal] =
    useState<PropertyAppraisalOutputDto | null>(null);
  const [isAppraisalReadOnlyOpen, setIsAppraisalReadOnlyOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // ─── Queries ───────────────────────────────────────────────────
  // 1. بهینه‌سازی شده: Server-Side Pagination با SkipCount و MaxResultCount
  const requestsQuery = useQuery({
    queryKey: [
      "requests-all-view",
      departmentType.id,
      pagination.pageIndex,
      pagination.pageSize,
      filters,
    ],
    queryFn: async () => {
      const requestFilters = Object.fromEntries(
        filters
          .filter((filter) => filter.value.trim())
          .map((filter) => {
            if (filter.key === "creationTime") {
              const rawDate = filter.value.trim();
              const isoDate = /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(rawDate)
                ? rawDate
                : persianToISO(rawDate);
              return [filter.key, isoDate || rawDate];
            }
            return [filter.key, filter.value.trim()];
          }),
      ) as {
        requestStatusTitle?: string;
        actorUserFullName?: string;
        creationTime?: string;
      };

      return getAllRequests({
        ...requestFilters,
        currentDepartmentTypeName: departmentType.name,
        skipCount: pagination.pageIndex * pagination.pageSize,
        maxResultCount: pagination.pageSize,
        sorting: "creationTime desc",
      });
    },
    select: (data) => {
      const items = (data?.items ?? []) as RequestItem[];
      const totalCount = data.totalCount ?? items.length;

      return {
        listResult: items,
        total: totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / pagination.pageSize)),
      };
    },
    placeholderData: (previousData) => previousData,
  });

  const statusQuery = useQuery({
    queryKey: ["request-statuses"],
    queryFn: () => getAllRequestStatus({ maxResultCount: 100 }),
    staleTime: 10 * 60 * 1000,
  });
  const statuses = statusQuery.data?.items;

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

  const lookupsQuery = useQuery({
    queryKey: ["property-appraisal-lookups"],
    queryFn: getPropertyAppraisalLookups,
    staleTime: 10 * 60 * 1000,
    enabled: isDetailOpen,
  });

  // ─── بهینه‌سازی شده: View Handler با درخواست‌های موازی ───
  const handleView = useCallback(
    async (req: RequestItem) => {
      activeRequestIdRef.current = req.id;
      setSelectedRequest(null);
      setDetailDocs([]);
      setDetailComments([]);
      setDetailCollaterals([]);
      setIsAppraisalReadOnlyOpen(false);
      setIsDetailOpen(true);

      try {
        await viewRequest(req.id);
        if (activeRequestIdRef.current !== req.id) return;

        const detail = await getRequest(req.id);
        if (activeRequestIdRef.current !== req.id) return;

        setSelectedRequest(detail);

        // 👇 لود فرم ارزیابی اگه وجود داره
        try {
          const appraisals = await getPropertyAppraisalByRequestId(req.id);
          setAllAppraisals(appraisals);
        } catch {
          // فرم ارزیابی نداره - نادیده بگیر
        }

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
        setDetailComments(
          (detail.requestCommentOutputDtos ?? []).map((comment) => ({
            id: comment.id,
            requestId: req.id,
            userId: comment.userId ?? null,
            description: comment.description ?? "", // تبدیل null به رشته خالی
            creationTime: comment.creationTime ?? "", // تبدیل null به رشته خالی
          })),
        );
        setDetailCollaterals(detail.collatralOutputDtos ?? []);
      } catch (err) {
        if (activeRequestIdRef.current === req.id) {
          console.error("Error in handleView:", err);
          showToast("خطا در بارگذاری جزئیات", "error");
        }
      }
    },
    [departmentType.id, showToast],
  );
  // ─── بهینه‌سازی شده: Edit Handler با درخواست‌های موازی ───
  const handleEdit = useCallback(
    async (req: RequestItem) => {
      activeRequestIdRef.current = req.id;
      setSelectedRequest(null);
      setEditUploadedFiles([]);
      setEditComments([]);
      setEditCustomerId(null);
      setEditCustomerNationalCode("");
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
          const nationalCode = detail.customerOutputDto.nationalCode || "";
          setEditCustomerId(detail.customerId);
          setEditCustomerNationalCode(nationalCode);
          setEditCustomerInfo({
            cif: detail.customerOutputDto.cifNumber || "-",
            name: detail.customerOutputDto.name || "-",
            nationalCode: nationalCode || "-",
          });
        } else {
          setEditCustomerId(null);
          setEditCustomerNationalCode("");
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
        setEditComments(
          (detail.requestCommentOutputDtos ?? []).map((comment) => ({
            id: comment.id,
            requestId: req.id,
            userId: comment.userId ?? null,
            description: comment.description ?? "", // تبدیل null به رشته خالی
            creationTime: comment.creationTime ?? "", // تبدیل null به رشته خالی
          })),
        );
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
      const uploadId =
        (startRes as typeof startRes & { result?: { uploadId?: string } })
          .result?.uploadId ?? startRes.uploadId;
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

      // اگه فایل موجود بود (source: "existing")، id رو ذخیره کن برای حذف از سرور
      const fileToDelete = editUploadedFiles.find(
        (f) => f.id === editFileToDelete,
      );
      if (fileToDelete?.source === "existing") {
        const numericId = Number(editFileToDelete);
        if (!isNaN(numericId)) {
          deletedFileIdsRef.current.push(numericId);
        }
      }

      setEditUploadedFiles((prev) =>
        prev.filter((f) => f.id !== editFileToDelete),
      );
      setEditFileToDelete(null);
    }
  }, [editFileToDelete, editUploadedFiles]);

  // ─── Customer Search Handlers ──────────────────────────────────
  const handleEditFindCustomer = useCallback(async () => {
    const nationalCode = editCustomerNationalCode.trim();
    if (!nationalCode) {
      showToast("لطفاً کد ملی را وارد کنید", "error");
      return;
    }

    setIsEditSearchingCustomer(true);
    try {
      const customers = await findCustomer({ nationalCode });
      if (customers.length === 0) {
        setEditCustomerId(null);
        setEditCustomerInfo(null);
        showToast("مشتری با این کد ملی یافت نشد", "warning");
      } else if (customers.length === 1) {
        const c = customers[0];
        setEditCustomerId(c.id);
        setEditCustomerInfo({
          cif: c.cifNumber || "-",
          name: c.name || "-",
          nationalCode: c.nationalCode || nationalCode,
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
  }, [editCustomerNationalCode, showToast]);

  const handleEditSelectCustomer = useCallback(
    (c: CustomerItem) => {
      const nationalCode = c.nationalCode || editCustomerNationalCode;
      setEditCustomerId(c.id);
      setEditCustomerNationalCode(nationalCode);
      setEditCustomerInfo({
        cif: c.cifNumber || "-",
        name: c.name || "-",
        nationalCode,
      });
      setIsEditCustomerModalOpen(false);
      showToast("مشتری انتخاب شد", "success");
    },
    [editCustomerNationalCode, showToast],
  );

  const handleClearCustomer = useCallback(() => {
    setEditCustomerId(null);
    setEditCustomerNationalCode("");
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
    if (
      activeCollaterals.some((collateral) => !isCollateralValid(collateral))
    ) {
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

      // حذف فایل‌های حذف‌شده از سرور
      if (deletedFileIdsRef.current.length > 0) {
        await deleteDocumentFiles(deletedFileIdsRef.current);
        deletedFileIdsRef.current = [];
      }

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

  const handleGeneratePdf = useCallback(async () => {
    if (!selectedReadonlyAppraisal) return;
    setIsGeneratingPdf(true);
    try {
      const pdfUrl = await generateAppraisalPdf(
        selectedReadonlyAppraisal,
        lookupsQuery.data ?? {},
        {
          requestCode: selectedRequest?.requestCode,
          date: selectedRequest?.creationTime
            ? isoToPersian(selectedRequest.creationTime)
            : "",
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
  }, [
    selectedReadonlyAppraisal,
    lookupsQuery.data,
    selectedRequest,
    showToast,
  ]);

  // ─── Columns Definition (Optimized with useCallback references) ──
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
        id: "authorityDepartmentType",
        header: "حدود صلاحیت",
        cell: ({ row }) =>
          row.original.authorityDepartmentTypeOutputDto?.name || "-",
      },
      {
        id: "detail",
        header: "جزئیات",
        cell: ({ row }) => (
          <ViewDetailsButton onClick={() => handleView(row.original)} />
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
    [handleView, handleEdit, statuses],
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
      <PageTitle title={departmentType.pageTitle} />
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
          return (
            <RequestDetailsPanel
              request={selectedRequest}
              documents={detailDocs}
              comments={detailComments}
              collaterals={detailCollaterals}
              getUserData={getUserCacheData}
              getPersonTypeTitle={(personTypeId) =>
                persTypeOpts.find(
                  (option) => String(option.id) === String(personTypeId),
                )?.title || "—"
              }
              onDownloadFile={(file) =>
                downloadFile(file.filePath, file.documentId)
              }
            >
              {allAppraisals.length > 0 && (
                <RequestDetailSection
                  icon={<ClipboardList className="w-5 h-5" />}
                  title="فرم‌های ارزیابی ملک"
                  count={`${allAppraisals.length} فرم`}
                  tone="blue"
                >
                  <div className="space-y-3">
                    {allAppraisals.map((appraisal, index) => (
                      <div
                        key={appraisal.id ?? index}
                        className="flex items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4"
                      >
                        <div>
                          <p className="text-sm font-medium text-blue-800">
                            فرم ارزیابی ملک {index + 1}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            ثبت شده توسط:{" "}
                            {getDepartmentName(appraisal.creatorDepartmentId)}
                          </p>
                        </div>
                        <FormButton
                          title="مشاهده فرم"
                          variant="primary"
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
            </RequestDetailsPanel>
          );
        }}
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
          <div className="max-h-[68vh] space-y-5 overflow-y-auto rounded-2xl bg-slate-50/70 p-1">
            {/* فرم اصلی */}
            <FormSection
              title="اطلاعات اصلی درخواست"
              description="مشخصات پرونده، نوع درخواست و اطلاعات مشتری را ویرایش کنید."
              icon={<FilePenLine className="h-5 w-5" />}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  type="text"
                  currency={true}
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

                <div className="relative">
                  <FormInput
                    id="e-requester"
                    name="requesterName"
                    label="درخواست کننده (کد ملی)"
                    value={editCustomerNationalCode}
                    onChange={(v) => {
                      setEditCustomerNationalCode(v);
                      setEditCustomerId(null);
                      setEditCustomerInfo(null);
                    }}
                    dir="rtl"
                  />
                  <button
                    type="button"
                    onClick={handleEditFindCustomer}
                    disabled={
                      !editCustomerNationalCode.trim() ||
                      isEditSearchingCustomer
                    }
                    title="استعلام"
                    className="absolute bottom-2 left-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isEditSearchingCustomer ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {editCustomerInfo && (
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 md:col-span-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="flex flex-1 flex-wrap items-center gap-3 text-sm">
                      <span className="text-gray-500">نام مشتری:</span>
                      <span className="font-medium text-gray-800">
                        {editCustomerInfo.name}
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-500">شماره مشتری:</span>
                      <span className="font-medium text-gray-800" dir="ltr">
                        {editCustomerInfo.cif}
                      </span>
                      <span className="text-gray-500">کد ملی:</span>
                      <span className="font-medium text-gray-800" dir="ltr">
                        {editCustomerInfo.nationalCode}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearCustomer}
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      title="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {!editCustomerInfo &&
                  !isEditSearchingCustomer &&
                  editCustomerNationalCode.trim() && (
                    <div className="-mt-2 text-xs text-gray-400 md:col-span-2">
                      برای استعلام، روی ذره‌بین کلیک کنید
                    </div>
                  )}

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
            </FormSection>

            <FormSection
              title="وثیقه‌گذاران"
              description="اطلاعات وثیقه‌گذاران پرونده را مدیریت کنید."
              icon={<UsersRound className="h-5 w-5" />}
              action={
                <button
                  type="button"
                  onClick={handleAddCollateral}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white"
                >
                  <Plus className="h-4 w-4" />
                  افزودن وثیقه‌گذار
                </button>
              }
            >
              <div className="space-y-3">
                {editCollaterals.map((col, i) => (
                  <div
                    key={i}
                    className="relative rounded-2xl border border-slate-200 bg-slate-50/70 p-4 pt-5"
                  >
                    <span className="absolute right-4 top-0 -translate-y-1/2 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
                      وثیقه‌گذار {i + 1}
                    </span>
                    {editCollaterals.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCollateral(i)}
                        className="absolute left-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-red-500 transition-colors hover:bg-red-50"
                        title="حذف وثیقه‌گذار"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                      <div className="md:col-span-2">
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
                    </div>
                  </div>
                ))}
              </div>
            </FormSection>

            {/* مدارک پیوست شده */}
            {editUploadedFiles.length > 0 && (
              <FormSection
                title="مدارک پیوست"
                description={`${editUploadedFiles.length} فایل در پرونده موجود است.`}
                icon={<Paperclip className="h-5 w-5" />}
                contentClassName="overflow-x-auto"
              >
                <table className="w-full min-w-[680px] overflow-hidden rounded-2xl text-xs">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="p-3 text-right">نوع مدرک</th>
                      <th className="p-3 text-right">نام فایل</th>
                      <th className="p-3 text-right">حجم</th>
                      <th className="p-3 text-right">وضعیت</th>
                      <th className="p-3 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {editUploadedFiles.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          {docTypeOpts.find(
                            (option) => option.id === f.documentTypeId,
                          )?.title ||
                            f.documentTypeTitle ||
                            "-"}
                        </td>
                        <td className="p-3 font-medium text-slate-700">
                          {f.fileName}
                        </td>
                        <td className="p-3 text-slate-500">
                          {(f.fileSize / 1024).toFixed(1)} KB
                        </td>
                        <td className="p-3">
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
                        <td className="p-3 text-center">
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
              </FormSection>
            )}

            {/* آپلود فایل جدید */}
            <FormSection
              title="آپلود مدرک جدید"
              description="نوع مدرک و فایل موردنظر را انتخاب و بارگذاری کنید."
              icon={<Upload className="h-5 w-5" />}
            >
              <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-4 sm:flex-row sm:items-center">
                <div className="w-full sm:w-56">
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
                  type="button"
                  onClick={() => editFileInputRef.current?.click()}
                  className="flex min-h-11 min-w-40 cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm text-slate-600 transition-colors hover:border-blue-400 hover:bg-blue-50"
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
            </FormSection>

            {/* توضیحات کارشناس قبلی */}
            {editComments.length > 0 && (
              <FormSection
                title="توضیحات کارشناسان"
                description={`${editComments.length} توضیح قبلی برای این پرونده ثبت شده است.`}
                icon={<MessageSquareText className="h-5 w-5" />}
              >
                <div className="space-y-3">
                  {editComments.map((c) => {
                    const userData = getUserCacheData(c.userId || 0);
                    return (
                      <div
                        key={c.id}
                        className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 text-xs"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-slate-600">
                            {userData.name}
                          </p>
                          <span className="text-slate-400">
                            {c.creationTime
                              ? isoToPersianDateTime(c.creationTime)
                              : "-"}
                          </span>
                        </div>
                        <p className="mt-2 leading-6 text-slate-700">
                          {c.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </FormSection>
            )}

            {/* افزودن توضیح جدید */}
            <FormSection
              title="افزودن توضیح جدید"
              description="در صورت نیاز توضیح جدیدی برای ادامه فرآیند ثبت کنید."
              icon={<MessageSquareText className="h-5 w-5" />}
            >
              <FormTextarea
                id="new-comment"
                name="new-comment"
                label="توضیحات کارشناس"
                value={newComment}
                onChange={(v) => setNewComment(v)}
                rows={3}
                dir="rtl"
              />
            </FormSection>
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
              {editFoundCustomers.length} مشتری با کد ملی "
              {editCustomerNationalCode}" یافت شد.
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
                  id: "nationalCode",
                  header: "کد ملی",
                  cell: ({ row }) =>
                    row.original.nationalCode ||
                    editCustomerNationalCode ||
                    "-",
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
      <PropertyAppraisalReadOnlyModal
        isOpen={isAppraisalReadOnlyOpen}
        appraisal={selectedReadonlyAppraisal}
        lookups={lookupsQuery.data ?? {}}
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

export default function BranchRequestViewPage() {
  return (
    <DepartmentRequestViewPage
      departmentType={REQUEST_DEPARTMENT_TYPES.branch}
    />
  );
}
