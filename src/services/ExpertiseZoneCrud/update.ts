import { apiClient } from "../../libs/api";

export interface UpdateExpertiseZoneBody {
    id: number;
    code: string;
    title: string;
    description?: string;
}

export async function updateExpertiseZone(body: UpdateExpertiseZoneBody): Promise<any> {
    return apiClient.request<any>("/services/app/ExpertiseZoneCrud/Update", {
        method: "PUT",
        body: JSON.stringify(body),
    });
}
