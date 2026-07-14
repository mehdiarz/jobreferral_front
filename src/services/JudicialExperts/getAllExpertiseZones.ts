import { apiClient } from "../../libs/api";

export interface ExpertiseZoneItem { id: number; title: string | null; code: string | null; }

export async function getAllExpertiseZones(): Promise<ExpertiseZoneItem[]> {
    const res = await apiClient.request<any>("/services/app/ExpertiseZoneCrud/GetAll", { method: "GET" });
    return res?.items ?? res?.result?.items ?? [];
}
