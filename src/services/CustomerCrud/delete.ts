// remove.ts
import { apiClient } from "../../libs/api";

export async function removeCustomer(id: number): Promise<void> {
  await apiClient.request<any>("/services/app/CustomerCrud/Remove", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}
