import type { ReactNode } from "react";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileText,
  Landmark,
  MessageSquareText,
  Paperclip,
  UserRound,
  UsersRound,
} from "lucide-react";

import type { CollatralItem } from "../services/CollatralCrud/types";
import type { DocumentItem } from "../services/DocumentCrud/types";
import type { DocumentFile } from "../services/FileService/GetDocumentAllFiles";
import type { RequestCommentItem } from "../services/RequestCommentCrud/types";
import type { RequestItem } from "../services/RequestCrud/types";
import { isoToPersian } from "../utils/persianToISO";

export interface RequestDetailDocument {
  doc: DocumentItem;
  files: DocumentFile[];
}

export interface RequestDetailUser {
  name: string;
  role: string;
}

interface RequestDetailsPanelProps {
  request: RequestItem;
  documents?: RequestDetailDocument[];
  comments?: RequestCommentItem[];
  collaterals?: CollatralItem[];
  getUserData?: (userId: number) => RequestDetailUser;
  getPersonTypeTitle?: (personTypeId?: number | null) => string;
  onDownloadFile?: (file: DocumentFile) => void;
  children?: ReactNode;
}

interface DetailItemProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  emphasized?: boolean;
}

function DetailItem({ icon, label, value, emphasized }: DetailItemProps) {
  return (
    <div className="flex min-h-20 items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-400">{label}</p>
        <div
          className={`mt-1 break-words text-sm text-slate-700 ${
            emphasized ? "font-bold text-slate-900" : "font-medium"
          }`}
        >
          {value || "-"}
        </div>
      </div>
    </div>
  );
}

interface DetailSectionProps {
  icon: ReactNode;
  title: string;
  count?: string;
  tone?: "blue" | "amber" | "green";
  children: ReactNode;
}

export function RequestDetailSection({
  icon,
  title,
  count,
  tone = "blue",
  children,
}: DetailSectionProps) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-emerald-50 text-emerald-700",
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}
          >
            {icon}
          </div>
          <h3 className="font-bold text-slate-800">{title}</h3>
        </div>
        {count && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-500">
            {count}
          </span>
        )}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function ViewDetailsButton({
  onClick,
  title = "مشاهده جزئیات",
}: {
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="group inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-600 hover:text-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
    >
      <Eye className="h-4 w-4 transition-transform group-hover:scale-110" />
    </button>
  );
}

function formatFileSize(fileSize: string) {
  const size = Number(fileSize);
  if (!Number.isFinite(size)) return "-";
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / 1024).toFixed(1)} KB`;
}

export default function RequestDetailsPanel({
  request,
  documents = [],
  comments = request.requestCommentOutputDtos ?? [],
  collaterals = request.collatralOutputDtos ?? [],
  getUserData = (userId) => ({ name: `کاربر ${userId}`, role: "-" }),
  getPersonTypeTitle,
  onDownloadFile,
  children,
}: RequestDetailsPanelProps) {
  const histories = request.requestHistoryOutputDtos ?? [];
  const customerDisplay = request.customerOutputDto
    ? `${request.customerOutputDto.name || "-"} (${
        request.customerOutputDto.cifNumber || request.customerId || "-"
      })`
    : `مشتری شماره ${request.customerId || "-"}`;
  const files = documents.flatMap(({ files: documentFiles }) => documentFiles);
  const amount = Number(request.amount);

  return (
    <div className="max-h-[68vh] space-y-4 overflow-y-auto px-0.5 pb-1 text-sm">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="absolute -left-12 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 right-1/3 h-40 w-40 rounded-full bg-cyan-300/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <FileText className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-800">پرونده درخواست</p>
              <h2 className="mt-1 truncate text-lg font-bold">
                {request.title || "بدون عنوان"}
              </h2>
              <p className="mt-1 text-xs text-slate-800">
                شماره پرونده: {request.loanNumber || "-"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs ring-1 ring-white/20">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {request.requestStatusTitle || "بدون مرحله"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs ring-1 ring-white/20">
              <CalendarDays className="h-3.5 w-3.5" />
              {request.creationTime ? isoToPersian(request.creationTime) : "-"}
            </span>
          </div>
        </div>
      </div>

      <RequestDetailSection
        icon={<Landmark className="h-4.5 w-4.5" />}
        title="اطلاعات درخواست"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DetailItem
            icon={<FileText className="h-4 w-4" />}
            label="شماره مصوبه"
            value={request.requestCode || "-"}
          />
          <DetailItem
            icon={<Landmark className="h-4 w-4" />}
            label="مبلغ (ریال)"
            value={
              Number.isFinite(amount) ? amount.toLocaleString("fa-IR") : "-"
            }
            emphasized
          />
          <DetailItem
            icon={<Building2 className="h-4 w-4" />}
            label="دپارتمان"
            value={request.departmentOutputDto?.title || "-"}
          />
          <DetailItem
            icon={<UserRound className="h-4 w-4" />}
            label="درخواست‌کننده"
            value={customerDisplay}
          />
        </div>
        {request.description && (
          <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[11px] text-slate-400">توضیحات درخواست</p>
            <p className="mt-1.5 leading-7 text-slate-700">
              {request.description}
            </p>
          </div>
        )}
      </RequestDetailSection>

      {histories.length > 0 && (
        <RequestDetailSection
          icon={<Clock3 className="h-4.5 w-4.5" />}
          title="تاریخچه اقدامات"
          count={`${histories.length} اقدام`}
        >
          <div className="space-y-3">
            {histories.map((history, index) => {
              const userData = getUserData(history.reviewerUserId || 0);
              return (
                <div
                  key={history.id}
                  className="relative flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"
                >
                  <div
                    className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                      index === histories.length - 1
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white text-slate-400 ring-1 ring-slate-200"
                    }`}
                  >
                    <Clock3 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-medium text-slate-700">
                        {history.description || "-"}
                      </p>
                      <span className="shrink-0 text-[11px] text-slate-400">
                        {history.creationTime
                          ? isoToPersian(history.creationTime)
                          : "-"}
                      </span>
                    </div>
                    {history.reviewerUserId && (
                      <p className="mt-1.5 text-xs text-slate-500">
                        {userData.name}
                        {userData.role !== "-" ? ` — ${userData.role}` : ""}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </RequestDetailSection>
      )}

      {collaterals.length > 0 && (
        <RequestDetailSection
          icon={<UsersRound className="h-4.5 w-4.5" />}
          title="وثیقه‌گذاران"
          count={`${collaterals.length} نفر`}
          tone="green"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {collaterals.map((collateral, index) => (
              <div
                key={collateral.id}
                className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3.5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 font-bold text-emerald-700">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-800">
                    {[collateral.firstName, collateral.lastName]
                      .filter(Boolean)
                      .join(" ") || "-"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    کد ملی: {collateral.nationalCode || "-"}
                  </p>
                </div>
                {getPersonTypeTitle && (
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] text-slate-500 shadow-sm">
                    {getPersonTypeTitle(collateral.personTypeId)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </RequestDetailSection>
      )}

      {files.length > 0 && (
        <RequestDetailSection
          icon={<Paperclip className="h-4.5 w-4.5" />}
          title="مدارک پیوست"
          count={`${files.length} فایل`}
        >
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 font-mono text-xs font-bold uppercase text-blue-700">
                  {file.extension || "FILE"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-700">
                    {file.fileName}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {formatFileSize(file.fileSize)}
                  </p>
                </div>
                {onDownloadFile && (
                  <button
                    type="button"
                    onClick={() => onDownloadFile(file)}
                    title="دانلود فایل"
                    aria-label={`دانلود ${file.fileName}`}
                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </RequestDetailSection>
      )}

      {comments.length > 0 && (
        <RequestDetailSection
          icon={<MessageSquareText className="h-4.5 w-4.5" />}
          title="توضیحات کارشناسان"
          count={`${comments.length} مورد`}
          tone="amber"
        >
          <div className="space-y-3">
            {comments.map((comment) => {
              const userData = getUserData(comment.userId || 0);
              return (
                <div
                  key={comment.id}
                  className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3.5"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-medium text-slate-600">
                      {userData.name}
                      {userData.role !== "-" ? ` — ${userData.role}` : ""}
                    </p>
                    <span className="text-[11px] text-slate-400">
                      {comment.creationTime
                        ? isoToPersian(comment.creationTime)
                        : "-"}
                    </span>
                  </div>
                  <p className="mt-2 leading-7 text-slate-700">
                    {comment.description || "-"}
                  </p>
                </div>
              );
            })}
          </div>
        </RequestDetailSection>
      )}

      {children}
    </div>
  );
}
