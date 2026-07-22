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
  const url = getDownloadUrl(path, documentId);
  const token = authStore.state.token || localStorage.getItem("auth_token");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error("Download failed");

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = path.split("/").pop() || "file";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
