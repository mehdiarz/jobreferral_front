import { apiClient } from "../../libs/api";

export interface ExpertiseZoneItem {
    id: number;
    code: string | null;
    title: string | null;
    description?: string | null;
}

export async function getExpertiseZone(id: number): Promise<ExpertiseZoneItem | null> {
    const res = await apiClient.request<any>(`/services/app/ExpertiseZoneCrud/Get?Id=${id}`, {
        method: "GET",
    });

    return res?.result ?? res ?? null;
}
