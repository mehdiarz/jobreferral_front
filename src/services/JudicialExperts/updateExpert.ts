import { apiClient } from "../../libs/api";
import type { CreateExpertBody } from "./createExpert";

export async function updateExpert(body: CreateExpertBody & { id: number }): Promise<any> {
    return apiClient.request<any>("/services/app/JudicialExpertCrud/Update", {
        method: "PUT",
        body: JSON.stringify(body),
    });
}
