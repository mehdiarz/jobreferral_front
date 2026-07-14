import { apiClient } from "../../libs/api";
import type { EditCollatralTypeBody, CollatralTypeItem } from "./types";

export async function editCollatralType(body: EditCollatralTypeBody): Promise<CollatralTypeItem> {
    return apiClient.request<CollatralTypeItem>("/services/app/CollatralTypeCrud/Edit", {
        method: "POST",
        body: JSON.stringify(body),
    });
}