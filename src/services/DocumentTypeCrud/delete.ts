import { apiClient } from "../../libs/api";

export async function deleteDocumentType(id: number): Promise<any> {
    return apiClient.request<any>("/services/app/DocumentTypeCrud/Remove", {
        method: "POST",
        body: JSON.stringify({ id }),
    });
}