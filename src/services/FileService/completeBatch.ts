import { apiClient } from "../../libs/api";

export interface CompleteBatchItem {
  uploadId: string;
  documentId: number;
}

export interface CompleteBatchBody {
  items: CompleteBatchItem[];
}

export async function completeBatchUpload(
  body: CompleteBatchBody,
): Promise<void> {
  await apiClient.request("/services/app/FileServiceAppServie/CompleteBatch", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
