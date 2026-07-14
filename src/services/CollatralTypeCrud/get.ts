import { apiClient } from "../../libs/api";
import type { CollatralTypeItem } from "./types";

export async function getCollatralType(id: number): Promise<CollatralTypeItem> {
    return apiClient.request<CollatralTypeItem>(
        `/services/app/CollatralTypeCrud/Get?Id=${id}`,
        { method: "GET" }
    );
}