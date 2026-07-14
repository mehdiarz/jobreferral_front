import { apiClient } from "../../libs/api";

export async function deleteRegion(id: number): Promise<any> {
    return apiClient.request<any>(
        `/services/app/RegionCrud/Remove`,{
        method: "POST",
            body: JSON.stringify({
            id,
        }),
    });
}
