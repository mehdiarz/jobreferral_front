import { apiClient } from "../../libs/api";
import type { CustomerItem, EditCustomerBody } from "./types";

export async function editCustomer(
  body: EditCustomerBody,
): Promise<CustomerItem> {
  const res = await apiClient.request<{ result: CustomerItem }>(
    "/services/app/CustomerCrud/Edit",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );

  return res?.result ?? (res as unknown as CustomerItem);
}
