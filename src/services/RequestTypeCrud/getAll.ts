import { apiClient } from "../../libs/api";
import type { GetAllRequestTypesParams, RequestTypeItem } from "./types";

export async function getAllRequestTypes(
    params?: GetAllRequestTypesParams
): Promise<{ items: RequestTypeItem[]; totalCount: number }> {
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
        ? `/services/app/RequestTypeCrud/GetAll?${query}`
        : "/services/app/RequestTypeCrud/GetAll";

    const res = await apiClient.request<any>(url, { method: "GET" });
    const items = res?.items ?? res?.result?.items ?? [];
    const totalCount = res?.totalCount ?? res?.result?.totalCount ?? items.length;

    return { items, totalCount };
}