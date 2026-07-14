import { apiClient } from "../../libs/api";
import type { EditRequestTypeBody, RequestTypeItem } from "./types";

export async function editRequestType(body: EditRequestTypeBody): Promise<RequestTypeItem> {
    return apiClient.request<RequestTypeItem>("/services/app/RequestTypeCrud/Edit", {
        method: "POST",
        body: JSON.stringify(body),
    });
}