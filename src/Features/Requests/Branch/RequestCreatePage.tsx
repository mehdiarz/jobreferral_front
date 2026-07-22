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
import { completeUpload } from "../../../services/FileService/complete";
import { uploadChunk } from "../../../services/FileService/uploadChunk";
import { downloadFile } from "../../../services/FileService/download";
import type { RequestTypeItem } from "../../../services/RequestTypeCrud/types";
import type { DepartmentItem } from "../../../services/DepartmentCrud/types";
import type { PersonalTypeItem } from "../../../services/PersonalTypeCrud/types";
import type { CollatralTypeItem } from "../../../services/CollatralTypeCrud/types";
import type { DocumentTypeItem } from "../../../services/DocumentTypeCrud/types";
import { isoToPersian } from "../../../utils/persianToISO";

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
  isCompleted: boolean;
  userName: string;
  userRole: string;
  uploadDate: string;
  uploadTime: string;
};

// ─── Constants ───
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

// ─── Component ───
export default function RequestCreatePage() {
  const { showToast } = useToast();
  const { user, fullName } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<Set<string>>(new Set());
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

  // ─── File handlers ───
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
      isCompleted: false,
      userName: user?.fullName || fullName || "",
      userRole: user?.roles || "",
      uploadDate: today,
      uploadTime: now,
    };

    setUploadedFiles((prev) => [newFile, ...prev]);
    setSelectedFile(null);
    setIsUploading(true);

    try {
      const chunkSize = CHUNK_SIZE;
      const totalChunks = Math.ceil(file.size / chunkSize);

      console.log("📤 Starting upload:", {
        fileName: file.name,
        fileSize: file.size,
        chunkSize,
        totalChunks,
      });

      const startRes = await startUpload({
        fileName: file.name,
        fileSize: file.size,
        chunkSize,
      });

      console.log("✅ Start response:", startRes);
      const uploadId =
        (startRes as any)?.result?.uploadId || (startRes as any)?.uploadId;
      console.log("🆔 Upload ID:", uploadId);

      for (let i = 0; i < totalChunks; i++) {
        if (cancelRef.current.has(docId)) throw new Error("آپلود لغو شد");
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        console.log(
          `📦 Uploading chunk ${i + 1}/${totalChunks}, size: ${chunk.size}`,
        );

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
          console.log(`✅ Chunk ${i + 1} done`);
        } catch (chunkErr: any) {
          console.error(`❌ Chunk ${i + 1} failed:`, chunkErr);
          throw chunkErr;
        }
      }

      console.log("🏁 Completing upload...");
      await completeUpload(uploadId);
      console.log("✅ Upload complete!");

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
      showToast("فایل با موفقیت آپلود شد", "success");
    } catch (err: any) {
      console.error("❌ Upload failed:", err);
      setUploadedFiles((prev) => prev.filter((f) => f.id !== docId));
      if (err.message !== "آپلود لغو شد")
        showToast(`خطا: ${err.message}`, "error");
    } finally {
      setIsUploading(false);
    }
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
        customerId: 0,
        title: requestForm.title,
        requestCode: requestForm.requestCode || "",
        loanNumber: requestForm.loanNumber,
        amount: parseFloat(requestForm.amount),
        description: requestForm.description || "",
        personalTypeId: requestForm.personalTypeId || 0,
        currentApprovalStepId: 0,
        requestStatusId: 0,
      };
      const res = await createRequest(body);
      const requestId = res.id;

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
      showToast("درخواست با موفقیت ثبت شد", "success");
    } catch (err: any) {
      showToast(err?.message || "خطا", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Columns for uploaded files table ───
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
        header: "پیشرفت",
        cell: ({ row }) => {
          if (row.original.isUploading) {
            return (
              <div className="flex items-center gap-2 min-w-[120px]">
                <div className="flex-1 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${row.original.uploadProgress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-8">
                  {row.original.uploadProgress}%
                </span>
              </div>
            );
          }
          return row.original.isCompleted ? (
            <span className="text-green-600 text-xs">✅ تکمیل</span>
          ) : (
            "-"
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
      dataUpdatedAt: Date.now(),
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
              value={user?.branchName || fullName || ""}
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
              value={user?.fullName || fullName || user?.username || ""}
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
          <FluidCol colSpan="col-span-12 md:col-span-4">
            <FormInput
              id="requesterName"
              name="requesterName"
              label="درخواست کننده"
              value={requestForm.requesterName}
              onChange={(v) =>
                setRequestForm((p) => ({ ...p, requesterName: v }))
              }
              dir="rtl"
            />
          </FluidCol>
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
          <button
            onClick={addCollateral}
            className="flex items-center gap-1 px-3 py-2 rounded-md bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" /> افزودن
          </button>
        </div>
        {collaterals.map((col, i) => (
          <div
            key={i}
            className="mb-4 p-4 border border-gray-200 rounded-lg relative"
          >
            {collaterals.length > 1 && (
              <button
                onClick={() => removeCollateral(i)}
                className="absolute top-2 left-2 p-1 text-red-500 hover:bg-red-50 rounded"
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

        {/* انتخاب نوع مدرک + انتخاب فایل + دکمه آپلود */}
        <div className="flex items-end gap-4 mb-6 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <FormSelect<number>
              id="docTypeSelect"
              name="docTypeSelect"
              label="نوع مدارک"
              value={selectedDocTypeId ?? ""}
              onChange={(v) => setSelectedDocTypeId(v ? Number(v) : null)}
              options={documentTypeOptions}
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-300 cursor-pointer text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              {selectedFile ? selectedFile.name : "انتخاب فایل"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
            />
            <FormButton
              title="شروع آپلود"
              variant="primary"
              onClick={handleStartUpload}
              isLoading={isUploading}
              disabled={isUploading || !selectedFile || !selectedDocTypeId}
            />
          </div>
        </div>

        {/* جدول فایل‌های آپلود شده */}
        {uploadedFiles.length > 0 && (
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
        )}
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
    </MainLayout.Main>
  );
}
