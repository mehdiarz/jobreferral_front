import { apiClient } from "../../libs/api";

export async function deleteDepartmentType(id: number): Promise<any> {
  return apiClient.request<any>("/services/app/DepartmentTypeCrud/Remove", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}
