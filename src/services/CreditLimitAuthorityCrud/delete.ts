import { apiClient } from "../../libs/api";

export async function deleteCreditLimitAuthority(id: number): Promise<any> {
    return apiClient.request<any>("/services/app/CreditLimitAuthorityCrud/Remove", {
        method: "POST",
        body: JSON.stringify({ id }),
    });
}