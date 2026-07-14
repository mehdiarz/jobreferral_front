import { apiClient } from "../../libs/api";

export interface RegionItem {
    id: number;
    code: string | null;
    title: string | null;
    description: string | null;
    creationTime: string;
    lastModificationTime: string | null;
    isDeleted: boolean;
}

export async function getAllRegions(): Promise<{
    items: RegionItem[];
    totalCount: number;
}> {
    const res = await apiClient.request<any>(
        "/services/app/RegionCrud/GetAll",
        { method: "GET" }
    );

    const items = res?.items ?? res?.result?.items ?? [];
    const totalCount =
        res?.totalCount ?? res?.result?.totalCount ?? items.length;

    return { items, totalCount };
}
