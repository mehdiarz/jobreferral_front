import { apiClient } from "../../libs/api";
import type { CreateCustomerBody, CustomerItem } from "./types";

export async function createCustomer(body: CreateCustomerBody): Promise<CustomerItem> {
    return apiClient.request<CustomerItem>("/services/app/CustomerCrud/Create", {
        method: "POST",
        body: JSON.stringify({ id: 0, ...body }),
    });
}