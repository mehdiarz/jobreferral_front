import { apiClient } from "../../libs/api";
import type { CreateDocumentBody, DocumentItem } from "./types";

export async function createDocument(
  body: CreateDocumentBody,
): Promise<DocumentItem> {
  return apiClient.request<DocumentItem>("/services/app/DocumentCrud/Create", {
    method: "POST",
    body: JSON.stringify({ id: 0, ...body }),
  });
}
