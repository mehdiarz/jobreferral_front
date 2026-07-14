import { apiClient } from "../../libs/api";

export interface UpdateRegionBody {
    id: number;
    code: string;
    title: string;
    description?: string;
}

export async function updateRegion(
    body: UpdateRegionBody
): Promise<any> {
    return apiClient.request<any>(
        "/services/app/RegionCrud/Edit",
        {
            method: "POST",
            body: JSON.stringify(body),
        }
    );
}
