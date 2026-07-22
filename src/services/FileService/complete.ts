import { apiClient } from "../../libs/api";

export async function completeUpload(
  uploadId: string,
  documentId?: number,
): Promise<void> {
  const params = new URLSearchParams();
  params.set("uploadId", uploadId);
  if (documentId) params.set("documentId", String(documentId));

  await apiClient.request(
    `/services/app/FileServiceAppServie/Complete?${params.toString()}`,
    {
      method: "POST",
    },
  );
}
