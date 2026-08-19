import { apiClient } from "../../libs/api";
import type { CustomerItem } from "./types";

export async function getCustomer(id: number): Promise<CustomerItem> {
  const res = await apiClient.request<{ result: CustomerItem }>(
    `/services/app/CustomerCrud/Get?Id=${id}`,
    { method: "GET" },
  );
  return (res as any)?.result ?? res;
}
