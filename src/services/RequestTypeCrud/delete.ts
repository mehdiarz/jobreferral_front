import { apiClient } from "../../libs/api";

export async function deleteRequestType(id: number): Promise<any> {
    return apiClient.request<any>("/services/app/RequestTypeCrud/Remove", {
        method: "POST",
        body: JSON.stringify({ id }),
    });
}