import { apiClient } from "../../libs/api";
import type { EditDocumentBody, DocumentItem } from "./types";

export async function editDocument(
  body: EditDocumentBody,
): Promise<DocumentItem> {
  return apiClient.request<DocumentItem>("/services/app/DocumentCrud/Edit", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
