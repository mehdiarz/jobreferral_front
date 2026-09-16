import { getApiBaseUrl } from "../../libs/appConfig";
import { authStore } from "../../libs/store/authActions";
import type { GetRequestReportInput } from "./types";

export async function exportRequestsToExcel(
  body: GetRequestReportInput = {},
): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const token = authStore.state.token || localStorage.getItem("auth_token");

  const url = `${baseUrl}/services/app/RequestReport/ExportRequestsToExcel`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error("Export requests to excel failed");
  }

  // ۱. استخراج نام فایل از هدر Content-Disposition
  let filename = `RequestReport_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const disposition = response.headers.get("content-disposition");

  if (disposition) {
    // پشتیبانی از UTF-8 برای نام‌های فارسی
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

  // ۲. تبدیل به Blob و اجرای دانلود
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
