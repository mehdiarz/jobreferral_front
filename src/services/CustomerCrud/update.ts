// edit.ts
import { apiClient } from "../../libs/api";
import type { EditCustomerBody, CustomerItem } from "./types";

export async function editCustomer(
  body: EditCustomerBody,
): Promise<CustomerItem> {
  const res = await apiClient.request<{ result: CustomerItem }>(
    "/services/app/CustomerCrud/Edit",
    { method: "POST", body: JSON.stringify(body) },
  );
  return (res as any)?.result ?? res;
}
