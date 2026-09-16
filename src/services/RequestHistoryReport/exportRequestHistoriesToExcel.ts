import { getApiBaseUrl } from "../../libs/appConfig";
import { authStore } from "../../libs/store/authActions";
import type { GetRequestHistoryReportInput } from "./types";

export async function exportRequestHistoriesToExcel(
  body: GetRequestHistoryReportInput = {},
): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const token = authStore.state.token || localStorage.getItem("auth_token");

  const url = `${baseUrl}/services/app/RequestHistoryReport/ExportRequestHistoriesToExcel`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error("Export request histories to excel failed");
  }

  // ۱. استخراج نام فایل از هدر Content-Disposition
  let filename = `RequestHistoryReport_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const disposition = response.headers.get("content-disposition");

  if (disposition) {
    // بررسی فرمت استاندارد UTF-8 برای حروف فارسی
    const utf8FilenameMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8FilenameMatch && utf8FilenameMatch[1]) {
      filename = decodeURIComponent(utf8FilenameMatch[1]);
    } else {
      const regularFilenameMatch = disposition.match(/filename="?([^";]+)"?/i);
      if (regularFilenameMatch && regularFilenameMatch[1]) {
        filename = regularFilenameMatch[1];
      }
    }
  }

  // ۲. ساخت Blob و آغاز فرایند دانلود
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
