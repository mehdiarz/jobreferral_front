import { apiClient } from "../../libs/api";
import type { CustomerItem } from "./types";

interface FindCustomerResponse {
  result: {
    customers: CustomerItem[];
  };
  success: boolean;
}

export async function findCustomer(cifNumber: string): Promise<CustomerItem[]> {
  const res = await apiClient.request<FindCustomerResponse>(
    "/services/app/CustomerCrud/FindCustomer",
    {
      method: "POST",
      body: JSON.stringify({ cifNumber }),
    },
  );
  return res?.result?.customers ?? [];
}
