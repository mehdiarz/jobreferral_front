import { getApiBaseUrl } from "../../libs/appConfig";
import { authStore } from "../../libs/store/authActions";

export function getDownloadUrl(path: string, documentId?: number): string {
  const baseUrl = getApiBaseUrl();
  const params = new URLSearchParams();
  params.set("path", path);
  if (documentId) params.set("documentId", String(documentId));
  return `${baseUrl}/services/app/FileServiceAppServie/Download?${params.toString()}`;
}

export async function downloadFile(
  path: string,
  documentId?: number,
): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const token = authStore.state.token || localStorage.getItem("auth_token");

  const params = new URLSearchParams();
  params.set("path", path);
  if (documentId) params.set("documentId", String(documentId));

  const url = `${baseUrl}/services/app/FileServiceAppServie/Download?${params.toString()}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error("Download failed");

  // 1. استخراج نام فایل از هدر Content-Disposition
  let filename = "downloaded_file";
  const disposition = response.headers.get("content-disposition");

  if (disposition) {
    // بررسی فرمت استاندارد filename*=UTF-8''... برای پشتیبانی از حروف فارسی
    const utf8FilenameMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8FilenameMatch && utf8FilenameMatch[1]) {
      filename = decodeURIComponent(utf8FilenameMatch[1]);
    } else {
      // فرمت پشتیبان برای filename="..."
      const regularFilenameMatch = disposition.match(/filename="?([^";]+)"?/i);
      if (regularFilenameMatch && regularFilenameMatch[1]) {
        filename = regularFilenameMatch[1];
      }
    }
  } else {
    // در صورت عدم وجود هدر، از انتخابی پشتیبان استفاده می‌شود
    filename = path.split("/").pop() || "file";
  }

  // 2. دانلود فایل با نام درست
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename; // قرار دادن نام استخراج شده
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
