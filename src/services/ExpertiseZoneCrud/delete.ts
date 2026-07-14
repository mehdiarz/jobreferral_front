import { apiClient } from "../../libs/api";

export async function deleteExpertiseZone(id: number): Promise<any> {
    return apiClient.request<any>("/services/app/ExpertiseZoneCrud/Remove", {
        method: "POST",
        body: JSON.stringify({
            id,
        }),
    });
}
