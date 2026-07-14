import { apiClient } from "../../libs/api";

export async function deleteExpert(id: number): Promise<any> {
    return apiClient.request<any>(`/services/app/JudicialExpertCrud/Remove`,{
        method: "POST",
        body: JSON.stringify({
            id,
        }),
    });
}
