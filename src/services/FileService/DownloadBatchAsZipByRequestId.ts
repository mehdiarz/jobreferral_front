import { getApiBaseUrl } from "../../libs/appConfig";
import { authStore } from "../../libs/store/authActions";

export async function downloadBatchAsZipByRequestId(
  requestId: number,
): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const token = authStore.state.token || localStorage.getItem("auth_token");

  const params = new URLSearchParams();
  params.set("requestId", String(requestId));

  const url = `${baseUrl}/services/app/FileServiceAppServie/DownloadBatchAsZipByRequestId?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error("Download batch zip failed");

  // تشخیص اسم فایل از هدر Content-Disposition اگه بود
  let fileName = `batch_${requestId}.zip`;
  const disposition = response.headers.get("Content-Disposition");
  if (disposition) {
    const match = disposition.match(/filename\*?=["']?([^"';]+)/i);
    if (match) fileName = match[1].replace(/%20/g, " ");
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
