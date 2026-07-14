import { apiClient } from "../../libs/api";

export interface ExpertiseZoneItem {
    id: number;
    code: string | null;
    title: string | null;
    description?: string | null;
}

export interface GetAllExpertiseZonesParams {
    sorting?: string;
    skipCount?: number;
    maxResultCount?: number;
}

export async function getAllExpertiseZones(
    params?: GetAllExpertiseZonesParams,
): Promise<{ items: ExpertiseZoneItem[]; totalCount: number }> {
    const searchParams = new URLSearchParams();

    if (params?.sorting) {
        searchParams.set("Sorting", params.sorting);
    }

    if (typeof params?.skipCount === "number") {
        searchParams.set("SkipCount", String(params.skipCount));
    }

    if (typeof params?.maxResultCount === "number") {
        searchParams.set("MaxResultCount", String(params.maxResultCount));
    }

    const query = searchParams.toString();
    const url = query
        ? `/services/app/ExpertiseZoneCrud/GetAll?${query}`
        : "/services/app/ExpertiseZoneCrud/GetAll";

    const res = await apiClient.request<any>(url, { method: "GET" });
    const items = res?.items ?? res?.result?.items ?? [];
    const totalCount = res?.totalCount ?? res?.result?.totalCount ?? items.length;

    return { items, totalCount };
}
