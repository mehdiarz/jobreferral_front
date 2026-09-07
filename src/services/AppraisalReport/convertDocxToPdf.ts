import { getApiBaseUrl, getBasePath } from "../../libs/appConfig";
import { authStore, authActions } from "../../libs/store/authActions";

export interface ConvertDocxToPdfParams {
  file: File | Blob;
}

/**
 * ارسال فایل Word و دریافت فایل PDF به صورت Blob
 */
export async function convertDocxToPdf(
  params: ConvertDocxToPdfParams,
): Promise<Blob> {
  const formData = new FormData();

  // دقیقاً فیلد 'file' که در سواگر مشخص شده است
  formData.append(
    "file",
    params.file,
    params.file instanceof File ? params.file.name : "AppraisalReport.docx",
  );

  // گرفتن baseUrl از config دقیقاً مثل apiClient
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/services/app/AppraisalReport/ConvertDocxToPdf`;

  // گرفتن توکن از authStore دقیقاً مثل apiClient
  const token = authStore.state.token;

  // استفاده از fetch مستقیم تا مرورگر خودش هدر multipart/form-data به همراه boundary را تنظیم کند
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      // توجه: به هیچ وجه 'Content-Type' را دستی وارد نکنید!
    },
    body: formData,
  });

  if (!response.ok) {
    // مدیریت خطا دقیقاً مثل apiClient
    if (response.status === 401) {
      authActions.logout();
      if (typeof window !== "undefined") {
        setTimeout(
          () => (window.location.href = `${getBasePath()}/login`),
          2000,
        );
      }
      throw new Error("رمز شما منقضی شده است. لطفاً دوباره وارد شوید.");
    }

    if (response.status === 403) {
      if (typeof window !== "undefined") {
        const forbiddenPath = `${getBasePath()}/403`;
        if (window.location.pathname !== forbiddenPath) {
          window.location.href = forbiddenPath;
        }
      }
      throw new Error("Forbidden");
    }

    let errorDetail = "";
    try {
      errorDetail = await response.text();
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(`خطا در تبدیل فایل (${response.status}): ${errorDetail}`);
  }

  // خروجی PDF به صورت باینری
  return await response.blob();
}

/**
 * تابع کمکی برای دانلود مستقیم PDF
 */
export async function convertDocxAndDownload(
  params: ConvertDocxToPdfParams,
  downloadName = "AppraisalReport.pdf",
): Promise<void> {
  const pdfBlob = await convertDocxToPdf(params);
  const blobUrl = window.URL.createObjectURL(pdfBlob);

  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = downloadName.endsWith(".pdf")
    ? downloadName
    : `${downloadName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}
