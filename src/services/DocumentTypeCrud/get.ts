import { apiClient } from "../../libs/api";
import type { DocumentTypeItem } from "./types";

export async function getDocumentType(id: number): Promise<DocumentTypeItem> {
    return apiClient.request<DocumentTypeItem>(
        `/services/app/DocumentTypeCrud/Get?Id=${id}`,
        { method: "GET" }
    );
}