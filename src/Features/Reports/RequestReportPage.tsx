import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Filter,
  Eye,
  FileText,
  Calendar,
  Info,
  Search,
  AlertTriangle,
  X,
} from "lucide-react";

import { MainLayout } from "../../baseComponents/MainLayout";
import PageTitle from "../../baseComponents/PageTitle";
import FormInput from "../../baseComponents/FormInput";
import FormSelect from "../../baseComponents/FormSelect";
import FormButton from "../../baseComponents/FormButton";
import DataTable from "../../baseComponents/DataTable";
import Modal from "../../baseComponents/Modal";
import { useToast } from "../../libs/toastContext";
import { getAllDepartments } from "../../services/DepartmentCrud/getAll";
import { getAllDepartmentTypes } from "../../services/DepartmentTypeCrud/getAll";
import { getAllPersonalTypes } from "../../services/PersonalTypeCrud/getAll";
import { getAllRequestStatus } from "../../services/RequestStatusCrud/getAll";
import { getAllRequestTypes } from "../../services/RequestTypeCrud/getAll";
import { getUserByUsername } from "../../services/Users/getByUsername";
import { findCustomerFromTsi } from "../../services/CustomerCrud/FindCustomerFromTsi";
import { getPagedRequests } from "../../services/RequestReport/getPagedRequests";
import { exportRequestsToExcel } from "../../services/RequestReport/exportRequestsToExcel";
import { isValidNationalIdentity } from "../../utils/createRequestValidator";
import { onlyDigits } from "../../utils/iranValidators";
import { toPersianDigits } from "../../utils/numberUtils.ts";
import type {
  GetPagedRequestsParams,
  RequestReportDto,
} from "../../services/RequestReport/types";
import type { CustomerItem } from "../../services/CustomerCrud/types";
import { isoToPersianDateTime, persianToISO } from "../../utils/persianToISO";
import { resolveRequestStatusTitle } from "../Requests/requestStatuses";
import { getBranchByCode } from "../../services/BranchCrud/getByCode";
import { getRegionByCode } from "../../services/RegionCrud/getByCode";
import { canFilterByBranchAndRegion } from "../../libs/userAccess";

type FilterState = {
  requestTitleFilter: string;
  requestStatusCode: string;
  authorityDepartmentTypeId: string;
  currentDepartmentTypeId: string;
  creatorDepartmentTypeId: string;
  actorUserId: string;
  actorUserLookup: string;
  personalTypeId: string;
  customerId: number | null;
  customerLookup: string;
  departmentId: string;
  requestTypeId: string;
  fromDate: string;
  toDate: string;
  branchCodeLookup: string;
  branchId: number | null;
  regionCodeLookup: string;
  regionCode: string;
};

const EMPTY_FILTERS: FilterState = {
  requestTitleFilter: "",
  requestStatusCode: "",
  authorityDepartmentTypeId: "",
  currentDepartmentTypeId: "",
  creatorDepartmentTypeId: "",
  actorUserId: "",
  actorUserLookup: "",
  personalTypeId: "",
  customerId: null,
  customerLookup: "",
  departmentId: "",
  requestTypeId: "",
  fromDate: "",
  toDate: "",
  branchCodeLookup: "",
  branchId: null,
  regionCodeLookup: "",
  regionCode: "",
};

const asNumber = (value: string) => (value.trim() ? Number(value) : undefined);
const asIso = (value: string) => {
  if (!value.trim()) return undefined;
  const iso = persianToISO(value.trim());
  return iso || undefined;
};
function formatAmount(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";

  const strVal = String(value).trim();
  const numericString = strVal.replace(/,/g, "");
  const num = Number(numericString);

  if (isNaN(num)) {
    return toPersianDigits(strVal);
  }

  // ۳ رقم ۳ رقم با ارقام فارسی همراه با پسوند ریال
  return `${toPersianDigits(num.toLocaleString("en-US"))} ریال`;
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "بله" : "خیر";
  if (typeof value === "number") {
    // در صورتی که می‌خواهید مبالغ/اعداد ۳ رقم ۳ رقم جدا هم بشوند:
    // return toPersianDigits(value.toLocaleString("fa-IR"));
    return toPersianDigits(value);
  }
  return toPersianDigits(String(value));
}

const IGNORED_MODAL_KEYS = new Set([
  "id",
  "requestStatusCode",
  "authorityDepartmentTypeId",
  "currentDepartmentTypeId",
  "creatorDepartmentTypeId",
  "actorUserId",
  "reviewerUserId",
  "supersvisionId",
  "supervisionId",
  "departmentId",
  "requestTypeId",
  "personalTypeId",
  "customerId",
  "branchId",
  "isDeleted",
  "deleterUserId",
  "deletionTime",
  "lastModifierUserId",
  "creatorUserId",
]);

const REPORT_FIELD_LABELS: Record<string, string> = {
  // شناسه‌ها و کدهای مرجع
  id: "شناسه",
  requestId: "شناسه درخواست",
  requestCode: "کد درخواست",
  requestTitle: "عنوان درخواست",
  requestLoanNumber: "شماره تسهیلات",
  loanNumber: "شماره تسهیلات",
  trackingCode: "کد پیگیری",
  cifNumber: "شماره مشتری (CIF)",

  // مبالغ
  amount: "مبلغ",
  requestAmount: "مبلغ درخواست",
  loanAmount: "مبلغ تسهیلات",
  approvedAmount: "مبلغ مصوب",
  requestedAmount: "مبلغ درخواستی",
  totalAmount: "مبلغ کل",

  // وضعیت و مراحل
  requestStatusCode: "کد وضعیت",
  requestStatusTitle: "مرحله فرآیند",
  requestStatuseTitle: "مرحله فرآیند",
  statusTitle: "وضعیت",
  currentStatusTitle: "وضعیت فعلی",
  stepTitle: "مرحله",

  // شعب و مناطق
  branchName: "شعبه",
  branchTitle: "شعبه",
  branchCode: "کد شعبه",
  supervisionName: "منطقه",
  supervisionTitle: "منطقه",

  // دپارتمان‌ها
  authorityDepartmentTypeTitle: "دپارتمان مرجع",
  authorityDepartmentTitle: "دپارتمان مرجع",
  authorityDepartmentName: "دپارتمان مرجع",
  currentDepartmentTypeTitle: "دپارتمان جاری",
  currentDepartmentTitle: "دپارتمان جاری",
  currentDepartmentName: "دپارتمان جاری",
  creatorDepartmentTypeTitle: "دپارتمان ایجادکننده",
  creatorDepartmentTitle: "دپارتمان ایجادکننده",
  creatorDepartmentName: "دپارتمان ایجادکننده",
  departmentName: "دپارتمان",
  departmentTitle: "دپارتمان",

  // اطلاعات مشتری و اشخاص
  requestTypeTitle: "نوع درخواست",
  personalTypeTitle: "نوع شخص",
  customerName: "نام مشتری",
  customerSurname: "نام خانوادگی مشتری",
  customerFullName: "نام و نام خانوادگی مشتری",
  customerNationalCode: "کد/شناسه ملی مشتری",
  nationalCode: "کد ملی",
  phoneNumber: "شماره تماس",
  mobileNumber: "شماره همراه",

  // اطلاعات اقدام‌کننده (Actor)
  actorName: "نام اقدام‌کننده",
  actorSurname: "نام خانوادگی اقدام‌کننده",
  actorSurName: "نام خانوادگی اقدام‌کننده",
  actorFullName: "نام و نام خانوادگی اقدام‌کننده",
  actorFullname: "نام و نام خانوادگی اقدام‌کننده",
  actorUserName: "نام کاربری اقدام‌کننده",

  // اطلاعات ایجادکننده (Creator)
  creatorName: "نام ایجادکننده",
  creatorSurname: "نام خانوادگی ایجادکننده",
  creatorFullName: "نام و نام خانوادگی ایجادکننده",
  creatorFullname: "نام و نام خانوادگی ایجادکننده",
  creatorUserName: "نام کاربری ایجادکننده",

  // اطلاعات بررسی‌کننده (Reviewer)
  reviewerName: "نام بررسی‌کننده",
  reviewerSurname: "نام خانوادگی بررسی‌کننده",
  reviewerFullName: "نام و نام خانوادگی بررسی‌کننده",
  reviewerFullname: "نام و نام خانوادگی بررسی‌کننده",
  reviewerUserName: "نام کاربری بررسی‌کننده",
  lastModifierUserName: "آخرین ویرایش‌کننده",

  // زمان‌ها و مقادیر
  actionDate: "تاریخ اقدام",
  creationTime: "تاریخ ایجاد",
  lastModificationTime: "آخرین ویرایش",
  description: "توضیحات",
  isActive: "وضعیت فعال",
  roles: "نقش‌ها",
};

function translateReportField(key: string): string {
  // ۱. بررسی مستقیم کلید
  if (REPORT_FIELD_LABELS[key]) return REPORT_FIELD_LABELS[key];

  // ۲. بررسی حالت بدون حساسیت به حروف بزرگ/کوچک (Case-insensitive)
  const lowerKey = key.toLowerCase();
  const matchedKey = Object.keys(REPORT_FIELD_LABELS).find(
    (k) => k.toLowerCase() === lowerKey,
  );
  if (matchedKey) return REPORT_FIELD_LABELS[matchedKey];

  // ۳. لغت‌نامه تکمیلی برای کلیدهای پیش‌بینی‌نشده
  const translations: Record<string, string> = {
    actor: "اقدام‌کننده",
    creator: "ایجادکننده",
    reviewer: "بررسی‌کننده",
    customer: "مشتری",
    user: "کاربر",
    full: "کامل",
    fullname: "نام و نام خانوادگی",
    name: "نام",
    surname: "نام خانوادگی",
    title: "عنوان",
    code: "کد",
    amount: "مبلغ",
    number: "شماره",
    date: "تاریخ",
    time: "زمان",
    department: "دپارتمان",
    branch: "شعبه",
    status: "وضعیت",
    request: "درخواست",
    loan: "تسهیلات",
  };

  const words = key
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase()
    .split(/\s+/);

  const translatedWords = words.map((w) => translations[w] || w);
  return translatedWords.join(" ");
}

function hasDisplayValue(value: unknown): boolean {
  return value !== null && value !== undefined && value !== "";
}

function formatDetailValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(formatDetailValue).join("، ");
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, nested]) => hasDisplayValue(nested))
      .map(
        ([nestedKey, nestedValue]) =>
          `${translateReportField(nestedKey)}: ${formatDetailValue(nestedValue)}`,
      )
      .join(" | ");
  }
  return displayValue(value);
}

export default function RequestReportPage() {
  const { showToast } = useToast();
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(EMPTY_FILTERS);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [customerSearching, setCustomerSearching] = useState(false);
  const [customerLabel, setCustomerLabel] = useState("");
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [foundCustomers, setFoundCustomers] = useState<CustomerItem[]>([]);
  const [selectedRow, setSelectedRow] = useState<Record<
    string,
    unknown
  > | null>(null);

  const [isNationalCodeNoticeOpen, setIsNationalCodeNoticeOpen] =
    useState(false);
  const [hasShownNationalCodeNotice, setHasShownNationalCodeNotice] =
    useState(false);

  const [actorUserSearching, setActorUserSearching] = useState(false);
  const [actorUserLabel, setActorUserLabel] = useState("");
  // دسترسی‌سنجی (نمایش فیلتر فقط برای ادمین یا ستاد)
  const canFilterBranchRegion = useMemo(() => canFilterByBranchAndRegion(), []);

  // وضعیت استعلام شعبه
  const [branchSearching, setBranchSearching] = useState(false);
  const [branchLabel, setBranchLabel] = useState("");

  // وضعیت استعلام منطقه
  const [regionSearching, setRegionSearching] = useState(false);
  const [regionLabel, setRegionLabel] = useState("");

  // متد استعلام شعبه (اصلاح شده برای ABP Result)
  const handleBranchSearch = async () => {
    const code = filters.branchCodeLookup.trim();
    if (!code) {
      showToast("لطفاً کد شعبه را وارد کنید", "error");
      return;
    }
    setBranchSearching(true);
    try {
      const response = await getBranchByCode(Number(code));
      // استخراج دیتای واقعی چه در قالب ABP و چه مستقیم
      const branch = (response as any)?.result ?? response;

      if (branch && (branch.id || branch.branchCode)) {
        const bCode = branch.branchCode ?? Number(code);
        setFilters((p) => ({ ...p, branchId: bCode }));
        setBranchLabel(
          branch.branchName
            ? `${branch.branchName} (کد ${bCode})`
            : `شعبه ${bCode}`,
        );
        showToast("شعبه با موفقیت یافت و انتخاب شد", "success");
      } else {
        setFilters((p) => ({ ...p, branchId: null }));
        setBranchLabel("");
        showToast("شعبه‌ای با این کد یافت نشد", "warning");
      }
    } catch (error) {
      setFilters((p) => ({ ...p, branchId: null }));
      setBranchLabel("");
      showToast(
        error instanceof Error ? error.message : "خطا در استعلام شعبه",
        "error",
      );
    } finally {
      setBranchSearching(false);
    }
  };

  // متد استعلام منطقه (اصلاح شده برای ABP Result)
  const handleRegionSearch = async () => {
    const code = filters.regionCodeLookup.trim();
    if (!code) {
      showToast("لطفاً کد منطقه را وارد کنید", "error");
      return;
    }
    setRegionSearching(true);
    try {
      const response = await getRegionByCode(code);
      // استخراج دیتای واقعی چه در قالب ABP و چه مستقیم
      const region = (response as any)?.result ?? response;

      if (region && (region.id || region.code || region.regionCode)) {
        const rCode = region.code ?? region.regionCode ?? code;
        const rTitle = region.title ?? region.regionName ?? `منطقه ${rCode}`;
        setFilters((p) => ({ ...p, regionCode: String(rCode) }));
        setRegionLabel(rTitle);
        showToast("منطقه با موفقیت یافت و انتخاب شد", "success");
      } else {
        setFilters((p) => ({ ...p, regionCode: "" }));
        setRegionLabel("");
        showToast("منطقه‌ای با این کد یافت نشد", "warning");
      }
    } catch (error) {
      setFilters((p) => ({ ...p, regionCode: "" }));
      setRegionLabel("");
      showToast(
        error instanceof Error ? error.message : "خطا در استعلام منطقه",
        "error",
      );
    } finally {
      setRegionSearching(false);
    }
  };

  const handleNationalCodeFocus = () => {
    if (hasShownNationalCodeNotice) return;

    setHasShownNationalCodeNotice(true);
    setIsNationalCodeNoticeOpen(true);
  };

  const reference = useQuery({
    queryKey: ["request-report-reference-data"],
    queryFn: async () => {
      const [
        statuses,
        departmentTypes,
        departments,
        requestTypes,
        personalTypes,
      ] = await Promise.all([
        getAllRequestStatus({ maxResultCount: 5000 }),
        getAllDepartmentTypes({ maxResultCount: 5000 }),
        getAllDepartments({ maxResultCount: 5000 }),
        getAllRequestTypes({ maxResultCount: 5000 }),
        getAllPersonalTypes({ maxResultCount: 5000 }),
      ]);
      return {
        statuses,
        departmentTypes,
        departments,
        requestTypes,
        personalTypes,
      };
    },
    staleTime: 10 * 60 * 1000,
  });

  const query = useQuery({
    queryKey: [
      "request-report",
      appliedFilters,
      pagination.pageIndex,
      pagination.pageSize,
    ],
    queryFn: () => {
      const common = {
        requestTitleFilter: appliedFilters.requestTitleFilter || undefined,
        requestStatusCode: asNumber(appliedFilters.requestStatusCode),
        authorityDepartmentTypeId: asNumber(
          appliedFilters.authorityDepartmentTypeId,
        ),
        currentDepartmentTypeId: asNumber(
          appliedFilters.currentDepartmentTypeId,
        ),
        creatorDepartmentTypeId: asNumber(
          appliedFilters.creatorDepartmentTypeId,
        ),
        actorUserId: asNumber(appliedFilters.actorUserId),
        personalTypeId: asNumber(appliedFilters.personalTypeId),
        customerId: appliedFilters.customerId ?? undefined,
        departmentId: asNumber(appliedFilters.departmentId),
        requestTypeId: asNumber(appliedFilters.requestTypeId),
        fromDate: asIso(appliedFilters.fromDate),
        toDate: asIso(appliedFilters.toDate),
        skipCount: pagination.pageIndex * pagination.pageSize,
        maxResultCount: pagination.pageSize,
        sorting: "creationTime desc",
        branchId: appliedFilters.branchId
          ? String(appliedFilters.branchId)
          : appliedFilters.branchCodeLookup.trim() || undefined,
        supersvisionId: appliedFilters.regionCode
          ? String(appliedFilters.regionCode)
          : undefined,
      };

      return getPagedRequests(common as GetPagedRequestsParams);
    },
    select: (data) => ({
      listResult: data.items,
      total: data.totalCount,
      totalPages: Math.max(1, Math.ceil(data.totalCount / pagination.pageSize)),
    }),
    placeholderData: (previous) => previous,
  });

  const exportMutation = useMutation({
    mutationFn: () => {
      const body = {
        requestTitleFilter: appliedFilters.requestTitleFilter || undefined,
        requestStatusCode: asNumber(appliedFilters.requestStatusCode),
        authorityDepartmentTypeId: asNumber(
          appliedFilters.authorityDepartmentTypeId,
        ),
        currentDepartmentTypeId: asNumber(
          appliedFilters.currentDepartmentTypeId,
        ),
        creatorDepartmentTypeId: asNumber(
          appliedFilters.creatorDepartmentTypeId,
        ),
        actorUserId: asNumber(appliedFilters.actorUserId),
        personalTypeId: asNumber(appliedFilters.personalTypeId),
        customerId: appliedFilters.customerId ?? undefined,
        departmentId: asNumber(appliedFilters.departmentId),
        requestTypeId: asNumber(appliedFilters.requestTypeId),
        fromDate: asIso(appliedFilters.fromDate),
        toDate: asIso(appliedFilters.toDate),
        branchId: appliedFilters.branchId
          ? String(appliedFilters.branchId)
          : appliedFilters.branchCodeLookup.trim() || undefined,
        supersvisionId: appliedFilters.regionCode
          ? String(appliedFilters.regionCode)
          : undefined,
      };
      return exportRequestsToExcel(body);
    },
    onSuccess: () => showToast("فایل گزارش با موفقیت دانلود شد", "success"),
    onError: (error: unknown) =>
      showToast(
        error instanceof Error ? error.message : "خطا در دریافت گزارش",
        "error",
      ),
  });

  const departmentTypeOptions = (
    reference.data?.departmentTypes.items ?? []
  ).map((x) => ({ id: String(x.id), title: x.name ?? "" }));

  const departmentOptions = (reference.data?.departments.items ?? []).map(
    (x) => ({ id: String(x.id), title: x.title ?? x.code ?? "" }),
  );
  const requestTypeOptions = (reference.data?.requestTypes.items ?? []).map(
    (x) => ({ id: String(x.id), title: x.title ?? x.code ?? "" }),
  );
  const personalTypeOptions = (reference.data?.personalTypes.items ?? []).map(
    (x) => ({ id: String(x.id), title: x.title ?? x.code ?? "" }),
  );
  const statusOptions = (reference.data?.statuses.items ?? []).map((x) => ({
    id: String(x.code ?? x.id),
    title: x.title ?? String(x.code ?? x.id),
  }));

  const handleCustomerSearch = async () => {
    const nationalCode = filters.customerLookup.trim();

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

    setCustomerSearching(true);
    try {
      const customers = await findCustomerFromTsi({ nationalCode });

      if (!customers || customers.length === 0) {
        setFilters((p) => ({ ...p, customerId: null }));
        setCustomerLabel("");
        showToast("مشتری با این مشخصات یافت نشد", "warning");
      } else if (customers.length === 1) {
        const c = customers[0];
        setFilters((p) => ({ ...p, customerId: c.id }));
        setCustomerLabel(c.name || c.cifNumber || String(c.id));
        showToast("مشتری یافت و انتخاب شد", "success");
      } else {
        setFoundCustomers(customers);
        setIsCustomerModalOpen(true);
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "خطا در استعلام مشتری",
        "error",
      );
    } finally {
      setCustomerSearching(false);
    }
  };

  const handleSelectCustomer = (customer: CustomerItem) => {
    setFilters((p) => ({ ...p, customerId: customer.id }));
    setCustomerLabel(
      customer.name || customer.cifNumber || String(customer.id),
    );
    setIsCustomerModalOpen(false);
    showToast("مشتری انتخاب شد", "success");
  };

  const handleActorUserSearch = async () => {
    const userName = filters.actorUserLookup.trim();

    if (!userName) {
      showToast("لطفاً کد پرسنلی / نام کاربری را وارد کنید", "error");
      return;
    }

    setActorUserSearching(true);
    try {
      const user = await getUserByUsername(userName);

      if (user && user.id) {
        setFilters((p) => ({ ...p, actorUserId: String(user.id) }));
        setActorUserLabel(
          user.fullName ||
            `${user.name} ${user.surname}`.trim() ||
            user.userName,
        );
        showToast("کاربر با موفقیت یافت و انتخاب شد", "success");
      } else {
        setFilters((p) => ({ ...p, actorUserId: "" }));
        setActorUserLabel("");
        showToast("کاربری با این مشخصات یافت نشد", "warning");
      }
    } catch (error) {
      setFilters((p) => ({ ...p, actorUserId: "" }));
      setActorUserLabel("");
      showToast(
        error instanceof Error ? error.message : "خطا در استعلام کاربر",
        "error",
      );
    } finally {
      setActorUserSearching(false);
    }
  };

  const applyFilters = () => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    setAppliedFilters(filters);
  };
  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setCustomerLabel("");
    setActorUserLabel("");
    setBranchLabel("");
    setRegionLabel("");
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    setFoundCustomers([]);
    setIsCustomerModalOpen(false);
  };

  const statuses = reference.data?.statuses.items;
  const departmentTitleById = useMemo(
    () =>
      new Map(
        (reference.data?.departments.items ?? []).map((x) => [
          x.id,
          x.title ?? x.code ?? "",
        ]),
      ),
    [reference.data?.departments.items],
  );
  const requestTypeTitleById = useMemo(
    () =>
      new Map(
        (reference.data?.requestTypes.items ?? []).map((x) => [
          x.id,
          x.title ?? x.code ?? "",
        ]),
      ),
    [reference.data?.requestTypes.items],
  );

  const requestColumns = useMemo<ColumnDef<RequestReportDto, unknown>[]>(
    () => [
      {
        accessorKey: "requestTitle",
        header: "عنوان درخواست",
        cell: ({ row }) => displayValue(row.original.requestTitle),
      },
      {
        accessorKey: "requestStatusTitle",
        header: "مرحله فرآیند",
        cell: ({ row }) =>
          resolveRequestStatusTitle(
            statuses,
            row.original.requestStatusCode,
            row.original.requestStatusTitle,
          ),
      },
      {
        accessorKey: "customerName",
        header: "مشتری",
        cell: ({ row }) =>
          displayValue(row.original.customerName ?? row.original.customerId),
      },
      {
        accessorKey: "branchName",
        header: "شعبه",
        cell: ({ row }) =>
          displayValue(row.original.branchName ?? row.original.branchId),
      },
      // {
      //   accessorKey: "departmentName",
      //   header: "دپارتمان",
      //   cell: ({ row }) =>
      //     displayValue(
      //       row.original.departmentName ??
      //         departmentTitleById.get(row.original.departmentId ?? -1) ??
      //         "—",
      //     ),
      // },
      {
        accessorKey: "requestTypeTitle",
        header: "نوع درخواست",
        cell: ({ row }) =>
          displayValue(
            row.original.requestTypeTitle ??
              requestTypeTitleById.get(row.original.requestTypeId ?? -1) ??
              "—",
          ),
      },
      {
        accessorKey: "actorUserName",
        header: "کاربر اقدام‌کننده",
        cell: ({ row }) => {
          const fullName = [row.original.actorName, row.original.actorSurname]
            .filter(Boolean)
            .join(" ")
            .trim();

          return displayValue(fullName || row.original.actorUserId || "—");
        },
      },
      {
        accessorKey: "creationTime",
        header: "تاریخ ایجاد",
        cell: ({ row }) =>
          row.original.creationTime ? (
            <span dir="ltr" className="inline-block whitespace-nowrap">
              {isoToPersianDateTime(row.original.creationTime)}
            </span>
          ) : (
            "—"
          ),
      },
      {
        id: "details",
        header: "جزئیات",
        cell: ({ row }) => (
          <button
            type="button"
            className="inline-flex items-center gap-1 cursor-pointer rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            onClick={() =>
              setSelectedRow(row.original as Record<string, unknown>)
            }
          >
            <Eye className="h-3.5 w-3.5" />
            مشاهده
          </button>
        ),
      },
    ],
    [departmentTitleById, requestTypeTitleById, statuses],
  );

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
        const type = personalTypeOptions.find(
          (item) => item.id === String(typeId),
        );
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

  const setField = (key: keyof FilterState, value: string | number | null) =>
    setFilters((p) => ({ ...p, [key]: value }));
  const input = (
    key: keyof FilterState,
    label: string,
    type = "text",
    placeholder?: string,
  ) => (
    <FormInput
      id={`report-${String(key)}`}
      name={`report-${String(key)}`}
      label={label}
      type={type}
      value={String(filters[key] ?? "")}
      onChange={(value) => setField(key, value)}
      dir="rtl"
      placeholder={placeholder}
    />
  );

  return (
    <MainLayout.Main maxWidth="screen-xl">
      <PageTitle title="گزارش درخواست‌ها" />
      <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Filter className="h-4 w-4 text-blue-600" /> فیلترهای گزارش
          </div>
          <div className="flex gap-2">
            <FormButton
              title="پاک کردن"
              variant="secondary"
              size="sm"
              onClick={clearFilters}
            />
            <FormButton
              title="اعمال فیلتر"
              variant="primary"
              size="sm"
              onClick={applyFilters}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {input("requestTitleFilter", "عنوان درخواست")}
          <FormSelect
            id="report-status"
            name="report-status"
            label="وضعیت درخواست"
            value={filters.requestStatusCode}
            onChange={(v) => setField("requestStatusCode", v)}
            options={statusOptions}
          />
          <FormSelect
            id="report-authority"
            name="report-authority"
            label="نوع دپارتمان مرجع"
            value={filters.authorityDepartmentTypeId}
            onChange={(v) => setField("authorityDepartmentTypeId", v)}
            options={departmentTypeOptions}
          />
          <FormSelect
            id="report-current"
            name="report-current"
            label="نوع دپارتمان جاری"
            value={filters.currentDepartmentTypeId}
            onChange={(v) => setField("currentDepartmentTypeId", v)}
            options={departmentTypeOptions}
          />
          <FormSelect
            id="report-creator"
            name="report-creator"
            label="نوع دپارتمان ایجادکننده"
            value={filters.creatorDepartmentTypeId}
            onChange={(v) => setField("creatorDepartmentTypeId", v)}
            options={departmentTypeOptions}
          />
          <FormSelect
            id="report-department"
            name="report-department"
            label="دپارتمان"
            value={filters.departmentId}
            onChange={(v) => setField("departmentId", v)}
            options={departmentOptions}
          />
          <FormSelect
            id="report-request-type"
            name="report-request-type"
            label="نوع درخواست"
            value={filters.requestTypeId}
            onChange={(v) => setField("requestTypeId", v)}
            options={requestTypeOptions}
          />
          <FormSelect
            id="report-personal-type"
            name="report-personal-type"
            label="نوع شخص"
            value={filters.personalTypeId}
            onChange={(v) => setField("personalTypeId", v)}
            options={personalTypeOptions}
          />

          {/* اینپوت استعلام کد پرسنلی کاربر اقدام‌کننده */}
          <div className="relative">
            <FormInput
              id="report-actorUserLookup"
              name="report-actorUserLookup"
              label="کد پرسنلی اقدام‌کننده"
              value={filters.actorUserLookup}
              onChange={(value) => {
                const cleanValue = onlyDigits(value);
                setFilters((p) => ({
                  ...p,
                  actorUserLookup: cleanValue,
                  actorUserId: "", // با تغییر اینپوت، آی‌دی قبلی ریست می‌شود تا مجدد استعلام شود
                }));
                setActorUserLabel("");
              }}
              dir="rtl"
              className="pl-24"
            />

            <button
              type="button"
              onClick={handleActorUserSearch}
              disabled={!filters.actorUserLookup.trim() || actorUserSearching}
              className={`absolute bottom-2 left-2 flex h-8 items-center gap-1.5 rounded-md px-2.5 transition-colors ${
                filters.actorUserLookup.trim()
                  ? "cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
                  : "cursor-not-allowed bg-slate-100 text-slate-400"
              }`}
              title="استعلام کاربر"
            >
              {actorUserSearching ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span className="text-xs font-semibold">استعلام</span>
                </>
              )}
            </button>
          </div>

          {/* باکس نمایش نام اقدام‌کننده استعلام‌شده */}
          <div className="flex items-center rounded-lg border border-blue-200 bg-blue-50/70 px-3 text-xs text-blue-900">
            {filters.actorUserId
              ? `اقدام‌کننده: ${actorUserLabel || filters.actorUserId}`
              : "اقدام‌کننده انتخاب نشده است"}
          </div>
          <div className="relative">
            <FormInput
              id="report-customerLookup"
              name="report-customerLookup"
              label="کد ملی مشتری"
              value={filters.customerLookup}
              onFocus={handleNationalCodeFocus}
              onChange={(value) => {
                const cleanValue = onlyDigits(value).slice(0, 11);
                setFilters((p) => ({
                  ...p,
                  customerLookup: cleanValue,
                  customerId: null,
                }));
                setCustomerLabel("");
              }}
              dir="rtl"
              maxLength={11}
              className="pl-24"
            />

            <button
              type="button"
              onClick={handleCustomerSearch}
              disabled={
                onlyDigits(filters.customerLookup).length < 10 ||
                customerSearching
              }
              className={`absolute bottom-2 left-2 flex h-8 items-center gap-1.5 rounded-md px-2.5 transition-colors ${
                onlyDigits(filters.customerLookup).length >= 10
                  ? "cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
                  : "cursor-not-allowed bg-slate-100 text-slate-400"
              }`}
              title="استعلام مشتری"
            >
              {customerSearching ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span className="text-xs font-semibold">استعلام</span>
                </>
              )}
            </button>
          </div>
          <div className="flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs text-emerald-800">
            {filters.customerId
              ? `مشتری انتخاب‌شده: ${customerLabel || filters.customerId}`
              : "مشتری انتخاب نشده است"}
          </div>
          {input("fromDate", "از تاریخ شمسی", "text", "۱۴۰۵/۰۱/۰۱")}
          {input("toDate", "تا تاریخ شمسی", "text", "۱۴۰۵/۱۲/۲۹")}
        </div>
        {/* فیلترهای اختصاصی شعبه و منطقه (مخصوص ستاد و ادمین) */}
        {canFilterBranchRegion && (
          <div className="col-span-full grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* ۱. اینپوت استعلام کد شعبه */}
            <div className="relative">
              <FormInput
                id="report-branchCodeLookup"
                name="report-branchCodeLookup"
                label="کد شعبه"
                value={filters.branchCodeLookup}
                onChange={(value) => {
                  const cleanValue = onlyDigits(value);
                  setFilters((p) => ({
                    ...p,
                    branchCodeLookup: cleanValue,
                    branchId: null,
                  }));
                  setBranchLabel("");
                }}
                dir="rtl"
                className="pl-24"
              />
              <button
                type="button"
                onClick={handleBranchSearch}
                disabled={!filters.branchCodeLookup.trim() || branchSearching}
                className={`absolute bottom-2 left-2 flex h-8 items-center gap-1.5 rounded-md px-2.5 transition-colors ${
                  filters.branchCodeLookup.trim()
                    ? "cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
                    : "cursor-not-allowed bg-slate-100 text-slate-400"
                }`}
                title="استعلام شعبه"
              >
                {branchSearching ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span className="text-xs font-semibold">استعلام</span>
                  </>
                )}
              </button>
            </div>

            {/* ۲. باکس وضعیت شعبه انتخاب‌شده (دقیقاً کنار اینپوت شعبه) */}
            <div className="flex items-center rounded-lg border border-blue-200 bg-blue-50/70 px-3 text-xs text-blue-900">
              {filters.branchId
                ? `شعبه: ${branchLabel || filters.branchId}`
                : "شعبه انتخاب نشده است"}
            </div>

            {/* ۳. اینپوت استعلام کد منطقه */}
            <div className="relative">
              <FormInput
                id="report-regionCodeLookup"
                name="report-regionCodeLookup"
                label="کد منطقه"
                value={filters.regionCodeLookup}
                onChange={(value) => {
                  const cleanValue = onlyDigits(value);
                  setFilters((p) => ({
                    ...p,
                    regionCodeLookup: cleanValue,
                    regionCode: "",
                  }));
                  setRegionLabel("");
                }}
                dir="rtl"
                className="pl-24"
              />
              <button
                type="button"
                onClick={handleRegionSearch}
                disabled={!filters.regionCodeLookup.trim() || regionSearching}
                className={`absolute bottom-2 left-2 flex h-8 items-center gap-1.5 rounded-md px-2.5 transition-colors ${
                  filters.regionCodeLookup.trim()
                    ? "cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
                    : "cursor-not-allowed bg-slate-100 text-slate-400"
                }`}
                title="استعلام منطقه"
              >
                {regionSearching ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span className="text-xs font-semibold">استعلام</span>
                  </>
                )}
              </button>
            </div>

            {/* ۴. باکس وضعیت منطقه انتخاب‌شده (دقیقاً کنار اینپوت منطقه) */}
            <div className="flex items-center rounded-lg border border-blue-200 bg-blue-50/70 px-3 text-xs text-blue-900">
              {filters.regionCode
                ? `منطقه: ${regionLabel || filters.regionCode}`
                : "منطقه انتخاب نشده است"}
            </div>
          </div>
        )}
      </div>
      <div className="mb-3 flex justify-end">
        <FormButton
          title="خروجی Excel"
          variant="success"
          size="sm"
          onClick={() => exportMutation.mutate()}
          isLoading={exportMutation.isPending}
        />
      </div>
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <DataTable
          query={query}
          columns={requestColumns}
          pagination={pagination}
          onPaginationChange={setPagination}
          filters={[]}
          onFiltersChange={() => undefined}
          filterFields={[]}
          skeletonColumns={8}
          emptyStateMessage="رکوردی برای نمایش یافت نشد"
        />
      </div>
      <Modal
        isOpen={!!selectedRow}
        isRTL
        header="جزئیات کامل رکورد"
        onClose={() => setSelectedRow(null)}
        overlayLock={false}
        renderContent={() => {
          if (!selectedRow) return null;

          const entries = Object.entries(selectedRow).filter(([key, value]) => {
            if (IGNORED_MODAL_KEYS.has(key)) return false;

            // فقط برای کلیدهایی که به Id ختم می‌شوند، جایگزین‌ها را بررسی کن
            if (key.endsWith("Id")) {
              const base = key.slice(0, -2); // حذف "Id"
              const titleKeyCandidates = [`${base}Title`, `${base}Name`];
              const hasTitleValue = titleKeyCandidates.some((candidate) =>
                hasDisplayValue(selectedRow[candidate]),
              );
              if (hasTitleValue) return false;
            }

            return hasDisplayValue(value);
          });

          return (
            <div className="max-h-[70vh] overflow-y-auto px-1 py-1" dir="rtl">
              {/* هدر خلاصه بالای مدال */}
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-blue-100 bg-gradient-to-l from-blue-50/70 to-indigo-50/40 p-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500">عنوان یا کد سند</p>
                  <p className="truncate text-sm font-bold text-slate-800">
                    {toPersianDigits(
                      String(
                        selectedRow.requestTitle ||
                          selectedRow.requestCode ||
                          "اطلاعات ثبت‌شده",
                      ),
                    )}
                  </p>
                </div>
              </div>

              {/* گرید کارت‌های اطلاعاتی */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {entries.map(([key, value]) => {
                  const lowerKey = key.toLowerCase();

                  const isDate =
                    lowerKey.includes("date") ||
                    lowerKey.endsWith("time") ||
                    lowerKey.includes("time");

                  const isAmount = lowerKey.includes("amount");

                  const isWide =
                    lowerKey.includes("description") ||
                    lowerKey.includes("comment") ||
                    lowerKey.includes("address");

                  // فرمت‌دهی مقدار
                  let formatted: string;

                  if (isAmount) {
                    formatted = formatAmount(value);
                  } else if (isDate) {
                    const dateStr =
                      typeof value === "string"
                        ? isoToPersianDateTime(value)
                        : displayValue(value);
                    formatted = toPersianDigits(dateStr);
                  } else if (typeof value === "object" && value !== null) {
                    const objStr = formatDetailValue(value);
                    formatted = /^[\d\s.,:/-]+$/.test(objStr)
                      ? toPersianDigits(objStr)
                      : objStr;
                  } else {
                    const rawVal = displayValue(value);
                    formatted = /^[\d\s.,:/-]+$/.test(rawVal)
                      ? toPersianDigits(rawVal)
                      : rawVal;
                  }

                  return (
                    <div
                      key={key}
                      className={`group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/40 p-3 transition-all hover:border-blue-200 hover:bg-white hover:shadow-sm ${
                        isWide ? "sm:col-span-2" : ""
                      }`}
                    >
                      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        {isDate ? (
                          <Calendar className="h-3.5 w-3.5 text-blue-500" />
                        ) : (
                          <Info className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500" />
                        )}
                        <span>{translateReportField(key)}</span>
                      </div>

                      <div
                        className={`break-words text-sm font-medium leading-6 text-slate-800 ${
                          isDate ? "font-semibold text-blue-950" : ""
                        } ${isAmount ? "font-semibold text-emerald-700" : ""}`}
                        dir="rtl"
                      >
                        {formatted}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }}
        footerButtons={
          <FormButton
            title="بستن"
            variant="secondary"
            onClick={() => setSelectedRow(null)}
          />
        }
      />

      <Modal
        isOpen={isCustomerModalOpen}
        isRTL
        header="انتخاب مشتری"
        onClose={() => setIsCustomerModalOpen(false)}
        overlayLock={false}
        renderContent={() => (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {foundCustomers.length} مشتری با کد ملی "{filters.customerLookup}"
              یافت شد.
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
