import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Download } from "lucide-react";

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
import { getAllRequestStatus } from "../../../services/RequestStatusCrud/getAll";
import { getAllRequestTypes } from "../../../services/RequestTypeCrud/getAll";
import { getAllDepartments } from "../../../services/DepartmentCrud/getAll";
import { getAllPersonalTypes } from "../../../services/PersonalTypeCrud/getAll";
import { getAllCollatralTypes } from "../../../services/CollatralTypeCrud/getAll";
import { getAllDocuments } from "../../../services/DocumentCrud/getAll";
import { getAllRequestComments } from "../../../services/RequestCommentCrud/getAll";
import { getAllCollatrals } from "../../../services/CollatralCrud/getAll";
import { getDocumentAllFiles } from "../../../services/FileService/GetDocumentAllFiles";
import { downloadFile } from "../../../services/FileService/download";
import { getAllRequestHistory } from "../../../services/RequestHistoryCrud/getAll";
import type { RequestHistoryItem } from "../../../services/RequestHistoryCrud/types";
import { getUserById } from "../../../services/Users/getUserById";

import type {
  RequestItem,
  EditRequestBody,
} from "../../../services/RequestCrud/types";
import type { DocumentItem } from "../../../services/DocumentCrud/types";
import type { DocumentFile } from "../../../services/FileService/GetDocumentAllFiles";
import type { RequestCommentItem } from "../../../services/RequestCommentCrud/types";
import type { CollatralItem } from "../../../services/CollatralCrud/types";
import { isoToPersian } from "../../../utils/persianToISO";

type TableFilter = { key: string; value: string };

const InfoRow = ({
  label,
  value,
  isBold,
}: {
  label: string;
  value: string;
  isBold?: boolean;
}) => (
  <div>
    <span className="text-gray-500 text-xs">{label}:</span>
    <span className={`mr-2 text-gray-800 ${isBold ? "font-bold" : ""}`}>
      {value}
    </span>
  </div>
);
export default function RequestViewPage() {
  const { showToast } = useToast();
  const { user } = useAuthStore();

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [filters, setFilters] = useState<TableFilter[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [detailDocs, setDetailDocs] = useState<
    { doc: DocumentItem; files: DocumentFile[] }[]
  >([]);
  const [detailComments, setDetailComments] = useState<RequestCommentItem[]>(
    [],
  );
  const [detailCollaterals, setDetailCollaterals] = useState<CollatralItem[]>(
    [],
  );
  const [editForm, setEditForm] = useState<any>({});
  const [editCollaterals, setEditCollaterals] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [userRolesCache, setUserRolesCache] = useState<Map<number, string>>(
    new Map(),
  );
  const [userNamesCache, setUserNamesCache] = useState<Map<number, string>>(
    new Map(),
  );

  const requestsQuery = useQuery({
    queryKey: ["requests-all-view"],
    queryFn: () => getAllRequests({ maxResultCount: 5000 }),
    select: (data) => {
      const items = data?.items ?? [];
      const tf =
        filters
          .find((f) => f.key === "title")
          ?.value?.trim()
          .toLocaleLowerCase("fa") ?? "";
      const lf =
        filters.find((f) => f.key === "loanNumber")?.value?.trim() ?? "";
      const filtered = items.filter(
        (r: RequestItem) =>
          (!tf || (r.title ?? "").toLocaleLowerCase("fa").includes(tf)) &&
          (!lf || String(r.loanNumber ?? "").includes(lf)),
      );
      const total = filtered.length;
      const tp = Math.max(1, Math.ceil(total / pagination.pageSize));
      const si = pagination.pageIndex * pagination.pageSize;
      return {
        listResult: filtered.slice(si, si + pagination.pageSize),
        total,
        totalPages: tp,
      };
    },
  });

  const statusQuery = useQuery({
    queryKey: ["req-status-all"],
    queryFn: () => getAllRequestStatus({ maxResultCount: 100 }),
    select: (d) => d?.items ?? [],
  });
  const typesQuery = useQuery({
    queryKey: ["req-types-all-view"],
    queryFn: () => getAllRequestTypes({ maxResultCount: 1000 }),
    select: (d) => (d as any)?.items ?? [],
  });
  const deptsQuery = useQuery({
    queryKey: ["depts-all-view"],
    queryFn: () => getAllDepartments({ maxResultCount: 1000 }),
    select: (d) => d?.items ?? [],
  });
  const persTypesQuery = useQuery({
    queryKey: ["pers-types-all-view"],
    queryFn: () => getAllPersonalTypes({ maxResultCount: 1000 }),
    select: (d) => d?.items ?? [],
  });
  const collTypesQuery = useQuery({
    queryKey: ["coll-types-all-view"],
    queryFn: () => getAllCollatralTypes({ maxResultCount: 1000 }),
    select: (d) => d?.items ?? [],
  });
  const historyQuery = useQuery({
    queryKey: ["req-history-all"],
    queryFn: () => getAllRequestHistory({ maxResultCount: 5000 }),
    select: (d) => (d as any)?.result?.items || (d as any)?.items || [],
  });

  const statusMap = useMemo(() => {
    const m = new Map<number, string>();
    (statusQuery.data ?? []).forEach((s: any) => m.set(s.code, s.title ?? ""));
    return m;
  }, [statusQuery.data]);
  const typeOpts = useMemo(
    () =>
      (typesQuery.data ?? []).map((i: any) => ({
        id: i.id,
        title: i.title ?? "",
      })),
    [typesQuery.data],
  );
  const deptOpts = useMemo(
    () =>
      (deptsQuery.data ?? []).map((i: any) => ({
        id: i.id,
        title: i.title ?? "",
      })),
    [deptsQuery.data],
  );
  const persTypeOpts = useMemo(
    () =>
      (persTypesQuery.data ?? []).map((i: any) => ({
        id: i.id,
        title: i.title ?? "",
      })),
    [persTypesQuery.data],
  );
  const collTypeOpts = useMemo(
    () =>
      (collTypesQuery.data ?? []).map((i: any) => ({
        id: i.id,
        title: i.title ?? "",
      })),
    [collTypesQuery.data],
  );

  const historyByRequest = useMemo(() => {
    const m = new Map<number, RequestHistoryItem>();
    (historyQuery.data ?? []).forEach((h: RequestHistoryItem) => {
      if (h.requestId && !m.has(h.requestId)) m.set(h.requestId, h);
    });
    return m;
  }, [historyQuery.data]);

  useEffect(() => {
    const uniqueIds = new Set<number>();

    (historyQuery.data || []).forEach((h: any) => {
      if (h.reviewerUserId && !userNamesCache.has(h.reviewerUserId)) {
        uniqueIds.add(h.reviewerUserId);
      }
    });

    if (detailComments.length > 0) {
      detailComments.forEach((c) => {
        if (c.userId && !userNamesCache.has(c.userId)) {
          uniqueIds.add(c.userId);
        }
      });
    }

    if (uniqueIds.size === 0) return;

    uniqueIds.forEach(async (id) => {
      try {
        const userInfo = await getUserById(id);
        const fullName =
          userInfo?.fullName ||
          `${userInfo?.name || ""} ${userInfo?.surname || ""}`.trim() ||
          `کاربر ${id}`;
        const role = userInfo?.roleNames?.join(", ") || "کاربر";

        setUserNamesCache((prev) => new Map(prev).set(id, fullName));
        setUserRolesCache((prev) => new Map(prev).set(id, role));
      } catch {
        setUserNamesCache((prev) => new Map(prev).set(id, `کاربر ${id}`));
        setUserRolesCache((prev) => new Map(prev).set(id, "-"));
      }
    });
  }, [historyQuery.data, detailComments]);

  const handleView = async (req: RequestItem) => {
    try {
      const detail = await getRequest(req.id);
      const reqData = (detail as any)?.result || detail;
      setSelectedRequest(reqData);

      // Docs
      const docs = await getAllDocuments({ maxResultCount: 5000 });
      const fDocs = (docs.items ?? []).filter(
        (d: DocumentItem) => d.requestId === req.id,
      );
      const docsWithFiles = await Promise.all(
        fDocs.map(async (doc: DocumentItem) => {
          const files = await getDocumentAllFiles(doc.id);
          return { doc, files };
        }),
      );
      setDetailDocs(docsWithFiles);

      // Comments
      const comments = await getAllRequestComments({
        requestId: req.id,
        maxResultCount: 100,
      });
      setDetailComments(comments.items ?? []);

      // Collaterals - فیلتر client-side
      const allColl = await getAllCollatrals({ maxResultCount: 5000 });
      const fColl = (allColl.items ?? []).filter(
        (c: CollatralItem) => c.requestId === req.id,
      );
      setDetailCollaterals(fColl);

      setIsDetailOpen(true);
    } catch {
      showToast("خطا", "error");
    }
  };

  const handleEdit = async (req: RequestItem) => {
    try {
      const detail = await getRequest(req.id);
      const reqData = (detail as any)?.result || detail;
      setSelectedRequest(reqData);
      setEditForm({
        loanNumber: reqData.loanNumber ?? "",
        title: reqData.title ?? "",
        requestCode: reqData.requestCode ?? "",
        amount: reqData.amount?.toString() ?? "",
        requestTypeId: reqData.requestTypeId ?? null,
        departmentId: reqData.departmentId ?? null,
        personalTypeId: reqData.personalTypeId ?? null,
        description: reqData.description ?? "",
      });

      // Collaterals for edit
      const allColl = await getAllCollatrals({ maxResultCount: 5000 });
      const fColl = (allColl.items ?? []).filter(
        (c: CollatralItem) => c.requestId === req.id,
      );
      setEditCollaterals(
        fColl.length > 0
          ? fColl.map((c: any) => ({
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

      setIsEditOpen(true);
    } catch {
      showToast("خطا", "error");
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedRequest) return;
    setIsSaving(true);
    try {
      await editRequest({
        id: selectedRequest.id,
        requestTypeId: editForm.requestTypeId ?? 0,
        departmentId: editForm.departmentId ?? 0,
        customerId: selectedRequest.customerId ?? 0,
        title: editForm.title,
        requestCode: editForm.requestCode,
        loanNumber: editForm.loanNumber,
        amount: parseFloat(editForm.amount) || 0,
        description: editForm.description,
        personalTypeId: editForm.personalTypeId ?? 0,
      } as EditRequestBody);
      showToast("ذخیره شد", "success");
      setIsEditOpen(false);
      requestsQuery.refetch();
    } catch (err: any) {
      showToast(err?.message || "خطا", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const columns = useMemo<ColumnDef<RequestItem, unknown>[]>(
    () => [
      {
        id: "status",
        header: "مرحله فرآیند",
        cell: ({ row }) =>
          statusMap.get(row.original.requestStatusCode ?? 0) || "-",
      },
      {
        id: "user",
        header: "نام کاربر اقدام کننده",
        cell: ({ row }) => {
          const h = historyByRequest.get(row.original.id);
          if (!h?.description) return user?.fullName || "-";
          // استخراج اسم از description
          // "درخواست توسط کاربر 9998 9998 با کد کاربری 9998 ایجاد گردید"
          const match = h.description.match(/توسط کاربر (.+?) با کد/);
          return match ? match[1] : user?.fullName || "-";
        },
      },
      {
        id: "role",
        header: "نقش سازمانی",
        cell: ({ row }) => {
          const h = historyByRequest.get(row.original.id);
          const reviewerId = h?.reviewerUserId;
          if (!reviewerId) return "-";
          return userRolesCache.get(reviewerId) || "...";
        },
      },
      {
        id: "date",
        header: "تاریخ و زمان",
        cell: ({ row }) => {
          const h = historyByRequest.get(row.original.id);
          return h?.creationTime ? isoToPersian(h.creationTime) : "-";
        },
      },
      {
        id: "desc",
        header: "توضیحات",
        cell: ({ row }) => {
          const h = historyByRequest.get(row.original.id);
          return h?.description || "-";
        },
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
    [statusMap, user, historyByRequest, userRolesCache],
  );

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
          onFiltersChange={(nf) => {
            const l = nf.at(-1);
            setFilters(l ? [l] : []);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
          filterFields={[
            { field: "title", label: "عنوان" },
            { field: "loanNumber", label: "شماره پرونده" },
          ]}
          searchMode="onEnter"
          skeletonColumns={7}
          emptyStateMessage="هیچ درخواستی یافت نشد"
        />
      </div>

      {/* مودال جزئیات */}
      <Modal
        isOpen={isDetailOpen}
        isRTL
        header="جزئیات پرونده"
        onClose={() => setIsDetailOpen(false)}
        overlayLock={false}
        renderContent={() => {
          if (!selectedRequest) return <p>در حال بارگذاری...</p>;

          const histories = (historyQuery.data || []).filter(
            (h: any) => h.requestId === selectedRequest.id,
          );
          const createHistory = histories.find((h: any) =>
            h.description?.includes("ایجاد گردید"),
          );

          return (
            <div className="space-y-4 text-sm max-h-[65vh] overflow-y-auto">
              {/* اطلاعات اصلی */}
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
                    value={
                      statusMap.get(selectedRequest.requestStatusCode ?? 0) ||
                      "-"
                    }
                  />
                  <InfoRow
                    label="تاریخ ثبت"
                    value={
                      selectedRequest.creationTime
                        ? isoToPersian(selectedRequest.creationTime)
                        : "-"
                    }
                  />
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
                      {(createHistory.description.match(
                        /توسط کاربر (.+?) با کد/,
                      ) || ["", "?"])[1].charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">
                      {
                        (createHistory.description.match(
                          /توسط کاربر (.+?) با کد/,
                        ) || ["", "-"])[1]
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {userRolesCache.get(createHistory.reviewerUserId) ||
                        "کاربر"}
                      {" — "}
                      {createHistory.creationTime
                        ? isoToPersian(createHistory.creationTime)
                        : "-"}
                    </p>
                  </div>
                </div>
              )}

              {/* تاریخچه اقدامات - Timeline */}
              {histories.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-blue-900 mb-3 text-base border-b border-gray-200 pb-2">
                    تاریخچه اقدامات
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
              {detailCollaterals.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-blue-900 mb-3 text-base border-b border-gray-200 pb-2">
                    وثیقه گذاران
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
                            (o: any) => String(o.id) === String(c.personTypeId),
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
                    توضیحات کارشناس
                    <span className="text-yellow-600 text-xs font-normal mr-2">
                      ({detailComments.length} مورد)
                    </span>
                  </h4>
                  <div className="space-y-2">
                    {detailComments.map((c) => (
                      <div
                        key={c.id}
                        className="bg-white rounded-lg p-3 border border-yellow-100"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">
                            {userNamesCache.get(c.userId || 0) ||
                              `کاربر شماره ${c.userId}`}
                            {" — "}
                            {userRolesCache.get(c.userId || 0) || ""}
                          </span>
                          <span className="text-xs text-gray-400">
                            {c.creationTime
                              ? isoToPersian(c.creationTime)
                              : "-"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{c.description}</p>
                      </div>
                    ))}
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
      {/* مودال ویرایش */}
      <Modal
        isOpen={isEditOpen}
        isRTL
        header="ویرایش درخواست"
        onClose={() => setIsEditOpen(false)}
        overlayLock={isSaving}
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
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                id="e-loan"
                name="loanNumber"
                label="شماره پرونده"
                value={editForm.loanNumber}
                onChange={(v) =>
                  setEditForm((p: any) => ({ ...p, loanNumber: v }))
                }
                dir="ltr"
                required
              />
              <FormInput
                id="e-title"
                name="title"
                label="عنوان"
                value={editForm.title}
                onChange={(v) => setEditForm((p: any) => ({ ...p, title: v }))}
                dir="rtl"
                required
              />
              <FormInput
                id="e-code"
                name="requestCode"
                label="شماره مصوبه"
                value={editForm.requestCode}
                onChange={(v) =>
                  setEditForm((p: any) => ({ ...p, requestCode: v }))
                }
                dir="ltr"
              />
              <FormInput
                id="e-amount"
                name="amount"
                label="مبلغ (ریال)"
                value={editForm.amount}
                onChange={(v) => setEditForm((p: any) => ({ ...p, amount: v }))}
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
                  setEditForm((p: any) => ({
                    ...p,
                    requestTypeId: v ? Number(v) : null,
                  }))
                }
                options={typeOpts}
              />
              <FormSelect<number>
                id="e-dept"
                name="departmentId"
                label="دپارتمان"
                value={editForm.departmentId ?? ""}
                onChange={(v) =>
                  setEditForm((p: any) => ({
                    ...p,
                    departmentId: v ? Number(v) : null,
                  }))
                }
                options={deptOpts}
              />
              <FormSelect<number>
                id="e-ptype"
                name="personalTypeId"
                label="نوع شخص"
                value={editForm.personalTypeId ?? ""}
                onChange={(v) =>
                  setEditForm((p: any) => ({
                    ...p,
                    personalTypeId: v ? Number(v) : null,
                  }))
                }
                options={persTypeOpts}
              />
              <div className="md:col-span-2">
                <FormTextarea
                  id="e-desc"
                  name="description"
                  label="توضیحات"
                  value={editForm.description}
                  onChange={(v) =>
                    setEditForm((p: any) => ({ ...p, description: v }))
                  }
                  rows={3}
                  dir="rtl"
                />
              </div>
            </div>
            {/* وثیقه گذاران در ویرایش */}
            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-sm">وثیقه گذاران</h4>
                <button
                  onClick={() =>
                    setEditCollaterals((prev: any) => [
                      ...prev,
                      {
                        personTypeId: null,
                        collatralTypeId: null,
                        firstName: "",
                        lastName: "",
                        nationalCode: "",
                      },
                    ])
                  }
                  className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1 cursor-pointer"
                >
                  + افزودن
                </button>
              </div>
              {editCollaterals.map((col: any, i: number) => (
                <div
                  key={i}
                  className="grid grid-cols-2 gap-2 mb-2 p-2 bg-gray-50 rounded relative"
                >
                  {editCollaterals.length > 1 && (
                    <button
                      onClick={() => {
                        const nc = [...editCollaterals];
                        nc.splice(i, 1);
                        setEditCollaterals(nc);
                      }}
                      className="absolute top-1 right-1 text-red-400 hover:text-red-600 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                  <FormSelect<number>
                    id={`ec-pt-${i}`}
                    name={`ec-pt-${i}`}
                    label="نوع شخص"
                    value={col.personTypeId ?? ""}
                    onChange={(v) => {
                      const nc = [...editCollaterals];
                      nc[i].personTypeId = v ? Number(v) : null;
                      setEditCollaterals(nc);
                    }}
                    options={persTypeOpts}
                  />
                  <FormSelect<number>
                    id={`ec-ct-${i}`}
                    name={`ec-ct-${i}`}
                    label="نوع وثیقه"
                    value={col.collatralTypeId ?? ""}
                    onChange={(v) => {
                      const nc = [...editCollaterals];
                      nc[i].collatralTypeId = v ? Number(v) : null;
                      setEditCollaterals(nc);
                    }}
                    options={collTypeOpts}
                  />
                  <FormInput
                    id={`ec-fn-${i}`}
                    name={`ec-fn-${i}`}
                    label="نام"
                    value={col.firstName}
                    onChange={(v) => {
                      const nc = [...editCollaterals];
                      nc[i].firstName = v;
                      setEditCollaterals(nc);
                    }}
                    dir="rtl"
                  />
                  <FormInput
                    id={`ec-ln-${i}`}
                    name={`ec-ln-${i}`}
                    label="نام خانوادگی"
                    value={col.lastName}
                    onChange={(v) => {
                      const nc = [...editCollaterals];
                      nc[i].lastName = v;
                      setEditCollaterals(nc);
                    }}
                    dir="rtl"
                  />
                  <FormInput
                    id={`ec-nc-${i}`}
                    name={`ec-nc-${i}`}
                    label="کد ملی"
                    value={col.nationalCode}
                    onChange={(v) => {
                      const nc = [...editCollaterals];
                      nc[i].nationalCode = v;
                      setEditCollaterals(nc);
                    }}
                    dir="ltr"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      />
    </MainLayout.Main>
  );
}
