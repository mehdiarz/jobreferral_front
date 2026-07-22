import { apiClient } from "../../libs/api";
import type { StartUploadRequest, StartUploadResponse } from "./types";

export async function startUpload(
  body: StartUploadRequest,
): Promise<StartUploadResponse> {
  return apiClient.request<StartUploadResponse>(
    "/services/app/FileServiceAppServie/Start",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}
