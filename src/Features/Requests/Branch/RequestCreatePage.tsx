import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Upload, Download } from "lucide-react";
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
import { useToast } from "../../../libs/toastContext";
import { useAuthStore } from "../../../libs/store";

import { createRequest } from "../../../services/RequestCrud/create";
import { getAllRequestTypes } from "../../../services/RequestTypeCrud/getAll";
import { getAllDepartments } from "../../../services/DepartmentCrud/getAll";
import { getAllPersonalTypes } from "../../../services/PersonalTypeCrud/getAll";
import { getAllCollatralTypes } from "../../../services/CollatralTypeCrud/getAll";
import { getAllDocumentTypes } from "../../../services/DocumentTypeCrud/getAll";
import { createCollatral } from "../../../services/CollatralCrud/create";
import { startUpload } from "../../../services/FileService/start";
import { uploadChunk } from "../../../services/FileService/uploadChunk";
import { downloadFile } from "../../../services/FileService/download";
import type { RequestTypeItem } from "../../../services/RequestTypeCrud/types";
import type { DepartmentItem } from "../../../services/DepartmentCrud/types";
import type { PersonalTypeItem } from "../../../services/PersonalTypeCrud/types";
import type { CollatralTypeItem } from "../../../services/CollatralTypeCrud/types";
import type { DocumentTypeItem } from "../../../services/DocumentTypeCrud/types";
import { isoToPersian } from "../../../utils/persianToISO";
import { createDocument } from "../../../services/DocumentCrud/create.ts";
import { completeBatchUpload } from "../../../services/FileService/completeBatch.ts";
import { findCustomer } from "../../../services/CustomerCrud/find";
import type { CustomerItem } from "../../../services/CustomerCrud/types";
import { createRequestComment } from "../../../services/RequestCommentCrud/create";

// ─── Types ───
type CollateralForm = {
  personTypeId: number | null;
  collatralTypeId: number | null;
  firstName: string;
  lastName: string;
  nationalCode: string;
};

type RequestForm = {
  loanNumber: string;
  requestTypeId: number | null;
  title: string;
  requestCode: string;
  personalTypeId: number | null;
  requesterName: string;
  amount: string;
  departmentId: number | null;
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
  collatralTypeId: null,
  firstName: "",
  lastName: "",
  nationalCode: "",
};
const emptyRequest: RequestForm = {
  loanNumber: "",
  requestTypeId: null,
  title: "",
  requestCode: "",
  personalTypeId: null,
  requesterName: "",
  amount: "",
  departmentId: null,
  description: "",
};
const CHUNK_SIZE = 2 * 1024 * 1024;

export default function RequestCreatePage() {
  const { showToast } = useToast();
  const { user, fullName } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<Set<string>>(new Set());
  const uploadStateRef = useRef<
    Map<
      string,
      {
        file: File;
        uploadId: string;
        totalChunks: number;
        lastUploadedChunk: number;
        isPaused: boolean;
        isCompleting: boolean;
      }
    >
  >(new Map());
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
  } | null>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [foundCustomers, setFoundCustomers] = useState<CustomerItem[]>([]);

  const [expertComment, setExpertComment] = useState("");

  const userName = fullName || user?.username || "";
  const branchName = user?.branchName || "";

  // ─── Queries ───
  const { data: requestTypes = [] } = useQuery({
    queryKey: ["request-types-all"],
    queryFn: () => getAllRequestTypes({ maxResultCount: 1000 }),
    select: (d) => (d as any)?.items ?? (d as any)?.result?.items ?? [],
  });
  const { data: departments = [] } = useQuery({
    queryKey: ["departments-all"],
    queryFn: () => getAllDepartments({ maxResultCount: 1000 }),
    select: (d) => d?.items ?? [],
  });
  const { data: personalTypes = [] } = useQuery({
    queryKey: ["personal-types-all"],
    queryFn: () => getAllPersonalTypes({ maxResultCount: 1000 }),
    select: (d) => d?.items ?? [],
  });
  const { data: collateralTypes = [] } = useQuery({
    queryKey: ["collateral-types-all"],
    queryFn: () => getAllCollatralTypes({ maxResultCount: 1000 }),
    select: (d) => d?.items ?? [],
  });
  const { data: documentTypes = [] } = useQuery({
    queryKey: ["document-types-all"],
    queryFn: () => getAllDocumentTypes({ maxResultCount: 1000 }),
    select: (d) => d?.items ?? [],
  });

  // ─── Options ───
  const requestTypeOptions = useMemo(
    () =>
      requestTypes.map((i: RequestTypeItem) => ({
        id: i.id,
        title: i.title ?? "",
      })),
    [requestTypes],
  );
  const departmentOptions = useMemo(
    () =>
      departments.map((i: DepartmentItem) => ({
        id: i.id,
        title: i.title ?? "",
      })),
    [departments],
  );
  const personalTypeOptions = useMemo(
    () =>
      personalTypes.map((i: PersonalTypeItem) => ({
        id: i.id,
        title: i.title ?? "",
      })),
    [personalTypes],
  );
  const collateralTypeOptions = useMemo(
    () =>
      collateralTypes.map((i: CollatralTypeItem) => ({
        id: i.id,
        title: i.title ?? "",
      })),
    [collateralTypes],
  );
  const documentTypeOptions = useMemo(
    () =>
      documentTypes.map((i: DocumentTypeItem) => ({
        id: i.id,
        title: i.title ?? "",
      })),
    [documentTypes],
  );

  // ─── File Upload with Resume ───
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
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
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

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
      const startRes: any = await startUpload({
        fileName: file.name,
        fileSize: file.size,
        chunkSize: CHUNK_SIZE,
      });
      const uploadId = startRes?.result?.uploadId || startRes?.uploadId;

      console.log("🆕 New uploadId:", uploadId);

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
      await uploadChunksInBatches(docId, file, uploadId, totalChunks, 0);

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
    } catch (err: any) {
      if (err.message === "آپلود لغو شد") {
        // کاربر دستی pause کرده - فایل بمونه
      } else {
        // خطای شبکه یا سرور - فایل بمونه توی حالت paused
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === docId ? { ...f, isUploading: false } : f)),
        );
        showToast(`خطا: ${err.message}. می‌توانید ادامه دهید.`, "warning");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFindCustomer = async () => {
    const cif = requestForm.requesterName.trim();
    if (!cif) {
      showToast("لطفاً شماره مشتری را وارد کنید", "error");
      return;
    }

    setIsSearchingCustomer(true);
    try {
      const customers = await findCustomer(cif);
      if (customers.length === 0) {
        setCustomerId(null);
        setCustomerInfo(null);
        showToast("مشتری با این شماره یافت نشد", "warning");
      } else if (customers.length === 1) {
        const c = customers[0];
        setCustomerId(c.id);
        setCustomerInfo({ cif: c.cifNumber || cif, name: c.name || "-" });
        showToast("مشتری یافت شد", "success");
      } else {
        setFoundCustomers(customers);
        setIsCustomerModalOpen(true);
      }
    } catch (err: any) {
      showToast(err?.message || "خطا در استعلام", "error");
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  const handleSelectCustomer = (customer: CustomerItem) => {
    setCustomerId(customer.id);
    setCustomerInfo({
      cif: customer.cifNumber || "",
      name: customer.name || "-",
    });
    setIsCustomerModalOpen(false);
    showToast("مشتری انتخاب شد", "success");
  };

  const uploadChunksInBatches = async (
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

      const state = uploadStateRef.current.get(docId);
      if (state?.isPaused) {
        state.lastUploadedChunk = i - 1;
        throw new Error("آپلود متوقف شد");
      }

      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      try {
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

        // Update state
        if (state) state.lastUploadedChunk = i;
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
      } catch (chunkErr: any) {
        // خطا توی آپلود chunk - متوقف کن و state رو ذخیره کن
        if (state) {
          state.lastUploadedChunk = i - 1;
          state.isPaused = true;
        }
        throw new Error(`خطا در آپلود: ${chunkErr.message}`);
      }
    }
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
      await uploadChunksInBatches(
        file.id,
        state.file,
        state.uploadId,
        state.totalChunks,
        startIndex,
      );

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
    } catch (err: any) {
      setUploadedFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, isUploading: false } : f)),
      );
      showToast(`خطا: ${err.message}. می‌توانید ادامه دهید.`, "warning");
    }
  };

  const handlePauseUpload = (docId: string) => {
    const state = uploadStateRef.current.get(docId);
    if (state) state.isPaused = true;
    setUploadedFiles((prev) =>
      prev.map((f) => (f.id === docId ? { ...f, isUploading: false } : f)),
    );
  };

  const handleDownload = async (file: UploadedFile) => {
    try {
      await downloadFile(file.fileAddress, 0);
    } catch {
      showToast("خطا در دانلود", "error");
    }
  };

  const handleDeleteFile = (id: string) => {
    cancelRef.current.add(id);
    uploadStateRef.current.delete(id);
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // ─── Collateral ───
  const addCollateral = () =>
    setCollaterals((p) => [...p, { ...emptyCollateral }]);
  const removeCollateral = (i: number) => {
    if (collaterals.length > 1)
      setCollaterals((p) => p.filter((_, idx) => idx !== i));
  };
  const updateCollateral = (i: number, f: keyof CollateralForm, v: any) =>
    setCollaterals((p) =>
      p.map((c, idx) => (idx === i ? { ...c, [f]: v } : c)),
    );

  // ─── Submit ───
  const handleSubmit = async () => {
    if (!requestForm.loanNumber) {
      showToast("شماره پرونده الزامی است", "error");
      return;
    }
    if (!requestForm.requestTypeId) {
      showToast("نوع درخواست الزامی است", "error");
      return;
    }
    if (!requestForm.title) {
      showToast("عنوان الزامی است", "error");
      return;
    }
    if (!requestForm.amount) {
      showToast("مبلغ الزامی است", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        requestTypeId: requestForm.requestTypeId!,
        departmentId: requestForm.departmentId || 0,
        customerId: customerId || 0,
        title: requestForm.title,
        requestCode: requestForm.requestCode || "",
        loanNumber: requestForm.loanNumber,
        amount: parseFloat(requestForm.amount),
        description: requestForm.description || "",
        personalTypeId: requestForm.personalTypeId || 0,
        // currentApprovalStepId: 0,
        // requestStatusCode: 0,
      };
      // 1. Create Request
      const requestRes: any = await createRequest(body);
      const requestId = requestRes?.result?.id || requestRes?.id;

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
        if (col.personTypeId && col.collatralTypeId && col.firstName) {
          await createCollatral({
            collatralTypeId: col.collatralTypeId,
            requestId,
            firstName: col.firstName,
            lastName: col.lastName,
            nationalCode: col.nationalCode,
            personTypeId: col.personTypeId,
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
        const docRes: any = await createDocument({
          documentTypeId: docTypeId,
          requestId,
        });
        const documentId = docRes?.result?.id || docRes?.id;
        console.log(`📄 Document created (typeId=${docTypeId}):`, documentId);

        // Attach all files to this document
        for (const file of files) {
          if (file.uploadId) {
            batchItems.push({ uploadId: file.uploadId, documentId });
          }
        }
      }

      // 5. Complete all files in ONE request
      if (batchItems.length > 0) {
        console.log("📦 Sending CompleteBatch:", batchItems);
        await completeBatchUpload({ items: batchItems });
        console.log("✅ CompleteBatch done");
      }

      showToast("درخواست با موفقیت ثبت شد", "success");
      setRequestForm(emptyRequest);
      setCollaterals([{ ...emptyCollateral }]);
      setUploadedFiles([]);
      uploadStateRef.current.clear();
      setSelectedDocTypeId(null);
      setSelectedFile(null);
      setCustomerId(null);
      setCustomerInfo(null);
      setExpertComment("");
    } catch (err: any) {
      showToast(err?.message || "خطا", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Columns ───
  const fileColumns = useMemo<ColumnDef<UploadedFile, any>[]>(
    () => [
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
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
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
            {row.original.isCompleted && (
              <button
                onClick={() => handleDownload(row.original)}
                className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50"
                title="دانلود"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
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
    ],
    [],
  );

  const customerColumns = useMemo<ColumnDef<CustomerItem, any>[]>(
    () => [
      {
        id: "cifNumber",
        header: "شماره مشتری",
        accessorKey: "cifNumber",
        cell: ({ row }) => row.original.cifNumber || "-",
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
          const type = personalTypes.find((t: any) => t.id === typeId);
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
    ],
    [personalTypes],
  );

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
      isSuccess: true,
      isPending: false,
      isLoadingError: false,
      isRefetchError: false,
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      error: null,
      status: "success" as const,
      fetchStatus: "idle" as const,
      refetch: () => {},
      promise: Promise.resolve({
        listResult: uploadedFiles,
        total: uploadedFiles.length,
        totalPages: 1,
      }),
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
      isSuccess: true,
      isPending: false,
      isLoadingError: false,
      isRefetchError: false,
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      error: null,
      status: "success" as const,
      fetchStatus: "idle" as const,
      refetch: () => {},
      promise: Promise.resolve({
        listResult: foundCustomers,
        total: foundCustomers.length,
        totalPages: 1,
      }),
    }),
    [foundCustomers],
  );

  // ─── Render ───
  return (
    <MainLayout.Main maxWidth="screen-xl">
      <PageTitle title="ایجاد درخواست جدید" />

      {/* اطلاعات درخواست */}
      <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
        <h3 className="mb-4 font-bold text-lg text-blue-900 dark:text-white">
          اطلاعات درخواست
        </h3>
        <FluidGrid className="gap-4">
          <FluidCol colSpan="col-span-12 md:col-span-4">
            <FormInput
              id="loanNumber"
              name="loanNumber"
              label="شماره پرونده"
              value={requestForm.loanNumber}
              onChange={(v) => setRequestForm((p) => ({ ...p, loanNumber: v }))}
              dir="ltr"
              required
            />
          </FluidCol>
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
            />
          </FluidCol>
          <FluidCol colSpan="col-span-12 md:col-span-4">
            <FormInput
              id="branchName"
              name="branchName"
              label="شعبه"
              value={branchName}
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
              value={today}
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
                label="درخواست کننده (شماره مشتری)"
                value={requestForm.requesterName}
                onChange={(v) => {
                  setRequestForm((p) => ({ ...p, requesterName: v }));
                  setCustomerInfo(null);
                  setCustomerId(null);
                }}
                dir="rtl"
              />
              <button
                onClick={handleFindCustomer}
                disabled={
                  !requestForm.requesterName.trim() || isSearchingCustomer
                }
                className="absolute bottom-2 left-2 rounded-md p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="استعلام"
              >
                {isSearchingCustomer ? (
                  <span className="inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
                ) : (
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
                )}
              </button>
            </div>
          </FluidCol>

          {/* نمایش نتیجه استعلام - فقط وقتی customerInfo داریم */}
          {customerInfo && (
            <FluidCol colSpan="col-span-12">
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 flex-1">
                  <svg
                    className="w-5 h-5 text-green-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">نام مشتری:</span>
                    <span className="font-medium text-gray-800">
                      {customerInfo.name}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500">شماره مشتری:</span>
                    <span className="font-medium text-gray-800" dir="ltr">
                      {customerInfo.cif}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCustomerInfo(null);
                    setCustomerId(null);
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="حذف"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </FluidCol>
          )}

          {/* اگه مشتری پیدا نشد */}
          {!customerInfo &&
            !isSearchingCustomer &&
            requestForm.requesterName.trim() && (
              <FluidCol colSpan="col-span-12">
                <div className="text-xs text-gray-400 -mt-2">
                  برای استعلام، روی ذره‌بین کلیک کنید
                </div>
              </FluidCol>
            )}
          <FluidCol colSpan="col-span-12 md:col-span-4">
            <FormInput
              id="amount"
              name="amount"
              label="مبلغ تسهیلات (ریال)"
              value={requestForm.amount}
              onChange={(v) => setRequestForm((p) => ({ ...p, amount: v }))}
              dir="ltr"
              type="number"
              required
            />
          </FluidCol>
          <FluidCol colSpan="col-span-12 md:col-span-4">
            <FormSelect<number>
              id="departmentId"
              name="departmentId"
              label="دپارتمان"
              value={requestForm.departmentId ?? ""}
              onChange={(v) =>
                setRequestForm((p) => ({
                  ...p,
                  departmentId: v ? Number(v) : null,
                }))
              }
              options={departmentOptions}
            />
          </FluidCol>
        </FluidGrid>
      </div>

      <hr className="my-6 border-gray-300 dark:border-gray-600" />

      {/* وثیقه گذاران */}
      <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-blue-900 dark:text-white">
            وثیقه گذار / وثیقه گذاران
          </h3>
          <FormButton
            title={
              <span className="flex items-center gap-1">
                <Plus className="w-4 h-4" /> افزودن
              </span>
            }
            variant="success"
            onClick={addCollateral}
          />
        </div>
        {collaterals.map((col, i) => (
          <div
            key={i}
            className="mb-4 p-4 border border-gray-200 rounded-lg relative"
          >
            {collaterals.length > 1 && (
              <button
                onClick={() => removeCollateral(i)}
                className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 rounded z-10"
                title="حذف"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <FluidGrid className="gap-4">
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
                />
              </FluidCol>
              <FluidCol colSpan="col-span-12 md:col-span-6">
                <FormSelect<number>
                  id={`cc-${i}`}
                  name={`cc-${i}`}
                  label="نوع وثیقه"
                  value={col.collatralTypeId ?? ""}
                  onChange={(v) =>
                    updateCollateral(i, "collatralTypeId", v ? Number(v) : null)
                  }
                  options={collateralTypeOptions}
                />
              </FluidCol>
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
      </div>

      <hr className="my-6 border-gray-300 dark:border-gray-600" />

      {/* مدارک پیوست */}
      <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
        <h3 className="font-bold text-lg text-blue-900 dark:text-white mb-4">
          مدارک پیوست
        </h3>

        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
          <div className="w-48">
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
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer text-sm text-gray-600 min-w-[140px]"
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
            disabled={isUploading || !selectedFile || !selectedDocTypeId}
          />

          {selectedFile && (
            <span className="text-xs text-gray-400 ml-auto">
              {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
            </span>
          )}
        </div>

        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <DataTable<UploadedFile>
              query={filesQueryResult as any}
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
      </div>

      <hr className="my-6 border-gray-300 dark:border-gray-600" />

      {/* توضیحات و ثبت */}
      <hr className="my-6 border-gray-300 dark:border-gray-600" />

      {/* توضیحات کارشناس */}
      <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
        <FluidGrid className="gap-4">
          <FluidCol colSpan="col-span-12">
            <FormTextarea
              id="expertComment"
              name="expertComment"
              label="توضیحات کارشناس"
              value={expertComment}
              onChange={(v) => setExpertComment(v)}
              rows={3}
              dir="rtl"
            />
          </FluidCol>
        </FluidGrid>
      </div>

      <hr className="my-6 border-gray-300 dark:border-gray-600" />

      {/* توضیحات و ثبت */}
      <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
        <FluidGrid className="gap-4">
          <FluidCol colSpan="col-span-12">
            <FormTextarea
              id="description"
              name="description"
              label="توضیحات"
              value={requestForm.description}
              onChange={(v) =>
                setRequestForm((p) => ({ ...p, description: v }))
              }
              rows={4}
              dir="rtl"
            />
          </FluidCol>
          <FluidCol colSpan="col-span-12" className="flex justify-end">
            <FormButton
              title="ثبت درخواست"
              variant="success"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            />
          </FluidCol>
        </FluidGrid>
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
              {foundCustomers.length} مشتری با شماره "
              {requestForm.requesterName}" یافت شد. لطفاً یکی را انتخاب کنید:
            </p>
            <DataTable<CustomerItem>
              query={customersQueryResult as any}
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
    </MainLayout.Main>
  );
}
