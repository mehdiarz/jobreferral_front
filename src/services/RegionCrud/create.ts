import { apiClient } from "../../libs/api";

export interface CreateRegionBody {
    id?: number;
    code: string;
    title: string;
    description?: string;
}

export async function createRegion(
    body: CreateRegionBody
): Promise<any> {
    return apiClient.request<any>(
        "/services/app/RegionCrud/Create",
        {
            method: "POST",
            body: JSON.stringify({
                id: 0,
                code: body.code,
                title: body.title,
                description: body.description,
            }),
        }
    );
}
