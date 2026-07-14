import { apiClient } from "../../libs/api";

export interface CreateExpertiseZoneBody {
    code: string;
    title: string;
    description?: string;
}

export interface ExpertiseZoneItem {
    id: number;
    code: string | null;
    title: string | null;
    description?: string | null;
}

export async function createExpertiseZone(body: CreateExpertiseZoneBody): Promise<any> {
    return apiClient.request<any>("/services/app/ExpertiseZoneCrud/Create", {
        method: "POST",
        body: JSON.stringify({ id: 0, ...body }),
    });
}
