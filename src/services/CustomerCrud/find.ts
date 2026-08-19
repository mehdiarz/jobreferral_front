import { apiClient } from "../../libs/api";
import type { CustomerItem } from "./types";

interface FindCustomerResponse {
  result: {
    customers: CustomerItem[];
  };
  success: boolean;
}

export interface FindCustomerParams {
  cifNumber?: string | null;
  nationalCode?: string | null;
}

export async function findCustomer(
  params: FindCustomerParams,
): Promise<CustomerItem[]> {
  console.log("📤 FindCustomer params:", params);

  const res = await apiClient.request<FindCustomerResponse>(
    "/services/app/CustomerCrud/FindCustomer",
    {
      method: "POST",
      body: JSON.stringify({
        cifNumber: params.cifNumber ?? null,
        nationalCode: params.nationalCode ?? null,
      }),
    },
  );

  console.log("📥 FindCustomer raw response:", res);
  console.log("📥 result:", res?.result);
  console.log("📥 customers:", res?.result?.customers);

  return res?.result?.customers ?? [];
}
