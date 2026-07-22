import { apiClient } from "../../libs/api";
import type { DocumentItem } from "./types";

export async function getDocument(id: number): Promise<DocumentItem> {
  return apiClient.request<DocumentItem>(
    `/services/app/DocumentCrud/Get?Id=${id}`,
    { method: "GET" },
  );
}
