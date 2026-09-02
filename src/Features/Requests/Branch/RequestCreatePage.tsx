import { useMemo, useRef, useState } from "react";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  FilePlus2,
  FileText,
  MessageSquareText,
  Paperclip,
  Plus,
  Search,
  Trash2,
  Upload,
  UserRound,
  UsersRound,
  AlertTriangle,
  X,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { MainLayout } from "../../../baseComponents/MainLayout";
import { FluidGrid } from "../../../baseComponents/FluidGrid";
import { FluidCol } from "../../../baseComponents/FluidCol";
import FormInput from "../../../baseComponents/FormInput";
import FormSelect from "../../../baseComponents/FormSelect";
import FormTextarea from "../../../baseComponents/FormTextarea";
import FormButton from "../../../baseComponents/FormButton";
import PageTitle from "../../../baseComponents/PageTitle";
import DataTable from "../../../baseComponents/DataTable";
import Modal from "../../../baseComponents/Modal";
import FormSection from "../../../baseComponents/FormSection";
import { useToast } from "../../../libs/toastContext";
import { useAuthStore } from "../../../libs/store";

import { createRequest } from "../../../services/RequestCrud/create";
import { createCollatral } from "../../../services/CollatralCrud/create";
import { startUpload } from "../../../services/FileService/start";
import type { DocumentTypeItem } from "../../../services/DocumentTypeCrud/types";
import { isoToPersian } from "../../../utils/persianToISO";
import { createDocument } from "../../../services/DocumentCrud/create";
import { completeBatchUpload } from "../../../services/FileService/completeBatch";
// import { findCustomer } from "../../../services/CustomerCrud/find";
import { findCustomerFromTsi } from "../../../services/CustomerCrud/FindCustomerFromTsi";
import type { CustomerItem } from "../../../services/CustomerCrud/types";
import { createRequestComment } from "../../../services/RequestCommentCrud/create";
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
import { scheduleNextRequestStep } from "../requestFlowNavigation";
import { isValidNationalIdentity } from "../../../utils/createRequestValidator.ts";
import { onlyDigits } from "../../../utils/iranValidators.ts";
import { toPersianDigits } from "../../../utils/numberUtils.ts";
import ModalTemplate from "../../../baseComponents/Modal";
import FormMultiSelectModal from "../../../baseComponents/FormMultiSelectModal.tsx";

// ─── Types ───
type CollateralForm = {
  personTypeId: number | null;
  collatralTypeId: number | null;
  expertiseZoneCodes: string[];
  firstName: string;
  lastName: string;
  nationalCode: string;
};

type RequestForm = {
  requestTypeId: number | null;
  title: string;
  requestCode: string;
  personalTypeId: number | null;
  requesterName: string;
  amount: string;
  description: string;
};

type UploadedFile = {
  id: string;
  documentTypeId: number | null;
  documentTypeTitle: string;
  fileName: string;
  fileSize: number;
  fileFormat: string;
  fileAddress: string;
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
};

const emptyCollateral: CollateralForm = {
  personTypeId: null,
  collatralTypeId: 0,
  expertiseZoneCodes: [],
  firstName: "",
  lastName: "",
  nationalCode: "",
};
const emptyRequest: RequestForm = {
  requestTypeId: null,
  title: "",
  requestCode: "",
  personalTypeId: null,
  requesterName: "",
  amount: "",
  description: "",
};
interface RequestCreatePageProps {
  departmentType: RequestDepartmentTypeConfig;
}

export function DepartmentRequestCreatePage({
  departmentType,
}: RequestCreatePageProps) {
  const { showToast } = useToast();
  const { user, fullName } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<Set<string>>(new Set());
  const uploadStateRef = useRef<Map<string, UploadState>>(new Map());
  const today = isoToPersian(new Date().toISOString());
  const now = new Date().toLocaleTimeString("fa-IR");

  const [requestForm, setRequestForm] = useState<RequestForm>(emptyRequest);
  const [collaterals, setCollaterals] = useState<CollateralForm[]>([
    { ...emptyCollateral },
  ]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedDocTypeId, setSelectedDocTypeId] = useState<number | null>(
    null,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerInfo, setCustomerInfo] = useState<{
    cif: string;
    name: string;
    nationalCode: string;
  } | null>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [foundCustomers, setFoundCustomers] = useState<CustomerItem[]>([]);

  const [expertComment, setExpertComment] = useState("");

  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [collateralZoneModalState, setCollateralZoneModalState] = useState<{
    collateralIndex: number;
    selectedCodes: string[];
  } | null>(null);

  const [isNationalCodeNoticeOpen, setIsNationalCodeNoticeOpen] =
    useState(false);

  const [hasShownNationalCodeNotice, setHasShownNationalCodeNotice] =
    useState(false);

  const handleNationalCodeFocus = () => {
    if (hasShownNationalCodeNotice) return;

    setHasShownNationalCodeNotice(true);
    setIsNationalCodeNoticeOpen(true);
  };

  const userName = fullName || user?.username || "";
  const branchName = user?.branchName || "";

  const {
    personalTypes,
    documentTypes,
    requestTypeOptions,
    personalTypeOptions,
    expertiseZones,
    documentTypeOptions,
  } = useRequestReferenceData();

  // ─── File Upload with Resume ───
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ⬅️ اعتبارسنجی فرمت فایل
    const allowedFormats = ["pdf", "png", "jpg", "jpeg"];
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";

    if (!allowedFormats.includes(fileExtension)) {
      showToast("فایل‌های PDF، PNG، JPG و JPEG مجاز هستند", "error");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    e.target.value = "";
  };

  const handleStartUpload = async () => {
    if (!selectedDocTypeId) {
      showToast("لطفاً نوع مدرک را انتخاب کنید", "error");
      return;
    }
    if (!selectedFile) {
      showToast("لطفاً فایل را انتخاب کنید", "error");
      return;
    }

    const file = selectedFile;
    const docId = crypto.randomUUID();
    const format = file.name.split(".").pop() || "";
    const docType = documentTypes.find(
      (d: DocumentTypeItem) => d.id === selectedDocTypeId,
    );
    if (file.size === 0) {
      showToast("فایل انتخاب‌شده خالی است", "error");
      return;
    }

    const totalChunks = Math.ceil(file.size / REQUEST_CHUNK_SIZE);

    const newFile: UploadedFile = {
      id: docId,
      documentTypeId: selectedDocTypeId,
      documentTypeTitle: docType?.title ?? "",
      fileName: file.name,
      fileSize: file.size,
      fileFormat: format,
      fileAddress: "",
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

    setUploadedFiles((prev) => [newFile, ...prev]);
    setSelectedFile(null);
    setIsUploading(true);

    try {
      // Start
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

      // Save state for resume
      uploadStateRef.current.set(docId, {
        file,
        uploadId,
        totalChunks,
        lastUploadedChunk: -1,
        isPaused: false,
        isCompleting: false,
      });
      setUploadedFiles((prev) =>
        prev.map((f) => (f.id === docId ? { ...f, uploadId } : f)),
      );

      // Upload chunks
      await uploadChunksSequentially({
        itemId: docId,
        file,
        uploadId,
        totalChunks,
        startIndex: 0,
        cancelRef,
        uploadStateRef,
        setFiles: setUploadedFiles,
      });

      // Completing
      // setUploadedFiles((prev) =>
      //   prev.map((f) =>
      //     f.id === docId
      //       ? {
      //           ...f,
      //           isUploading: false,
      //           isCompleting: true,
      //           uploadProgress: 100,
      //         }
      //       : f,
      //   ),
      // );
      // const state = uploadStateRef.current.get(docId);
      // if (state) state.isCompleting = true;
      //
      // await completeUpload(uploadId);

      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === docId
            ? {
                ...f,
                uploadProgress: 100,
                isUploading: false,
                isCompleting: false,
                isCompleted: true,
                fileAddress: uploadId,
              }
            : f,
        ),
      );
      uploadStateRef.current.delete(docId);
      showToast("فایل با موفقیت آپلود شد", "success");
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      if (message === "آپلود لغو شد") {
        // کاربر دستی pause کرده - فایل بمونه
      } else {
        // خطای شبکه یا سرور - فایل بمونه توی حالت paused
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === docId ? { ...f, isUploading: false } : f)),
        );
        showToast(`خطا: ${message}. می‌توانید ادامه دهید.`, "warning");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFindCustomer = async () => {
    const nationalCode = onlyDigits(requestForm.requesterName);

    if (!nationalCode) {
      showToast("لطفاً کد ملی یا شناسه ملی را وارد کنید", "error");
      return;
    }

    if (nationalCode.length < 10 || nationalCode.length > 11) {
      showToast("کد ملی باید ۱۰ رقم و شناسه ملی باید ۱۱ رقم باشد", "error");
      return;
    }

    if (!isValidNationalIdentity(nationalCode)) {
      showToast("فرمت کد ملی / شناسه ملی وارد شده معتبر نمی‌باشد", "error");
      return;
    }

    setIsSearchingCustomer(true);
    try {
      const customers = await findCustomerFromTsi({ nationalCode });

      if (!customers || customers.length === 0) {
        setCustomerId(null);
        setCustomerInfo(null);
        showToast("مشتری با این مشخصات یافت نشد", "warning");
      } else if (customers.length === 1) {
        const c = customers[0];
        setCustomerId(c.id);
        setCustomerInfo({
          cif: c.cifNumber || "-",
          name: c.name || "-",
          nationalCode: (c as any)?.nationalCode || nationalCode,
        });

        // خودکار پر کردن نوع شخص از مشتری
        if (c.personalTypeId) {
          setRequestForm((prev) => ({
            ...prev,
            personalTypeId: c.personalTypeId ?? null,
          }));
        }

        showToast("مشتری یافت و با موفقیت انتخاب شد", "success");
      } else {
        setFoundCustomers(customers);
        setIsCustomerModalOpen(true);
      }
    } catch (error: unknown) {
      showToast(getErrorMessage(error, "خطا در استعلام"), "error");
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  const handleSelectCustomer = (customer: CustomerItem) => {
    setCustomerId(customer.id);
    setCustomerInfo({
      cif: customer.cifNumber || "",
      name: customer.name || "-",
      nationalCode:
        (customer as any)?.nationalCode || requestForm.requesterName,
    });

    // خودکار پر کردن نوع شخص از مشتری
    if (customer.personalTypeId) {
      setRequestForm((prev) => ({
        ...prev,
        personalTypeId: customer.personalTypeId ?? null,
      }));
    }

    setIsCustomerModalOpen(false);
    showToast("مشتری انتخاب شد", "success");
  };

  const handleResumeUpload = async (file: UploadedFile) => {
    const state = uploadStateRef.current.get(file.id);
    if (!state || !state.file || !state.uploadId) {
      showToast("امکان ادامه آپلود وجود ندارد", "error");
      return;
    }

    state.isPaused = false;
    const startIndex = (state.lastUploadedChunk ?? -1) + 1;
    setUploadedFiles((prev) =>
      prev.map((f) =>
        f.id === file.id ? { ...f, isUploading: true, isCompleted: false } : f,
      ),
    );

    try {
      await uploadChunksSequentially({
        itemId: file.id,
        file: state.file,
        uploadId: state.uploadId,
        totalChunks: state.totalChunks,
        startIndex,
        cancelRef,
        uploadStateRef,
        setFiles: setUploadedFiles,
      });

      // Completing
      // setUploadedFiles((prev) =>
      //   prev.map((f) =>
      //     f.id === file.id
      //       ? {
      //           ...f,
      //           isUploading: false,
      //           isCompleting: true,
      //           uploadProgress: 100,
      //         }
      //       : f,
      //   ),
      // );
      // state.isCompleting = true;
      //
      // await completeUpload(state.uploadId);

      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? {
                ...f,
                isUploading: false,
                isCompleting: false,
                isCompleted: true,
                fileAddress: state.uploadId,
              }
            : f,
        ),
      );
      uploadStateRef.current.delete(file.id);
      showToast("فایل با موفقیت آپلود شد", "success");
    } catch (error: unknown) {
      setUploadedFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, isUploading: false } : f)),
      );
      showToast(
        `خطا: ${getErrorMessage(error)}. می‌توانید ادامه دهید.`,
        "warning",
      );
    }
  };

  const handlePauseUpload = (docId: string) => {
    const state = uploadStateRef.current.get(docId);
    if (state) state.isPaused = true;
    setUploadedFiles((prev) =>
      prev.map((f) => (f.id === docId ? { ...f, isUploading: false } : f)),
    );
  };

  const handleDeleteFile = (id: string) => {
    setFileToDelete(id);
  };

  const confirmDeleteFile = () => {
    if (fileToDelete) {
      cancelRef.current.add(fileToDelete);
      uploadStateRef.current.delete(fileToDelete);
      setUploadedFiles((prev) => prev.filter((f) => f.id !== fileToDelete));
      setFileToDelete(null);
    }
  };

  // ─── Collateral ───
  const addCollateral = () =>
    setCollaterals((p) => [...p, { ...emptyCollateral }]);
  const removeCollateral = (i: number) => {
    if (collaterals.length > 1)
      setCollaterals((p) => p.filter((_, idx) => idx !== i));
  };
  const updateCollateral = (
    i: number,
    f: keyof CollateralForm,
    v: CollateralForm[keyof CollateralForm],
  ) =>
    setCollaterals((p) =>
      p.map((c, idx) => (idx === i ? { ...c, [f]: v } : c)),
    );
  const getSelectedExpertiseZoneTitles = (codes: string[]) =>
    expertiseZones
      .filter((zone) => Boolean(zone.code) && codes.includes(zone.code!))
      .map((zone) => zone.title || zone.code!)
      .join("، ");
  const toggleModalExpertiseZone = (code: string) =>
    setCollateralZoneModalState((previous) =>
      !previous
        ? previous
        : {
            ...previous,
            selectedCodes: previous.selectedCodes.includes(code)
              ? previous.selectedCodes.filter(
                  (selectedCode) => selectedCode !== code,
                )
              : [...previous.selectedCodes, code],
          },
    );

  // ─── Submit ───
  const handleSubmit = async () => {
    if (!requestForm.requestTypeId) {
      showToast("نوع درخواست الزامی است", "error");
      return;
    }
    if (!requestForm.title.trim()) {
      showToast("عنوان الزامی است", "error");
      return;
    }
    const amount = Number(requestForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast("مبلغ الزامی است", "error");
      return;
    }
    if (!requestForm.personalTypeId) {
      showToast("نوع شخص الزامی است", "error");
      return;
    }
    if (!customerId) {
      showToast("لطفاً ابتدا مشتری را استعلام و انتخاب کنید", "error");
      return;
    }
    if (!requestForm.requestCode.trim()) {
      showToast("شماره مصوبه/ابلاغیه الزامی است", "error");
      return;
    }

    const nationalCode = onlyDigits(requestForm.requesterName);
    if (!isValidNationalIdentity(nationalCode)) {
      showToast("کد ملی / شناسه ملی نامعتبر است", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        actorUserId: Number(user?.id || 0),
        currentDepartmentTypeId: departmentType.id,
        currentApprovalStepId: 0,
        requestStatusCode: 1,
        requestTypeId: requestForm.requestTypeId!,
        customerId,
        title: requestForm.title.trim(),
        requestCode: requestForm.requestCode || "",
        amount,
        description: requestForm.description || "",
        personalTypeId: requestForm.personalTypeId,
        // currentApprovalStepId: 0,
        // requestStatusCode: 0,
      };

      console.log(body);
      // 1. Create Request
      const requestRes = await createRequest(body);
      const requestId = extractEntityId(requestRes, "درخواست");

      // 1.5 Save expert comment (اگه نوشته باشه)
      if (expertComment.trim()) {
        await createRequestComment({
          requestId,
          userId: Number(user?.id || 0),
          description: expertComment.trim(),
        });
      }

      // 2. Create Collaterals
      for (const col of collaterals) {
        if (
          col.personTypeId &&
          col.expertiseZoneCodes.length > 0 &&
          col.firstName
        ) {
          await createCollatral({
            requestId,
            firstName: col.firstName,
            lastName: col.lastName,
            collatralTypeId: 0,
            nationalCode: col.nationalCode,
            personTypeId: col.personTypeId,
            expertiseZoneCodes: col.expertiseZoneCodes,
          });
        }
      }

      // 3. Group completed files by documentTypeId
      const filesByType = new Map<number, UploadedFile[]>();
      for (const file of uploadedFiles) {
        if (file.isCompleted && file.documentTypeId) {
          const existing = filesByType.get(file.documentTypeId) || [];
          existing.push(file);
          filesByType.set(file.documentTypeId, existing);
        }
      }

      // 4. Create ONE document per documentTypeId, then attach all files
      const batchItems: { uploadId: string; documentId: number }[] = [];

      for (const [docTypeId, files] of filesByType) {
        // Create document
        const docRes = await createDocument({
          documentTypeId: docTypeId,
          requestId,
        });
        const documentId = extractEntityId(docRes, "سند");

        // Attach all files to this document
        for (const file of files) {
          if (file.uploadId) {
            batchItems.push({ uploadId: file.uploadId, documentId });
          }
        }
      }

      // 5. Complete all files in ONE request
      if (batchItems.length > 0) {
        await completeBatchUpload({ items: batchItems });
      }

      showToast("درخواست با موفقیت ثبت شد", "success");
      scheduleNextRequestStep({ nextStateCode: 2 }, departmentType);
      setRequestForm(emptyRequest);
      setCollaterals([{ ...emptyCollateral }]);
      setUploadedFiles([]);
      uploadStateRef.current.clear();
      setSelectedDocTypeId(null);
      setSelectedFile(null);
      setCustomerId(null);
      setCustomerInfo(null);
      setExpertComment("");
    } catch (error: unknown) {
      showToast(getErrorMessage(error, "خطا"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Columns ───
  const fileColumns: ColumnDef<UploadedFile, unknown>[] = [
    {
      id: "documentTypeTitle",
      header: "نوع مدرک",
      accessorKey: "documentTypeTitle",
      cell: ({ row }) => row.original.documentTypeTitle || "-",
    },
    {
      id: "fileName",
      header: "نام فایل",
      accessorKey: "fileName",
      cell: ({ row }) => row.original.fileName,
    },
    {
      id: "fileFormat",
      header: "نوع فایل",
      accessorKey: "fileFormat",
      cell: ({ row }) => row.original.fileFormat || "-",
    },
    {
      id: "fileSize",
      header: "حجم",
      cell: ({ row }) => `${(row.original.fileSize / 1024).toFixed(1)} KB`,
    },
    {
      id: "progress",
      header: "وضعیت",
      cell: ({ row }) => {
        const f = row.original;
        if (f.isCompleting) {
          return (
            <span className="text-yellow-600 text-xs flex items-center gap-1">
              ⏳ در حال آماده‌سازی...
            </span>
          );
        }
        if (f.isCompleted) {
          return <span className="text-green-600 text-xs">✅ تکمیل</span>;
        }
        if (f.isUploading) {
          return (
            <div className="flex items-center gap-2 min-w-[140px]">
              <div className="flex-1 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${f.uploadProgress}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-8">
                {f.uploadProgress}%
              </span>
              <button
                onClick={() => handlePauseUpload(f.id)}
                className="p-1 rounded-md text-yellow-600 hover:bg-yellow-50"
                title="توقف"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              </button>
            </div>
          );
        }
        // Paused - آیکون play برای ادامه
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div
                className="bg-yellow-500 h-2 rounded-full"
                style={{ width: `${f.uploadProgress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-8">
              {f.uploadProgress}%
            </span>
            <button
              onClick={() => handleResumeUpload(f)}
              className="p-1 rounded-md text-green-600 hover:bg-green-50"
              title="ادامه"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </button>
          </div>
        );
      },
    },
    {
      id: "userName",
      header: "کاربر",
      accessorKey: "userName",
      cell: ({ row }) => row.original.userName || "-",
    },
    {
      id: "userRole",
      header: "نقش",
      accessorKey: "userRole",
      cell: ({ row }) => row.original.userRole || "-",
    },
    {
      id: "uploadDate",
      header: "تاریخ",
      accessorKey: "uploadDate",
      cell: ({ row }) => row.original.uploadDate || "-",
    },
    {
      id: "uploadTime",
      header: "ساعت",
      accessorKey: "uploadTime",
      cell: ({ row }) => row.original.uploadTime || "-",
    },
    {
      id: "actions",
      header: "عملیات",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {row.original.isUploading && (
            <button
              onClick={() => handlePauseUpload(row.original.id)}
              className="p-1.5 rounded-md text-yellow-600 hover:bg-yellow-50"
              title="توقف"
            >
              ⏸
            </button>
          )}
          <button
            onClick={() => handleDeleteFile(row.original.id)}
            className="p-1.5 rounded-md text-red-600 hover:bg-red-50"
            title="حذف"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const customerColumns: ColumnDef<CustomerItem, unknown>[] = [
    {
      id: "cifNumber",
      header: "شماره مشتری",
      accessorKey: "cifNumber",
      cell: ({ row }) => row.original.cifNumber || "-",
    },
    {
      id: "nationalCode",
      header: "کد ملی",
      cell: ({ row }) => (row.original as any)?.nationalCode || "-",
    },
    {
      id: "name",
      header: "نام مشتری",
      accessorKey: "name",
      cell: ({ row }) => row.original.name || "-",
    },
    {
      id: "personalTypeId",
      header: "نوع شخص",
      accessorKey: "personalTypeId",
      cell: ({ row }) => {
        const typeId = row.original.personalTypeId;
        const type = personalTypes.find((item) => item.id === typeId);
        return type?.title || "-";
      },
    },
    {
      id: "select",
      header: "انتخاب",
      cell: ({ row }) => (
        <FormButton
          title="انتخاب"
          variant="primary"
          size="sm"
          onClick={() => handleSelectCustomer(row.original)}
        />
      ),
    },
  ];

  const filesQueryResult = useMemo(
    () => ({
      data: {
        listResult: uploadedFiles,
        total: uploadedFiles.length,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
      isFetching: false,
    }),
    [uploadedFiles],
  );

  const customersQueryResult = useMemo(
    () => ({
      data: {
        listResult: foundCustomers,
        total: foundCustomers.length,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
      isFetching: false,
    }),
    [foundCustomers],
  );

  // ─── Render ───
  return (
    <MainLayout.Main maxWidth="screen-xl">
      <PageTitle
        title={`ایجاد درخواست جدید ${departmentType.name}`}
        subtitle="اطلاعات پرونده، وثیقه‌گذاران و مدارک موردنیاز را ثبت کنید."
        className="mb-5"
      />

      <div className="relative mb-5 overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="absolute -left-12 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <FilePlus2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-800">فرم ثبت پرونده</p>
              <h2 className="mt-1 text-lg font-bold">
                درخواست جدید شعبه {toPersianDigits(branchName) || "-"}
              </h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 ring-1 ring-white/20">
              <UserRound className="h-3.5 w-3.5" />
              {userName || "-"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 ring-1 ring-white/20">
              <CalendarDays className="h-3.5 w-3.5" />
              {toPersianDigits(today)}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* اطلاعات درخواست */}
        <FormSection
          title="اطلاعات درخواست"
          description="مشخصات اصلی پرونده و اطلاعات مشتری را وارد کنید."
          icon={<FileText className="h-5 w-5" />}
        >
          <FluidGrid className="gap-4">
            <FluidCol colSpan="col-span-12 md:col-span-4">
              <FormSelect<number>
                id="requestTypeId"
                name="requestTypeId"
                label="نوع درخواست"
                value={requestForm.requestTypeId ?? ""}
                onChange={(v) =>
                  setRequestForm((p) => ({
                    ...p,
                    requestTypeId: v ? Number(v) : null,
                  }))
                }
                options={requestTypeOptions}
                required
              />
            </FluidCol>
            <FluidCol colSpan="col-span-12 md:col-span-4">
              <FormInput
                id="title"
                name="title"
                label="عنوان"
                value={requestForm.title}
                onChange={(v) => setRequestForm((p) => ({ ...p, title: v }))}
                dir="rtl"
                required
              />
            </FluidCol>
            <FluidCol colSpan="col-span-12 md:col-span-4">
              <FormInput
                id="requestCode"
                name="requestCode"
                label="شماره مصوبه/ابلاغیه"
                value={requestForm.requestCode}
                onChange={(v) =>
                  setRequestForm((p) => ({ ...p, requestCode: v }))
                }
                dir="ltr"
                required
              />
            </FluidCol>
            <FluidCol colSpan="col-span-12 md:col-span-4">
              <FormInput
                id="branchName"
                name="branchName"
                label="شعبه"
                value={toPersianDigits(branchName)}
                dir="rtl"
                disabled
                onChange={() => {}}
              />
            </FluidCol>
            <FluidCol colSpan="col-span-12 md:col-span-4">
              <FormInput
                id="userName"
                name="userName"
                label="نام کاربر"
                value={userName}
                dir="rtl"
                disabled
                onChange={() => {}}
              />
            </FluidCol>
            <FluidCol colSpan="col-span-12 md:col-span-4">
              <FormInput
                id="todayDate"
                name="todayDate"
                label="تاریخ ثبت"
                value={toPersianDigits(today)}
                dir="ltr"
                disabled
                onChange={() => {}}
              />
            </FluidCol>
            <FluidCol colSpan="col-span-12 md:col-span-4">
              <FormSelect<number>
                id="personalTypeId"
                name="personalTypeId"
                label="نوع شخص"
                value={requestForm.personalTypeId ?? ""}
                onChange={(v) =>
                  setRequestForm((p) => ({
                    ...p,
                    personalTypeId: v ? Number(v) : null,
                  }))
                }
                options={personalTypeOptions}
              />
            </FluidCol>
            {/* ردیف درخواست کننده + استعلام */}
            <FluidCol colSpan="col-span-12 md:col-span-4">
              <div className="relative">
                <FormInput
                  id="requesterName"
                  name="requesterName"
                  label="درخواست‌کننده (کد/شناسه ملی)"
                  value={requestForm.requesterName}
                  onFocus={handleNationalCodeFocus}
                  onChange={(value) => {
                    const cleanValue = onlyDigits(value).slice(0, 11);

                    setRequestForm((prev) => ({
                      ...prev,
                      requesterName: cleanValue,
                    }));

                    setCustomerInfo(null);
                    setCustomerId(null);
                  }}
                  dir="rtl"
                  maxLength={11}
                  required
                  className="pl-24"
                />

                <button
                  type="button"
                  onClick={handleFindCustomer}
                  disabled={
                    onlyDigits(requestForm.requesterName).length < 10 ||
                    isSearchingCustomer
                  }
                  className={`absolute bottom-2 left-2 flex h-8 items-center gap-1.5 rounded-md px-2.5 transition-colors ${
                    onlyDigits(requestForm.requesterName).length >= 10
                      ? "cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
                      : "cursor-not-allowed bg-slate-100 text-slate-400"
                  }`}
                  title="استعلام مشتری"
                >
                  {isSearchingCustomer ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      <span className="text-xs font-semibold">استعلام</span>
                    </>
                  )}
                </button>
              </div>
            </FluidCol>
            <FluidCol colSpan="col-span-12 md:col-span-4">
              <FormInput
                id="amount"
                name="amount"
                label="مبلغ تسهیلات (ریال)"
                value={requestForm.amount}
                onChange={(v) => setRequestForm((p) => ({ ...p, amount: v }))}
                dir="ltr"
                type="text"
                currency={true}
                required
              />
            </FluidCol>
          </FluidGrid>
        </FormSection>

        {/* نمایش نتیجه استعلام - فقط وقتی customerInfo داریم */}
        {customerInfo && (
          <FluidCol colSpan="col-span-12">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 flex-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-gray-500">نام مشتری:</span>
                  <span className="font-medium text-gray-800">
                    {customerInfo.name}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-500">شماره مشتری:</span>
                  <span className="font-medium text-gray-800" dir="ltr">
                    {toPersianDigits(customerInfo.cif)}
                  </span>
                  <span className="text-gray-500">کد ملی:</span>
                  <span className="font-medium text-gray-800" dir="ltr">
                    {toPersianDigits(customerInfo.nationalCode)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCustomerInfo(null);
                  setCustomerId(null);
                }}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                title="حذف"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </FluidCol>
        )}

        {/* وثیقه گذاران */}
        <FormSection
          title="وثیقه‌گذاران"
          description="در صورت نیاز یک یا چند وثیقه‌گذار به پرونده اضافه کنید."
          icon={<UsersRound className="h-5 w-5" />}
          action={
            <FormButton
              title={
                <span className="flex items-center gap-1">
                  <Plus className="w-4 h-4" /> افزودن
                </span>
              }
              variant="primary"
              onClick={addCollateral}
            />
          }
        >
          {collaterals.map((col, i) => (
            <div
              key={i}
              className="relative mb-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-5 pt-6 last:mb-0"
            >
              <span className="absolute right-4 top-0 -translate-y-1/2 rounded-full bg-white dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
                وثیقه‌گذار {toPersianDigits(i + 1)}
              </span>

              {collaterals.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCollateral(i)}
                  className="absolute left-3 top-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <FluidGrid className="gap-y-3">
                {/* ردیف اول: نوع شخص + نوع وثیقه */}
                <FluidCol colSpan="col-span-12 md:col-span-6">
                  <FormSelect<number>
                    id={`cp-${i}`}
                    name={`cp-${i}`}
                    label="نوع شخص"
                    value={col.personTypeId ?? ""}
                    onChange={(v) =>
                      updateCollateral(i, "personTypeId", v ? Number(v) : null)
                    }
                    options={personalTypeOptions}
                    required
                  />
                </FluidCol>

                <FluidCol colSpan="col-span-12 md:col-span-6">
                  <FormMultiSelectModal
                    id={`cz-${i}`}
                    label="نوع وثیقه"
                    required
                    selectedCount={col.expertiseZoneCodes.length}
                    displayText={getSelectedExpertiseZoneTitles(
                      col.expertiseZoneCodes,
                    )}
                    onClick={() =>
                      setCollateralZoneModalState({
                        collateralIndex: i,
                        selectedCodes: [...col.expertiseZoneCodes],
                      })
                    }
                  />
                </FluidCol>

                {/* ردیف دوم: مشخصات هویتی */}
                <FluidCol colSpan="col-span-12 md:col-span-4">
                  <FormInput
                    id={`cfn-${i}`}
                    name={`cfn-${i}`}
                    label="نام"
                    value={col.firstName}
                    onChange={(v) => updateCollateral(i, "firstName", v)}
                    dir="rtl"
                  />
                </FluidCol>

                <FluidCol colSpan="col-span-12 md:col-span-4">
                  <FormInput
                    id={`cln-${i}`}
                    name={`cln-${i}`}
                    label="نام خانوادگی"
                    value={col.lastName}
                    onChange={(v) => updateCollateral(i, "lastName", v)}
                    dir="rtl"
                  />
                </FluidCol>

                <FluidCol colSpan="col-span-12 md:col-span-4">
                  <FormInput
                    id={`cnc-${i}`}
                    name={`cnc-${i}`}
                    label="کد ملی"
                    value={col.nationalCode}
                    onChange={(v) => updateCollateral(i, "nationalCode", v)}
                    dir="ltr"
                  />
                </FluidCol>
              </FluidGrid>
            </div>
          ))}
        </FormSection>

        {/* مدارک پیوست */}
        <FormSection
          title="مدارک پیوست"
          description="مدارک را بر اساس نوع انتخاب‌شده بارگذاری کنید."
          icon={<Paperclip className="h-5 w-5" />}
        >
          <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-4 md:flex-row md:items-center">
            <div className="w-full md:w-56">
              <FormSelect<number>
                id="docTypeSelect"
                name="docTypeSelect"
                label="نوع مدارک"
                value={selectedDocTypeId ?? ""}
                onChange={(v) => setSelectedDocTypeId(v ? Number(v) : null)}
                options={documentTypeOptions}
              />
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-11 min-w-[160px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50"
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
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileSelect}
            />

            <FormButton
              title="آپلود"
              variant="primary"
              size="sm"
              onClick={handleStartUpload}
              isLoading={isUploading}
              disabled={isUploading || !selectedFile || !selectedDocTypeId}
            />

            {selectedFile && (
              <span className="text-xs text-gray-400 ml-auto">
                {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
              </span>
            )}
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <DataTable<UploadedFile>
                query={filesQueryResult}
                columns={fileColumns}
                pagination={{ pageIndex: 0, pageSize: 10 }}
                onPaginationChange={() => {}}
                filters={[]}
                onFiltersChange={() => {}}
                filterFields={[]}
                skeletonColumns={10}
                emptyStateMessage="هیچ فایلی آپلود نشده است"
              />
            </div>
          )}
        </FormSection>

        {/* توضیحات کارشناس */}
        <FormSection
          title={
            departmentType.id === REQUEST_DEPARTMENT_TYPES.branch.id
              ? "یادداشت کارشناس شعبه"
              : "یادداشت کارشناس شعبه مستقل"
          }
          description="نکات کارشناسی، موارد نیازمند بررسی یا توضیحات داخلی خود درباره این درخواست را ثبت کنید. این یادداشت به‌عنوان نظر کارشناس در روند بررسی درخواست نمایش داده می‌شود."
          icon={<MessageSquareText className="h-5 w-5" />}
        >
          <FluidGrid className="gap-4">
            <FluidCol colSpan="col-span-12">
              <FormTextarea
                id="expertComment"
                name="expertComment"
                label="یادداشت / نظر کارشناس"
                value={expertComment}
                onChange={(v) => setExpertComment(v)}
                rows={3}
                dir="rtl"
              />
            </FluidCol>
          </FluidGrid>
        </FormSection>

        {/* توضیحات و ثبت */}
        <FormSection
          title="شرح نهایی درخواست"
          description="موضوع، دلیل و جزئیات اصلی درخواست را وارد کنید. این متن به‌عنوان شرح رسمی درخواست ثبت و در اطلاعات پرونده نگهداری می‌شود."
          icon={<Building2 className="h-5 w-5" />}
        >
          <FluidGrid className="gap-4">
            <FluidCol colSpan="col-span-12">
              <FormTextarea
                id="description"
                name="description"
                label="شرح درخواست"
                value={requestForm.description}
                onChange={(v) =>
                  setRequestForm((p) => ({ ...p, description: v }))
                }
                rows={4}
                dir="rtl"
              />
            </FluidCol>
            <FluidCol colSpan="col-span-12">
              <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-slate-700">آماده ثبت درخواست</p>
                  <p className="mt-1 text-xs text-slate-500">
                    قبل از ثبت، اطلاعات و فایل‌های پیوست را بررسی کنید.
                  </p>
                </div>
                <FormButton
                  title="ثبت درخواست"
                  variant="success"
                  size="md"
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                />
              </div>
            </FluidCol>
          </FluidGrid>
        </FormSection>
      </div>
      {/* ─── Modal انتخاب مشتری ─── */}
      <Modal
        isOpen={isCustomerModalOpen}
        isRTL
        header="انتخاب مشتری"
        onClose={() => setIsCustomerModalOpen(false)}
        overlayLock={false}
        renderContent={() => (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {foundCustomers.length} مشتری با کد ملی "
              {requestForm.requesterName}" یافت شد.
            </p>
            <DataTable<CustomerItem>
              query={customersQueryResult}
              columns={customerColumns}
              pagination={{ pageIndex: 0, pageSize: 10 }}
              onPaginationChange={() => {}}
              filters={[]}
              onFiltersChange={() => {}}
              filterFields={[]}
              skeletonColumns={4}
              emptyStateMessage="هیچ مشتری یافت نشد"
            />
          </div>
        )}
        footerButtons={
          <FormButton
            title="انصراف"
            variant="secondary"
            onClick={() => setIsCustomerModalOpen(false)}
          />
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

      <ModalTemplate
        isOpen={!!collateralZoneModalState}
        isRTL
        header="انتخاب انواع وثیقه"
        onClose={() => setCollateralZoneModalState(null)}
        overlayLock={false}
        className="max-w-2xl"
        footerButtons={
          <div className="flex gap-2">
            <FormButton
              title="تأیید انتخاب"
              variant="primary"
              onClick={() => {
                if (collateralZoneModalState) {
                  updateCollateral(
                    collateralZoneModalState.collateralIndex,
                    "expertiseZoneCodes",
                    collateralZoneModalState.selectedCodes,
                  );
                }
                setCollateralZoneModalState(null);
              }}
            />
            <FormButton
              title="انصراف"
              variant="secondary"
              onClick={() => setCollateralZoneModalState(null)}
            />
          </div>
        }
        renderContent={() => {
          const selectableZones = expertiseZones.filter((zone) =>
            Boolean(zone.code),
          );
          const selectedCount =
            collateralZoneModalState?.selectedCodes.length ?? 0;

          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-blue-50 dark:bg-slate-700/50 px-4 py-3 text-sm text-blue-900 dark:text-blue-200">
                <span>یک یا چند مورد را انتخاب کنید:</span>
                <span className="font-bold">
                  {toPersianDigits(selectedCount)} مورد انتخاب شده
                </span>
              </div>

              {selectableZones.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-500">
                  موردی یافت نشد.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto p-1">
                  {selectableZones.map((zone) => {
                    const checked =
                      collateralZoneModalState?.selectedCodes.includes(
                        zone.code!,
                      ) ?? false;

                    return (
                      <label
                        key={zone.id}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 text-sm font-medium transition-all ${
                          checked
                            ? "border-blue-600 bg-blue-50/80 text-blue-900 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-200 shadow-sm"
                            : "border-gray-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/60 text-gray-700 dark:text-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleModalExpertiseZone(zone.code!)
                            }
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>{zone.title || zone.code}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }}
      />

      {isNationalCodeNoticeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="national-code-notice-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsNationalCodeNoticeOpen(false);
            }
          }}
        >
          <div
            dir="rtl"
            className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl"
          >
            <div className="flex items-start gap-3 border-b border-slate-100 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <h2
                  id="national-code-notice-title"
                  className="text-sm font-bold text-slate-800"
                >
                  توجه در ثبت اطلاعات درخواست‌کننده
                </h2>

                <p className="mt-2 text-sm leading-7 text-slate-600">
                  وارد کردن کد ملی شخص حقیقی یا شناسه ملی شخص حقوقی و انجام
                  استعلام مشتری الزامی است.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsNationalCodeNoticeOpen(false)}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                title="بستن"
                aria-label="بستن پیام"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-slate-50 px-5 py-3">
              <p className="text-xs leading-6 text-slate-500">
                کد ملی باید ۱۰ رقم و شناسه ملی باید ۱۱ رقم باشد. پس از ورود
                اطلاعات، دکمه «استعلام» را انتخاب کنید.
              </p>
            </div>

            <div className="flex justify-end p-4">
              <button
                type="button"
                autoFocus
                onClick={() => setIsNationalCodeNoticeOpen(false)}
                className="cursor-pointer rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout.Main>
  );
}

export default function RequestCreatePage() {
  return (
    <DepartmentRequestCreatePage
      departmentType={REQUEST_DEPARTMENT_TYPES.branch}
    />
  );
}
