import { apiClient } from "../../libs/api";

export interface DocumentFile {
  fileName: string;
  filePath: string;
  fileSize: string;
  extension: string;
  documentId: number;
  id: number;
  creationTime: string;
}

export async function getDocumentAllFiles(
  documentId: number,
): Promise<DocumentFile[]> {
  const res = await apiClient.request<any>(
    `/services/app/FileServiceAppServie/GetDocumentAllFiles?documentId=${documentId}`,
    { method: "GET" },
  );
  return res?.result ?? [];
}
