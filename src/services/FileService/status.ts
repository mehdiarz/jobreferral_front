import { apiClient } from "../../libs/api";
import type { UploadSession } from "./types";

export async function getUploadStatus(
  uploadId: string,
): Promise<UploadSession> {
  return apiClient.request<UploadSession>(
    `/services/app/FileServiceAppServie/Status?uploadId=${uploadId}`,
    { method: "GET" },
  );
}
