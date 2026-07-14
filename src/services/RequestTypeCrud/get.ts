import { apiClient } from "../../libs/api";
import type { RequestTypeItem } from "./types";

export async function getRequestType(id: number): Promise<RequestTypeItem> {
    return apiClient.request<RequestTypeItem>(
        `/services/app/RequestTypeCrud/Get?Id=${id}`,
        { method: "GET" }
    );
}