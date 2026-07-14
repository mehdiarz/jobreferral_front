import { apiClient } from "../../libs/api";
import type { EditDocumentTypeBody, DocumentTypeItem } from "./types";

export async function editDocumentType(body: EditDocumentTypeBody): Promise<DocumentTypeItem> {
    return apiClient.request<DocumentTypeItem>("/services/app/DocumentTypeCrud/Edit", {
        method: "POST",
        body: JSON.stringify(body),
    });
}