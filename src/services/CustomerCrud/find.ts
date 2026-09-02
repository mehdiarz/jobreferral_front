import { apiClient } from "../../libs/api";
import type { CustomerItem, FindCustomerParams } from "./types";

interface FindCustomerResponse {
  result?: {
    customers?: CustomerItem[] | null;
  };
  customers?: CustomerItem[] | null;
  success?: boolean;
}

export async function findCustomer(
  params: FindCustomerParams,
): Promise<CustomerItem[]> {
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

  return res?.result?.customers ?? res?.customers ?? [];
}
