import { apiClient } from "../../libs/api";
import type { CustomerItem } from "./types";

interface FindCustomerFromTsiResponse {
  result?: {
    customers?: CustomerItem[] | null;
  };
  customers?: CustomerItem[] | null;
  success?: boolean;
}

export interface FindCustomerFromTsiParams {
  nationalCode?: string | null;
  /**
   * در صورت ارسال نشدن، مقدار پیش‌فرض 1 استفاده می‌شود.
   */
  persontype?: number;
}

export async function findCustomerFromTsi(
  params: FindCustomerFromTsiParams,
): Promise<CustomerItem[]> {
  const res = await apiClient.request<FindCustomerFromTsiResponse>(
    "/services/app/CustomerCrud/FindCustomerFromTsi",
    {
      method: "POST",
      body: JSON.stringify({
        personcode: params.nationalCode ?? null,
        persontype: params.persontype ?? 1,
      }),
    },
  );

  return res?.result?.customers ?? res?.customers ?? [];
}
