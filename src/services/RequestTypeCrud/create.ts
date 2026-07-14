import { apiClient } from "../../libs/api";
import type { CreateRequestTypeBody, RequestTypeItem } from "./types";

export async function createRequestType(body: CreateRequestTypeBody): Promise<RequestTypeItem> {
    return apiClient.request<RequestTypeItem>("/services/app/RequestTypeCrud/Create", {
        method: "POST",
        body: JSON.stringify({ id: 0, ...body }),
    });
}