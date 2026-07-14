import { apiClient } from "../../libs/api";

export interface RegionItem { id: number; title: string | null; code: string | null; }

export async function getAllRegions(): Promise<RegionItem[]> {
    const res = await apiClient.request<any>("/services/app/RegionCrud/GetAll", { method: "GET" });
    return res?.items ?? res?.result?.items ?? [];
}
