import { apiClient } from "../../libs/api";
import type { CreateDocumentTypeBody, DocumentTypeItem } from "./types";

export async function createDocumentType(body: CreateDocumentTypeBody): Promise<DocumentTypeItem> {
    return apiClient.request<DocumentTypeItem>("/services/app/DocumentTypeCrud/Create", {
        method: "POST",
        body: JSON.stringify({ id: 0, ...body }),
    });
}