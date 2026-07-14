import { apiClient } from "../../libs/api";
import type { CustomerItem } from "./types";

export async function getCustomer(id: number): Promise<CustomerItem> {
    return apiClient.request<CustomerItem>(
        `/services/app/CustomerCrud/Get?Id=${id}`,
        { method: "GET" }
    );
}