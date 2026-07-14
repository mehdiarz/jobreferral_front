import { apiClient } from "../../libs/api";
import type { CreateCollatralTypeBody, CollatralTypeItem } from "./types";

export async function createCollatralType(body: CreateCollatralTypeBody): Promise<CollatralTypeItem> {
    return apiClient.request<CollatralTypeItem>("/services/app/CollatralTypeCrud/Create", {
        method: "POST",
        body: JSON.stringify({ id: 0, ...body }),
    });
}