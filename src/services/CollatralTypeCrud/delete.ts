import { apiClient } from "../../libs/api";

export async function deleteCollatralType(id: number): Promise<any> {
    return apiClient.request<any>("/services/app/CollatralTypeCrud/Remove", {
        method: "POST",
        body: JSON.stringify({ id }),
    });
}