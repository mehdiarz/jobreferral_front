import { apiClient } from "../../libs/api";

export async function removePropertyAppraisal(id: number): Promise<void> {
  await apiClient.request<any>("/services/app/PropertyAppraisalCrud/Remove", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}
