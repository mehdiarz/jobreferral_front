import { apiClient } from "../../libs/api";

export async function deleteDocumentFiles(fileIds: number[]): Promise<void> {
  await apiClient.request<any>(
    "/services/app/FileServiceAppServie/DeleteDocumentFiles",
    {
      method: "POST",
      body: JSON.stringify(fileIds),
    },
  );
}
